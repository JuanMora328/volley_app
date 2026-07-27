import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSessionsAndTeams1770000000000 implements MigrationInterface {
  name = 'CreateSessionsAndTeams1770000000000';
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "game_sessions_status_enum" AS ENUM ('DRAFT','TEAMS_CREATED','IN_PROGRESS','SETTLEMENT','FINISHED','CANCELLED')`,
    );
    await queryRunner.query(
      `CREATE TYPE "session_players_payment_method_enum" AS ENUM ('CASH','TRANSFER')`,
    );
    await queryRunner.query(
      `CREATE TABLE "game_sessions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "date" date NOT NULL, "start_time" time, "venue_id" uuid, "venue_name_snapshot" varchar NOT NULL, "court_price" integer NOT NULL DEFAULT 0, "gatorade_price" integer NOT NULL DEFAULT 0, "team_count" integer NOT NULL DEFAULT 2, "default_target_score" integer NOT NULL DEFAULT 21, "current_target_score" integer NOT NULL DEFAULT 21, "status" "game_sessions_status_enum" NOT NULL DEFAULT 'DRAFT', "champion_team_id" uuid, "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(), "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(), "finished_at" TIMESTAMPTZ, CONSTRAINT "CHK_sessions_values" CHECK (court_price >= 0 AND gatorade_price >= 0 AND team_count >= 2 AND default_target_score > 0 AND current_target_score > 0), CONSTRAINT "PK_game_sessions" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "session_players" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "session_id" uuid NOT NULL, "player_id" uuid NOT NULL, "player_name_snapshot" varchar NOT NULL, "level_snapshot" integer NOT NULL, "included_in_court_split" boolean NOT NULL DEFAULT true, "included_in_gatorade_split" boolean NOT NULL DEFAULT true, "court_amount" integer NOT NULL DEFAULT 0, "gatorade_amount" integer NOT NULL DEFAULT 0, "amount_due" integer NOT NULL DEFAULT 0, "amount_paid" integer NOT NULL DEFAULT 0, "payment_method" "session_players_payment_method_enum", "paid_at" TIMESTAMPTZ, "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(), "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(), CONSTRAINT "UQ_session_player" UNIQUE ("session_id", "player_id"), CONSTRAINT "CHK_session_players_level" CHECK (level_snapshot between 1 and 5), CONSTRAINT "CHK_session_players_money" CHECK (court_amount >= 0 AND gatorade_amount >= 0 AND amount_due >= 0 AND amount_paid >= 0), CONSTRAINT "PK_session_players" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "teams" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "session_id" uuid NOT NULL, "name" varchar NOT NULL, "color" text, "initial_rotation_position" integer, "generated_automatically" boolean NOT NULL DEFAULT true, "confirmed_at" TIMESTAMPTZ, "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(), "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(), CONSTRAINT "UQ_team_session_name" UNIQUE ("session_id", "name"), CONSTRAINT "PK_teams" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "team_players" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "team_id" uuid NOT NULL, "session_player_id" uuid NOT NULL, "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(), CONSTRAINT "UQ_team_player_once" UNIQUE ("session_player_id"), CONSTRAINT "PK_team_players" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "game_sessions" ADD CONSTRAINT "FK_session_venue" FOREIGN KEY ("venue_id") REFERENCES "venues"("id") ON DELETE SET NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "session_players" ADD CONSTRAINT "FK_sp_session" FOREIGN KEY ("session_id") REFERENCES "game_sessions"("id") ON DELETE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "session_players" ADD CONSTRAINT "FK_sp_player" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE RESTRICT`,
    );
    await queryRunner.query(
      `ALTER TABLE "teams" ADD CONSTRAINT "FK_team_session" FOREIGN KEY ("session_id") REFERENCES "game_sessions"("id") ON DELETE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "team_players" ADD CONSTRAINT "FK_tp_team" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "team_players" ADD CONSTRAINT "FK_tp_sp" FOREIGN KEY ("session_player_id") REFERENCES "session_players"("id") ON DELETE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "game_sessions" ADD CONSTRAINT "FK_session_champion" FOREIGN KEY ("champion_team_id") REFERENCES "teams"("id") ON DELETE SET NULL`,
    );
    await queryRunner.query(
      `CREATE OR REPLACE FUNCTION check_team_player_session() RETURNS trigger AS $$ BEGIN IF (SELECT session_id FROM teams WHERE id=NEW.team_id) <> (SELECT session_id FROM session_players WHERE id=NEW.session_player_id) THEN RAISE EXCEPTION 'El participante y el equipo deben pertenecer a la misma jornada'; END IF; RETURN NEW; END; $$ LANGUAGE plpgsql`,
    );
    await queryRunner.query(
      `CREATE TRIGGER "TR_team_player_session" BEFORE INSERT OR UPDATE ON "team_players" FOR EACH ROW EXECUTE FUNCTION check_team_player_session()`,
    );
  }
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TRIGGER IF EXISTS "TR_team_player_session" ON "team_players"`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS check_team_player_session`);
    await queryRunner.query(`ALTER TABLE "game_sessions" DROP CONSTRAINT "FK_session_champion"`);
    await queryRunner.query(`DROP TABLE "team_players"`);
    await queryRunner.query(`DROP TABLE "teams"`);
    await queryRunner.query(`DROP TABLE "session_players"`);
    await queryRunner.query(`DROP TABLE "game_sessions"`);
    await queryRunner.query(`DROP TYPE "session_players_payment_method_enum"`);
    await queryRunner.query(`DROP TYPE "game_sessions_status_enum"`);
  }
}
