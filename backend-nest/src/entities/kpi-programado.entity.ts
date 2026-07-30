import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  CreateDateColumn,
} from 'typeorm';
import { Kpi } from './kpi.entity';
import { User } from './user.entity';

@Entity('kpis_programados')
@Index('ix_kpis_programados_kpi_completado', ['kpiId', 'completado'])
@Index('ix_kpis_programados_fechas', ['fechaInicio', 'fechaFin'])
export class KpiProgramado {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'kpi_id' })
  kpiId: number;

  @Column({ name: 'fecha_inicio', type: 'datetime' })
  fechaInicio: Date;

  @Column({ name: 'fecha_fin', type: 'datetime' })
  fechaFin: Date;

  @Column({ default: false })
  completado: boolean;

  @Column({ name: 'registro_kpi_id', nullable: true })
  registroKpiId: number;

  @Column({ name: 'asignado_por', type: 'varchar', length: 36, nullable: true })
  asignadoPor: string;

  // Fecha generada automáticamente en el INSERT
  @CreateDateColumn({ name: 'creado_en', type: 'timestamp' })
  creadoEn: Date;

  @ManyToOne(() => Kpi)
  @JoinColumn({ name: 'kpi_id' })
  kpi: Kpi;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'asignado_por' })
  asignador: User;
}
