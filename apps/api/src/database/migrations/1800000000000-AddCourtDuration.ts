import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCourtDuration1800000000000 implements MigrationInterface {
  name = 'AddCourtDuration1800000000000';
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `alter table "game_sessions" add column "court_hourly_price" integer not null default 0`,
    );
    await queryRunner.query(
      `alter table "game_sessions" add column "court_duration_minutes" integer not null default 60`,
    );
    await queryRunner.query(`update "game_sessions" set "court_hourly_price" = "court_price"`);
    await queryRunner.query(
      `alter table "game_sessions" add constraint "CHK_session_court_duration" check ("court_hourly_price" >= 0 and "court_duration_minutes" > 0 and "court_duration_minutes" % 30 = 0)`,
    );
  }
  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `alter table "game_sessions" drop constraint "CHK_session_court_duration"`,
    );
    await queryRunner.query(`alter table "game_sessions" drop column "court_duration_minutes"`);
    await queryRunner.query(`alter table "game_sessions" drop column "court_hourly_price"`);
  }
}
