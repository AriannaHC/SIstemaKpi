# Contexto del Proyecto: Módulo "Registro Diario de Actividades"

Este documento resume el contexto actual del desarrollo del módulo **Registro Diario** para el Sistema KPI, enfocado en el flujo de los colaboradores. Hemos estado trabajando en la estructura de base de datos, el backend con FastAPI y el frontend con React.

A continuación, se detalla el estado actual de los archivos clave involucrados en este flujo:

---

## 1. Backend: Base de Datos (`Backend/db/models.py`)
El modelo `RegistroDiario` (tabla `registro_diario_actividades`) está dividido en tres secciones lógicas:
1. **Datos Automáticos:** `usuario_id`, `area_id` y `fecha_registro`. Estos se inyectan en el backend a través del token del usuario autenticado.
2. **Datos Base del Colaborador (Obligatorios):** `proceso`, `tipo_actividad`, `entregable`, `responsable_asigna`, `fecha_inicio`, `fecha_entrega`.
3. **Datos de Calidad y Operaciones (Opcionales):** Campos como `estado_entregable_calidad`, `tiempo_real_operaciones`, `unidad_medida`, `tiempo_estimado`, y `estado_base` que inicialmente eran obligatorios, ahora son manejados posteriormente por otras áreas, por lo que pueden ser nulos al momento del registro inicial o se actualizarán en otro flujo.

## 2. Backend: Schemas (`Backend/schemas/registro_diario_schema.py`)
- **`RegistroDiarioCreate`**: Es el payload que envía el frontend. Exige estrictamente los 6 campos base del colaborador. Ya NO se le exige al usuario inicial enviar `unidad_medida`, `tiempo_estimado` ni `estado_base`.
- **`RegistroDiarioResponse`**: Define cómo se devuelve el registro. Recientemente se ajustó para que `unidad_medida`, `tiempo_estimado` y `estado_base` sean `Optional`, previniendo errores HTTP 500 cuando SQLAlchemy intenta retornar registros donde estos campos están vacíos (al omitirse en el payload de creación).

## 3. Backend: Rutas y Servicios
### `Backend/api/registro_diario.py`
Contiene el endpoint `POST /api/registros-diarios/`. Utiliza las dependencias de FastAPI (`get_current_user`) para:
- Validar que el usuario tenga un área asignada.
- Inyectar automáticamente el `usuario_id`, `area_id` y la fecha actual en la instancia de SQLAlchemy antes de guardar el payload `RegistroDiarioCreate`.

### `Backend/api/users.py` (Endpoint `/mi-equipo`)
El frontend necesita listar a los compañeros del área para el campo "Responsable que asigna". El endpoint `GET /mi-equipo` se actualizó para permitir acceso **no solo al Jefe de Área (rol 2), sino también a los Trabajadores (rol 3)**, retornando a todos los usuarios activos de su misma área.

## 4. Frontend: Servicios (`frontend/src/services/registroDiarioService.js`)
Es un servicio limpio que exporta `registroDiarioService` y realiza la petición POST a `/registros-diarios/` utilizando un cliente Axios configurado (`apiClient`), manejando automáticamente los interceptores de tokens.

## 5. Frontend: Navegación (`frontend/src/components/Sidebar.jsx`)
Se agregó un nuevo elemento de navegación `NavItem` hacia la ruta `registro-diario`.
- **Restricción:** Solo visible para usuarios operativos (Roles 2 y 3).
- **Iconografía:** Se implementó el icono `NotebookPen` de la librería `lucide-react` para mantener coherencia visual.

## 6. Frontend: Interfaz (`frontend/src/pages/LlenadoRegistroDiario.jsx`)
La vista fue refactorizada completamente para tener un **diseño premium y jerárquico**, alineándose con los estilos de la aplicación (`LlenadoKPI.jsx` y `MiEquipo.jsx`):
- **Diseño Corporativo:** Se usan variables `COLOR_AZUL` (`#123498`) y `COLOR_NARANJA` (`#F46F0B`), tipografías `font-heading`, contenedores redondeados (`rounded-4xl`), sombras (`shadow-xl`) y animaciones de entrada (`fade-in`).
- **Lógica de Formulario:** 
  - Se obtienen los compañeros del área usando `userService.getMiEquipo()`.
  - El campo de "Entregable / Tarea" tiene una **validación estricta de máximo 250 caracteres**, reemplazando un anterior conteo por palabras. Incluye un contador visual dinámico (Gris → Ámbar → Rojo).
- **Experiencia de Usuario (UX):** Al enviar el formulario exitosamente, se dispara una animación de confeti en los colores corporativos (`canvas-confetti`) y se resetean todos los campos.

---

### Resumen del Flujo
1. El usuario (Rol 2 o 3) entra a "Registro Diario" desde el Sidebar.
2. Llena sus 6 campos principales (el select de "Responsable que asigna" se puebla de `/mi-equipo`).
3. Envía el formulario. El frontend valida los 250 caracteres del entregable.
4. El backend recibe los datos, inyecta el ID del usuario y su área, y lo guarda en la BD.
5. El frontend muestra el confeti, un toast de éxito, y limpia el formulario. Los campos de calidad/operaciones quedan nulos para ser procesados más adelante.
