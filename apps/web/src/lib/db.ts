import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import * as schema from '@/db/schema';
import { env } from '@/lib/env';

const client = postgres(env.DATABASE_URL);

export const db = drizzle(client, { schema });

export type Db = typeof db;
export type DbTransaction = Parameters<Parameters<Db['transaction']>[0]>[0];
export type DbExecutor = Db | DbTransaction;
