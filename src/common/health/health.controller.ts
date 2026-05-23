import { Controller, Get, Logger } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HealthService } from './health.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({
    summary: 'Health check endpoint — bu endpoint har 1 daqiqada o\'zi-o\'ziga ping qilinadi, shunday qilib render serveri uxlab qolmaydi',
  })
  @ApiResponse({
    status: 200,
    description: 'Server sog\'lom',
    schema: {
      example: {
        status: 'ok',
        timestamp: '2024-01-01T00:00:00.000Z',
        uptime: 12345,
        message: 'Server is alive',
      },
    },
  })
  check() {
    this.healthService.startSelfPing(60_000);
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      message: 'Server is alive',
    };
  }
}
