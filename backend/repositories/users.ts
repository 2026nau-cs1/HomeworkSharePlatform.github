import { eq } from 'drizzle-orm';
import { db } from '../db';
import { users, type User, type InsertUser } from '../db/schema';

export const usersRepository = {
  async findByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  },

  async findById(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  },

  async create(userData: z.infer<typeof import('../db/schema').insertUserSchema>): Promise<User> {
    const result = await db.insert(users).values(userData as InsertUser);
    // MySQL 不支持 returning，需要重新查询
    const insertedUser = await this.findByEmail(userData.email);
    if (!insertedUser) {
      throw new Error('Failed to create user');
    }
    return insertedUser;
  },

  async update(id: number, data: Partial<InsertUser>): Promise<User | undefined> {
    await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id));
    return this.findById(id);
  },

  async incrementDownloadCount(id: number): Promise<void> {
    const user = await this.findById(id);
    if (!user) return;
    const today = new Date().toISOString().split('T')[0];
    if (user.downloadResetDate !== today) {
      await db.update(users).set({ downloadCountToday: 1, downloadResetDate: today }).where(eq(users.id, id));
    } else {
      await db.update(users).set({ downloadCountToday: (user.downloadCountToday || 0) + 1 }).where(eq(users.id, id));
    }
  },
};

import { z } from 'zod';
