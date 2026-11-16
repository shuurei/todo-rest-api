import 'dotenv/config';
import type { CookieOptions, Request, Response } from 'express';

export const SESSION_COOKIE = 'session';

export const sessionCookieOptions: CookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV !== 'DEV',
    sameSite: 'lax',
    path: '/'
};

const maxSessionAge = 7 * 24 * 60 * 60 * 1000;
const legacyCookieOptions = {
    ...sessionCookieOptions,
    path: '/api'
};

export const setSessionCookie = (res: Response, token: string) => {
    res.clearCookie(SESSION_COOKIE, legacyCookieOptions);

    res.cookie(SESSION_COOKIE, token, {
        ...sessionCookieOptions,
        maxAge: maxSessionAge
    });
};

export const sendSessionResponse = <T>(
    req: Request,
    res: Response,
    session: {
        user: T;
        token: string;
    },
    status = 200
) => {
    if (req.get('X-Auth-Mode') === 'bearer') {
        return res.status(status).json({
            data: session
        });
    }

    setSessionCookie(res, session.token);

    return res.status(status).json({
        data: {
            user: session.user
        }
    });
};

export const clearSessionCookie = (res: Response) => {
    res.clearCookie(SESSION_COOKIE, legacyCookieOptions);

    res.clearCookie(SESSION_COOKIE, sessionCookieOptions);
};
