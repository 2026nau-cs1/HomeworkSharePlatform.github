import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL!;
const client = mysql.createPool(connectionString);
export const db = drizzle(client);
