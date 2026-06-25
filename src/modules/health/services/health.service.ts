import { Injectable, Logger } from "@nestjs/common";
import { HealthResponseDto } from "../dto/health-response.dto";

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);
  private readonly startTime: number = Date.now();

  check(): HealthResponseDto {
    const memoryUsage = process.memoryUsage();

    this.logger.log("Health check requested");

    return {
      status: "ok",
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      timestamp: new Date().toISOString(),
      memory: {
        rss: memoryUsage.rss,
        heapTotal: memoryUsage.heapTotal,
        heapUsed: memoryUsage.heapUsed,
        external: memoryUsage.external,
      },
    };
  }
}