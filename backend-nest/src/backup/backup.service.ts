import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FtpService } from '../common/ftp/ftp.service';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);
const TABLAS_KPI =
  'areas kpi_roles users kpis kpi_campos kpis_programados registros_kpi registro_valores notifications notification_reads';

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);

  constructor(
    private configService: ConfigService,
    private ftpService: FtpService,
  ) {}

  async generateBackup() {
    const timestamp = new Date()
      .toISOString()
      .replace(/[-:T]/g, '')
      .slice(0, 14);
    const filename = `backup_kpis_${timestamp}.sql`;
    const backupDir = path.join(process.cwd(), 'uploads', 'backups');

    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    const filepath = path.join(backupDir, filename);

    try {
      const dbUser = this.configService.get<string>('DATABASE_USER');
      const dbPassword = this.configService.get<string>('DATABASE_PASSWORD');
      const dbHost = this.configService.get<string>('DATABASE_HOST');
      const dbName = this.configService.get<string>('DATABASE_NAME');

      let mysqldumpPath = 'C:\\xampp\\mysql\\bin\\mysqldump.exe';
      if (!fs.existsSync(mysqldumpPath)) {
        mysqldumpPath = 'mysqldump'; // Fallback para Linux/Mac o variables de entorno
      }

      const pwdArg = dbPassword ? `-p${dbPassword}` : '';
      const cmd = `"${mysqldumpPath}" -u ${dbUser} ${pwdArg} -h ${dbHost} ${dbName} ${TABLAS_KPI} > "${filepath}"`;

      await execAsync(cmd);

      const stats = fs.statSync(filepath);
      const buffer = fs.readFileSync(filepath);

      await this.ftpService.uploadBackupBytes(buffer, filename);

      fs.unlinkSync(filepath); // Limpiar archivo local

      return {
        success: true,
        filename,
        size_mb: Number((stats.size / 1024 / 1024).toFixed(2)),
        created_at: timestamp,
      };
    } catch (error) {
      if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
      this.logger.error('Error generando backup', error);
      throw new InternalServerErrorException(
        `Error en mysqldump: ${error.message}`,
      );
    }
  }

  async listBackups() {
    return this.ftpService.listBackups();
  }

  async downloadBackup(filename: string) {
    return this.ftpService.downloadBackupBytes(filename);
  }
}
