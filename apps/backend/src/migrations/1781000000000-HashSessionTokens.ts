import { TableColumn, type MigrationInterface, type QueryRunner } from 'typeorm'

export class HashSessionTokens1781000000000 implements MigrationInterface {
    async up(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable('session');
        if (!table) throw new Error('The session table must exist before this migration');
        // Development schema synchronization may already have created the new columns.
        if (!table.findColumnByName('token') && table.findColumnByName('tokenHash') && table.findColumnByName('id')) return;

        // Old JWTs have no jti. Revoke them rather than retain raw credentials.
        await queryRunner.query('DELETE FROM "session"');
        await queryRunner.dropPrimaryKey('session');
        await queryRunner.dropColumn('session', 'token');
        await queryRunner.addColumns('session', [
            new TableColumn({ name: 'id', type: 'uuid', isNullable: false }),
            new TableColumn({ name: 'tokenHash', type: 'varchar', length: '97', isNullable: false }),
        ]);
        await queryRunner.createPrimaryKey('session', ['id']);
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        // Hashes cannot be reversed. Rolling back also requires users to log in again.
        await queryRunner.query('DELETE FROM "session"');
        await queryRunner.dropPrimaryKey('session');
        await queryRunner.dropColumns('session', ['id', 'tokenHash']);
        await queryRunner.addColumn('session', new TableColumn({ name: 'token', type: 'varchar', isNullable: false }));
        await queryRunner.createPrimaryKey('session', ['userId', 'token']);
    }
}
