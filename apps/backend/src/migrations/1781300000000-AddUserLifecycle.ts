import { TableColumn, TableIndex, type MigrationInterface, type QueryRunner } from 'typeorm'

export class AddUserLifecycle1781300000000 implements MigrationInterface {
    async up(queryRunner: QueryRunner): Promise<void> {
        if (!await queryRunner.hasColumn('user', 'isDisabled')) {
            await queryRunner.addColumn('user', new TableColumn({ name: 'isDisabled', type: 'boolean', default: false }));
        }
        if (!await queryRunner.hasColumn('user', 'deletedAt')) {
            await queryRunner.addColumn('user', new TableColumn({ name: 'deletedAt', type: 'timestamptz', isNullable: true }));
        }
        const table = await queryRunner.getTable('user');
        if (!table.indices.some(index => index.name === 'IDX_user_deletedAt')) {
            await queryRunner.createIndex('user', new TableIndex({ name: 'IDX_user_deletedAt', columnNames: ['deletedAt'] }));
        }
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable('user');
        if (table.indices.some(index => index.name === 'IDX_user_deletedAt')) {
            await queryRunner.dropIndex('user', 'IDX_user_deletedAt');
        }
        if (await queryRunner.hasColumn('user', 'deletedAt')) await queryRunner.dropColumn('user', 'deletedAt');
        if (await queryRunner.hasColumn('user', 'isDisabled')) await queryRunner.dropColumn('user', 'isDisabled');
    }
}
