import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('kpi_campos')
export class KpiCampo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'kpi_id' })
  kpiId: number;

  @Column({ name: 'campo_key', length: 100 })
  campoKey: string;

  @Column({ name: 'campo_label', length: 200 })
  campoLabel: string;

  @Column({ length: 50, default: 'numero' })
  tipo: string;

  @Column({ length: 50, default: 'usuario' })
  origen: string;

  @Column({
    type: 'text',
    name: 'formula_personalizada',
    nullable: true,
  })
  formulaPersonalizada: string | null;

  @Column({ name: 'es_requerido', default: false })
  esRequerido: boolean;

  @Column({ default: 0 })
  orden: number;
}
