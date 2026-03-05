import { Redis } from "@upstash/redis";

// Serverless-optimized Redis client using HTTP to avoid connection pooling issues.
export const redis = Redis.fromEnv();
