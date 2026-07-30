import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  Res,
  BadRequestException,
} from '@nestjs/common';
import { BackupService } from './backup.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import type { Response } from 'express';

@Controller('backup')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(1) // Solo Administrador
export class BackupController {
  constructor(private readonly backupService: BackupService) {}

  @Post('generate')
  async generate() {
    return this.backupService.generateBackup();
  }

  @Get('list')
  async list() {
    return this.backupService.listBackups();
  }

  @Get('download/:filename')
  async download(@Param('filename') filename: string, @Res() res: Response) {
    if (
      filename.includes('/') ||
      filename.includes('\\') ||
      !filename.endsWith('.sql')
    ) {
      throw new BadRequestException('Nombre de archivo inválido.');
    }

    const buffer = await this.backupService.downloadBackup(filename);
    res.set({
      'Content-Type': 'application/sql',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });
    res.send(buffer);
  }
}
