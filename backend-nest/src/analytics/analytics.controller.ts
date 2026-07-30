import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Get('participacion')
  participacion(
    @Query('area_id') areaId: string,
    @Query('mes') mes: string,
    @Query('anio') anio: string,
    @Req() req,
  ) {
    return this.analyticsService.getParticipacion(
      areaId ? +areaId : undefined,
      mes ? +mes : undefined,
      anio ? +anio : undefined,
      req.user,
    );
  }

  @Get('evolucion')
  evolucion(
    @Query('area_id') areaId: string,
    @Query('mes') mes: string,
    @Query('anio') anio: string,
    @Req() req,
  ) {
    return this.analyticsService.getEvolucion(
      areaId ? +areaId : undefined,
      mes ? +mes : undefined,
      anio ? +anio : undefined,
      req.user,
    );
  }

  @Get('comparar-areas')
  @UseGuards(RolesGuard)
  @Roles(1, 2)
  compararAreas(
    @Query('area_a') areaA: string,
    @Query('area_b') areaB: string,
    @Query('fecha_desde') fechaDesde: string,
    @Query('fecha_hasta') fechaHasta: string,
    @Query('mes') mes: string,
    @Query('anio') anio: string,
    @Req() req,
  ) {
    return this.analyticsService.compararAreas(
      +areaA,
      +areaB,
      fechaDesde,
      fechaHasta,
      mes ? +mes : undefined,
      anio ? +anio : undefined,
      req.user,
    );
  }

  @Get('comparar-trabajadores')
  @UseGuards(RolesGuard)
  @Roles(1, 2)
  compararTrabajadores(
    @Query('user_a') userA: string,
    @Query('user_b') userB: string,
    @Query('fecha_desde') fechaDesde: string,
    @Query('fecha_hasta') fechaHasta: string,
    @Query('mes') mes: string,
    @Query('anio') anio: string,
    @Req() req,
  ) {
    return this.analyticsService.compararTrabajadores(
      userA,
      userB,
      fechaDesde,
      fechaHasta,
      mes ? +mes : undefined,
      anio ? +anio : undefined,
      req.user,
    );
  }

  @Get('comparar-meses')
  compararMeses(
    @Query('area_id') areaId: string,
    @Query('mes') mes: string,
    @Query('anio') anio: string,
  ) {
    return this.analyticsService.compararMeses(
      areaId ? +areaId : undefined,
      mes ? +mes : undefined,
      anio ? +anio : undefined,
    );
  }

  @Get('perfil')
  perfil(
    @Query('area_id') areaId: string,
    @Query('mes') mes: string,
    @Query('anio') anio: string,
  ) {
    return this.analyticsService.getPerfil(
      areaId ? +areaId : undefined,
      mes ? +mes : undefined,
      anio ? +anio : undefined,
    );
  }
}
