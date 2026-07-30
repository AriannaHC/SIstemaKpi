import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KpisController } from './kpis.controller';
import { KpisService } from './kpis.service';
import { KpiCierreService } from './kpi-cierre.service';
import { Area } from '../entities/area.entity';
import { Kpi } from '../entities/kpi.entity';
import { KpiCampo } from '../entities/kpi-campo.entity';
import { KpiProgramado } from '../entities/kpi-programado.entity';
import { RegistroKpi } from '../entities/registro-kpi.entity';
import { RegistroValores } from '../entities/registro-valores.entity';
import { Notification } from '../entities/notification.entity';
import { ExcelImportService } from './excel-import.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Area,
      Kpi,
      KpiCampo,
      KpiProgramado,
      RegistroKpi,
      RegistroValores,
      Notification,
    ]),
  ],
  controllers: [KpisController],
  providers: [KpisService, KpiCierreService, ExcelImportService],
  exports: [KpiCierreService],
})
export class KpisModule {}
