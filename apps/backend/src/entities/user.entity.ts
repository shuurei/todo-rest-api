import { Entity, Column, CreateDateColumn, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { defaultUserPreferences, type UserPreferences } from '@nodus/shared';
import { Session } from './session.entity';
import { Todo } from './todo.entity';

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: string;
    @Column({
        type: 'varchar',
        nullable: true,
        default: null
    })
    displayName: string | null;
    @Column({
        type: 'varchar',
        unique: true
    })
    username: string;
    @Column({
        type: 'varchar',
        select: false,
        nullable: true
    })
    password: string | null;
    @Column({
        type: 'integer',
        default: 0
    })
    flags: number;
    @Column({
        type: 'boolean',
        default: false
    })
    isDisabled: boolean;
    @Column({
        type: 'jsonb',
        default: () => `'${JSON.stringify(defaultUserPreferences)}'::jsonb`
    })
    preferences: UserPreferences;
    @CreateDateColumn({
        type: 'timestamptz'
    })
    updatedAt: Date;
    @CreateDateColumn({
        type: 'timestamptz'
    })
    createdAt: Date;
    @OneToMany(() => Session, (session) => session)
    sessions: Session[];
    @OneToMany(() => Todo, (todo) => todo)
    todos: Todo[];
}
