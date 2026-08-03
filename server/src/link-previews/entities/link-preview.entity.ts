import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('link_previews')
export class LinkPreview {
  @PrimaryColumn('varchar', { length: 2048 })
  url: string;

  @Column({ type: 'varchar', length: 512, nullable: true })
  title: string | null;

  @Column({ type: 'varchar', length: 512, nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 2048, nullable: true })
  image: string | null;

  @Column({ name: 'site_name', type: 'varchar', length: 255, nullable: true })
  siteName: string | null;

  @Column({ type: 'varchar', length: 2048, nullable: true })
  favicon: string | null;

  @Column({ name: 'fetched_at', type: 'timestamp with time zone', default: () => 'now()' })
  fetchedAt: Date;
}
