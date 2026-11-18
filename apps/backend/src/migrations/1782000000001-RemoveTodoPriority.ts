import type { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveTodoPriority1782000000001 implements MigrationInterface {
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "todo" DROP COLUMN IF EXISTS "priority"`);
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "todo" ADD COLUMN IF NOT EXISTS "priority" varchar NOT NULL DEFAULT 'normal'`);
    }
}
