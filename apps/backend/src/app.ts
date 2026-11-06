import express from 'express'
import cors from 'cors'
import { AppDataSource } from './db'
import swaggerUi from 'swagger-ui-express'
import { swaggerSpec } from './swagger/spec'

import { errorMiddleware } from './middlewares/error-handler.middleware'

import userRoutes from './routes/user.route'
import authRoutes from './routes/auth.route'

const ASCII_LOGO = [
    '[0;37m     [0;35m▄[0;95m▄[0;95;45m▄[0;37m      [0;35m▄[0;95m▄[0;95;45m▄▄[0;95m▄[0;35m▄[0;37m               [0m',
    '[0;37m   [0;95;45m░[0;95m████▌[0;37m     [0;95m██[0;95;47m▄▓[0;95m████[0;95;45m▄[0;95m▄[0;35m▄[0;37m   [0;35m▄▄[0;95m▄[0;95;45m▄▄▓[0;37m [0m',
    '[0;37m   [0;95m█[0;95;45m▓[0;97;45m▄[0;97m█[0;97;45m▓[0;95m█▌[0;37m    [0;95m█████▀▀██[0;95;45m▓[0;95m█[0;95;45m▄[0;95m▄[0;37m [0;95m▐███[0;95;45m▄[0;95m█[0;37m [0m',
    '[0;37m  [0;95m▐█[0;97m█████[0;95;45m▓[0;95m▌[0;37m   [0;95m▐[0;91;47m▓[0;97;47m▄[0;97;45m▓[0;95m█▄[0;37m  [0;95m▀█[0;97;45m▄▓[0;97m█[0;37m▌[0;95m▐█[0;97;45m▓[0;97m█[0;97;45m▄[0;95m█[0;37m [0m',
    '[0;37m  [0;31;47m░[0;97m███████[0;97;47m▌[0;37m    [0;97;47m▐[0;97m████[0;37m  [0;97m▄███[0;97;47m░[0;37m ▐[0;97;47m▓[0;97m███[0;97;47m▌[0;37m [0m',
    '[0;37m ▐[0;97m███[0;97;47m▓[0;37m [0;97m▀███[0;97;47m▌[0;37m   [0;97;47m▐▓[0;97m██████[0;97;47m▀[0;97m▀[0;37m▀  ▐[0;97m████[0;97;47m▌[0;37m▌[0m',
    '[0;37m [0;97;47m▐[0;97m██████████[0;37m▌  ▐[0;97m█████[0;97;47m▀[0;37m▀      [0;97;47m▐[0;97m███[0;97;47m▌[0;37m [0m',
    '[0;93m▐█[0;97m██[0;93m██[0;97m█▀██[0;97;47m▓[0;97m██[0;37m▌  [0;93m█[0;97m███[0;93m█▌[0;37m       [0;93m██[0;97m██[0;93m█[0;37m [0m',
    '[0;93;43m▀▓[0;93m█[0;93;47m▓[0;37m    [0;93m▐█[0;97m██[0;93m██[0;37m  [0;93;43m▀[0;93;47m▓[0;93m██▀[0;37m        [0;33m▐[0;93;43m▀[0;93m███[0;37m [0m',
    '[0;37m         [0;93m█[0;93;43m▀[0;93m▀▀[0;33m▀[0;37m  [0;33m▀[0;37m                  [0m               ',
    '━'.repeat(35)
] as const

console.log(ASCII_LOGO.join('\n'));
console.log(`Environment: ${process.env.NODE_ENV}`);

try {
    await AppDataSource.initialize();
    console.log('Database: 🫡');

    const port = Number(process.env.PORT) || 3000;
    const app = express();

    app.use(cors({
        origin: [
            'http://localhost:5173',
            'http://localhost:3000',
            'http://127.0.0.1:5173'
        ],
        credentials: true
    }));

    app.use(express.json());

    app.get('/health', (_req, res) => {
        res.status(200).json({ status: 'OK' });
    });

    if (process.env.NODE_ENV === 'DEV') {
        app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
            customSiteTitle: 'Todo Rest API - DOCS',
            customCss: `.swagger-ui .topbar { display: none; }`,
            swaggerOptions: {
                displayRequestDuration: true,
                defaultModelsExpandDepth: -1,
                defaultModelExpandDepth: -1
            }
        }));

        console.log(`DOCS: http://localhost:${port}/api/docs`);
    }

    app.use('/api/auth', authRoutes);
    app.use('/api/users', userRoutes);

    app.use(errorMiddleware);

    app.listen(port, () => {
        console.log(`API: http://localhost:${port}`);
        console.log('━'.repeat(35));
    });
} catch (err) {
    console.error('Database: ', err);
}