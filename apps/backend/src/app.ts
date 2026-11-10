import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { allowedOrigins, csrfMiddleware } from './middlewares/csrf.middleware'
import { AppDataSource } from './db'

import { errorMiddleware } from './middlewares/error-handler.middleware'

import routes from './routes'
import { apiRateLimiter } from './middlewares/rate-limit.middleware'
import { startUserPurgeJob } from './jobs/purge-users.job'

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
    startUserPurgeJob();

    const port = Number(process.env.PORT) || 3000;
    const app = express();

    app.use(cors({
        origin: allowedOrigins,
        credentials: true
    }));

    app.use(cookieParser());
    app.use('/api', apiRateLimiter, csrfMiddleware);
    app.use(express.json());

    app.use(routes);

    app.use(errorMiddleware);

    app.listen(port, () => {
        console.log(`API: http://localhost:${port}`);
        console.log('━'.repeat(35));
    });
} catch (err) {
    console.error('Database: ', err);
}