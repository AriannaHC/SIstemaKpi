import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  CreateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Area } from './area.entity';

@Entity('registro_diario_actividades')
@Index('ix_registro_diario_usuario_fecha', ['usuarioId', 'fechaRegistro'])
export class RegistroDiario {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'usuario_id', type: 'varchar', length: 36 })
  usuarioId: string;

  @Column({ name: 'area_id' })
  areaId: number;

  @CreateDateColumn({ name: 'fecha_registro', type: 'timestamp' })
  fechaRegistro: Date;

  @Column({ length: 200 })
  proceso: string;

  @Column({ name: 'tipo_actividad', length: 150 })
  tipoActividad: string;

  @Column({ name: 'tipo_tarea', length: 150 })
  tipoTarea: string;

  @Column({ length: 300 })
  entregable: string;

  @Column({ name: 'responsable_asigna', length: 150 })
  responsableAsigna: string;

  @Column({ name: 'fecha_inicio', type: 'datetime' })
  fechaInicio: Date;

  @Column({ name: 'fecha_entrega', type: 'datetime' })
  fechaEntrega: Date;

  @Column({ name: 'unidad_medida', length: 50 })
  unidadMedida: string;

  @Column({ name: 'tiempo_estimado', type: 'float' })
  tiempoEstimado: number;

  @Column({ name: 'estado_base', length: 100 })
  estadoBase: string;

  @Column({ name: 'estado_entregable_calidad', length: 100, nullable: true })
  estadoEntregableCalidad: string;

  @Column({ name: 'estado_animo', length: 100, nullable: true })
  estadoAnimo: string;

  @Column({ name: 'observaciones_calidad', length: 500, nullable: true })
  observacionesCalidad: string;

  @Column({ name: 'tiempo_estandar', type: 'float', nullable: true })
  tiempoEstandar: number;

  @Column({ name: 'tiempo_real_calidad', type: 'float', nullable: true })
  tiempoRealCalidad: number;

  @Column({ name: 'errores_observaciones', length: 500, nullable: true })
  erroresObservaciones: string;

  @Column({ type: 'float', nullable: true })
  eficiencia: number;

  @Column({ name: 'tasa_calidad', type: 'float', nullable: true })
  tasaCalidad: number;

  @Column({ name: 'rubrica_final', length: 500, nullable: true })
  rubricaFinal: string;

  @Column({ name: 'auditado_calidad', default: false })
  auditadoCalidad: boolean;

  @Column({ length: 50, nullable: true })
  prioridad: string;

  @Column({ name: 'tiempo_real_operaciones', type: 'float', nullable: true })
  tiempoRealOperaciones: number;

  @Column({ name: 'estado_tarea_operaciones', length: 100, nullable: true })
  estadoTareaOperaciones: string;

  @Column({ name: 'motivo_retraso', length: 500, nullable: true })
  motivoRetraso: string;

  @Column({ name: 'observaciones_operaciones', length: 500, nullable: true })
  observacionesOperaciones: string;

  @Column({ name: 'enlace_evidencia', length: 500, nullable: true })
  enlaceEvidencia: string;

  @Column({ name: 'imagen_evidencia', length: 500, nullable: true })
  imagenEvidencia: string;

  @Column({ name: 'validacion_lider', length: 100, nullable: true })
  validacionLider: string;

  @Column({ name: 'actitud_colaborador', length: 100, nullable: true })
  actitudColaborador: string;

  @Column({ name: 'dias_vencimiento', nullable: true })
  diasVencimiento: number;

  @Column({ name: 'auditado_operaciones', default: false })
  auditadoOperaciones: boolean;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'usuario_id' })
  usuario: User;

  @ManyToOne(() => Area)
  @JoinColumn({ name: 'area_id' })
  area: Area;
}
