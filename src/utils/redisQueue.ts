import { Worker, Queue } from 'bullmq';
import getRedisClient, { redisConfig } from './connectRedis';
import { AppDataSource } from './data-source';
import { Post } from '../entities/post.entity';

// BullMQ connection object (not the fully connected Redis client)
const connection = {
  host: redisConfig.host,
  port: redisConfig.port,
  username: redisConfig.username,
  password: redisConfig.password,
};

// Queue for feed jobs
export const feedQueue = new Queue('feedQueue', { connection });

// Worker to process feed jobs
export const feedWorker = new Worker(
  'feedQueue',
  async job => {
    if (!job) return;

    const { postId, followers } = job.data as { postId: string; followers: string[] };

    // Ensure post exists in DB
    const post = await AppDataSource.getRepository(Post).findOneBy({ id: postId });
    if (!post) return;

    // Push postId to each follower's feed in Redis
    for (const followerId of followers) {
      const key = `feed:${followerId}`;
      const redisClient = getRedisClient();
      await redisClient.lPush(key, post.id); // always string
      await redisClient.lTrim(key, 0, 99); // keep latest 100 posts
    }
  },
  { connection }
);

feedWorker.on('completed', job => console.log(`Feed job ${job.id} completed`));
feedWorker.on('failed', (job, err) => console.error(`Feed job ${job?.id} failed:`, err));
