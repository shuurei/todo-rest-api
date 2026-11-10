import 'reflect-metadata'
import 'dotenv/config'

import { DataSource } from 'typeorm'

const isDev = process.env.NODE_ENV === 'DEV';

export const AppDataSource = new DataSource({
	type: 'postgres',
	host: process.env['DB_HOST'] ?? 'localhost',
	port: Number(process.env['DB_PORT'] ?? 5432),
	username: process.env['DB_USERNAME'],
	password: process.env['DB_PASSWORD'],
	database: process.env['DB_DATABASE'],
	synchronize: isDev && ['true', '1'].includes(process.env.DB_AUTO_SYNC ?? ''),
	entities: [ 'src/entities/*.entity.ts' ],
	migrations: [ "src/migrations/*.ts" ],
});