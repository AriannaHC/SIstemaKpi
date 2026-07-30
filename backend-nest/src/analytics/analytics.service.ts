import { Injectable, ForbiddenException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CacheService } from '../common/cache/cache.service';
import { buildMonthRange } from '../common/utils/month-range.util';
import { User } from '../entities/user.entity';

interface MetricasResult {
  cumplimiento: number;
  eficiencia: number;
  eficacia: number;
  rendimiento: number;
}

@Injectable()
export class AnalyticsService {
  constructor(
    private dataSource: DataSource,
    private cache: CacheService,
  ) {}

  // round(val*100, 1) — usado en /perfil
  private pctRound1(val: any): number {
    return val ? Math.round(Number(val) * 1000) / 10 : 0.0;
  }

  // round(val*100, 2) — usado en /evolucion y los 3 endpoints "comparar-*"
  private pctRound2(val: any): number {
    return val ? Math.round(Number(val) * 10000) / 100 : 0.0;
  }

  // ---------- PARTICIPACIÓN ----------
  async getParticipacion(
    areaIdParam: number | undefined,
    mes: number | undefined,
    anio: number | undefined,
    currentUser: User,
  ) {
    const esAdmin = currentUser.kpiRolId === 1;
    let areaId = areaIdParam;
    if (!esAdmin && currentUser.kpiAreaId) {
      areaId = currentUser.kpiAreaId;
    }

    const [inicio, fin] = buildMonthRange(mes, anio);
    const cacheKey = `kpis-participacion-${areaId}-${mes}-${anio}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    let sql = `
      SELECT u.id AS id, u.name AS nombre, a.nombre AS area_nombre,
             COUNT(kp.id) AS total,
             SUM(CASE WHEN kp.completado = 1 THEN 1 ELSE 0 END) AS completados
      FROM users u
      LEFT JOIN areas a ON u.kpi_area_id = a.id
      INNER JOIN kpis k ON k.responsable_id = u.id
      INNER JOIN kpis_programados kp ON kp.kpi_id = k.id
      WHERE u.kpi_rol_id IN (2, 3) AND u.status = 1
    `;
    const params: any[] = [];

    if (areaId) {
      sql += ' AND u.kpi_area_id = ?';
      params.push(areaId);
    }
    if (inicio && fin) {
      sql += ' AND kp.fecha_inicio >= ? AND kp.fecha_fin <= ?';
      params.push(inicio, fin);
    }
    sql += ' GROUP BY u.id, u.name, a.nombre';

    const rows = await this.dataSource.query(sql, params);

    let resultados = rows
      .map((row: any) => {
        const total = Number(row.total);
        const completados = Number(row.completados) || 0;
        if (total === 0) return null;
        const score = Math.round((completados / total) * 1000) / 10;
        return {
          id: row.id,
          nombre: row.nombre,
          area: row.area_nombre || 'Sin Área',
          score,
          alerta_cero: score === 0,
          alerta_alta: score >= 90,
        };
      })
      .filter((r: any) => r !== null);

    resultados.sort((a: any, b: any) => b.score - a.score);
    this.cache.set(cacheKey, resultados);
    return resultados;
  }

  // ---------- EVOLUCIÓN ----------
  async getEvolucion(
    areaIdParam: number | undefined,
    mes: number | undefined,
    anio: number | undefined,
    currentUser: User,
  ) {
    const esAdmin = currentUser.kpiRolId === 1;
    let areaId = areaIdParam;
    if (!esAdmin && currentUser.kpiAreaId) {
      areaId = currentUser.kpiAreaId;
    }

    const [inicio, fin] = buildMonthRange(mes, anio);
    const cacheKey = `kpis-evolucion-${areaId}-${mes}-${anio}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    let sql = `
      SELECT r.semana AS semana, AVG(r.cumplimiento) AS promedio_cumplimiento
      FROM registros_kpi r
      INNER JOIN kpis k ON r.kpi_id = k.id
      WHERE r.cumplimiento IS NOT NULL
    `;
    const params: any[] = [];

    if (inicio && fin) {
      sql += ' AND r.enviado_en >= ? AND r.enviado_en <= ?';
      params.push(inicio, fin);
    }
    if (areaId) {
      sql += ' AND k.area_id = ?';
      params.push(areaId);
    }
    sql += ' GROUP BY r.semana ORDER BY r.semana';

    const rows = await this.dataSource.query(sql, params);

    const resultado = rows.map((r: any) => ({
      semana: `Semana ${r.semana}`,
      cumplimiento: this.pctRound2(r.promedio_cumplimiento),
    }));

    this.cache.set(cacheKey, resultado);
    return resultado;
  }

  // ---------- Helper compartido por los 3 "comparar-*" ----------
  private async obtenerMetricasPorFiltro(
    whereExtra: string,
    params: any[],
  ): Promise<MetricasResult> {
    const sql = `
      SELECT AVG(r.cumplimiento) AS cump, AVG(r.eficiencia) AS efi,
             AVG(r.eficacia) AS efica, AVG(r.rendimiento) AS rend
      FROM registros_kpi r
      ${whereExtra}
    `;
    const rows = await this.dataSource.query(sql, params);
    const stats = rows[0] || {};
    return {
      cumplimiento: this.pctRound2(stats.cump),
      eficiencia: this.pctRound2(stats.efi),
      eficacia: this.pctRound2(stats.efica),
      rendimiento: this.pctRound2(stats.rend),
    };
  }

