import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPhaseSix1810000000000 implements MigrationInterface {
  name = 'AddPhaseSix1810000000000';
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "app_settings" ("id" uuid NOT NULL, "organization_name" varchar NOT NULL, "default_team_count" integer NOT NULL, "default_target_score" integer NOT NULL, "default_court_price" integer NOT NULL, "default_gatorade_price" integer NOT NULL, "default_venue_id" uuid, "timezone" varchar NOT NULL DEFAULT 'America/Bogota', "updated_by" uuid, "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(), CONSTRAINT "CHK_app_settings_singleton" CHECK (id = '00000000-0000-0000-0000-000000000001'), CONSTRAINT "CHK_app_settings_values" CHECK (default_team_count >= 2 and default_target_score > 0 and default_court_price >= 0 and default_gatorade_price >= 0), CONSTRAINT "PK_app_settings" PRIMARY KEY ("id"), CONSTRAINT "FK_settings_venue" FOREIGN KEY ("default_venue_id") REFERENCES "venues"("id") ON DELETE SET NULL, CONSTRAINT "FK_settings_user" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL)`,
    );
    await queryRunner.query(
      `INSERT INTO "app_settings" (id, organization_name, default_team_count, default_target_score, default_court_price, default_gatorade_price) VALUES ('00000000-0000-0000-0000-000000000001', 'VolleyFlow', 2, 10, 0, 0)`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_game_sessions_date" ON "game_sessions" ("date")`);
    await queryRunner.query(
      `CREATE INDEX "IDX_game_sessions_status" ON "game_sessions" ("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_sessions_champion" ON "game_sessions" ("champion_team_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_session_players_player" ON "session_players" ("player_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_session_players_session" ON "session_players" ("session_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_matches_session_status" ON "matches" ("session_id", "status")`,
    );
  }
  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_matches_session_status"`);
    await queryRunner.query(`DROP INDEX "IDX_session_players_session"`);
    await queryRunner.query(`DROP INDEX "IDX_session_players_player"`);
    await queryRunner.query(`DROP INDEX "IDX_sessions_champion"`);
    await queryRunner.query(`DROP INDEX "IDX_game_sessions_status"`);
    await queryRunner.query(`DROP INDEX "IDX_game_sessions_date"`);
    await queryRunner.query(`DROP TABLE "app_settings"`);
  }
}
