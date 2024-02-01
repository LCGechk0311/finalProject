import mysql from 'mysql2';
import util from 'util';

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
};

const pool = mysql.createPool(dbConfig);
export const query = util.promisify(pool.query).bind(pool);