  private buildComparacion(
    nombreA: string,
    statsA: MetricasResult,
    nombreB: string,
    statsB: MetricasResult,
  ) {
    return [
      {
        metrica: 'Cumplimiento',
        entidadA_nombre: nombreA,
        entidadA_valor: statsA.cumplimiento,
        entidadB_nombre: nombreB,
        entidadB_valor: statsB.cumplimiento,
      },
      {
        metrica: 'Eficiencia',
        entidadA_nombre: nombreA,
        entidadA_valor: statsA.eficiencia,
        entidadB_nombre: nombreB,
        entidadB_valor: statsB.eficiencia,
      },
      {
        metrica: 'Eficacia',
        entidadA_nombre: nombreA,
        entidadA_valor: statsA.eficacia,
        entidadB_nombre: nombreB,
        entidadB_valor: statsB.eficacia,
      },
      {
        metrica: 'Rendimiento',
        entidadA_nombre: nombreA,
        entidadA_valor: statsA.rendimiento,
        entidadB_nombre: nombreB,
        entidadB_valor: statsB.rendimiento,
      },
    ];
  }

  // ---------- COMPARAR ÁREAS ----------
  async compararAreas(
    areaA: number,
    areaB: number,
    fechaDesde: string | undefined,
    fechaHasta: string | undefined,
    mes: number | undefined,
    anio: number | undefined,
    currentUser: User,
  ) {
    if (currentUser.kpiRolId !== 1 && currentUser.kpiRolId !== 2) {
      throw new ForbiddenException('Sin permisos.');
    }
    const [inicioMes, finMes] = buildMonthRange(mes, anio);

    const metricasArea = async (areaId: number) => {
      let where =
        'INNER JOIN kpis k ON r.kpi_id = k.id WHERE k.area_id = ? AND r.cumplimiento IS NOT NULL';
      const params: any[] = [areaId];
      if (inicioMes && finMes) {
        where += ' AND r.enviado_en >= ? AND r.enviado_en <= ?';
        params.push(inicioMes, finMes);
      } else {
        if (fechaDesde) {
          where += ' AND r.enviado_en >= ?';
          params.push(`${fechaDesde} 00:00:00`);
        }
        if (fechaHasta) {
          where += ' AND r.enviado_en <= ?';
          params.push(`${fechaHasta} 23:59:59`);
        }
      }
      return this.obtenerMetricasPorFiltro(where, params);
    };

    const nombreRows = await this.dataSource.query(
      'SELECT id, nombre FROM areas WHERE id IN (?, ?)',
      [areaA, areaB],
    );
    const nombreA =
      nombreRows.find((r: any) => r.id === areaA)?.nombre || `Área ${areaA}`;
    const nombreB =
      nombreRows.find((r: any) => r.id === areaB)?.nombre || `Área ${areaB}`;

    const statsA = await metricasArea(areaA);
    const statsB = await metricasArea(areaB);

    return this.buildComparacion(nombreA, statsA, nombreB, statsB);
  }

  // ---------- COMPARAR TRABAJADORES ----------
  async compararTrabajadores(
    userA: string,
    userB: string,
    fechaDesde: string | undefined,
    fechaHasta: string | undefined,
    mes: number | undefined,
    anio: number | undefined,
    currentUser: User,
  ) {
    if (currentUser.kpiRolId !== 1 && currentUser.kpiRolId !== 2) {
      throw new ForbiddenException('Sin permisos.');
    }
    const [inicioMes, finMes] = buildMonthRange(mes, anio);

    const metricasUsuario = async (userId: string) => {
      let where = 'WHERE r.usuario_id = ? AND r.cumplimiento IS NOT NULL';
      const params: any[] = [userId];
      if (inicioMes && finMes) {
        where += ' AND r.enviado_en >= ? AND r.enviado_en <= ?';
        params.push(inicioMes, finMes);
      } else {
        if (fechaDesde) {
          where += ' AND r.enviado_en >= ?';
          params.push(`${fechaDesde} 00:00:00`);
        }
        if (fechaHasta) {
          where += ' AND r.enviado_en <= ?';
          params.push(`${fechaHasta} 23:59:59`);
        }
      }
      return this.obtenerMetricasPorFiltro(where, params);
    };

    const nombresRows = await this.dataSource.query(
      'SELECT id, name FROM users WHERE id IN (?, ?)',
      [userA, userB],
    );
    const nombreA =
      nombresRows.find((r: any) => r.id === userA)?.name || 'Usuario A';
    const nombreB =
      nombresRows.find((r: any) => r.id === userB)?.name || 'Usuario B';

    const statsA = await metricasUsuario(userA);
    const statsB = await metricasUsuario(userB);

    return this.buildComparacion(nombreA, statsA, nombreB, statsB);
  }

