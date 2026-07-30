import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Area } from './area.entity';
import { KpiRol } from './kpi-rol.entity';

@Entity('users')
export class User {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 255, unique: true })
  email: string;

  @Column({ name: 'password_hash', length: 255 })
  password: string;

  @Column({ default: true })
  status: boolean;

  @Column({ name: 'kpi_area_id', nullable: true })
  kpiAreaId: number | null;

  @Column({ name: 'kpi_rol_id', nullable: true })
  kpiRolId: number | null;

  @ManyToOne(() => Area, (area) => area.usuarios)
  @JoinColumn({ name: 'kpi_area_id' })
  areaKpi: Area;

  @ManyToOne(() => KpiRol, (rol) => rol.usuarios)
  @JoinColumn({ name: 'kpi_rol_id' })
  rolKpi: KpiRol;
}
