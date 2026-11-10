import type { MigrationInterface, QueryRunner } from 'typeorm'

export class AddUserLanguage1781200000000 implements MigrationInterface {
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`UPDATE "user" SET "preferences" = '{"language":"fr"}'::jsonb || "preferences"`);
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "preferences"
            SET DEFAULT '{"language":"fr","themeColor":"green","transitionDuration":2.2}'::jsonb`);
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`UPDATE "user" SET "preferences" = "preferences" - 'language'`);
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "preferences"
            SET DEFAULT '{"themeColor":"green","transitionDuration":2.2}'::jsonb`);
    }
}
