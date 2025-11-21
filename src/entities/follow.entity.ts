// src/entities/follow.entity.ts
import {
    Entity,
    PrimaryColumn,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    Index,
  } from 'typeorm';
  import { User } from './user.entity';
  
  @Entity('follows')
  export class Follow {
    // composite primary key: (followerId, followingId)
    @PrimaryColumn()
    followerId: string;
  
    @PrimaryColumn()
    followingId: string;
  
    @ManyToOne(() => User, (user) => (user as any).following, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'followerId' })
    follower: User;
  
    @ManyToOne(() => User, (user) => (user as any).followers, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'followingId' })
    following: User;
  
    @Index()
    @CreateDateColumn()
    createdAt: Date;
  }
  