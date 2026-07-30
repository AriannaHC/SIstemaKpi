import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { RegistroDiarioService } from './registro-diario.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CreateRegistroDiarioDto } from './dto/create-registro-diario.dto';
import {
  Patch,
  Res,
  UseInterceptors,
  UploadedFile,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { AuditarCalidadDto } from './dto/auditar-calidad.dto';
import { AuditarOperacionesDto } from './dto/auditar-operaciones.dto';

@Controller('registros-diarios')
@UseGuards(JwtAuthGuard)
export class RegistroDiarioController {
  constructor(private readonly registroService: RegistroDiarioService) {}

  @Post()
  crearRegistro(@Body() dto: CreateRegistroDiarioDto, @Req() req) {
    return this.registroService.crearRegistro(dto, req.user);
  }

  @Get('panel-operaciones')
  panelOperaciones(@Req() req) {
    return this.registroService.getPanelOperaciones(req.user);
  }

  @Get('panel-calidad')
  panelCalidad(@Req() req) {
    return this.registroService.getPanelCalidad(req.user);
  }

  @Get('exportar-excel')
  async exportarExcel(
    @Query('area_panel') areaPanel: string,
    @Query('fecha') fecha: string,
    @Query('fecha_desde') fechaDesde: string,
    @Query('fecha_hasta') fechaHasta: string,
    @Query('area_filtro') areaFiltro: string,
    @Query('trabajador') trabajador: string,
    @Query('estado') estado: string,
    @Req() req,
    @Res() res: Response,
  ) {
    const { buffer, filename } = await this.registroService.exportarExcel(
      {
        areaPanel,
        fecha,
        fechaDesde,
        fechaHasta,
        areaFiltro,
        trabajador,
        estado,
      },
      req.user,
    );
    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });
    res.send(buffer);
  }

  @Get(':id')
  obtenerRegistroDetalle(@Param('id') id: string) {
    return this.registroService.obtenerRegistroDetalle(+id);
  }

  @Patch(':id/calidad')
  auditarCalidad(
    @Param('id') id: string,
    @Body() dto: AuditarCalidadDto,
    @Req() req,
  ) {
    return this.registroService.auditarCalidad(+id, dto, req.user);
  }

  @Patch(':id/operaciones')
  @UseInterceptors(FileInterceptor('imagen_evidencia'))
  auditarOperaciones(
    @Param('id') id: string,
    @Body() dto: AuditarOperacionesDto,
    @UploadedFile() file: Express.Multer.File,
    @Req() req,
  ) {
    return this.registroService.auditarOperaciones(+id, dto, file, req.user);
  }
}
