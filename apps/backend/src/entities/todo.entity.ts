import { Entity, Column, CreateDateColumn, ManyToOne, JoinColumn, PrimaryColumn } from 'typeorm'
import { User } from './user.entity'

@Entity()
export class Todo {
    @PrimaryColumn({ type: 'varchar' })
    id: string;

    @PrimaryColumn({ type: 'varchar' })
    userId: string;

    @Column({ type: 'bool', default: false })
    isCompleted: boolean;

    @Column({ type: 'varchar' })
    title: string;

    @CreateDateColumn({ type: 'timestamptz' })
    updatedAt: Date;

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt: Date;

    @ManyToOne(() => User, (user) => user.todos, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user: User;
}