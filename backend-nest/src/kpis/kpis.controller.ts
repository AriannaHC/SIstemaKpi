import {
  Controller,
  Get,
  Post,
  Param,
  ParseIntPipe,
  Body,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { KpisService } from './kpis.service';
import { Delete, Patch } from '@nestjs/common';
import { RegistrarKpiDto } from './dto/registrar-kpi.dto';
import { ProgramarKpiDto } from './dto/programar-kpi.dto';
import { AsignarResponsableDto } from './dto/asignar-responsable.dto';
import { UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ExcelImportService } from './excel-import.service';

@Controller('kpis')
@UseGuards(JwtAuthGuard)
export class KpisController {
  constructor(
    private kpisService: KpisService,
    private excelImportService: ExcelImportService,
  ) {}

  @Get('areas/stats')
  areasStats(@Req() req) {
    return this.kpisService.getAreasStats(req.user);
  }

  @Get('area/:areaId')
  kpisPorArea(@Param('areaId', ParseIntPipe) areaId: number, @Req() req) {
    return this.kpisService.getKpisPorArea(areaId, req.user);
  }

  @Get('campos/:kpiId')
  camposKpi(@Param('kpiId', ParseIntPipe) kpiId: number) {
    return this.kpisService.getCamposKpi(kpiId);
  }

  @Get('configuracion/:kpiId')
  configuracion(@Param('kpiId', ParseIntPipe) kpiId: number, @Req() req) {
    return this.kpisService.getConfiguracion(kpiId, req.user);
  }

  @Post('configuracion/:kpiId')
  saveConfiguracion(
    @Param('kpiId', ParseIntPipe) kpiId: number,
    @Body() payload: { campos?: any[] },
    @Req() req,
  ) {
    return this.kpisService.saveConfiguracion(kpiId, payload, req.user);
  }

  @Get('dashboard_data')
  dashboardData(@Req() req) {
    return this.kpisService.getDashboardData(req.user);
  }

  @Get('semanales/:areaId')
  semanales(@Param('areaId', ParseIntPipe) areaId: number, @Req() req) {
    return this.kpisService.getKpisSemanalesPorArea(areaId, req.user);
  }

  @Get('diario')
  diario(@Req() req) {
    return this.kpisService.obtenerKpisDiarios(req.user);
  }

  // --- RUTAS DEL DÍA 8 (Abajo de las rutas estáticas del Día 7) ---

  @Post('registrar')
  registrarLlenado(@Body() dto: RegistrarKpiDto, @Req() req) {
    return this.kpisService.registrarLlenado(dto, req.user);
  }

  @Post(':kpiId/programar')
  programarKpi(
    @Param('kpiId', ParseIntPipe) kpiId: number,
    @Body() dto: ProgramarKpiDto,
    @Req() req,
  ) {
    return this.kpisService.programarKpi(kpiId, dto, req.user);
  }

  @Delete('areas/:areaId')
  deleteArea(@Param('areaId', ParseIntPipe) areaId: number, @Req() req) {
    return this.kpisService.deleteArea(areaId, req.user);
  }

  @Delete('kpi/:kpiId')
  deleteKpi(@Param('kpiId', ParseIntPipe) kpiId: number, @Req() req) {
    return this.kpisService.deleteKpi(kpiId, req.user);
  }

  @Patch(':kpiId/responsable')
  asignarResponsable(
    @Param('kpiId', ParseIntPipe) kpiId: number,
    @Body() dto: AsignarResponsableDto,
    @Req() req,
  ) {
    return this.kpisService.asignarResponsable(kpiId, dto, req.user);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadExcel(@UploadedFile() file: Express.Multer.File, @Req() req) {
    const result = await this.excelImportService.parseExcelAndSave(
      file.buffer,
      req.user,
    );

    await this.kpisService.limpiarCachesGlobales(); // <--- AGREGA ESTA LÍNEA

    return { success: true, result };
  }

  @Post('upload_smart')
  @UseInterceptors(FileInterceptor('file'))
  async uploadSmartExcel(
    @UploadedFile() file: Express.Multer.File,
    @Req() req,
  ) {
    const kpisActualizados = await this.excelImportService.processSmartExcel(
      file.buffer,
      req.user,
    );

    await this.kpisService.limpiarCachesGlobales(); // <--- AGREGA ESTA LÍNEA

    return {
      success: true,
      message: `¡Diccionario SMART procesado con éxito! Se auto-configuraron ${kpisActualizados} KPIs.`,
    };
  }

  @Post('cerrar-vencidos')
  cerrarVencidosManual(@Req() req) {
    return this.kpisService.cerrarVencidosManual(req.user);
  }

  @Get('alertas')
  alertas(@Req() req) {
    return this.kpisService.getAlertas(req.user);
  }

  @Get('sincronizar')
  async sincronizarManual() {
    await this.kpisService.limpiarCachesGlobales();
    return {
      success: true,
      message: 'Caché sincronizada con la base de datos',
    };
  }

  @Get('mis-reportes')
  misReportes(@Req() req) {
    return this.kpisService.getMisReportes(req.user);
  }

  @Get('historial')
  historial(@Req() req) {
    return this.kpisService.getHistorial(req.user);
  }

  @Get('historial/exportar')
  async exportarHistorialExcel(@Req() req, @Res() res: Response) {
    const buffer = await this.kpisService.exportarHistorialExcel(req.user);
    const fecha = new Date().toISOString().split('T')[0];

    // Le decimos al navegador que esto es un archivo de Excel para descargar
    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename=Historial_KPIs_${fecha}.xlsx`,
      'Content-Length': buffer.length.toString(),
    });

    res.end(buffer);
  }
}
