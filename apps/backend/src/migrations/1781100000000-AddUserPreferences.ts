import { TableColumn, type MigrationInterface, type QueryRunner } from 'typeorm'

export class AddUserPreferences1781100000000 implements MigrationInterface {
    async up(queryRunner: QueryRunner): Promise<void> {
        if (await queryRunner.hasColumn('user', 'preferences')) return;

        await queryRunner.addColumn('user', new TableColumn({
            name: 'preferences',
            type: 'jsonb',
            isNullable: false,
            default: `'${JSON.stringify({ themeColor: 'green', transitionDuration: 2.2 })}'::jsonb`,
        }));
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        if (await queryRunner.hasColumn('user', 'preferences')) {
            await queryRunner.dropColumn('user', 'preferences');
        }
    }
}
