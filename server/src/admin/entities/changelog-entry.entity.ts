import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('changelog_entries')
@Index('IDX_changelog_entries_publishedAt', ['publishedAt'])
@Index('UQ_changelog_entries_version', ['version'], { unique: true })
export class ChangelogEntryEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 64 })
  version: string;

  @Column({ type: 'varchar', length: 160 })
  title: string;

  @Column({ type: 'text' })
  body: string;

  @Column({ type: 'jsonb' })
  changes: string[];

  @Column({ type: 'timestamptz' })
  publishedAt: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
