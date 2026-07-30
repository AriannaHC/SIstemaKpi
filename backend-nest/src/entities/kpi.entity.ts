import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Area } from './area.entity';
import { User } from './user.entity';

@Entity('kpis')
export class Kpi {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  nombre: string;

  @Column({ name: 'formula_texto', length: 500, nullable: true })
  formulaTexto: string;

  @Column({ name: 'tipo_kpi', length: 50, default: 'Positivo' })
  tipoKpi: string;

  @Column({ name: 'area_id', nullable: true })
  areaId: number;

  @Column({
    name: 'responsable_id',
    type: 'varchar',
    length: 36,
    nullable: true,
  })
  responsableId: string | null;

  @Column({ name: 'meta_valor', type: 'float', default: 0.0 })
  metaValor: number;

  @Column({ name: 'meta_produccion', type: 'float', nullable: true })
  metaProduccion: number;

  @Column({ name: 'horas_planificadas', type: 'float', nullable: true })
  horasPlanificadas: number;

  @Column({ default: true })
  activo: boolean;

  @Column({ name: 'activo_semanal', default: false })
  activoSemanal: boolean;

  @ManyToOne(() => Area)
  @JoinColumn({ name: 'area_id' })
  area: Area;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'responsable_id' })
  responsable: User;
}
