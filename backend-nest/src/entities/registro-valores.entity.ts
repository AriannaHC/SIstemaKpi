import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('registro_valores')
export class RegistroValores {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'registro_id' })
  registroId: number;

  @Column({ name: 'campo_id' })
  campoId: number;

  @Column({ type: 'float', nullable: true })
  valor: number;
}
