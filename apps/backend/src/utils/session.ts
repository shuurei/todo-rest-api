import 'dotenv/config'
import type { CookieOptions, Request, Response } from 'express'

export const SESSION_COOKIE = 'session';
export const sessionCookieOptions: CookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV !== 'DEV',
    sameSite: 'lax',
    path: '/api'
};

export const sendSessionResponse = <T>(req: Request, res: Response, session: { user: T; token: string }, status = 200) => {
    if (req.get('X-Auth-Mode') === 'bearer') {
        return res.status(status).json({ data: session });
    };
    
    res.cookie(SESSION_COOKIE, session.token, {
        ...sessionCookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.status(status).json({ data: { user: session.user } });
}

export const clearSessionCookie = (res: Response) => {
    res.clearCookie(SESSION_COOKIE, sessionCookieOptions);
}
