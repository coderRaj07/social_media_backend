// src/entities/like.entity.ts
import {
    Entity,
    PrimaryColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    Index,
  } from 'typeorm';
  import { User } from './user.entity';
  import { Post } from './post.entity';
  
  @Entity('likes')
  export class Like {
    // composite primary key: (userId, postId)
    @PrimaryColumn()
    userId: string;
  
    @PrimaryColumn()
    postId: string;
  
    @ManyToOne(() => User, (user) => user.likes, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user: User;
  
    @ManyToOne(() => Post, (post) => post.likes, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'postId' })
    post: Post;
  
    @CreateDateColumn()
    createdAt: Date;
  }
  