  // ---------- COMPARAR MESES ----------
  async compararMeses(
    areaIdParam: number | undefined,
    mes: number | undefined,
    anio: number | undefined,
  ) {
    let currInicio: string,
      currFin: string,
      prevInicio: string,
      prevFin: string;
    let currLabel: string, prevLabel: string;

    if (mes && anio) {
      const [ci, cf] = buildMonthRange(mes, anio);
      currInicio = ci as string;
      currFin = cf as string;
      const prevMes = mes === 1 ? 12 : mes - 1;
      const prevAnio = mes === 1 ? anio - 1 : anio;
      const [pi, pf] = buildMonthRange(prevMes, prevAnio);
      prevInicio = pi as string;
      prevFin = pf as string;
      currLabel = `Mes ${mes}`;
      prevLabel = `Mes ${prevMes}`;
    } else {
      const now = new Date();
      const currInicioDate = new Date(
        now.getFullYear(),
        now.getMonth(),
        1,
        0,
        0,
        0,
      );
      const prevFinDate = new Date(currInicioDate.getTime() - 1000);
      const prevInicioDate = new Date(
        prevFinDate.getFullYear(),
        prevFinDate.getMonth(),
        1,
        0,
        0,
        0,
      );
      const prevFinAdjusted = new Date(
        prevFinDate.getFullYear(),
        prevFinDate.getMonth(),
        prevFinDate.getDate(),
        23,
        59,
        59,
      );

      const fmt = (d: Date) => d.toISOString().slice(0, 19).replace('T', ' ');
      currInicio = fmt(currInicioDate);
      currFin = fmt(now);
      prevInicio = fmt(prevInicioDate);
      prevFin = fmt(prevFinAdjusted);
      currLabel = 'Mes Actual';
      prevLabel = 'Mes Anterior';
    }

    const statsMes = async (inicio: string, fin: string) => {
      if (areaIdParam && areaIdParam > 0) {
        const where =
          'INNER JOIN kpis k ON r.kpi_id = k.id WHERE k.area_id = ? AND r.enviado_en >= ? AND r.enviado_en <= ? AND r.cumplimiento IS NOT NULL';
        return this.obtenerMetricasPorFiltro(where, [areaIdParam, inicio, fin]);
      }
      const where =
        'WHERE r.enviado_en >= ? AND r.enviado_en <= ? AND r.cumplimiento IS NOT NULL';
      return this.obtenerMetricasPorFiltro(where, [inicio, fin]);
    };

    const statsCurr = await statsMes(currInicio, currFin);
    const statsPrev = await statsMes(prevInicio, prevFin);

    return this.buildComparacion(currLabel, statsCurr, prevLabel, statsPrev);
  }

  // ---------- PERFIL ----------
  async getPerfil(
    areaId: number | undefined,
    mes: number | undefined,
    anio: number | undefined,
  ) {
    const [inicio, fin] = buildMonthRange(mes, anio);
    const cacheKey = `kpis-perfil-${areaId}-${mes}-${anio}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    let sqlGral = `
      SELECT AVG(cumplimiento) AS cump, AVG(eficacia) AS efica,
             AVG(eficiencia) AS efi, AVG(rendimiento) AS rend
      FROM registros_kpi
      WHERE cumplimiento IS NOT NULL
    `;
    const paramsGral: any[] = [];
    if (inicio && fin) {
      sqlGral += ' AND enviado_en >= ? AND enviado_en <= ?';
      paramsGral.push(inicio, fin);
    }
    const rowsGral = await this.dataSource.query(sqlGral, paramsGral);
    const statsGral = rowsGral[0] || {};

    const promedioGral = [
      this.pctRound1(statsGral.cump),
      this.pctRound1(statsGral.efica),
      this.pctRound1(statsGral.efi),
      this.pctRound1(statsGral.rend),
    ];

    let areaValor: number[] = [];
    if (areaId) {
      let sqlArea = `
        SELECT AVG(r.cumplimiento) AS cump, AVG(r.eficacia) AS efica,
               AVG(r.eficiencia) AS efi, AVG(r.rendimiento) AS rend
        FROM registros_kpi r
        INNER JOIN kpis k ON r.kpi_id = k.id
        WHERE k.area_id = ? AND r.cumplimiento IS NOT NULL
      `;
      const paramsArea: any[] = [areaId];
      if (inicio && fin) {
        sqlArea += ' AND r.enviado_en >= ? AND r.enviado_en <= ?';
        paramsArea.push(inicio, fin);
      }
      const rowsArea = await this.dataSource.query(sqlArea, paramsArea);
      const statsArea = rowsArea[0];
      if (statsArea && statsArea.cump !== null) {
        areaValor = [
          this.pctRound1(statsArea.cump),
          this.pctRound1(statsArea.efica),
          this.pctRound1(statsArea.efi),
          this.pctRound1(statsArea.rend),
        ];
      }
    }

    const resultado = { promedioGral, areaValor };
    this.cache.set(cacheKey, resultado);
    return resultado;
  }
}
