import { Entity, Column, CreateDateColumn, PrimaryGeneratedColumn, OneToMany } from 'typeorm'
import { Session } from './session.entity'

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

    @CreateDateColumn({ type: 'timestamptz' })
    updatedAt: Date;

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt: Date;

    @OneToMany(() => Session, (session) => session)
    sessions: Session[];
}