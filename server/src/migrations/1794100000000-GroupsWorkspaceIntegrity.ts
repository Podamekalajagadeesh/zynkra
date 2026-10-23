import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Groups Workspace integrity (Wave 6 promotion).
 *
 * Three schema-level defects made every groups list a sequential scan, every
 * duplicate a race, and account deletion a guaranteed failure:
 *
 * 1. **No unique constraints.** `group_members`, `channel_members`, `vote`,
 *    and participation contributions were all check-then-insert in app code —
 *    two concurrent joins produced two membership rows. Dedupe first, then
 *    partial unique indexes (partial so NULL rows — allowed by the nullable
 *    columns — stay indexable-optional and PG keeps them distinct).
 * 2. **Every FK was `ON DELETE NO ACTION`.** `UsersService.delete` sweeps
 *    ownership columns and then `remove(user)`; columns it does not sweep
 *    (`vote.voterId`, `todo_items.assigneeId`, `message.senderId`,
 *    `conversation.modmailRecipientId`, `conversation_participants_users.usersId`)
 *    threw 23503 and rolled the whole deletion back, and the purge cron had no
 *    sweep at all. Policy now: identity/membership rows die with their owner
 *    (CASCADE); content rows survive with the reference nulled (SET NULL),
 *    which is what `delete`'s ownerId/creatorId sweep already assumed.
 *    Group children cascade with the group (there is no group-deletion route
 *    yet, but the owner sweep deletes owned groups, and blocked FKs are what
 *    made that fail).
 * 3. **No FK indexes.** Every join by groupId/channelId/userId was a seq scan.
 *
 * Constraint names are the ones actually present in the live database
 * (verified against pg_constraint, not assumed from the baseline) — the
 * lockdown FKs were churned by the drift-fix migration and carry different
 * names than their baseline originals.
 */
export class GroupsWorkspaceIntegrity1794100000000 implements MigrationInterface {
  name = 'GroupsWorkspaceIntegrity1794100000000';

  private async redefineForeignKey(
    queryRunner: QueryRunner,
    table: string,
    constraint: string,
    column: string,
    refTable: string,
    refColumn: string,
    onDelete: string,
    onUpdate = 'NO ACTION'
  ): Promise<void> {
    await queryRunner.query(`ALTER TABLE "${table}" DROP CONSTRAINT IF EXISTS "${constraint}"`);
    await queryRunner.query(
      `ALTER TABLE "${table}" ADD CONSTRAINT "${constraint}" FOREIGN KEY ("${column}") REFERENCES "${refTable}"("${refColumn}") ON DELETE ${onDelete} ON UPDATE ${onUpdate}`
    );
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    // --- 1. Dedupe existing rows before the unique indexes. -----------------
    await queryRunner.query(
      `DELETE FROM "group_members" a USING "group_members" b
         WHERE a."id" > b."id" AND a."userId" = b."userId" AND a."groupId" = b."groupId"`
    );
    await queryRunner.query(
      `DELETE FROM "channel_members" a USING "channel_members" b
         WHERE a."id" > b."id" AND a."channelId" = b."channelId" AND a."userId" = b."userId"`
    );
    await queryRunner.query(
      `DELETE FROM "vote" a USING "vote" b
         WHERE a."id" > b."id" AND a."proposalId" = b."proposalId" AND a."voterId" = b."voterId"`
    );
    // Only PARTICIPATION is duplicate-checked in the service; monetary
    // donations and actions are legitimately repeatable.
    await queryRunner.query(
      `DELETE FROM "challenge_contributions" a USING "challenge_contributions" b
         WHERE a."id" > b."id" AND a."type" = 'participation' AND b."type" = 'participation'
           AND a."challengeId" = b."challengeId" AND a."userId" = b."userId"`
    );

    // --- 2. Partial unique indexes (the DB-side idempotency the app lacked). -
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_group_members_user_group" ON "group_members" ("userId", "groupId") WHERE "userId" IS NOT NULL AND "groupId" IS NOT NULL`
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_channel_members_channel_user" ON "channel_members" ("channelId", "userId") WHERE "channelId" IS NOT NULL AND "userId" IS NOT NULL`
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_vote_proposal_voter" ON "vote" ("proposalId", "voterId") WHERE "proposalId" IS NOT NULL AND "voterId" IS NOT NULL`
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_challenge_contributions_participation" ON "challenge_contributions" ("challengeId", "userId") WHERE "type" = 'participation' AND "challengeId" IS NOT NULL AND "userId" IS NOT NULL`
    );

