import { Entity, Column, CreateDateColumn, DeleteDateColumn, Index, PrimaryGeneratedColumn, OneToMany } from 'typeorm'
import { defaultUserPreferences, type UserPreferences } from '@todo/shared'
import { Session } from './session.entity'
import { Todo } from './todo.entity';

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: string;

    @Column({ type: 'varchar', nullable: true, default: null })
    displayName: string | null;

    @Column({ type: 'varchar', unique: true })
    username: string;
    
    @Column({ type: 'varchar', select: false })
    password: string;

    @Column({ type: 'integer', default: 0 })
    coins: number;

    @Column({ type: 'integer', default: 0 })
    flags: number;

    @Column({ type: 'boolean', default: false })
    isDisabled: boolean;

    @Index('IDX_user_deletedAt')
    @DeleteDateColumn({ type: 'timestamptz', nullable: true })
    deletedAt: Date | null;

    @Column({ type: 'jsonb', default: () => `'${JSON.stringify(defaultUserPreferences)}'::jsonb` })
    preferences: UserPreferences;

    @CreateDateColumn({ type: 'timestamptz' })
    updatedAt: Date;

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt: Date;

    @OneToMany(() => Session, (session) => session)
    sessions: Session[];

    @OneToMany(() => Todo, (todo) => todo)
    todos: Todo[];
}