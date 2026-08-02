import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  In,
  LessThanOrEqual,
  MoreThanOrEqual,
  DataSource,
  DeepPartial,
} from 'typeorm';
import { Area } from '../entities/area.entity';
import { Kpi } from '../entities/kpi.entity';
import { KpiCampo } from '../entities/kpi-campo.entity';
import { KpiProgramado } from '../entities/kpi-programado.entity';
import { RegistroKpi } from '../entities/registro-kpi.entity';
import { RegistroValores } from '../entities/registro-valores.entity';
import { Notification } from '../entities/notification.entity';
import { User } from '../entities/user.entity';
import { CacheService } from '../common/cache/cache.service';
import { KpiCierreService } from './kpi-cierre.service';
import { RegistrarKpiDto } from './dto/registrar-kpi.dto';
import { ProgramarKpiDto } from './dto/programar-kpi.dto';
import { AsignarResponsableDto } from './dto/asignar-responsable.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class KpisService {
  constructor(
    @InjectRepository(Area) private areaRepo: Repository<Area>,
    @InjectRepository(Kpi) private kpiRepo: Repository<Kpi>,
    @InjectRepository(KpiCampo) private campoRepo: Repository<KpiCampo>,
    @InjectRepository(KpiProgramado)
    private programadoRepo: Repository<KpiProgramado>,
    @InjectRepository(RegistroKpi)
    private registroRepo: Repository<RegistroKpi>,
    @InjectRepository(RegistroValores)
    private valoresRepo: Repository<RegistroValores>,
    @InjectRepository(Notification)
    private notificationRepo: Repository<Notification>,
    private cache: CacheService,
    private kpiCierre: KpiCierreService,
    private dataSource: DataSource,
  ) {}

  // ── 1. areas/stats ──
  async getAreasStats(currentUser: User) {
    const esAdmin = currentUser.kpiRolId === 1;
    await this.kpiCierre.cerrarVencidosInterno(currentUser.id);

    const cacheKey = `kpis-areas-stats-${currentUser.kpiAreaId}-${currentUser.kpiRolId}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    const now = new Date();

    const whereAreas: any = { activo: true };
    if (!esAdmin && currentUser.kpiAreaId) {
      whereAreas.id = currentUser.kpiAreaId;
    }
    const areas = await this.areaRepo.find({
      where: whereAreas,
      order: { nombre: 'ASC' },
    });

    const kpis = await this.kpiRepo.find({ where: { activo: true } });
    const programaciones = await this.programadoRepo.find({
      where: {
        fechaInicio: LessThanOrEqual(now),
        fechaFin: MoreThanOrEqual(now),
      },
      relations: { kpi: true },
    });

    const progAreaCount: Record<number, number> = {};
    for (const p of programaciones) {
      const areaId = p.kpi.areaId;
      progAreaCount[areaId] = (progAreaCount[areaId] || 0) + 1;
    }

    const kpiAreaCount: Record<number, number> = {};
    for (const k of kpis) {
      kpiAreaCount[k.areaId] = (kpiAreaCount[k.areaId] || 0) + 1;
    }

    const res = areas.map((a) => ({
      id: a.id,
      nombre: a.nombre,
      total: kpiAreaCount[a.id] || 0,
      activos: progAreaCount[a.id] || 0,
      max: 3,
    }));

    this.cache.set(cacheKey, res);
    return res;
  }

  // ── 2. area/{area_id} ──
  async getKpisPorArea(areaId: number, currentUser: User) {
    const esAdmin = currentUser.kpiRolId === 1;
    if (!esAdmin && currentUser.kpiAreaId !== areaId) {
      throw new ForbiddenException('No tienes acceso a esta área.');
    }
    const kpis = await this.kpiRepo.find({
      where: { areaId, activo: true },
      order: { nombre: 'ASC' },
    });
    return kpis.map((k) => ({
      id: k.id,
      nombre: k.nombre,
      formula_texto: k.formulaTexto,
    }));
  }

  // ── 3. campos/{kpi_id} ──
  async getCamposKpi(kpiId: number) {
    const campos = await this.campoRepo.find({
      where: { kpiId },
      order: { orden: 'ASC' },
    });
    const kpi = await this.kpiRepo.findOne({ where: { id: kpiId } });

    let kpiMeta: any = null;
    if (kpi) {
      kpiMeta = {
        meta_valor: kpi.metaValor,
        meta_produccion: kpi.metaProduccion ?? null,
        horas_planificadas: kpi.horasPlanificadas ?? null,
      };
    }

    const camposSerializados = campos.map((c) => ({
      id: c.id,
      kpi_id: c.kpiId,
      campo_key: c.campoKey,
      campo_label: c.campoLabel,
      tipo: c.tipo,
      origen: c.origen,
      formula_personalizada: c.formulaPersonalizada || '',
      es_requerido: c.esRequerido,
      orden: c.orden,
    }));

    return { campos: camposSerializados, kpi_meta: kpiMeta };
  }

  // ── 4. GET configuracion/{kpi_id} ──
  async getConfiguracion(kpiId: number, currentUser: User) {
    if (currentUser.kpiRolId !== 1) {
      throw new ForbiddenException(
        'Solo el administrador puede ver la configuración de KPIs.',
      );
    }
    const campos = await this.campoRepo.find({
      where: { kpiId },
      order: { orden: 'ASC' },
    });
    const kpi = await this.kpiRepo.findOne({ where: { id: kpiId } });
    if (!kpi) throw new NotFoundException('KPI no encontrado.');

    return {
      formula_original: kpi.formulaTexto || '',
      campos: campos.map((c) => ({
        id: c.id,
        campo_key: c.campoKey,
        campo_label: c.campoLabel,
        tipo: c.tipo,
        origen: c.origen,
        formula_personalizada: c.formulaPersonalizada || '',
      })),
    };
  }

  // ── 5. POST configuracion/{kpi_id} ──
  async saveConfiguracion(
    kpiId: number,
    payload: { campos?: any[] },
    currentUser: User,
  ) {
    if (currentUser.kpiRolId !== 1) {
      throw new ForbiddenException(
        'Solo el administrador puede configurar KPIs.',
      );
    }
    const camposPayload = payload.campos || [];
    for (const c of camposPayload) {
      const campo = await this.campoRepo.findOne({
        where: { id: c.id, kpiId },
      });
      if (campo) {
        campo.origen = c.origen ?? campo.origen;
        campo.formulaPersonalizada = c.formula_personalizada || null;
        await this.campoRepo.save(campo);
      }
    }
    this.cache.invalidatePrefix('kpis-');
    return { success: true, message: 'Configuración guardada exitosamente' };
  }

  // ── 6. dashboard_data ──
  async getDashboardData(currentUser: User) {
    const esAdmin = currentUser.kpiRolId === 1;

    const whereAreas: any = { activo: true };
    if (!esAdmin) {
      if (!currentUser.kpiAreaId) return [];
      whereAreas.id = currentUser.kpiAreaId;
    }
    const areas = await this.areaRepo.find({
      where: whereAreas,
      order: { nombre: 'ASC' },
    });
    const areaIds = areas.map((a) => a.id);
    if (areaIds.length === 0) return [];

    const todosKpis = await this.kpiRepo.find({
      where: { areaId: In(areaIds) },
    });

    const kpisPorArea: Record<number, Kpi[]> = {};
    for (const id of areaIds) kpisPorArea[id] = [];
    for (const k of todosKpis) kpisPorArea[k.areaId].push(k);

    return areas.map((area) => {
      const kpisOrdenados = [...kpisPorArea[area.id]].sort(
        (a, b) => a.id - b.id,
      );
      return {
        id: area.id,
        nombre: area.nombre,
        kpis: kpisOrdenados.map((k) => ({
          id: k.id,
          nombre: k.nombre,
          formula_texto: k.formulaTexto || 'N/A',
          tipo_kpi: k.tipoKpi || 'Positivo',
          activo_semanal: k.activoSemanal,
        })),
      };
    });
  }

  // ── 7. semanales/{area_id} ──
  async getKpisSemanalesPorArea(areaId: number, currentUser: User) {
    if (
      currentUser.kpiRolId == null ||
      ![1, 2].includes(currentUser.kpiRolId)
    ) {
      throw new ForbiddenException(
        'Sin permisos para gestionar KPIs semanales.',
      );
    }
    if (currentUser.kpiRolId === 2 && currentUser.kpiAreaId !== areaId) {
      throw new ForbiddenException('Solo puedes gestionar tu propia área.');
    }

    const area = await this.areaRepo.findOne({ where: { id: areaId } });
    if (!area) throw new NotFoundException('Área no encontrada.');

    const kpis = await this.kpiRepo.find({
      where: { areaId, activo: true },
      order: { nombre: 'ASC' },
    });

    await this.kpiCierre.cerrarVencidosInterno(currentUser.id);

    const now = new Date();
    const programaciones = await this.programadoRepo.find({
      where: {
        kpi: { areaId },
        fechaInicio: LessThanOrEqual(now),
        fechaFin: MoreThanOrEqual(now),
      },
      relations: { kpi: true },
    });

    const progDict: Record<number, KpiProgramado> = {};
    for (const p of programaciones) progDict[p.kpiId] = p;

    return {
      area_id: area.id,
      area_nombre: area.nombre,
      activos_count: programaciones.length,
      max_activos: 3,
      kpis: kpis.map((k) => ({
        id: k.id,
        nombre: k.nombre,
        formula_texto: k.formulaTexto || '',
        is_programado: k.id in progDict,
        fecha_fin: progDict[k.id] ? progDict[k.id].fechaFin : null,
        responsable_id: k.responsableId,
        completado: progDict[k.id] ? progDict[k.id].completado : false,
      })),
    };
  }

  // ── 8. diario ──
  async obtenerKpisDiarios(currentUser: User) {
    const esAdmin = currentUser.kpiRolId === 1;
    await this.kpiCierre.cerrarVencidosInterno(currentUser.id);
    const now = new Date();

    const where: any = {
      fechaInicio: LessThanOrEqual(now),
      fechaFin: MoreThanOrEqual(now),
    };

    if (!esAdmin) {
      if (!currentUser.kpiAreaId) return [];
      where.kpi = { areaId: currentUser.kpiAreaId };
    }

    const programados = await this.programadoRepo.find({
      where,
      relations: { kpi: { responsable: true } },
    });

    const resultado = programados.map((p) => ({
      id: p.kpi.id,
      nombre: p.kpi.nombre,
      area_id: p.kpi.areaId,
      responsable_id: p.kpi.responsableId,
      responsable_nombre: p.kpi.responsable ? p.kpi.responsable.name : null,
      meta_valor: p.kpi.metaValor || 0.0,
      activo_semanal: true,
      es_mi_kpi: p.kpi.responsableId === currentUser.id,
      fecha_fin: p.fechaFin,
      completado: p.completado,
    }));

    resultado.sort((a, b) => Number(b.es_mi_kpi) - Number(a.es_mi_kpi));
    return resultado;
  }

  // ── 9. REGISTRAR LLENADO (POST /registrar) ──
  private safeFloat(val: any): number | null {
    if (val === null || val === undefined || String(val).trim() === '')
      return null;
    const valStr = String(val).trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(valStr)) {
      const fecha = new Date(valStr.substring(0, 10));
      const epoch = new Date('1970-01-01T00:00:00Z');
      return (fecha.getTime() - epoch.getTime()) / 86400000.0;
    }
    const num = parseFloat(valStr);
    return isNaN(num) ? null : num;
  }

  async registrarLlenado(dto: RegistrarKpiDto, currentUser: User) {
    const campos = await this.campoRepo.find({ where: { kpiId: dto.kpi_id } });

    let valorSemanal: number | null = null,
      cumplimiento: number | null = null,
      productividad: number | null = null,
      eficiencia: number | null = null;
    let eficacia: number | null = null,
      efectividad: number | null = null,
      rendimiento: number | null = null;
    let alerta = 'gris',
      observaciones = '',
      accionesCorrectivas = '';

    for (const c of campos) {
      const key = c.campoKey;
      const label = c.campoLabel.toLowerCase();
      if (!(key in dto.valores)) continue;
      const val = dto.valores[key];
      if (val === null || String(val).trim() === '') continue;

      if (label.includes('valor semanal')) valorSemanal = this.safeFloat(val);
      else if (label.includes('cumplimiento'))
        cumplimiento = this.safeFloat(val);
      else if (label.includes('productividad'))
        productividad = this.safeFloat(val);
      else if (label.includes('eficiencia')) eficiencia = this.safeFloat(val);
      else if (label.includes('eficacia')) eficacia = this.safeFloat(val);
      else if (label.includes('efectividad')) efectividad = this.safeFloat(val);
      else if (label.includes('rendimiento')) rendimiento = this.safeFloat(val);
      else if (label.includes('alerta') || label.includes('semáforo')) {
        const valStr = String(val).toLowerCase();
        if (valStr.includes('verde')) alerta = 'verde';
        else if (valStr.includes('amarillo')) alerta = 'amarillo';
        else if (valStr.includes('rojo')) alerta = 'rojo';
      } else if (label.includes('observaciones')) observaciones = String(val);
      else if (label.includes('acciones correctivas'))
        accionesCorrectivas = String(val);
    }

    const now = new Date();
    const currentWeek = Math.ceil(
      ((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) /
        86400000 +
        now.getDay() +
        1) /
        7,
    );

    const nuevoRegistro = this.registroRepo.create({
      usuarioId: currentUser.id,
      kpiId: dto.kpi_id,
      periodoInicio: dto.periodo_inicio || now.toISOString().substring(0, 10),
      periodoFin: dto.periodo_fin || now.toISOString().substring(0, 10),
      semana: dto.semana || currentWeek,
      estado: 'enviado',
      alerta,
      valorSemanal,
      cumplimiento,
      productividad,
      eficiencia,
      eficacia,
      efectividad,
      rendimiento,
      observaciones,
      accionesCorrectivas,
    } as DeepPartial<RegistroKpi>);

    await this.registroRepo.save(nuevoRegistro);

    const valoresToInsert: RegistroValores[] = [];
    for (const c of campos) {
      if (c.campoKey in dto.valores) {
        const vFloat = this.safeFloat(dto.valores[c.campoKey]);
        if (vFloat !== null) {
          valoresToInsert.push(
            this.valoresRepo.create({
              registroId: nuevoRegistro.id,
              campoId: c.id,
              valor: vFloat,
            }),
          );
        }
      }
    }
    if (valoresToInsert.length > 0)
      await this.valoresRepo.save(valoresToInsert);

    const programado = await this.programadoRepo.findOne({
      where: {
        kpiId: dto.kpi_id,
        fechaInicio: LessThanOrEqual(now),
        fechaFin: MoreThanOrEqual(now),
        completado: false,
      },
    });

    if (programado) {
      programado.completado = true;
      programado.registroKpiId = nuevoRegistro.id;
      await this.programadoRepo.save(programado);
    }

    this.cache.invalidatePrefix('kpis-');
    return {
      message: 'Valor registrado con éxito',
      registro_id: nuevoRegistro.id,
      alerta,
    };
  }

  // ── 10. PROGRAMAR KPI (POST /{kpi_id}/programar) ──
  async programarKpi(kpiId: number, dto: ProgramarKpiDto, currentUser: User) {
    if (currentUser.kpiRolId !== 1)
      throw new ForbiddenException(
        'Solo el administrador puede programar KPIs.',
      );

    const kpi = await this.kpiRepo.findOne({ where: { id: kpiId } });
    if (!kpi) throw new NotFoundException('KPI no encontrado.');

    const area = await this.areaRepo.findOne({ where: { id: kpi.areaId } });
    const nombreAreaTexto = area ? area.nombre : '';

    const activosCount = await this.programadoRepo.count({
      where: {
        kpi: { areaId: kpi.areaId },
        fechaInicio: LessThanOrEqual(new Date(dto.fecha_fin)),
        fechaFin: MoreThanOrEqual(new Date(dto.fecha_inicio)),
        completado: false, // AGREGADO: solo cuenta lo que sigue activo, no lo histórico
      },
    });

    if (activosCount >= 3) {
      throw new BadRequestException(
        'El área ya tiene el máximo de 3 KPIs programados en este rango de fechas.',
      );
    }

    const nuevoProgramado = this.programadoRepo.create({
      kpiId,
      fechaInicio: new Date(dto.fecha_inicio),
      fechaFin: new Date(dto.fecha_fin),
      asignadoPor: currentUser.id,
    });
    await this.programadoRepo.save(nuevoProgramado);
    this.cache.invalidatePrefix('kpis-');

    try {
      const dFormateada = new Date(dto.fecha_fin).toLocaleString('es-PE', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
      await this.notificationRepo.save(
        this.notificationRepo.create({
          id: randomUUID(), // AGREGADO: arregla el TypeORMError que viste en los logs
          title: '🎯 Nueva Tarea de Área',
          body: `Se ha habilitado el KPI '${kpi.nombre}' para tu área. Límite para registro: ${dFormateada}.`,
          audience: 'area',
          audienceValue: nombreAreaTexto,
          createdBy: currentUser.id,
        }),
      );
    } catch (e) {
      console.error(`Error al enviar notificación: ${e}`);
    }

    return { message: 'KPI programado exitosamente.' };
  }

  // ── 11. ELIMINAR ÁREA EN CASCADA (DELETE /areas/{area_id}) ──
  async deleteArea(areaId: number, currentUser: User) {
    if (currentUser.kpiRolId !== 1)
      throw new ForbiddenException(
        'Solo el administrador puede eliminar áreas.',
      );

    const area = await this.areaRepo.findOne({ where: { id: areaId } });
    if (!area) throw new NotFoundException('Área no encontrada.');

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const kpis = await queryRunner.manager.find(Kpi, {
        where: { areaId },
        select: { id: true },
      });
      const kpiIds = kpis.map((k) => k.id);

      if (kpiIds.length > 0) {
        const registros = await queryRunner.manager.find(RegistroKpi, {
          where: { kpiId: In(kpiIds) },
          select: { id: true },
        });
        const regIds = registros.map((r) => r.id);

        if (regIds.length > 0)
          await queryRunner.manager.delete(RegistroValores, {
            registroId: In(regIds),
          });
        await queryRunner.manager.delete(RegistroKpi, { kpiId: In(kpiIds) });
        await queryRunner.manager.delete(KpiCampo, { kpiId: In(kpiIds) });
        await queryRunner.manager.delete(KpiProgramado, { kpiId: In(kpiIds) });
        await queryRunner.manager.delete(Kpi, { areaId });
      }

      await queryRunner.manager.delete(Area, { id: areaId });
      await queryRunner.commitTransaction();
      this.cache.invalidatePrefix('kpis-');
      return {
        success: true,
        message: 'Área y todos sus KPIs eliminados correctamente.',
      };
    } catch (e) {
      await queryRunner.rollbackTransaction();
      throw new BadRequestException(String(e));
    } finally {
      await queryRunner.release();
    }
  }

  // ── 12. ELIMINAR KPI EN CASCADA (DELETE /kpi/{kpi_id}) ──
  async deleteKpi(kpiId: number, currentUser: User) {
    if (currentUser.kpiRolId !== 1)
      throw new ForbiddenException(
        'Solo el administrador puede eliminar KPIs.',
      );

    const kpi = await this.kpiRepo.findOne({ where: { id: kpiId } });
    if (!kpi) throw new NotFoundException('KPI no encontrado.');

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const registros = await queryRunner.manager.find(RegistroKpi, {
        where: { kpiId },
        select: { id: true },
      });
      const regIds = registros.map((r) => r.id);

      if (regIds.length > 0)
        await queryRunner.manager.delete(RegistroValores, {
          registroId: In(regIds),
        });
      await queryRunner.manager.delete(RegistroKpi, { kpiId });
      await queryRunner.manager.delete(KpiCampo, { kpiId });
      await queryRunner.manager.delete(KpiProgramado, { kpiId });
      await queryRunner.manager.delete(Kpi, { id: kpiId });

      await queryRunner.commitTransaction();
      this.cache.invalidatePrefix('kpis-');
      return { success: true, message: 'KPI eliminado correctamente.' };
    } catch (e) {
      await queryRunner.rollbackTransaction();
      throw new BadRequestException(String(e));
    } finally {
      await queryRunner.release();
    }
  }

  // ── 13. ASIGNAR RESPONSABLE (PATCH /{kpi_id}/responsable) ──
  async asignarResponsable(
    kpiId: number,
    dto: AsignarResponsableDto,
    currentUser: User,
  ) {
    if (currentUser.kpiRolId == null || ![1, 2].includes(currentUser.kpiRolId))
      throw new ForbiddenException('Sin permisos para asignar responsables.');

    const kpi = await this.kpiRepo.findOne({ where: { id: kpiId } });
    if (!kpi) throw new NotFoundException('KPI no encontrado.');

    if (currentUser.kpiRolId === 2 && kpi.areaId !== currentUser.kpiAreaId) {
      throw new ForbiddenException(
        'Solo puedes asignar responsables en tu área.',
      );
    }

    if (!dto.responsable_id) {
      kpi.responsableId = null;
      await this.kpiRepo.save(kpi);
      this.cache.invalidatePrefix('kpis-');
      return { success: true, message: `KPI '${kpi.nombre}' desasignado.` };
    }

    const trabajador = await this.dataSource
      .getRepository(User)
      .findOne({ where: { id: dto.responsable_id } });
    if (!trabajador) throw new NotFoundException('Trabajador no encontrado.');

    if (trabajador.kpiRolId !== 1 && trabajador.kpiAreaId !== kpi.areaId) {
      throw new BadRequestException(
        'El trabajador no pertenece al área de este KPI.',
      );
    }

    kpi.responsableId = dto.responsable_id;
    await this.kpiRepo.save(kpi);
    this.cache.invalidatePrefix('kpis-');
    return {
      success: true,
      message: `Responsable asignado correctamente al KPI '${kpi.nombre}'.`,
    };
  }

  // ── 14. CERRAR VENCIDOS MANUAL (POST /cerrar-vencidos) ──
  async cerrarVencidosManual(currentUser: User) {
    if (currentUser.kpiRolId !== 1) {
      throw new ForbiddenException(
        'Solo el administrador puede ejecutar el cierre de KPIs.',
      );
    }
    const cerrados = await this.kpiCierre.cerrarVencidosInterno(currentUser.id);
    if (cerrados === 0) {
      return {
        success: true,
        message: 'No hay KPIs vencidos pendientes por cerrar.',
        cerrados: 0,
      };
    }
    return {
      success: true,
      message: `Se cerraron ${cerrados} KPIs vencidos con reporte de omisión (Rojo).`,
      cerrados,
    };
  }

  // ── 15. ALERTAS (GET /alertas) ──
  async getAlertas(currentUser: User) {
    if (
      currentUser.kpiRolId == null ||
      ![1, 2].includes(currentUser.kpiRolId)
    ) {
      throw new ForbiddenException(
        'Sin permisos para ver el panel de alertas.',
      );
    }

    await this.kpiCierre.cerrarVencidosInterno(currentUser.id);

    const esAdmin = currentUser.kpiRolId === 1;
    const filtroArea = esAdmin ? null : currentUser.kpiAreaId;

    const cacheKey = `kpis-alertas-${filtroArea}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    const now = new Date();

    let sqlPend = `
      SELECT kp.fecha_fin AS fecha_fin, k.nombre AS kpi_nombre,
             a.nombre AS area_nombre, u.name AS responsable_nombre
      FROM kpis_programados kp
      INNER JOIN kpis k ON kp.kpi_id = k.id
      LEFT JOIN users u ON k.responsable_id = u.id
      INNER JOIN areas a ON k.area_id = a.id
      WHERE kp.fecha_inicio <= ? AND kp.fecha_fin >= ? AND kp.completado = 0
    `;
    const paramsPend: any[] = [now, now];
    if (filtroArea) {
      sqlPend += ' AND k.area_id = ?';
      paramsPend.push(filtroArea);
    }
    const pendRows = await this.dataSource.query(sqlPend, paramsPend);
    const pendientes = pendRows.map((row: any) => {
      const fechaFin = new Date(row.fecha_fin);
      const diasRestantes = Math.floor(
        (fechaFin.getTime() - now.getTime()) / 86400000,
      );
      return {
        kpi_nombre: row.kpi_nombre,
        area_nombre: row.area_nombre,
        responsable: row.responsable_nombre || 'Sin asignar',
        fecha_fin: row.fecha_fin,
        dias_restantes: diasRestantes,
      };
    });

    let sqlRiesgo = `
      SELECT r.id AS id, k.nombre AS kpi_nombre, a.nombre AS area_nombre,
             u.name AS responsable_nombre, r.alerta AS alerta,
             r.valor_semanal AS valor_semanal, r.estado AS estado, r.periodo_fin AS periodo_fin
      FROM registros_kpi r
      INNER JOIN kpis k ON r.kpi_id = k.id
      INNER JOIN users u ON r.usuario_id = u.id
      INNER JOIN areas a ON k.area_id = a.id
      WHERE r.alerta IN ('rojo', 'amarillo')
    `;
    const paramsRiesgo: any[] = [];
    if (filtroArea) {
      sqlRiesgo += ' AND k.area_id = ?';
      paramsRiesgo.push(filtroArea);
    }
    sqlRiesgo += ' ORDER BY r.id DESC LIMIT 10';
    const riesgoRows = await this.dataSource.query(sqlRiesgo, paramsRiesgo);
    const enRiesgo = riesgoRows.map((row: any) => ({
      id_registro: row.id,
      kpi_nombre: row.kpi_nombre,
      area_nombre: row.area_nombre,
      responsable: row.responsable_nombre,
      alerta: row.alerta,
      valor_registrado: row.valor_semanal,
      estado: row.estado,
      fecha: row.periodo_fin,
    }));

    let sqlPart = `
      SELECT kp.completado AS completado, a.nombre AS area_nombre
      FROM kpis_programados kp
      INNER JOIN kpis k ON kp.kpi_id = k.id
      INNER JOIN areas a ON k.area_id = a.id
      WHERE kp.fecha_inicio <= ? AND kp.fecha_fin >= ?
    `;
    const paramsPart: any[] = [now, now];
    if (filtroArea) {
      sqlPart += ' AND k.area_id = ?';
      paramsPart.push(filtroArea);
    }
    const partRows = await this.dataSource.query(sqlPart, paramsPart);

    const statsPorArea: Record<string, { total: number; completados: number }> =
      {};
    for (const row of partRows) {
      const areaNom = row.area_nombre;
      if (!statsPorArea[areaNom])
        statsPorArea[areaNom] = { total: 0, completados: 0 };
      statsPorArea[areaNom].total++;
      if (Number(row.completado) === 1) statsPorArea[areaNom].completados++;
    }

    const participacion = Object.entries(statsPorArea).map(
      ([areaNom, stats]) => {
        const porcentaje =
          stats.total > 0 ? (stats.completados / stats.total) * 100 : 0;
        return {
          area: areaNom,
          total_programados: stats.total,
          completados: stats.completados,
          porcentaje: Math.round(porcentaje * 10) / 10,
        };
      },
    );

    const resultado = { pendientes, en_riesgo: enRiesgo, participacion };
    this.cache.set(cacheKey, resultado);
    return resultado;
  }

  // ── 16. MIS REPORTES (GET /mis-reportes) ──
  async getMisReportes(currentUser: User) {
    const cacheKey = `kpis-mis-reportes-${currentUser.id}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    const sql = `
      SELECT r.id AS id, k.nombre AS kpi_nombre, r.periodo_inicio AS periodo_inicio,
             r.periodo_fin AS periodo_fin, r.estado AS estado, r.valor_semanal AS valor_semanal,
             r.cumplimiento AS cumplimiento, r.alerta AS alerta, r.observaciones AS observaciones,
             r.enviado_en AS enviado_en
      FROM registros_kpi r
      INNER JOIN kpis k ON r.kpi_id = k.id
      WHERE r.usuario_id = ?
      ORDER BY r.id DESC
    `;
    const resultado = await this.dataSource.query(sql, [currentUser.id]);

    this.cache.set(cacheKey, resultado);
    return resultado;
  }

  // ── 17. HISTORIAL GENERAL (GET /historial, solo admin) ──
  async getHistorial(currentUser: User) {
    if (currentUser.kpiRolId !== 1) {
      throw new ForbiddenException(
        'Solo el administrador puede ver el historial general.',
      );
    }

    const cacheKey = 'kpis-historial';
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    const sql = `
      SELECT r.id AS id, r.periodo_inicio AS periodo_inicio, r.periodo_fin AS periodo_fin,
             a.nombre AS area_nombre, k.nombre AS kpi_nombre, u.name AS responsable,
             r.valor_semanal AS valor_semanal, r.cumplimiento AS cumplimiento,
             r.productividad AS productividad, r.eficiencia AS eficiencia,
             r.eficacia AS eficacia, r.efectividad AS efectividad, r.rendimiento AS rendimiento,
             r.estado AS estado, r.alerta AS alerta, r.observaciones AS observaciones,
             r.acciones_correctivas AS acciones_correctivas, r.enviado_en AS enviado_en
      FROM registros_kpi r
      INNER JOIN kpis k ON r.kpi_id = k.id
      INNER JOIN users u ON r.usuario_id = u.id
      INNER JOIN areas a ON k.area_id = a.id
      ORDER BY r.id DESC
    `;
    const resultado = await this.dataSource.query(sql);

    this.cache.set(cacheKey, resultado);
    return resultado;
  }

  // ── LIMPIEZA DE CACHÉ GLOBAL ──
  async limpiarCachesGlobales() {
    this.cache.invalidatePrefix(''); // Borra toda la memoria temporal (limpia todas las claves)
  }
}
