import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { HealthService } from "../services/health.service";
import { HealthResponseDto } from "../dto/health-response.dto";

@ApiTags("Health")
@Controller("health")
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: "Check service health status" })
  check(): HealthResponseDto {
    return this.healthService.check();
  }
}