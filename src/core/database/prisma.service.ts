import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleDestroy, OnModuleInit
{
  constructor() {
    const connectionString = process.env.DATABASE_URL;
    const useSsl = process.env.DATABASE_SSL !== 'false';
    
    const pool = new Pool({
      connectionString,
      ssl: useSsl ? { rejectUnauthorized: false } : undefined,
      max: 2,
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: 1000,
    });
    pool.on('error', (err) => {
      Logger.error('Unexpected error on idle client', err);
    });
    const adapter = new PrismaPg(pool);
    super({
      adapter,
      log: ["error", "warn"],
    });
  }

  async onModuleInit() {
    Logger.log("✅ Database module initialized");
  }

  async onModuleDestroy() {
    Logger.log("❌ Database module destroyed");
  }
}
