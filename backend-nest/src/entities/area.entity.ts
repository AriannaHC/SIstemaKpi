import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { User } from './user.entity';

@Entity('areas')
export class Area {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 120 })
  nombre: string;

  @Column({ default: true })
  activo: boolean;

  @OneToMany(() => User, (user) => user.areaKpi)
  usuarios: User[];
}
