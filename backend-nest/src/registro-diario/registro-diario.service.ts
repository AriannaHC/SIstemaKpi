import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RegistroDiario } from '../entities/registro-diario.entity';
import { User } from '../entities/user.entity';
import { CacheService } from '../common/cache/cache.service';
import { CreateRegistroDiarioDto } from './dto/create-registro-diario.dto';
import { extname } from 'path';
import { randomUUID } from 'crypto';
import * as ExcelJS from 'exceljs';
import { AuditarCalidadDto } from './dto/auditar-calidad.dto';
import { AuditarOperacionesDto } from './dto/auditar-operaciones.dto';
import { FtpService } from '../common/ftp/ftp.service'; // ya la debes tener

const AREA_CALIDAD_ID = 25;
const AREA_OPERACIONES_ID = 26;

@Injectable()
export class RegistroDiarioService {
  constructor(
    @InjectRepository(RegistroDiario)
    private registroRepo: Repository<RegistroDiario>,
    private cache: CacheService,
    private ftpService: FtpService,
  ) {}

  // ── 1. CREAR REGISTRO ──
  async crearRegistro(dto: CreateRegistroDiarioDto, currentUser: User) {
    if (!currentUser.kpiAreaId) {
      throw new BadRequestException('El usuario no tiene un área asignada.');
    }

    const nuevoRegistro = this.registroRepo.create({
      usuarioId: currentUser.id,
      areaId: currentUser.kpiAreaId,
      proceso: dto.proceso,
      tipoActividad: dto.tipo_actividad,
      tipoTarea: dto.tipo_tarea,
      entregable: dto.entregable,
      responsableAsigna: dto.responsable_asigna,
      fechaInicio: new Date(dto.fecha_inicio),
      fechaEntrega: new Date(dto.fecha_entrega),
      unidadMedida: dto.unidad_medida || 'Horas',
      tiempoEstimado: dto.tiempo_estimado || 0,
      estadoBase: dto.estado_base || 'En proceso',
    });

    await this.registroRepo.save(nuevoRegistro);

    // Invalidamos el caché para que los paneles se refresquen
    this.cache.invalidatePrefix('registros-diarios-');

    return nuevoRegistro;
  }

  // ── 2. PANEL OPERACIONES ──
  async getPanelOperaciones(currentUser: User) {
    if (currentUser.kpiAreaId !== AREA_OPERACIONES_ID) {
      throw new ForbiddenException('No tienes acceso a este panel.');
    }
    const cacheKey = 'registros-diarios-panel-operaciones';
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    const registros = await this.obtenerRegistrosPanel();
    this.cache.set(cacheKey, registros);
    return registros;
  }

  // ── 3. PANEL CALIDAD ──
  async getPanelCalidad(currentUser: User) {
    if (currentUser.kpiAreaId !== AREA_CALIDAD_ID) {
      throw new ForbiddenException('No tienes acceso a este panel.');
    }
    const cacheKey = 'registros-diarios-panel-calidad';
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    const registros = await this.obtenerRegistrosPanel();
    this.cache.set(cacheKey, registros);
    return registros;
  }

  // ── 4. DETALLE POR ID ──
  async obtenerRegistroDetalle(id: number) {
    const registro = await this.registroRepo.findOne({
      where: { id },
      relations: { usuario: true, area: true },
    });
    if (!registro) throw new NotFoundException('Registro no encontrado');
    return this.mapToResponse(registro);
  }

  // ── 5. AUDITAR CALIDAD ──
  async auditarCalidad(id: number, dto: AuditarCalidadDto, currentUser: User) {
    if (currentUser.kpiAreaId !== AREA_CALIDAD_ID) {
      throw new ForbiddenException(
        'No tienes permisos para auditar en Calidad.',
      );
    }
    const registro = await this.registroRepo.findOne({
      where: { id },
      relations: { usuario: true, area: true },
    });
    if (!registro) throw new NotFoundException('Registro no encontrado');

    registro.estadoEntregableCalidad = dto.estado_entregable_calidad;
    registro.estadoAnimo = dto.estado_animo;
    registro.tiempoEstandar = dto.tiempo_estandar;
    registro.tiempoRealCalidad = dto.tiempo_real_calidad;
    registro.erroresObservaciones = dto.errores_observaciones;
    registro.observacionesCalidad = dto.observaciones_calidad;
    registro.rubricaFinal = dto.rubrica_final;
    registro.eficiencia = dto.eficiencia;
    registro.tasaCalidad = dto.tasa_calidad;
    registro.auditadoCalidad = true;

    await this.registroRepo.save(registro);
    this.cache.invalidatePrefix('registros-diarios-');

    return this.mapToResponse(registro);
  }

