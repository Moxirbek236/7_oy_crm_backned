import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { SchedulerRegistry } from "@nestjs/schedule";
import axios from "axios";

@Injectable()
export class MonitoringService implements OnModuleInit {
  private readonly logger = new Logger(MonitoringService.name);
  private readonly isEnabled: boolean;
  private readonly pingUrl: string;
  private readonly pingInterval: number; // minutes
  private lastPingStatus: "success" | "failure" | null = null;
  private lastPingTime: string | null = null;
  private consecutiveFailures = 0;

  constructor(
    private readonly configService: ConfigService,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {
    this.isEnabled = this.configService.get<boolean>("SELF_PING_ENABLED", false);
    this.pingUrl = this.configService.get<string>("SELF_PING_URL", "");
    this.pingInterval = this.configService.get<number>("SELF_PING_INTERVAL", 14);
  }

  onModuleInit(): void {
    if (this.isEnabled) {
      if (!this.pingUrl) {
        this.logger.warn(
          "Self-ping is enabled but SELF_PING_URL is not configured. " +
            "Please set SELF_PING_URL in your .env file.",
        );
        return;
      }

      const intervalMs = this.pingInterval * 60 * 1000;
      const intervalId = setInterval(() => this.handleSelfPing(), intervalMs);
      this.schedulerRegistry.addInterval("self-ping-job", intervalId);

      this.logger.log(
        `Self-ping monitoring initialized. URL: ${this.pingUrl}/api/v1/health, ` +
          `Interval: every ${this.pingInterval} minute(s) (${intervalMs}ms)`,
      );

      // Initial ping immediately on startup
      this.handleSelfPing();
    } else {
      this.logger.log("Self-ping monitoring is disabled. Set SELF_PING_ENABLED=true to enable.");
    }
  }

  async handleSelfPing(): Promise<void> {
    if (!this.isEnabled || !this.pingUrl) {
      return;
    }

    try {
      this.logger.log(`[Self-Ping] Sending ping to ${this.pingUrl}/api/v1/health`);

      const response = await axios.get(`${this.pingUrl}/api/v1/health`, {
        timeout: 10000,
        headers: {
          "User-Agent": "NestJS-SelfPing/1.0",
        },
      });

      this.lastPingStatus = "success";
      this.lastPingTime = new Date().toISOString();
      this.consecutiveFailures = 0;

      this.logger.log(
        `[Self-Ping] Ping successful. Status: ${response.status}, ` +
          `Uptime: ${response.data?.uptime ?? "N/A"}s`,
      );
    } catch (error: unknown) {
      this.lastPingStatus = "failure";
      this.lastPingTime = new Date().toISOString();
      this.consecutiveFailures++;

      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      this.logger.error(
        `[Self-Ping] Ping failed (${this.consecutiveFailures} consecutive): ${errorMessage}`,
      );

      if (this.consecutiveFailures >= 3) {
        this.logger.warn(
          `[Self-Ping] ${this.consecutiveFailures} consecutive ping failures detected! ` +
            `The service may be experiencing issues.`,
        );
      }
    }
  }

  getPingStatus(): {
    enabled: boolean;
    url: string;
    interval: number;
    lastPing: string | null;
    lastStatus: string | null;
    consecutiveFailures: number;
  } {
    return {
      enabled: this.isEnabled,
      url: this.pingUrl,
      interval: this.pingInterval,
      lastPing: this.lastPingTime,
      lastStatus: this.lastPingStatus,
      consecutiveFailures: this.consecutiveFailures,
    };
  }
}