import { MigrationInterface, QueryRunner } from 'typeorm';
export class CreatePlayersAndVenues1764200000000 implements MigrationInterface {
  name = 'CreatePlayersAndVenues1764200000000';
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "players" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "default_level" integer NOT NULL, "notes" text, "active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "CHK_players_default_level" CHECK ("default_level" between 1 and 5), CONSTRAINT "PK_players" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_players_active_name" ON "players" ("active", "name")`,
    );
    await queryRunner.query(
      `CREATE TABLE "venues" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "address" text, "default_court_price" integer NOT NULL DEFAULT 0, "default_gatorade_price" integer NOT NULL DEFAULT 0, "active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "CHK_venues_default_court_price" CHECK ("default_court_price" >= 0), CONSTRAINT "CHK_venues_default_gatorade_price" CHECK ("default_gatorade_price" >= 0), CONSTRAINT "PK_venues" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_venues_active_name" ON "venues" ("active", "name")`);
  }
  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "venues"');
    await queryRunner.query('DROP TABLE "players"');
  }
}
