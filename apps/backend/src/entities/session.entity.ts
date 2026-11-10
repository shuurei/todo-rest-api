import { Entity, Column, CreateDateColumn, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm'
import { User } from './user.entity'

@Entity()
export class Session {
    @PrimaryColumn({ type: 'uuid' })
    id: string;

    @Column({ type: 'varchar' })
    userId: string;

    @Column({ type: 'varchar', length: 97, select: false })
    tokenHash: string;

    @Column({ type: 'text', nullable: true })
    userAgent: string | null;

    @Column({ type: 'timestamptz' })
    expiresAt: Date;

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt: Date;

    @ManyToOne(() => User, (user) => user.sessions, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user: User;
}