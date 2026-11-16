import cookieParser from 'cookie-parser';
import express from 'express';
import cors from 'cors';
import { createServer } from 'node:http';
import { Gateway } from './wss/gateway';
import { apiRateLimiter } from './middlewares/rate-limit.middleware';
import { errorMiddleware } from './middlewares/error-handler.middleware';
import { allowedOrigins, csrfMiddleware } from './middlewares/csrf.middleware';
import { AppDataSource } from './db';
import routes from './routes';
import { imageDirectory } from './utils/image';

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
] as const;

console.log(ASCII_LOGO.join('\n'));

console.log(`Environment: ${process.env.NODE_ENV}`);

try {
    await AppDataSource.initialize();

    console.log('Database: 🫡');

    const port = Number(process.env.PORT) || 3000;
    const app = express();
    const trustedProxies = (process.env.TRUST_PROXY ?? '')
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean);

    if (trustedProxies.length) {
        app.set('trust proxy', trustedProxies);
    }

    app.use(
        cors({
            origin: allowedOrigins,
            credentials: true
        })
    );

    app.use(
        '/public/images',
        express.static(imageDirectory, {
            dotfiles: 'deny',
            index: false,
            maxAge: '1y',
            immutable: true,
            setHeaders: (res) => {
                res.setHeader('X-Content-Type-Options', 'nosniff');
            }
        })
    );

    app.use(cookieParser());

    app.use('/api', apiRateLimiter, csrfMiddleware);

    app.use(express.json());

    app.use(routes);

    app.use(errorMiddleware);

    const server = createServer(app);

    new Gateway(server);

    server.listen(port, () => {
        console.log(`API: http://localhost:${port}`);

        console.log('━'.repeat(35));
    });
} catch (err) {
    console.error('Database: ', err);
}
