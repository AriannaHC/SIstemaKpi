import apiClient from "./apiClient";

export const backupService = {
  // 1. Generar un nuevo volcado de la base de datos
  generateBackup: async () => {
    const response = await apiClient.post("/backup/generate");
    return response.data;
  },

  // 2. Obtener la lista del historial de backups
  getList: async () => {
    const response = await apiClient.get("/backup/list");
    return response.data;
  },

  // 3. Descargar el archivo .sql de forma segura
  downloadBackup: async (filename) => {
    // Pedimos a axios que trate la respuesta como un archivo (blob)
    const response = await apiClient.get(`/backup/download/${filename}`, {
      responseType: "blob",
    });

    // Creamos un enlace invisible en la memoria del navegador para forzar la descarga
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;

    // Le asignamos el nombre del archivo original
    link.setAttribute("download", filename);

    // Simulamos el clic y luego limpiamos la memoria
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
};
