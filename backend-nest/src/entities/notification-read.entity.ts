import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('notification_reads')
export class NotificationRead {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'notification_id', type: 'varchar', length: 36 })
  notificationId: string;

  @Column({ name: 'user_id', type: 'varchar', length: 36 })
  userId: string;

  @CreateDateColumn({ name: 'read_at', type: 'timestamp' })
  readAt: Date;
}
