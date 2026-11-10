import jwt from 'jsonwebtoken'
import { randomUUID } from 'node:crypto'
import * as argon2 from 'argon2'
import { AppDataSource } from '../db'
import { HttpConflictError, HttpUnauthorizedError } from '../utils/http-errors'

import { CreateUserInput } from '../validators/user.schema'
import { Session } from '../entities/session.entity'
import { User } from '../entities/user.entity'
import { UserService } from './user.service'

export class AuthService {
    static get repo() {
        return AppDataSource.getRepository(Session);
    }

    static async generateSession(userId: string, userAgent: string | null) {
        const id = randomUUID();
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        const token = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d', jwtid: id });

        const tokenHash = await argon2.hash(token);
        await AppDataSource.transaction(async manager => {
            // Serialize login with disable/delete so no session escapes revocation.
            const user = await manager.getRepository(User).findOne({
                where: { id: userId }, withDeleted: true, lock: { mode: 'pessimistic_write' },
            });
            if (!user) throw new HttpUnauthorizedError('INVALID_CREDENTIALS');
            UserService.assertCanAuthenticate(user);
            const repo = manager.getRepository(Session);
            await repo.save(repo.create({ id, userId, tokenHash, expiresAt, userAgent }));
        });

        return token;
    }

    static async register(data: CreateUserInput, userAgent: string | null) {
        const existing = await UserService.repo.findOneBy({ username: data.username });
        if (existing) {
            throw new HttpConflictError('USERNAME_ALREADY_EXISTS');
        }

        const user = await UserService.create(data);
        delete user.password;

        return {
            token: await this.generateSession(user.id, userAgent),
            user
        };
    }

    static async login(username: string, password: string, userAgent: string | null) {
        const user = await UserService.findByUsernameWithPassword(username);
        if (!user) {
            throw new HttpUnauthorizedError('INVALID_CREDENTIALS');
        }

        const passwordValid = await argon2.verify(user.password, password).catch(() => false);
        if (!passwordValid) {
            throw new HttpUnauthorizedError('INVALID_CREDENTIALS');
        }

        // Only expose account status after verifying the password.
        UserService.assertCanAuthenticate(user);
        delete user.password;

        return {
            token: await this.generateSession(user.id, userAgent),
            user
        };
    }

    static async findSession(userId: string, id: string, token: string) {
        const session = await this.repo.createQueryBuilder('session')
            .addSelect('session.tokenHash')
            .where('session.id = :id AND session.userId = :userId', { id, userId })
            .getOne();

        if (!session || !(await argon2.verify(session.tokenHash, token).catch(() => false))) return null;
        
        return session;
    }

    static async logout(userId: string, sessionId: string) {
        return await this.repo.delete({ userId, id: sessionId });
    }
}