  // ── 6. AUDITAR OPERACIONES (con imagen opcional) ──
  async auditarOperaciones(
    id: number,
    dto: AuditarOperacionesDto,
    file: Express.Multer.File | undefined,
    currentUser: User,
  ) {
    if (currentUser.kpiAreaId !== AREA_OPERACIONES_ID) {
      throw new ForbiddenException(
        'No tienes permisos para auditar en Operaciones.',
      );
    }
    const registro = await this.registroRepo.findOne({
      where: { id },
      relations: { usuario: true, area: true },
    });
    if (!registro) throw new NotFoundException('Registro no encontrado');

    registro.prioridad = dto.prioridad ?? '';
    registro.tiempoRealOperaciones = dto.tiempo_real_operaciones ?? 0;
    registro.estadoTareaOperaciones = dto.estado_tarea_operaciones ?? '';
    registro.motivoRetraso = dto.motivo_retraso ?? '';
    registro.actitudColaborador = dto.actitud_colaborador ?? '';
    registro.enlaceEvidencia = dto.enlace_evidencia ?? '';
    registro.validacionLider = dto.validacion_lider ?? '';
    registro.observacionesOperaciones = dto.observaciones_operaciones ?? '';
    registro.diasVencimiento = dto.dias_vencimiento ?? 0;
    registro.unidadMedida = dto.unidad_medida ?? 'Horas';
    registro.tiempoEstimado = dto.tiempo_estimado ?? 0;

    if (file) {
      const ext = extname(file.originalname);
      const nombreUnico = `${randomUUID().replace(/-/g, '')}${ext}`;
      const urlPublica = await this.ftpService.uploadImageBytes(
        file.buffer,
        nombreUnico,
      );
      registro.imagenEvidencia = urlPublica;
    }

    registro.auditadoOperaciones = true;

    await this.registroRepo.save(registro);
    this.cache.invalidatePrefix('registros-diarios-');

    return this.mapToResponse(registro);
  }

  // ── 7. EXPORTAR EXCEL ──
  private readonly COLUMNAS_CALIDAD = [
    'Fecha Registro',
    'Área',
    'Trabajador',
    'Proceso',
    'Tipo de Actividad',
    'Entregable Específico',
    'Estado del Entregable',
    'Fecha de Inicio',
    'Fecha Límite',
    'Estado de Ánimo',
    'Observaciones de Calidad',
    'Tiempo Estándar',
    'Tiempo Real',
    'Unidades (Fijo: 1)',
    'Errores Encontrados',
    'Eficiencia',
    'Tasa de Calidad',
    'Rúbrica Final',
  ];

  private readonly COLUMNAS_OPERACIONES = [
    'Fecha Registro',
    'Área',
    'Trabajador',
    'Responsable que asigna',
    'Entregable Específico',
    'Tipo de Tarea',
    'Prioridad',
    'Unidad de Medida',
    'Tiempo Estimado',
    'Fecha Límite',
    'Tiempo Real Operaciones',
    'Estado de Tarea',
    'Motivo Retraso',
    'Observaciones Operaciones',
    'Enlace Evidencia',
    'Validación Líder',
    'Actitud Colaborador',
    'Días Vencimiento',
  ];

  private fmtFecha(valor: Date | string | null): string {
    if (!valor) return '';
    const d = new Date(valor);
    const pad = (n: number) => String(n).padStart(2, '0');
    const fecha = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const conHora = d.getHours() !== 0 || d.getMinutes() !== 0;
    return conHora
      ? `${fecha} ${pad(d.getHours())}:${pad(d.getMinutes())}`
      : fecha;
  }

  private filaCalidad(r: any): any[] {
    return [
      this.fmtFecha(r.fecha_registro),
      r.area_nombre,
      r.trabajador_nombre,
      r.proceso,
      r.tipo_actividad,
      r.entregable,
      r.estado_entregable_calidad,
      this.fmtFecha(r.fecha_inicio),
      this.fmtFecha(r.fecha_entrega),
      r.estado_animo,
      r.observaciones_calidad,
      r.tiempo_estandar,
      r.tiempo_real_calidad,
      1,
      r.errores_observaciones,
      r.eficiencia,
      r.tasa_calidad,
      r.rubrica_final,
    ];
  }

