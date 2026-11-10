import * as argon2 from 'argon2'
import { AppDataSource } from '../db'
import { User } from '../entities/user.entity'
import { Session } from '../entities/session.entity'

import { CreateUserInput, UpdateUserInput } from '../validators/user.schema'
import { HttpConflictError, HttpForbiddenError, HttpNotFoundError } from '../utils/http-errors'
import { userDeletionRetentionDays, type UserPreferences } from '@todo/shared'
import type { UpdateUserPreferencesInput } from '../validators/user-preferences.schema'
import type { AdminUpdateUserInput, SearchUsersInput } from '../validators/admin.schema'

export class UserService {
    static get repo() {
        return AppDataSource.getRepository(User);
    }

    static async search({ q, status, page, limit }: SearchUsersInput) {
        const query = this.repo.createQueryBuilder('user').withDeleted();
        if (status === 'deleted') query.andWhere('user.deletedAt IS NOT NULL');
        if (status === 'active' || status === 'disabled') {
            query.andWhere('user.deletedAt IS NULL AND user.isDisabled = :disabled', { disabled: status === 'disabled' });
        }
        if (q) {
            // Escape LIKE wildcards; query values are always bound parameters.
            const search = `%${q.replace(/[\\%_]/g, '\\$&')}%`;
            query.andWhere(
                '(CAST(user.id AS TEXT) = :id OR user.username ILIKE :search OR user.displayName ILIKE :search)',
                { id: q, search },
            );
        }
        const [users, total] = await query.orderBy('user.id', 'DESC')
            .skip((page - 1) * limit).take(limit).getManyAndCount();
        return {
            data: users,
            meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
        };
    }

    static async findById(id: string) {
        const user = await this.repo.findOneBy({ id });
        if (!user) {
            throw new HttpNotFoundError('USER_NOT_FOUND');
        }

        return user;
    }

    static async findForAuthentication(id: string) {
        return await this.repo.findOne({ where: { id }, withDeleted: true });
    }

    static assertCanAuthenticate(user: Pick<User, 'isDisabled' | 'deletedAt'>) {
        if (user.deletedAt) throw new HttpForbiddenError('USER_DELETED');
        if (user.isDisabled) throw new HttpForbiddenError('USER_DISABLED');
    }

    static async create(data: CreateUserInput) {
        const existingUser = await this.repo.findOne({ where: { username: data.username }, withDeleted: true });
        if (existingUser) {
            throw new HttpConflictError('USERNAME_ALREADY_EXISTS');
        }

        const user = this.repo.create({
            ...data,
            password: await argon2.hash(data.password),
        });

        return await this.repo.save(user);
    }

    static async findByUsernameWithPassword(username: string) {
        return await UserService.repo
            .createQueryBuilder('user')
            .withDeleted()
            .addSelect('user.password')
            .where('user.username = :username', { username })
            .getOne();
    }

    static async update(id: string, { username, ...data }: UpdateUserInput | AdminUpdateUserInput) {
        return await AppDataSource.transaction(async manager => {
            const repo = manager.getRepository(User);
            const user = await repo.findOne({ where: { id }, lock: { mode: 'pessimistic_write' } });
            if (!user) throw new HttpNotFoundError('USER_NOT_FOUND');

            if (username !== undefined) {
                const existingUser = await repo.findOne({ where: { username }, withDeleted: true });
                if (existingUser && String(existingUser.id) !== String(id)) {
                    throw new HttpConflictError('USERNAME_ALREADY_EXISTS');
                }
                user.username = username;
            }
            Object.assign(user, data);
            const saved = await repo.save(user);
            if ('isDisabled' in data && data.isDisabled === true) {
                await manager.getRepository(Session).delete({ userId: id });
            }
            return saved;
        });
    }

    static async updatePreferences(id: string, preferences: UpdateUserPreferencesInput): Promise<UserPreferences> {
        const result = await this.repo.createQueryBuilder()
            .update(User)
            .set({ preferences: () => '"preferences" || CAST(:preferences AS jsonb)' })
            .setParameter('preferences', JSON.stringify(preferences))
            .where('id = :id', { id })
            .andWhere('"deletedAt" IS NULL')
            .returning('preferences')
            .execute();

        if (!result.raw[0]) {
            throw new HttpNotFoundError('USER_NOT_FOUND');
        }
        
        return result.raw[0].preferences;
    }

    static async delete(id: string) {
        return await AppDataSource.transaction(async manager => {
            const repo = manager.getRepository(User);
            const user = await repo.findOne({ where: { id }, lock: { mode: 'pessimistic_write' } });
            if (!user) throw new HttpNotFoundError('USER_NOT_FOUND');
            if (user.coins > 0) throw new HttpConflictError('USER_COINS_NOT_EMPTY');

            await repo.softDelete({ id });
            await manager.getRepository(Session).delete({ userId: id });
        });
    }

    static async restore(id: string) {
        return await AppDataSource.transaction(async manager => {
            const repo = manager.getRepository(User);
            const user = await repo.findOne({ where: { id }, withDeleted: true, lock: { mode: 'pessimistic_write' } });
            if (!user) throw new HttpNotFoundError('USER_NOT_FOUND');
            if (!user.deletedAt) throw new HttpConflictError('USER_NOT_DELETED');
            
            const [window] = await manager.query(
                `SELECT clock_timestamp() >= $1::timestamptz + INTERVAL '${userDeletionRetentionDays} days' AS expired`,
                [user.deletedAt]
            );

            if (window.expired) throw new HttpConflictError('RESTORE_WINDOW_EXPIRED');
            await repo.restore({ id });
            user.deletedAt = null;

            return user;
        });
    }

    static async purgeDeleted() {
        return await this.repo.createQueryBuilder().delete().from(User)
            .where(`"deletedAt" <= CURRENT_TIMESTAMP - INTERVAL '${userDeletionRetentionDays} days'`)
            .execute();
    }
}