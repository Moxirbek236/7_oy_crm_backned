import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import http from 'http';

@Injectable()
export class HealthService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(HealthService.name);
  private pingInterval?: NodeJS.Timeout;
  private readonly pingUrl: string;

  constructor() {
    // Render.com server port yoki o'zi 3000 portni eshitadi
    const port = process.env.PORT || 3000;
    this.pingUrl = process.env.SELF_PING_URL || `http://localhost:${port}`;
  }

  onModuleInit() {
    // Modul yuklanganidan keyin avtomatik self-ping boshlanadi
    this.startSelfPing(60_000);
  }

  onModuleDestroy() {
    this.stopSelfPing();
  }

  /**
   * Har 1 daqiqada o'zi-o'ziga so'rov yuborib, bepul render serverining
   * uxlab qolishining oldini oladi.
   */
  startSelfPing(intervalMs: number = 60_000): void {
    if (this.pingInterval) return;

    this.pingInterval = setInterval(async () => {
      const healthUrl = `${this.pingUrl}/api/v1/health`;
      try {
        await this.ping(healthUrl);
      } catch {
        // Ping xatosi konsolga chiqariladi, lekin interval to'xtatilmaydi
      }
    }, intervalMs);

    this.logger.log(`Self-ping har ${intervalMs / 1000} daqiqada ishga tushdi: ${this.pingUrl}`);
  }

  stopSelfPing(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = undefined;
      this.logger.log('Self-ping to\'xtatildi');
    }
  }

  private ping(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const req = http.get(url, { timeout: 10_000 }, (res) => {
        // Status kod qanday bo'lishidan qat'i nazar, resolve qilamiz
        res.resume();
        resolve();
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Ping timeout'));
      });
    });
  }
}

