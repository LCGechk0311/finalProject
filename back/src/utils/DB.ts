import mysql from 'mysql2';
import util from 'util';
import * as Redis from 'redis';
import dotenv from "dotenv";

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
};

const pool = mysql.createPool(dbConfig);
export const query = util.promisify(pool.query).bind(pool);

export const execute = util.promisify(pool.execute).bind(pool);

//* Redis 연결
const redisClient = Redis.createClient();

redisClient.connect();
redisClient.on('connect', () => {
   console.info('Redis connected!');
});
redisClient.on('error', (err) => {
   console.error('Redis Client Error', err);
});

export default redisClient;