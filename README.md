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

## **2. Scalability & Performance Strategies**

### **1. Indexing**

* Frequently queried fields are indexed:

  * `userId` in posts, comments, likes
  * `followerId` / `followingId` in follows
  * `email` and `verificationCode` in users
* These indexes significantly reduce query times for:

  * Feed generation
  * Follower lookups
  * User-specific post or comment fetches


### **2. Pagination**

* All large-list endpoints use pagination (`skip/take`):

  * User feeds
  * User posts
  * Comments
* Prevents loading large datasets and ensures stable performance even as data grows.
* Enables scalable, predictable query load under high traffic.


### **3. Caching (Redis)**

* Redis is used to reduce database load and speed up responses:

  * **User sessions**: cached for fast authentication checks.
  * **Feeds**: each user stores their latest 100 post IDs.
  * **Posts by user**: paginated results cached for quick retrieval.
* Cache expiry is configurable (commonly 30–60 minutes).
* Reduces repetitive database reads and improves response times.

### **4. Queueing (BullMQ)**

* Feed generation is **asynchronous** and follows the **Observer / Subscriber pattern**:

  * **Observable (Publisher)**: when a user creates a post, a job is published to the queue.
  * **Subscribers**: the followers are implicit subscribers; the worker updates each follower’s feed cache in Redis.
* Benefits:

  * Offloads heavy feed fan-out work from the API request.
  * Allows horizontal scaling by increasing the number of workers.
  * Makes feed updates reactive, event-driven, and fast even for high follower counts.

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
6. **Image Uploads**

   * Currently, only image links are stored in the database and images are uploaded via Multer (No endpoints exposed for this right now as an MVP).
   * **For production scale, upgrade to S3 presigned URLs to allow direct uploads from clients, reducing server load and DB storage.**
     
---

## **6. Features & User Flow**

### **User Flow**

1. **User Registration**

   * User registers via `/auth/register`.
   * A **verification email** is sent with a unique link.
   * User clicks the link → account gets **verified**.
2. **Login**

   * Only **verified users** can log in via `/auth/login`.
   * JWT tokens (access + refresh) are returned.
3. **Post Creation & Feed**

   * Verified users create posts via `/posts`.
   * Followers’ feeds are updated asynchronously using the **queue system**.
4. **Interactions**

   * Users can comment (`/comments`), like (`/like/:postId`), follow/unfollow (`/follow/:userId`).
5. **Feed Retrieval**

   * `/posts/feed` returns latest posts from followed users with **pagination**.
6. **Public APIs**

   * Fetch followers `/follow/getfollowers/:userId` and following `/follow/getfollowing/:userId`.

### **APIs (Base URL: `https://social-media-backend-sond.onrender.com/api`)**

#### **Auth**

* **Register**

```json
POST /auth/register
{
  "name": "Rajendra",
  "email": "rajendra123@gmail.com",
  "password": "password123",
  "passwordConfirm": "password123"
}
```

> **Note:** Verification email is sent upon registration. which will redirect to a link 👇

* **Verify Email**

```http
GET /auth/verifyemail?/{{verificationToken}}
```

* **Login**

```json
POST /auth/login
{
  "email": "rajendra123@gmail.com",
  "password": "password123"
}
```

* **Logout**

```http
GET /auth/logout
Authorization: Bearer {{accessToken}}
```

#### **Posts**

* **Create Post**

```json
POST /posts
Authorization: Bearer {{accessToken}}
{
  "title": "My 3rd Post",
  "content": "Hello World !!"
}
```

* **Get Post by ID**

```http
GET /posts/{{postId}}
Authorization: Bearer {{accessToken}}
```

* **Get My Posts**

```http
GET /posts/me?page=1&limit=10
Authorization: Bearer {{accessToken}}
```

* **Get Feed**

```http
GET /posts/feed?page=1&limit=10
Authorization: Bearer {{accessToken}}
```

#### **Comments**

* **Add Comment**

```json
POST /comments
Authorization: Bearer {{accessToken}}
{
  "postId": "{{postId}}",
  "text": "Great Post!"
}
```

* **Delete Comment**

```http
DELETE /comments/{{commentId}}
Authorization: Bearer {{accessToken}}
```

#### **Likes**

* **Toggle Like**

```json
POST /like/{{postId}}
Authorization: Bearer {{accessToken}}
{
  "postId": "{{postId}}"
}
```

#### **Follow**

* **Follow User**

```http
POST /follow/{{userId}}
Authorization: Bearer {{accessToken}}
```

* **Unfollow User**

```http
DELETE /follow/{{userId}}
Authorization: Bearer {{accessToken}}
```

#### **Public**

* **Get Followers**

```http
GET /follow/getfollowers/{{userId}}
```

* **Get Following**

```http
GET /follow/getfollowing/{{userId}}
```
---

## **7. Summary**

The system is **scalable and production-ready** with:

* Efficient schema design with relations and composite keys
* Indexed fields for fast queries
* Pagination and cache for performance
* Queue-based feed generation

**Current limitations** are mostly due to **free-tier Redis/NeonDB resources**, which can handle small-scale testing (~1–2 K active users) but need upgrading for production-scale.

---
