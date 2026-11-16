import jwt from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';
import * as argon2 from 'argon2';
import { MoreThan } from 'typeorm';
import { AppDataSource } from '../db';
import { HttpConflictError, HttpForbiddenError, HttpNotFoundError, HttpUnauthorizedError } from '../utils/http-errors';
import { CreateUserInput } from '../validators/user.schema';
import { Session } from '../entities/session.entity';
import { UserService } from './user.service';
import { emitGatewayEvent } from '../wss/events';

export class AuthService {
    static get repo() {
        return AppDataSource.getRepository(Session);
    }

    static async generateSession(userId: string, userAgent: string | null, ipAddress: string | null) {
        const id = randomUUID();
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        const token = jwt.sign(
            {
                userId
            },
            process.env.JWT_SECRET,
            {
                expiresIn: '7d',
                jwtid: id
            }
        );
        const tokenHash = await argon2.hash(token);
        const user = await UserService.findForAuthentication(userId);

        if (!user) {
            throw new HttpUnauthorizedError('INVALID_CREDENTIALS');
        }

        if (user.isDisabled) {
            throw new HttpForbiddenError('USER_DISABLED');
        }

        await this.repo.save(
            this.repo.create({
                id,
                userId,
                tokenHash,
                expiresAt,
                userAgent,
                ipAddress
            })
        );

        emitGatewayEvent({
            type: 'SESSIONS_CHANGED',
            userId
        });

        return token;
    }

    static async register(data: CreateUserInput, userAgent: string | null, ipAddress: string | null) {
        const existing = await UserService.repo.findOneBy({
            username: data.username
        });

        if (existing) {
            throw new HttpConflictError('USERNAME_ALREADY_EXISTS');
        }

        const user = await UserService.create(data);

        delete user.password;

        return {
            token: await this.generateSession(user.id, userAgent, ipAddress),
            user
        };
    }

    static async login(username: string, password: string, userAgent: string | null, ipAddress: string | null) {
        const user = await UserService.findByUsernameWithPassword(username);

        if (!user || !user.password) {
            throw new HttpUnauthorizedError('INVALID_CREDENTIALS');
        }

        const passwordValid = await argon2.verify(user.password, password).catch(() => false);

        if (!passwordValid) {
            throw new HttpUnauthorizedError('INVALID_CREDENTIALS');
        }

        if (user.isDisabled) {
            throw new HttpForbiddenError('USER_DISABLED');
        }

        delete user.password;

        return {
            token: await this.generateSession(user.id, userAgent, ipAddress),
            user
        };
    }

    static async findSession(userId: string, id: string, token: string) {
        const session = await this.repo
            .createQueryBuilder('session')
            .addSelect('session.tokenHash')
            .where('session.id = :id AND session.userId = :userId', {
                id,
                userId
            })
            .getOne();

        if (!session || !(await argon2.verify(session.tokenHash, token).catch(() => false))) {
            return null;
        }

        return session;
    }

    static async listSessions(userId: string, currentSessionId: string) {
        const sessions = await this.repo.find({
            where: {
                userId,
                expiresAt: MoreThan(new Date())
            },
            select: {
                id: true,
                userAgent: true,
                ipAddress: true
            },
            order: {
                createdAt: 'DESC'
            }
        });

        return sessions.map((session) => ({
            id: session.id,
            userAgent: session.userAgent,
            ipAddress: session.ipAddress,
            isCurrent: session.id === currentSessionId
        }));
    }

    static async revokeSession(userId: string, sessionId: string) {
        const result = await this.repo.delete({
            userId,
            id: sessionId
        });

        if (!result.affected) {
            throw new HttpNotFoundError('SESSION_NOT_FOUND');
        }

        emitGatewayEvent({
            type: 'SESSION_REVOKED',
            userId,
            sessionId
        });

        emitGatewayEvent({
            type: 'SESSIONS_CHANGED',
            userId
        });
    }

    static async revokeAllSessions(userId: string) {
        await this.repo.delete({
            userId
        });

        emitGatewayEvent({
            type: 'SESSION_REVOKED',
            userId
        });

        emitGatewayEvent({
            type: 'SESSIONS_CHANGED',
            userId
        });
    }

    static async logout(userId: string, sessionId: string) {
        const result = await this.repo.delete({
            userId,
            id: sessionId
        });

        emitGatewayEvent({
            type: 'SESSION_REVOKED',
            userId,
            sessionId,
            code: 'LOGGED_OUT'
        });

        emitGatewayEvent({
            type: 'SESSIONS_CHANGED',
            userId
        });

        return result;
    }
}
