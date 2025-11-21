    // src/entities/comment.entity.ts
    import {
        Entity,
        Column,
        ManyToOne,
        JoinColumn,
        CreateDateColumn,
        PrimaryGeneratedColumn,
        Index,
    } from 'typeorm';
    import { User } from './user.entity';
    import { Post } from './post.entity';
    
    @Entity('comments')
    export class Comment {
        @PrimaryGeneratedColumn('uuid')
        id: string;
    
        @Column({ type: 'text' })
        text: string;
    
        @Index()
        @Column()
        userId: string;
    
        @Index()
        @Column()
        postId: string;
    
        @ManyToOne(() => User, (user) => user.comments, { onDelete: 'SET NULL' })
        @JoinColumn({ name: 'userId' })
        user: User;
    
        @ManyToOne(() => Post, (post) => post.comments, { onDelete: 'CASCADE' })
        @JoinColumn({ name: 'postId' })
        post: Post;
    
        @CreateDateColumn()
        createdAt: Date;
    }
    