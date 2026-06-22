import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
  ServiceUnavailableException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly client: Redis;

  /**
   * Redis ulanishi tayyor yoki yo'qligini bildiradi.
   * Agar Redis mavjud bo'lmasa OTP so'rovlari darhol xato qaytaradi —
   * jim muvaffaqiyat emas.
   */
  private isConnected = false;

  constructor(private readonly configService: ConfigService) {
    const redisUrl = this.configService.get<string>("REDIS_URL");

    this.client = redisUrl
      ? new Redis(redisUrl, this.baseOptions())
      : new Redis({
          host: this.configService.get<string>("REDIS_HOST") ?? "localhost",
          port: this.configService.get<number>("REDIS_PORT") ?? 6379,
          ...this.baseOptions(),
        });

    this.client.on("connect", () => {
      this.isConnected = true;
      this.logger.log("Redis connected");
    });

    this.client.on("close", () => {
      this.isConnected = false;
      this.logger.warn("Redis connection closed");
    });

    this.client.on("error", (err: Error) => {
      this.isConnected = false;
      this.logger.error(`Redis error: ${err.message}`);
    });
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  async onModuleInit(): Promise<void> {
    try {
      await this.client.connect();
    } catch (err) {
      this.logger.error("Redis connection failed on startup.", err);
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.quit().catch((err) =>
      this.logger.warn(`Redis quit error: ${err.message}`),
    );
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  /**
   * @param key   - To'liq Redis key (prefix auth.service da belgilanadi)
   * @param value - Saqlanadigan qiymat
   * @param ttl   - Amal qilish muddati (soniyalarda)
   */
  async set(key: string, value: string, ttl: number): Promise<void> {
    this.assertConnected();
    await this.client.set(key, value, "EX", ttl);
  }

  async get(key: string): Promise<string | null> {
    this.assertConnected();
    return this.client.get(key);
  }

  async delete(key: string): Promise<void> {
    this.assertConnected();
    await this.client.del(key);
  }

  /**
   * Bir vaqtda bir nechta keyni atomik o'chirish (pipeline)
   */
  async deleteMany(...keys: string[]): Promise<void> {
    if (!keys.length) return;
    this.assertConnected();
    await this.client.del(...keys);
  }

  // ── Private ────────────────────────────────────────────────────────────────

  private assertConnected(): void {
    if (!this.isConnected) {
      throw new ServiceUnavailableException(
        "Cache service is temporarily unavailable. Please try again.",
      );
    }
  }

  private baseOptions() {
    return {
      lazyConnect: true,
      maxRetriesPerRequest: 3,
      retryStrategy(times: number): number | null {
        if (times > 5) return null; // 5 urinishdan keyin to'xtash
        return Math.min(times * 200, 2000);
      },
    } as const;
  }
}