import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCompetition1785000000000 implements MigrationInterface {
  name = 'CreateCompetition1785000000000';
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."matches_status_enum" AS ENUM('IN_PROGRESS','FINISHED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "matches" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "session_id" uuid NOT NULL, "sequence" integer NOT NULL, "team_a_id" uuid NOT NULL, "team_b_id" uuid NOT NULL, "team_a_score" integer NOT NULL DEFAULT 0, "team_b_score" integer NOT NULL DEFAULT 0, "target_score" integer NOT NULL, "status" "public"."matches_status_enum" NOT NULL DEFAULT 'IN_PROGRESS', "winner_team_id" uuid, "loser_team_id" uuid, "started_at" TIMESTAMP WITH TIME ZONE NOT NULL, "finished_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "CHK_matches_scores" CHECK (team_a_score >= 0 and team_b_score >= 0 and target_score > 0), CONSTRAINT "CHK_matches_teams" CHECK (team_a_id <> team_b_id), CONSTRAINT "CHK_matches_result" CHECK ((status = 'IN_PROGRESS' and winner_team_id is null and loser_team_id is null and finished_at is null) or (status = 'FINISHED' and winner_team_id is not null and loser_team_id is not null and finished_at is not null and winner_team_id <> loser_team_id and winner_team_id in (team_a_id, team_b_id) and loser_team_id in (team_a_id, team_b_id))), CONSTRAINT "UQ_matches_session_sequence" UNIQUE ("session_id", "sequence"), CONSTRAINT "PK_matches" PRIMARY KEY ("id"), CONSTRAINT "FK_matches_session" FOREIGN KEY ("session_id") REFERENCES "game_sessions"("id") ON DELETE CASCADE, CONSTRAINT "FK_matches_team_a" FOREIGN KEY ("team_a_id") REFERENCES "teams"("id") ON DELETE CASCADE, CONSTRAINT "FK_matches_team_b" FOREIGN KEY ("team_b_id") REFERENCES "teams"("id") ON DELETE CASCADE, CONSTRAINT "FK_matches_winner" FOREIGN KEY ("winner_team_id") REFERENCES "teams"("id") ON DELETE CASCADE, CONSTRAINT "FK_matches_loser" FOREIGN KEY ("loser_team_id") REFERENCES "teams"("id") ON DELETE CASCADE)`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_matches_one_active" ON "matches" ("session_id") WHERE "status" = 'IN_PROGRESS'`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_teams_rotation_position" ON "teams" ("session_id", "initial_rotation_position") WHERE "initial_rotation_position" IS NOT NULL`,
    );
  }
  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_teams_rotation_position"`);
    await queryRunner.query(`DROP INDEX "IDX_matches_one_active"`);
    await queryRunner.query(`DROP TABLE "matches"`);
    await queryRunner.query(`DROP TYPE "public"."matches_status_enum"`);
  }
}
