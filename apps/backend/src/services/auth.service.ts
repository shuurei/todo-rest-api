import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import { AppDataSource } from '../db'
import { HttpConflictError, HttpUnauthorizedError } from '../utils/http-errors'

import { CreateUserInput } from '../validators/user.schema'
import { Session } from '../entities/session.entity'
import { UserService } from './user.service'

export class AuthService {
    static get repo() {
        return AppDataSource.getRepository(Session);
    }

    static async register(data: CreateUserInput) {
        const existing = await UserService.repo.findOneBy({ username: data.username });
        if (existing) {
            throw new HttpConflictError('USERNAME_ALREADY_EXISTS');
        }

        const user = await UserService.create(data);
        delete user.password;

        return user;
    }

    static async login(email: string, password: string, userAgent: string | null) {
        const user = await UserService.findByEmailWithPassword(email);
        if (!user) {
            throw new HttpUnauthorizedError('INVALID_CREDENTIALS');
        }

        const passwordValid = await bcrypt.compare(password, user.password);
        if (!passwordValid) {
            throw new HttpUnauthorizedError('INVALID_CREDENTIALS');
        }

        delete user.password;
    
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        const session = this.repo.create({
            userId: user.id,
            token,
            expiresAt,
            userAgent
        });

        await this.repo.save(session);

        return { token, user };
    }

    static async logout(userId: string, token: string) {
        return await this.repo.delete({ userId, token });
    }
}