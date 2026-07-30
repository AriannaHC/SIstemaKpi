import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { KpiProgramado } from '../entities/kpi-programado.entity';
import { RegistroKpi } from '../entities/registro-kpi.entity';
import { CacheService } from '../common/cache/cache.service';

function getIsoWeek(date: Date): number {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

@Injectable()
export class KpiCierreService {
  // Equivalente a _last_cerrar_kpis_ts — vive mientras viva el proceso Node.
  private lastRunTs = 0;

  constructor(
    @InjectRepository(KpiProgramado)
    private programadoRepo: Repository<KpiProgramado>,
    @InjectRepository(RegistroKpi)
    private registroRepo: Repository<RegistroKpi>,
    private cache: CacheService,
  ) {}

  async cerrarVencidosInterno(systemUserId?: string): Promise<number> {
    const nowTs = Date.now();
    if (nowTs - this.lastRunTs < 300_000) {
      // 300s, igual que el original
      return 0;
    }
    this.lastRunTs = nowTs;

    const now = new Date();
    const vencidos = await this.programadoRepo.find({
      where: { completado: false, fechaFin: LessThan(now) },
      relations: { kpi: true },
    });

    if (vencidos.length === 0) return 0;

    let cerrados = 0;
    for (const p of vencidos) {
      const responsableOmision =
        p.kpi.responsableId || p.asignadoPor || systemUserId;
      if (!responsableOmision) continue;

      const registroOmision = this.registroRepo.create({
        usuarioId: responsableOmision,
        kpiId: p.kpiId,
        periodoInicio: this.formatFecha(p.fechaInicio),
        periodoFin: this.formatFecha(p.fechaFin),
        semana: getIsoWeek(p.fechaInicio),
        estado: 'no_reportado',
        alerta: 'rojo',
        valorSemanal: 0.0,
        observaciones:
          'Cierre automático por sistema (fecha vencida sin llenado)',
      });
      await this.registroRepo.save(registroOmision);

      p.completado = true;
      p.registroKpiId = registroOmision.id;
      await this.programadoRepo.save(p);
      cerrados++;
    }

    if (cerrados > 0) {
      this.cache.invalidatePrefix('kpis-');
    }
    return cerrados;
  }

  private formatFecha(d: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }
}