    // --- 3. FK cascade policy (CASCADE = dies with owner; SET NULL = survives). -
    // Group children die with the group.
    await this.redefineForeignKey(
      queryRunner,
      'group_members',
      'FK_1aa8d31831c3126947e7a713c2b',
      'groupId',
      'groups',
      'id',
      'CASCADE'
    );
    await this.redefineForeignKey(
      queryRunner,
      'channels',
      'FK_7b7ca5e0b7cf3eec983e9e1feaa',
      'groupId',
      'groups',
      'id',
      'CASCADE'
    );
    await this.redefineForeignKey(
      queryRunner,
      'proposal',
      'FK_82e55bb65a396217357c522253f',
      'groupId',
      'groups',
      'id',
      'CASCADE'
    );
    await this.redefineForeignKey(
      queryRunner,
      'community_challenges',
      'FK_f3de241c264a7b8f226d2724df2',
      'groupId',
      'groups',
      'id',
      'CASCADE'
    );
    await this.redefineForeignKey(
      queryRunner,
      'calendar_events',
      'FK_05cdeb3c17cfc3f991909db05d2',
      'groupId',
      'groups',
      'id',
      'CASCADE'
    );
    await this.redefineForeignKey(
      queryRunner,
      'todo_items',
      'FK_51feffa74df79cde1298597f6b1',
      'groupId',
      'groups',
      'id',
      'CASCADE'
    );
    await this.redefineForeignKey(
      queryRunner,
      'conversation',
      'FK_2582545e3c921d0844ce79c8467',
      'groupId',
      'groups',
      'id',
      'CASCADE'
    );
    await this.redefineForeignKey(
      queryRunner,
      'dao',
      'FK_095462f4bbc42ba939af18c92f7',
      'groupId',
      'groups',
      'id',
      'CASCADE'
    );
    await this.redefineForeignKey(
      queryRunner,
      'group_lockdowns',
      'FK_e2323be78c2e914aac38ffbbb1f',
      'groupId',
      'groups',
      'id',
      'CASCADE'
    );

    // Membership/identity rows die with their owner or their channel.
    await this.redefineForeignKey(
      queryRunner,
      'group_members',
      'FK_fdef099303bcf0ffd9a4a7b18f5',
      'userId',
      'users',
      'id',
      'CASCADE'
    );
    await this.redefineForeignKey(
      queryRunner,
      'channel_members',
      'FK_b497f2fef3c4a62173cdb6728ef',
      'userId',
      'users',
      'id',
      'CASCADE'
    );
    await this.redefineForeignKey(
      queryRunner,
      'channel_members',
      'FK_db73d12c31aa45d249f6efeaa01',
      'channelId',
      'channels',
      'id',
      'CASCADE'
    );
    await this.redefineForeignKey(
      queryRunner,
      'vote',
      'FK_9c72b23d6e8f221818d6a43caff',
      'voterId',
      'users',
      'id',
      'CASCADE'
    );
    await this.redefineForeignKey(
      queryRunner,
      'message',
      'FK_bc096b4e18b1f9508197cd98066',
      'senderId',
      'users',
      'id',
      'CASCADE'
    );
    await this.redefineForeignKey(
      queryRunner,
      'conversation_participants_users',
      'FK_a236e54f2eb0a63a9527349b5d6',
      'usersId',
      'users',
      'id',
      'CASCADE',
      'CASCADE'
    );

