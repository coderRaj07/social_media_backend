# Social Media Backend

A scalable social media backend built with **Node.js**, **TypeORM**, **PostgreSQL (NeonDB)**, **Redis**, and **BullMQ**. Supports user authentication, posts, comments, likes, follows, and feed generation.

---

## **1. Schema / Entity Relations**

### **Entities**

* **User**

  * `id`, `name`, `email`, `password`, `role`, `photo`, `verified`
  * Relations: posts, comments, likes, followers, following
* **Post**

  * `id`, `title`, `content`, `image`, `userId`
  * Relations: user, comments, likes
* **Comment**

  * `id`, `text`, `userId`, `postId`
  * Relations: user, post
* **Like**

  * Composite PK: `(userId, postId)`
  * Relations: user, post
* **Follow**

  * Composite PK: `(followerId, followingId)`
  * Relations: follower, following

**Diagram:**

```
User 1---* Post
User 1---* Comment
User 1---* Like
User 1---* Follow (as follower/following)
Post 1---* Comment
Post 1---* Like
```

---

## **2. Optimizations**

1. **Indexing**

   * Frequently queried fields are indexed:

     * `userId` in posts, comments, likes
     * `followerId` / `followingId` in follows
     * `email` and `verificationCode` in users
   * Speeds up feed generation, post queries, and follower lookups.

2. **Pagination**

   * Feed queries, user posts, and comments use **skip/take**.
   * Prevents fetching large datasets at once.

3. **Caching (Redis)**

   * **User sessions**: stores basic user info.
   * **Feeds**: stores latest 100 posts per user.
   * **Posts by user**: caches paginated results.
   * Cache expiry: configurable (e.g., 30 minutes).

4. **Queueing (BullMQ)**

   * **Feed generation** is asynchronous:

     * When a user posts, job is queued for all followers.
     * Worker pushes post IDs to followers’ feed caches in Redis.
   * Benefits:

     * Decouples heavy feed writes from API request.
     * Supports horizontal scaling by adding workers.

---

## **3. Tradeoffs**

| Feature                        | Benefit                         | Tradeoff / Limitation                             |
| ------------------------------ | ------------------------------- | ------------------------------------------------- |
| Redis cache                    | Fast session and feed retrieval | Limited memory (30 MB free tier)                  |
| Feed queue                     | Non-blocking feed updates       | Delay between post creation and feed availability |
| Composite PKs in Like / Follow | Ensures uniqueness              | Harder to shard horizontally                      |
| Indexing                       | Faster lookups                  | Extra storage overhead in DB                      |
| Paginated queries              | Efficient data fetching         | Requires careful client-side pagination handling  |

---

## **4. Current System Capacity (Free Tiers)**

### **Redis (30 MB)**

* User sessions ≈ 200 B each
* Feed cache: 100 posts/user ≈ 3.6 KB/user
* Realistic capacity: **1–5 K active users** (for feed caching + sessions)

### **NeonDB (512 MB)**

| Entity  | Row size | Approx rows |
| ------- | -------- | ----------- |
| User    | 200 B    | ~2.6 M      |
| Post    | 1 KB     | ~500 K      |
| Comment | 500 B    | ~1 M        |
| Like    | 50 B     | ~10 M       |
| Follow  | 40 B     | ~12 M       |

**Safe estimate for free tier:** 1–2 K active users with moderate activity.

---

## **5. Scaling Recommendations**

1. **Redis**

   * Upgrade memory (≥1 GB) for larger feeds.
   * Store only essential fields in cache.
2. **Database**

   * Use read replicas for heavy read traffic.
   * Use `JSONB` or denormalized tables for feeds if needed.
3. **Queue**

   * Scale workers horizontally for high post volumes.
4. **Feed caching**

   * Use **cursor-based pagination** instead of caching full feed.
5. **Compression**

   * Compress feed JSON in Redis for memory efficiency.

---

## **6. Summary**

The system is **scalable and production-ready** with:

* Efficient schema design with relations and composite keys
* Indexed fields for fast queries
* Pagination and cache for performance
* Queue-based feed generation

**Current limitations** are mostly due to **free-tier Redis/NeonDB resources**, which can handle small-scale testing (~1–2 K active users) but need upgrading for production-scale.

---