  private filaOperaciones(r: any): any[] {
    return [
      this.fmtFecha(r.fecha_registro),
      r.area_nombre,
      r.trabajador_nombre,
      r.responsable_asigna,
      r.entregable,
      r.tipo_tarea,
      r.prioridad,
      r.unidad_medida,
      r.tiempo_estimado,
      this.fmtFecha(r.fecha_entrega),
      r.tiempo_real_operaciones,
      r.estado_tarea_operaciones,
      r.motivo_retraso,
      r.observaciones_operaciones,
      r.enlace_evidencia,
      r.validacion_lider,
      r.actitud_colaborador,
      r.dias_vencimiento,
    ];
  }

  private extToExcelType(filename: string): 'jpeg' | 'png' | 'gif' {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (ext === 'png') return 'png';
    if (ext === 'gif') return 'gif';
    return 'jpeg';
  }

  private parseFechaQuery(valor?: string): string | null {
    if (!valor || !valor.trim()) return null;
    const trimmed = valor.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      throw new BadRequestException(
        `Formato de fecha inválido: '${valor}'. Use YYYY-MM-DD.`,
      );
    }
    return trimmed;
  }

  async exportarExcel(
    filtros: {
      areaPanel: string;
      fecha?: string;
      fechaDesde?: string;
      fechaHasta?: string;
      areaFiltro?: string;
      trabajador?: string;
      estado?: string;
    },
    currentUser: User,
  ) {
    const areaPanel = (filtros.areaPanel || '').toLowerCase().trim();
    if (!['calidad', 'operaciones'].includes(areaPanel)) {
      throw new BadRequestException(
        "area_panel debe ser 'calidad' u 'operaciones'.",
      );
    }
    if (areaPanel === 'calidad' && currentUser.kpiAreaId !== AREA_CALIDAD_ID) {
      throw new ForbiddenException('No tienes acceso a este panel.');
    }
    if (
      areaPanel === 'operaciones' &&
      currentUser.kpiAreaId !== AREA_OPERACIONES_ID
    ) {
      throw new ForbiddenException('No tienes acceso a este panel.');
    }

    const fecha = this.parseFechaQuery(filtros.fecha);
    const fechaDesde = this.parseFechaQuery(filtros.fechaDesde);
    const fechaHasta = this.parseFechaQuery(filtros.fechaHasta);
    const areaFiltro = filtros.areaFiltro?.trim() || null;
    const trabajador = filtros.trabajador?.trim() || null;
    const estado = filtros.estado?.trim() || null;

    const qb = this.registroRepo
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.usuario', 'usuario')
      .leftJoinAndSelect('r.area', 'area');

    qb.andWhere(
      areaPanel === 'calidad'
        ? 'r.auditadoCalidad = :aud'
        : 'r.auditadoOperaciones = :aud',
      { aud: true },
    );

    if (fecha) qb.andWhere('DATE(r.fechaRegistro) = :fecha', { fecha });
    if (fechaDesde)
      qb.andWhere('r.fechaRegistro >= :desde', {
        desde: `${fechaDesde} 00:00:00`,
      });
    if (fechaHasta)
      qb.andWhere('r.fechaRegistro <= :hasta', {
        hasta: `${fechaHasta} 23:59:59`,
      });
    if (areaFiltro)
      qb.andWhere('area.nombre LIKE :areaFiltro', {
        areaFiltro: `%${areaFiltro}%`,
      });
    if (trabajador)
      qb.andWhere('usuario.name LIKE :trabajador', {
        trabajador: `%${trabajador}%`,
      });
    if (estado) {
      qb.andWhere(
        areaPanel === 'calidad'
          ? 'r.estadoEntregableCalidad = :estado'
          : 'r.estadoTareaOperaciones = :estado',
        { estado },
      );
    }

    qb.orderBy('r.fechaRegistro', 'DESC');
    const registrosCrudos = await qb.getMany();
    const registros = registrosCrudos.map((r) => this.mapToResponse(r));

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(
      areaPanel === 'calidad' ? 'Calidad' : 'Operaciones',
    );

    const columnas =
      areaPanel === 'calidad'
        ? this.COLUMNAS_CALIDAD
        : this.COLUMNAS_OPERACIONES;
    const filaFn =
      areaPanel === 'calidad'
        ? this.filaCalidad.bind(this)
        : this.filaOperaciones.bind(this);

    const headerRow = worksheet.addRow(columnas);
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1F4E78' },
      };
      cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    for (const registro of registros) {
      const row = worksheet.addRow(filaFn(registro));
      row.height = 60;

      if (areaPanel === 'operaciones' && registro.imagen_evidencia) {
        const filename = registro.imagen_evidencia.split('/').pop() as string;
        try {
          const buffer = await this.ftpService.downloadImageBytes(filename);
          const imageId = workbook.addImage({
            buffer: buffer as any,
            extension: this.extToExcelType(filename),
          });
          worksheet.addImage(imageId, {
            tl: { col: 14, row: row.number - 1 },
            ext: { width: 100, height: 100 },
          });
          row.getCell(15).value = '(Ver imagen adjunta)';
        } catch (e) {
          console.error('Error cargando imagen en Excel:', e);
        }
      }
    }

    columnas.forEach((titulo, idx) => {
      worksheet.getColumn(idx + 1).width = Math.max(titulo.length + 2, 15);
    });
    worksheet.views = [{ state: 'frozen', ySplit: 1 }];

    const buffer = (await workbook.xlsx.writeBuffer()) as unknown as Buffer;
    const ts = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 15);
    const filename = `registros_${areaPanel}_${ts}.xlsx`;

    return { buffer, filename };
  }

  // ── HELPER: Obtener tabla completa y mapear a formato Frontend ──
  private async obtenerRegistrosPanel() {
    const rows = await this.registroRepo.find({
      relations: { usuario: true, area: true },
      order: { fechaRegistro: 'DESC' },
    });
    return rows.map((r) => this.mapToResponse(r));
  }

  private mapToResponse(r: RegistroDiario) {
    return {
      id: r.id,
      usuario_id: r.usuarioId,
      area_id: r.areaId,
      fecha_registro: r.fechaRegistro,
      trabajador_nombre: r.usuario ? r.usuario.name : 'Usuario Desconocido',
      area_nombre: r.area ? r.area.nombre : 'Área Desconocida',
      proceso: r.proceso,
      tipo_actividad: r.tipoActividad,
      tipo_tarea: r.tipoTarea,
      entregable: r.entregable,
      responsable_asigna: r.responsableAsigna,
      fecha_inicio: r.fechaInicio,
      fecha_entrega: r.fechaEntrega,
      unidad_medida: r.unidadMedida,
      tiempo_estimado: r.tiempoEstimado,
      estado_base: r.estadoBase,

      // Calidad
      estado_entregable_calidad: r.estadoEntregableCalidad,
      estado_animo: r.estadoAnimo,
      observaciones_calidad: r.observacionesCalidad,
      tiempo_estandar: r.tiempoEstandar,
      tiempo_real_calidad: r.tiempoRealCalidad,
      errores_observaciones: r.erroresObservaciones,
      eficiencia: r.eficiencia,
      tasa_calidad: r.tasaCalidad,
      rubrica_final: r.rubricaFinal,
      auditado_calidad: r.auditadoCalidad,

      // Operaciones
      prioridad: r.prioridad,
      tiempo_real_operaciones: r.tiempoRealOperaciones,
      estado_tarea_operaciones: r.estadoTareaOperaciones,
      motivo_retraso: r.motivoRetraso,
      observaciones_operaciones: r.observacionesOperaciones,
      enlace_evidencia: r.enlaceEvidencia,
      imagen_evidencia: r.imagenEvidencia,
      validacion_lider: r.validacionLider,
      actitud_colaborador: r.actitudColaborador,
      dias_vencimiento: r.diasVencimiento,
      auditado_operaciones: r.auditadoOperaciones,
    };
  }

  // ── 8. HISTORIAL PERSONAL (MIS REGISTROS) ──
  async getMisRegistros(currentUser: User) {
    const cacheKey = `registros-diarios-mis-registros-${currentUser.id}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    const rows = await this.registroRepo.find({
      where: { usuarioId: currentUser.id },
      relations: { usuario: true, area: true },
      order: { fechaRegistro: 'DESC' },
    });

    // 🚀 USAMOS EL MAPEO SEGURO AQUÍ
    const registros = rows.map((r) => this.mapToSecureResponse(r));

    this.cache.set(cacheKey, registros);
    return registros;
  }

  // 👇 NUEVO: MAPEO SEGURO (Filtra campos sensibles de auditoría)
  private mapToSecureResponse(r: RegistroDiario) {
    return {
      id: r.id,
      fecha_registro: r.fechaRegistro,
      proceso: r.proceso,
      tipo_actividad: r.tipoActividad,
      tipo_tarea: r.tipoTarea,
      entregable: r.entregable,
      fecha_inicio: r.fechaInicio,
      fecha_entrega: r.fechaEntrega,
      // Solo enviamos los booleanos, nada de texto ni métricas internas
      auditado_calidad: r.auditadoCalidad,
      auditado_operaciones: r.auditadoOperaciones,
    };
  }
}