    // Content rows die with the container that defines them.
    await this.redefineForeignKey(
      queryRunner,
      'vote',
      'FK_a6099cc53a32762d8c69e71dcd1',
      'proposalId',
      'proposal',
      'id',
      'CASCADE'
    );
    await this.redefineForeignKey(
      queryRunner,
      'challenge_contributions',
      'FK_b268e2360250c75922ceca5d8f8',
      'challengeId',
      'community_challenges',
      'id',
      'CASCADE'
    );
    await this.redefineForeignKey(
      queryRunner,
      'message',
      'FK_5fdbbcb32afcea663c2bea2954f',
      'channelId',
      'channels',
      'id',
      'CASCADE'
    );
    await this.redefineForeignKey(
      queryRunner,
      'message',
      'FK_7cf4a4df1f2627f72bf6231635f',
      'conversationId',
      'conversation',
      'id',
      'CASCADE'
    );
    await this.redefineForeignKey(
      queryRunner,
      'conversation',
      'FK_370aed8457add6193a28a807e2e',
      'ownerId',
      'users',
      'id',
      'CASCADE'
    );

    // References to a person survive their account, minus the person.
    await this.redefineForeignKey(
      queryRunner,
      'groups',
      'FK_4d8d8897aef1c049336d8dde13f',
      'ownerId',
      'users',
      'id',
      'SET NULL'
    );
    await this.redefineForeignKey(
      queryRunner,
      'proposal',
      'FK_3960d940912c096dfd56959e79b',
      'creatorId',
      'users',
      'id',
      'SET NULL'
    );
    await this.redefineForeignKey(
      queryRunner,
      'calendar_events',
      'FK_4842d827f75ed2ce13d82d24534',
      'creatorId',
      'users',
      'id',
      'SET NULL'
    );
    await this.redefineForeignKey(
      queryRunner,
      'todo_items',
      'FK_7748ee1252a87bfb64392e7537c',
      'creatorId',
      'users',
      'id',
      'SET NULL'
    );
    await this.redefineForeignKey(
      queryRunner,
      'todo_items',
      'FK_aac721bbb76dbbb6217bb27c47a',
      'assigneeId',
      'users',
      'id',
      'SET NULL'
    );
    await this.redefineForeignKey(
      queryRunner,
      'community_challenges',
      'FK_1677b9c4ab8aee05fdda3cf8636',
      'creatorId',
      'users',
      'id',
      'SET NULL'
    );
    await this.redefineForeignKey(
      queryRunner,
      'challenge_contributions',
      'FK_382bc93105aabc81cbd2158ccc9',
      'userId',
      'users',
      'id',
      'SET NULL'
    );
    await this.redefineForeignKey(
      queryRunner,
      'group_lockdowns',
      'FK_d461037198c59a2018b43b7e331',
      'createdById',
      'users',
      'id',
      'SET NULL'
    );
    await this.redefineForeignKey(
      queryRunner,
      'conversation',
      'FK_0a3b8781470e209a60df119044b',
      'modmailRecipientId',
      'users',
      'id',
      'SET NULL'
    );
    // A reply must survive the replied-to message dying with its sender.
    await this.redefineForeignKey(
      queryRunner,
      'message',
      'FK_dc84d76f927b87f616cbedcf2e5',
      'replyToId',
      'message',
      'id',
      'SET NULL'
    );
    await this.redefineForeignKey(
      queryRunner,
      'message',
      'FK_91b7f0e21fb2b22af1e83f180fe',
      'forwardedFromId',
      'message',
      'id',
      'SET NULL'
    );

