import {
  Injectable,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as ExcelJS from 'exceljs';
import { Area } from '../entities/area.entity';
import { Kpi } from '../entities/kpi.entity';
import { KpiCampo } from '../entities/kpi-campo.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class ExcelImportService {
  private readonly SKIP_SHEETS = new Set([
    'Inicio',
    'Índice de formulas',
    'Índice de fórmulas',
    'Leyenda de Evaluación de Indica',
    'Datos de la hoja',
    'datos de la hoja',
  ]);

  constructor(
    @InjectRepository(Area) private areaRepo: Repository<Area>,
    @InjectRepository(Kpi) private kpiRepo: Repository<Kpi>,
    @InjectRepository(KpiCampo) private campoRepo: Repository<KpiCampo>,
  ) {}

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

  private campoKey(label: string): string {
    return label
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_')
      .substring(0, 80);
  }

  private isSystemCol(h: string): boolean {
    const hLower = h.toLowerCase().trim();
    const exactMatches = new Set([
      'semana',
      'cuartil',
      'fecha inicio',
      'fecha fin',
      'duración (días)',
      'kpi',
      'fórmula base',
      'objetivo',
      'función',
      'importancia',
      'responsable',
    ]);
    return exactMatches.has(hLower);
  }

  private buildJsFormula(formulaText: string, camposEntrada: string[]): string {
    if (!formulaText || String(formulaText).trim().toLowerCase() === 'nan')
      return '';
    let form = String(formulaText);
    form = form.replace(/(?:\*|x|×)\s*100\b/gi, '').trim();
    form = form
      .replace(/×/g, '*')
      .replace(/x/g, '*')
      .replace(/÷/g, '/')
      .replace(/−/g, '-');
    const camposValidos = camposEntrada
      .filter(
        (c) =>
          !['observaciones', 'acciones correctivas'].includes(c.toLowerCase()),
      )
      .sort((a, b) => b.length - a.length);
    for (const c of camposValidos) {
      form = form.split(c).join(`[${c}]`);
    }
    return form;
  }

  private getRowValues(ws: ExcelJS.Worksheet, rowNumber: number): any[] {
    const row = ws.getRow(rowNumber);
    const maxCol = ws.columnCount || row.cellCount;
    const values: any[] = [];
    for (let i = 1; i <= maxCol; i++) {
      const cell = row.getCell(i);
      values.push(cell.value === undefined ? null : cell.value);
    }
    return values;
  }

  private extractKpiFieldsFromSheet(ws: ExcelJS.Worksheet): any {
    const dataRaw = this.getRowValues(ws, 5);
    const headersRaw = this.getRowValues(ws, 4);
    if (!headersRaw.length || !dataRaw.length) return null;

    const headers = headersRaw.map((v) =>
      v !== null && v !== undefined ? String(v).trim() : '',
    );

    const getVal = (colName: string) => {
      const idx = headers.indexOf(colName);
      if (idx === -1) return null;
      const v = dataRaw[idx];
      if (
        v === null ||
        v === undefined ||
        String(v).trim().toLowerCase() === 'nan'
      )
        return null;
      return v;
    };

    let kpiName = getVal('KPI');
    if (!kpiName || String(kpiName).trim() === '') kpiName = null;

    const formula = getVal('Fórmula base') || '';
    const metaRaw =
      getVal('Meta KPI <=') ??
      getVal('Meta KPI >=') ??
      getVal('Meta KPI ≤') ??
      getVal('Meta KPI ≥');
    let metaTipo = 'minimo';
    for (const h of headers) {
      if (h.includes('Meta KPI <') || h.includes('Meta KPI ≤')) {
        metaTipo = 'maximo';
        break;
      }
    }
    const metaProdRaw =
      getVal('Meta Producción <=') ??
      getVal('Meta Producción >=') ??
      getVal('Meta Producción ≤') ??
      getVal('Meta Producción ≥');
    const horasPlanRaw = getVal('Horas planificadas');

    const inputFields: string[] = [];
    const seen = new Set<string>();
    for (const h of headers) {
      const hClean = h.trim();
      if (hClean && !this.isSystemCol(hClean) && !seen.has(hClean)) {
        inputFields.push(hClean);
        seen.add(hClean);
      }
    }

    return {
      kpiName: kpiName ? String(kpiName) : null,
      formula: String(formula),
      metaValor: this.safeFloat(metaRaw),
      metaTipo,
      metaProd: this.safeFloat(metaProdRaw),
      horasPlan: this.safeFloat(horasPlanRaw),
      inputFields,
    };
  }

  // ── upload ──
  async parseExcelAndSave(buffer: Buffer, currentUser: User): Promise<any> {
    if (currentUser.kpiRolId !== 1) {
      throw new ForbiddenException(
        'Solo el administrador puede importar Excels.',
      );
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as any);

    const wsInicio = workbook.getWorksheet('Inicio');
    if (!wsInicio)
      throw new BadRequestException(
        "No se encontró la hoja 'Inicio' en el Excel.",
      );

    let areaName: string | null = null;
    for (let r = 2; r <= 5; r++) {
      const cellVal = wsInicio.getRow(r).getCell(2).value; // columna B
      if (
        cellVal !== null &&
        cellVal !== undefined &&
        String(cellVal).trim() !== ''
      ) {
        areaName = String(cellVal).trim();
        break;
      }
    }
    areaName = areaName || 'Sin nombre';

    let area = await this.areaRepo.findOne({ where: { nombre: areaName } });
    if (!area) {
      area = this.areaRepo.create({ nombre: areaName, activo: true });
      await this.areaRepo.save(area);
    }

    const results: any[] = [];

    for (const ws of workbook.worksheets) {
      if (this.SKIP_SHEETS.has(ws.name)) continue;
      const info = this.extractKpiFieldsFromSheet(ws);
      if (!info) continue;

      const kpiName = info.kpiName || ws.name;

      const kpi = this.kpiRepo.create({
        nombre: kpiName,
        formulaTexto: info.formula,
        areaId: area.id,
        metaValor: info.metaValor,
        metaProduccion: info.metaProd,
        horasPlanificadas: info.horasPlan,
        activo: true,
        activoSemanal: false,
      });
      await this.kpiRepo.save(kpi);

      const formulaValorSemanal = this.buildJsFormula(
        info.formula,
        info.inputFields,
      );
      const camposGuardados: string[] = [];

      for (let orden = 0; orden < info.inputFields.length; orden++) {
        const colLabel = info.inputFields[orden];
        const key = this.campoKey(colLabel);
        const lowerLabel = colLabel.toLowerCase();

        const tipo = ['observaciones', 'acciones', 'fecha', 'alerta'].some(
          (w) => lowerLabel.includes(w),
        )
          ? 'texto'
          : 'numero';

        let origen = 'usuario';
        let formulaPers: string | null = null;

        if (lowerLabel.includes('eficiencia')) {
          origen = 'calculado';
          formulaPers = '([Horas planificadas] / [Horas reales])';
        } else if (lowerLabel.includes('eficacia')) {
          origen = 'calculado';
          formulaPers = '[Cumplimiento (%)] > 1 ? 1 : [Cumplimiento (%)]';
        } else if (lowerLabel.includes('efectividad')) {
          origen = 'calculado';
          formulaPers = '([Eficiencia (%)] * [Eficacia (%)])';
        } else if (lowerLabel.includes('rendimiento')) {
          origen = 'calculado';
          formulaPers = '([Productividad] / [Meta Producción ≥])';
        } else if (lowerLabel.includes('alerta')) {
          origen = 'sistema';
        } else if (lowerLabel.includes('valor semanal')) {
          origen = 'calculado';
          formulaPers = formulaValorSemanal;
        } else if (
          ['cumplimiento', 'productividad', 'calculado'].some((w) =>
            lowerLabel.includes(w),
          )
        ) {
          origen = 'calculado';
        } else if (lowerLabel.includes('meta')) {
          origen = 'sistema';
        }

        const existing = await this.campoRepo.findOne({
          where: { kpiId: kpi.id, campoKey: key },
        });
        if (!existing) {
          await this.campoRepo.save(
            this.campoRepo.create({
              kpiId: kpi.id,
              campoKey: key,
              campoLabel: colLabel,
              tipo,
              origen,
              formulaPersonalizada: formulaPers,
              esRequerido: false,
              orden,
            }),
          );
          camposGuardados.push(colLabel);
        }
      }

      results.push({
        sheet: ws.name,
        kpi: kpiName,
        campos_entrada: camposGuardados,
      });
    }

    return { area: areaName, kpis: results };
  }

  // ── upload_smart ──
  async processSmartExcel(buffer: Buffer, currentUser: User): Promise<number> {
    if (currentUser.kpiRolId !== 1) {
      throw new ForbiddenException(
        'Solo el administrador puede importar Excels.',
      );
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as any);
    const ws = workbook.getWorksheet('2_Metas');
    if (!ws)
      throw new BadRequestException(
        "No se encontró la hoja '2_Metas' en el Excel.",
      );

    const headerRow = ws.getRow(1);
    const headers: string[] = [];
    headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      headers[colNumber] = cell.value ? String(cell.value).trim() : '';
    });

    let kpisActualizados = 0;

    for (let r = 2; r <= ws.rowCount; r++) {
      const row = ws.getRow(r);
      const getCol = (name: string): any => {
        const idx = headers.indexOf(name);
        if (idx === -1) return '';
        const v = row.getCell(idx).value;
        return v === null || v === undefined ? '' : v;
      };

      const nombreKpi = String(getCol('Nombre KPI') || '').trim();
      const tipoKpiCrudo = String(getCol('Tipo_KPI') || '')
        .trim()
        .toLowerCase();
      if (!nombreKpi) continue;

      const kpi = await this.kpiRepo.findOne({ where: { nombre: nombreKpi } });
      if (!kpi) continue;

      const tipoEnum = tipoKpiCrudo === 'negativo' ? 'Negativo' : 'Positivo';
      kpi.tipoKpi = tipoEnum;

      const campos = await this.campoRepo.find({ where: { kpiId: kpi.id } });

      let labelValor = '[Valor semanal]';
      let labelMeta = '[Meta KPI]';
      let labelMetaProd = '[Meta Producción]';

      for (const c of campos) {
        const lbl = c.campoLabel.toLowerCase();
        if (lbl.includes('valor semanal')) labelValor = `[${c.campoLabel}]`;
        else if (lbl.includes('meta kpi')) labelMeta = `[${c.campoLabel}]`;
        else if (
          lbl.includes('meta producción') ||
          lbl.includes('meta produccion')
        )
          labelMetaProd = `[${c.campoLabel}]`;
      }

      let fCump: string, fProd: string;
      if (tipoEnum === 'Positivo') {
        fCump = `(${labelMeta} === 0 || ${labelMeta} === null) ? 0 : (${labelValor} / ${labelMeta})`;
        fProd = `(${labelMetaProd} === 0 || ${labelMetaProd} === null) ? 0 : (${labelValor} / ${labelMetaProd})`;
      } else {
        fCump = `(${labelMeta} === 0 || ${labelMeta} === null) ? (${labelValor} === 0 ? 1 : 0) : Math.max(0, 1 - (${labelValor} / ${labelMeta}))`;
        fProd = `(${labelMetaProd} === 0 || ${labelMetaProd} === null) ? (${labelValor} === 0 ? 1 : 0) : Math.max(0, 1 - (${labelValor} / ${labelMetaProd}))`;
      }

      for (const c of campos) {
        const lbl = c.campoLabel.toLowerCase();
        if (lbl.includes('cumplimiento')) {
          c.formulaPersonalizada = fCump;
          c.origen = 'calculado';
        } else if (lbl.includes('productividad')) {
          c.formulaPersonalizada = fProd;
          c.origen = 'calculado';
        }
      }
      await this.campoRepo.save(campos);
      await this.kpiRepo.save(kpi);

      kpisActualizados++;
    }

    return kpisActualizados;
  }
}
