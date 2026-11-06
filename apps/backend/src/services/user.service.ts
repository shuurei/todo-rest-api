import bcrypt from 'bcrypt'
import { AppDataSource } from '../db'
import { User } from '../entities/user.entity'

import { CreateUserInput, UpdateUserInput } from '../validators/user.schema'
import { HttpConflictError, HttpNotFoundError } from '../utils/http-errors'

export class UserService {
    static get repo() {
        return AppDataSource.getRepository(User);
    }

    static async findById(id: string) {
        const user = await this.repo.findOneBy({ id });
        if (!user) {
            throw new HttpNotFoundError('USER_NOT_FOUND');
        }

        return user;
    }

    static async create(data: CreateUserInput) {
        const existingUser = await this.repo.findOneBy({ username: data.username });
        if (existingUser) {
            throw new HttpConflictError('USERNAME_ALREADY_EXISTS');
        }

        const user = this.repo.create({
            ...data,
            password: await bcrypt.hash(data.password, 12),
        });

        return await this.repo.save(user);
    }

    static async findByUsernameWithPassword(username: string) {
        return await UserService.repo
            .createQueryBuilder('user')
            .addSelect('user.password')
            .where('user.username = :username', { username })
            .getOne();
    }

    static async update(id: string, { username, ...data }: UpdateUserInput) {
        const user = await this.repo.findOneBy({ id });
        if (!user) {
            throw new HttpNotFoundError('USER_NOT_FOUND');
        }

        Object.assign(user, data);

        if (username !== undefined) {
            const existingUser = await this.repo.findOneBy({ username });
            if (existingUser && existingUser.id !== id) {
                throw new HttpConflictError('USERNAME_ALREADY_EXISTS');
            }

            user.username = username;
        }

        return await this.repo.save(user);
    }

    static async delete(id: string) {
        const user = await this.repo.findOneBy({ id });
        if (user.coins > 0) {
            throw new HttpConflictError('USER_COINS_NOT_EMPTY');
        }

        return await this.repo.delete({ id });
    }
}