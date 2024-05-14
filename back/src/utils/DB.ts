import mysql from 'mysql2';
import util from 'util';
import * as Redis from 'redis';
import session from 'express-session';
import RedisStore from 'connect-redis';
import dotenv from 'dotenv';
dotenv.config();
// import aws from 'aws-sdk';

declare module 'express-session' {
  interface SessionData {
    is_logined?: boolean;
    dispayName?: string;
    userId?: string;
  }
}
//* Redis 연결
const redisClient = Redis.createClient({
  disableOfflineQueue: true,
  legacyMode: true,
});
redisClient.on('connect', async () => {
  console.info('Redis connected!');
});
redisClient.on('error', (err) => {
  console.error('Redis Client Error', err);
});

redisClient.connect().then();
export const redisCli = redisClient.v4;
export default redisClient;

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
};

const pool = mysql.createPool(dbConfig);
export const query = util.promisify(pool.query).bind(pool);

const redisStoreInstance = new RedisStore({ client: redisClient });

export const sessionMiddleware = session({
  store: redisStoreInstance,
  secret: process.env.SESSION_SECRET_KEY,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
  },
});
