import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSettlementAudit1795000000000 implements MigrationInterface {
  name = 'AddSettlementAudit1795000000000';
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`alter table "game_sessions" add column "settled_at" timestamptz null`);
    await queryRunner.query(
      `create index "IDX_session_players_session_payment" on "session_players" ("session_id", "amount_due", "amount_paid")`,
    );
  }
  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`drop index "IDX_session_players_session_payment"`);
    await queryRunner.query(`alter table "game_sessions" drop column "settled_at"`);
  }
}
