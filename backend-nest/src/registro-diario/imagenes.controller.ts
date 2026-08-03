import { Controller, Get, Param, Res, NotFoundException } from '@nestjs/common';
import type { Response } from 'express';
import { FtpService } from '../common/ftp/ftp.service';

@Controller('imagenes')
export class ImagenesController {
  constructor(private ftpService: FtpService) {}

  @Get(':filename')
  async getImagen(@Param('filename') filename: string, @Res() res: Response) {
    // Seguridad básica: evita que alguien pida rutas fuera de la carpeta
    if (
      filename.includes('/') ||
      filename.includes('\\') ||
      filename.includes('..')
    ) {
      throw new NotFoundException('Nombre de archivo inválido.');
    }

    try {
      const buffer = await this.ftpService.downloadImageBytes(filename);
      const ext = filename.split('.').pop()?.toLowerCase();
      const contentType =
        ext === 'png'
          ? 'image/png'
          : ext === 'gif'
            ? 'image/gif'
            : ext === 'webp'
              ? 'image/webp'
              : 'image/jpeg';

      res.set({
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400', // el navegador la guarda 1 día, evita repetir la descarga por FTP en cada vista
      });
      res.send(buffer);
    } catch {
      throw new NotFoundException('Imagen no encontrada.');
    }
  }
}
