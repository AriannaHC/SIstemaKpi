import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RegistroDiarioController } from './registro-diario.controller';
import { RegistroDiarioService } from './registro-diario.service';
import { RegistroDiario } from '../entities/registro-diario.entity';
import { FtpService } from '../common/ftp/ftp.service';
import { ImagenesController } from './imagenes.controller';

@Module({
  imports: [TypeOrmModule.forFeature([RegistroDiario])],
  controllers: [RegistroDiarioController, ImagenesController],
  providers: [RegistroDiarioService, FtpService],
})
export class RegistroDiarioModule {}
