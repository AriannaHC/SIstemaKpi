import {
  Controller,
  Post,
  Headers,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BackupService } from '../backup/backup.service';

@Controller('internal')
export class InternalController {
  private readonly logger = new Logger(InternalController.name);

  constructor(
    private configService: ConfigService,
    private backupService: BackupService,
  ) {}

  @Post('cerrar-vencidos')
  async cerrarVencidos(@Headers('x-cron-secret') cronSecret: string) {
    const validSecret = this.configService.get<string>('CRON_SECRET');

    if (!cronSecret || cronSecret !== validSecret) {
      this.logger.warn(
        'Intento de acceso no autorizado al endpoint interno (cerrar-vencidos).',
      );
      throw new UnauthorizedException('Token interno inválido');
    }

    this.logger.log(
      'Ejecutando cierre de KPIs vencidos vía Cron / Endpoint interno...',
    );

    return { success: true, message: 'Cierre de KPIs ejecutado correctamente' };
  }

  @Post('backup-diario')
  async backupDiario(@Headers('x-cron-secret') cronSecret: string) {
    const validSecret = this.configService.get<string>('CRON_SECRET');

    if (!cronSecret || cronSecret !== validSecret) {
      this.logger.warn(
        'Intento de acceso no autorizado al endpoint interno (backup-diario).',
      );
      throw new UnauthorizedException('Token interno inválido');
    }

    this.logger.log(
      'Iniciando generación automática de Backup diario (3:00 AM)...',
    );

    try {
      const resultado = await this.backupService.generateBackup();
      this.logger.log(
        `✅ Backup automático generado y subido al FTP: ${resultado.filename}`,
      );
      return {
        success: true,
        message: 'Backup automático exitoso',
        data: resultado,
      };
    } catch (error) {
      this.logger.error('❌ Falló el backup automático', error);
      throw error;
    }
  }
}
