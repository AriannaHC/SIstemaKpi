import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
} from 'typeorm';

@Entity('registros_kpi')
@Index('ix_registros_kpi_usuario_alerta', ['usuarioId', 'alerta'])
export class RegistroKpi {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'usuario_id', type: 'varchar', length: 36 })
  usuarioId: string;

  @Column({ name: 'kpi_id' })
  kpiId: number;

  @Column({ name: 'periodo_inicio', length: 20, nullable: true })
  periodoInicio: string;

  @Column({ name: 'periodo_fin', length: 20, nullable: true })
  periodoFin: string;

  @Column({ nullable: true })
  semana: number;

  @Column({ length: 50, default: 'enviado' })
  estado: string;

  @Column({ name: 'valor_semanal', type: 'float', nullable: true })
  valorSemanal: number;

  @Column({ type: 'float', nullable: true })
  cumplimiento: number;

  @Column({ type: 'float', nullable: true })
  productividad: number;

  @Column({ type: 'float', nullable: true })
  eficiencia: number;

  @Column({ type: 'float', nullable: true })
  eficacia: number;

  @Column({ type: 'float', nullable: true })
  efectividad: number;

  @Column({ type: 'float', nullable: true })
  rendimiento: number;

  @Column({ length: 20, default: 'gris' })
  alerta: string;

  @Column({ length: 500, nullable: true })
  observaciones: string;

  @Column({ name: 'acciones_correctivas', length: 500, nullable: true })
  accionesCorrectivas: string;

  // Fecha generada automáticamente en el INSERT
  @CreateDateColumn({ name: 'enviado_en', type: 'timestamp' })
  enviadoEn: Date;
}