    // --- 4. FK/join indexes (every one of these was a seq scan). -------------
    const indexes: Array<[string, string]> = [
      ['group_members', 'userId'],
      ['group_members', 'groupId'],
      ['channels', 'groupId'],
      ['channel_members', 'channelId'],
      ['channel_members', 'userId'],
      ['message', 'channelId'],
      ['message', 'conversationId'],
      ['message', 'senderId'],
      ['conversation', 'groupId'],
      ['conversation', 'modmailRecipientId'],
      ['proposal', 'groupId'],
      ['vote', 'proposalId'],
      ['vote', 'voterId'],
      ['todo_items', 'groupId'],
      ['todo_items', 'assigneeId'],
      ['calendar_events', 'groupId'],
      ['community_challenges', 'groupId'],
      ['challenge_contributions', 'challengeId'],
      ['group_lockdowns', 'groupId'],
    ];
    for (const [table, column] of indexes) {
      await queryRunner.query(`CREATE INDEX "IDX_${table}_${column}" ON "${table}" ("${column}")`);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const indexes: Array<[string, string]> = [
      ['group_members', 'userId'],
      ['group_members', 'groupId'],
      ['channels', 'groupId'],
      ['channel_members', 'channelId'],
      ['channel_members', 'userId'],
      ['message', 'channelId'],
      ['message', 'conversationId'],
      ['message', 'senderId'],
      ['conversation', 'groupId'],
      ['conversation', 'modmailRecipientId'],
      ['proposal', 'groupId'],
      ['vote', 'proposalId'],
      ['vote', 'voterId'],
      ['todo_items', 'groupId'],
      ['todo_items', 'assigneeId'],
      ['calendar_events', 'groupId'],
      ['community_challenges', 'groupId'],
      ['challenge_contributions', 'challengeId'],
      ['group_lockdowns', 'groupId'],
    ];
    for (const [table, column] of indexes) {
      await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_${table}_${column}"`);
    }

    // Back to the original NO ACTION policy. The dedupe deletions above are
    // intentionally not reversible — duplicate rows were already corrupt data.
    await this.redefineForeignKey(
      queryRunner,
      'group_members',
      'FK_1aa8d31831c3126947e7a713c2b',
      'groupId',
      'groups',
      'id',
      'NO ACTION'
    );
    await this.redefineForeignKey(
      queryRunner,
      'channels',
      'FK_7b7ca5e0b7cf3eec983e9e1feaa',
      'groupId',
      'groups',
      'id',
      'NO ACTION'
    );
    await this.redefineForeignKey(
      queryRunner,
      'proposal',
      'FK_82e55bb65a396217357c522253f',
      'groupId',
      'groups',
      'id',
      'NO ACTION'
    );
    await this.redefineForeignKey(
      queryRunner,
      'community_challenges',
      'FK_f3de241c264a7b8f226d2724df2',
      'groupId',
      'groups',
      'id',
      'NO ACTION'
    );
    await this.redefineForeignKey(
      queryRunner,
      'calendar_events',
      'FK_05cdeb3c17cfc3f991909db05d2',
      'groupId',
      'groups',
      'id',
      'NO ACTION'
    );
    await this.redefineForeignKey(
      queryRunner,
      'todo_items',
      'FK_51feffa74df79cde1298597f6b1',
      'groupId',
      'groups',
      'id',
      'NO ACTION'
    );
    await this.redefineForeignKey(
      queryRunner,
      'conversation',
      'FK_2582545e3c921d0844ce79c8467',
      'groupId',
      'groups',
      'id',
      'NO ACTION'
    );
    await this.redefineForeignKey(
      queryRunner,
      'dao',
      'FK_095462f4bbc42ba939af18c92f7',
      'groupId',
      'groups',
      'id',
      'NO ACTION'
    );
    await this.redefineForeignKey(
      queryRunner,
      'group_lockdowns',
      'FK_e2323be78c2e914aac38ffbbb1f',
      'groupId',
      'groups',
      'id',
      'CASCADE'
    );
    await this.redefineForeignKey(
      queryRunner,
      'group_members',
      'FK_fdef099303bcf0ffd9a4a7b18f5',
      'userId',
      'users',
      'id',
      'NO ACTION'
    );
    await this.redefineForeignKey(
      queryRunner,
      'channel_members',
      'FK_b497f2fef3c4a62173cdb6728ef',
      'userId',
      'users',
      'id',
      'NO ACTION'
    );
    await this.redefineForeignKey(
      queryRunner,
      'channel_members',
      'FK_db73d12c31aa45d249f6efeaa01',
      'channelId',
      'channels',
      'id',
      'NO ACTION'
    );
    await this.redefineForeignKey(
      queryRunner,
      'vote',
      'FK_9c72b23d6e8f221818d6a43caff',
      'voterId',
      'users',
      'id',
      'NO ACTION'
    );
    await this.redefineForeignKey(
      queryRunner,
      'message',
      'FK_bc096b4e18b1f9508197cd98066',
      'senderId',
      'users',
      'id',
      'NO ACTION'
    );
    await this.redefineForeignKey(
      queryRunner,
      'conversation_participants_users',
      'FK_a236e54f2eb0a63a9527349b5d6',
      'usersId',
      'users',
      'id',
      'NO ACTION',
      'CASCADE'
    );
    await this.redefineForeignKey(
      queryRunner,
      'vote',
      'FK_a6099cc53a32762d8c69e71dcd1',
      'proposalId',
      'proposal',
      'id',
      'NO ACTION'
    );
    await this.redefineForeignKey(
      queryRunner,
      'challenge_contributions',
      'FK_b268e2360250c75922ceca5d8f8',
      'challengeId',
      'community_challenges',
      'id',
      'NO ACTION'
    );
    await this.redefineForeignKey(
      queryRunner,
      'message',
      'FK_5fdbbcb32afcea663c2bea2954f',
      'channelId',
      'channels',
      'id',
      'NO ACTION'
    );
    await this.redefineForeignKey(
      queryRunner,
      'message',
      'FK_7cf4a4df1f2627f72bf6231635f',
      'conversationId',
      'conversation',
      'id',
      'NO ACTION'
    );
    await this.redefineForeignKey(
      queryRunner,
      'conversation',
      'FK_370aed8457add6193a28a807e2e',
      'ownerId',
      'users',
      'id',
      'NO ACTION'
    );
    await this.redefineForeignKey(
      queryRunner,
      'groups',
      'FK_4d8d8897aef1c049336d8dde13f',
      'ownerId',
      'users',
      'id',
      'NO ACTION'
    );
    await this.redefineForeignKey(
      queryRunner,
      'proposal',
      'FK_3960d940912c096dfd56959e79b',
      'creatorId',
      'users',
      'id',
      'NO ACTION'
    );
    await this.redefineForeignKey(
      queryRunner,
      'calendar_events',
      'FK_4842d827f75ed2ce13d82d24534',
      'creatorId',
      'users',
      'id',
      'NO ACTION'
    );
    await this.redefineForeignKey(
      queryRunner,
      'todo_items',
      'FK_7748ee1252a87bfb64392e7537c',
      'creatorId',
      'users',
      'id',
      'NO ACTION'
    );
    await this.redefineForeignKey(
      queryRunner,
      'todo_items',
      'FK_aac721bbb76dbbb6217bb27c47a',
      'assigneeId',
      'users',
      'id',
      'NO ACTION'
    );
    await this.redefineForeignKey(
      queryRunner,
      'community_challenges',
      'FK_1677b9c4ab8aee05fdda3cf8636',
      'creatorId',
      'users',
      'id',
      'NO ACTION'
    );
    await this.redefineForeignKey(
      queryRunner,
      'challenge_contributions',
      'FK_382bc93105aabc81cbd2158ccc9',
      'userId',
      'users',
      'id',
      'NO ACTION'
    );
    await this.redefineForeignKey(
      queryRunner,
      'group_lockdowns',
      'FK_d461037198c59a2018b43b7e331',
      'createdById',
      'users',
      'id',
      'NO ACTION'
    );
    await this.redefineForeignKey(
      queryRunner,
      'conversation',
      'FK_0a3b8781470e209a60df119044b',
      'modmailRecipientId',
      'users',
      'id',
      'NO ACTION'
    );
    await this.redefineForeignKey(
      queryRunner,
      'message',
      'FK_dc84d76f927b87f616cbedcf2e5',
      'replyToId',
      'message',
      'id',
      'NO ACTION'
    );
    await this.redefineForeignKey(
      queryRunner,
      'message',
      'FK_91b7f0e21fb2b22af1e83f180fe',
      'forwardedFromId',
      'message',
      'id',
      'NO ACTION'
    );

    await queryRunner.query(`DROP INDEX "public"."UQ_challenge_contributions_participation"`);
    await queryRunner.query(`DROP INDEX "public"."UQ_vote_proposal_voter"`);
    await queryRunner.query(`DROP INDEX "public"."UQ_channel_members_channel_user"`);
    await queryRunner.query(`DROP INDEX "public"."UQ_group_members_user_group"`);
  }
}
