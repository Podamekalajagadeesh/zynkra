import { MigrationInterface, QueryRunner } from 'typeorm';

export class PostCollaborators1786900000000 implements MigrationInterface {
  name = 'PostCollaborators1786900000000';

  // Redundant no-op: the Baseline migration (1784458210376) already creates the
  // post_collaborators table, its indexes, and FKs. Running CREATE TABLE again here
  // fails with `relation "post_collaborators" already exists`, which (because all
  // migrations run in one transaction) rolls back the entire schema batch. Baseline's
  // version also uses the correct ON UPDATE CASCADE behavior.
  public async up(queryRunner: QueryRunner): Promise<void> {
    return;
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    return;
  }
}
