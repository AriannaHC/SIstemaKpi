import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as ftp from 'basic-ftp';
import { Readable, Writable } from 'stream';

@Injectable()
export class FtpService {
  private readonly logger = new Logger(FtpService.name);

  constructor(private configService: ConfigService) {}

  private async connect(type: 'images' | 'backups'): Promise<ftp.Client> {
    const client = new ftp.Client();
    try {
      await client.access({
        host: this.configService.get<string>('FTP_HOST'),
        user: this.configService.get<string>(`FTP_${type.toUpperCase()}_USER`),
        password: this.configService.get<string>(
          `FTP_${type.toUpperCase()}_PASSWORD`,
        ),
        secure: true,
        secureOptions: { rejectUnauthorized: false }, // ← agregar esta línea
      });
      return client;
    } catch (error) {
      this.logger.error(`Error conectando al FTP (${type}):`, error);
      client.close();
      throw error;
    }
  }

  // ── Imágenes (públicas) ──────────────────────────────────────────────

  async uploadImageBytes(buffer: Buffer, filename: string): Promise<string> {
    const client = await this.connect('images');
    try {
      const stream = Readable.from(buffer);
      await client.uploadFrom(stream, filename);
      const baseUrl = this.configService.get<string>('PUBLIC_URL_BASE');
      return `${baseUrl}/${filename}`;
    } finally {
      client.close();
    }
  }

  // ── Backups (privados) ───────────────────────────────────────────────

  async uploadBackupBytes(buffer: Buffer, filename: string): Promise<void> {
    const client = await this.connect('backups');
    try {
      const stream = Readable.from(buffer);
      await client.uploadFrom(stream, filename);
    } finally {
      client.close();
    }
  }

  async listBackups(): Promise<any[]> {
    const client = await this.connect('backups');
    try {
      const list = await client.list();
      const files = list
        .filter((item) => item.name.endsWith('.sql'))
        .map((item) => ({
          filename: item.name,
          size_mb: Number((item.size / 1024 / 1024).toFixed(2)),
          created_at: item.modifiedAt ? item.modifiedAt.toISOString() : '',
        }));
      return files.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
    } finally {
      client.close();
    }
  }

  async downloadBackupBytes(filename: string): Promise<Buffer> {
    const client = await this.connect('backups');
    try {
      const chunks: Buffer[] = [];
      const writableStream = new Writable({
        write(chunk, encoding, callback) {
          chunks.push(Buffer.from(chunk));
          callback();
        },
      });
      await client.downloadTo(writableStream, filename);
      return Buffer.concat(chunks);
    } finally {
      client.close();
    }
  }

  async downloadImageBytes(filename: string): Promise<Buffer> {
    const client = await this.connect('images');
    try {
      const chunks: Buffer[] = [];
      const writableStream = new Writable({
        write(chunk, encoding, callback) {
          chunks.push(Buffer.from(chunk));
          callback();
        },
      });
      await client.downloadTo(writableStream, filename);
      return Buffer.concat(chunks);
    } finally {
      client.close();
    }
  }
}
