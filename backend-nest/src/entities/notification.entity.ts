import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('notifications')
export class Notification {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id: string;

  @Column({ length: 200 })
  title: string;

  @Column({ length: 500, nullable: true })
  body: string;

  @Column({ name: 'image_url', length: 500, nullable: true })
  imageUrl: string;

  @Column({ name: 'pdf_url', length: 500, nullable: true })
  pdfUrl: string;

  @Column({ length: 50, default: 'all' })
  audience: string;

  @Column({ name: 'audience_value', length: 150, nullable: true })
  audienceValue: string;

  @Column({ name: 'created_by', type: 'varchar', length: 36 })
  createdBy: string;

  @Column({ name: 'idempotency_key', length: 64, nullable: true })
  idempotencyKey: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
