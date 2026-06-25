import { ApiProperty } from "@nestjs/swagger";

export class HealthResponseDto {
  @ApiProperty({ example: "ok" })
  status!: string;

  @ApiProperty({ example: 12345 })
  uptime!: number;

  @ApiProperty({ example: "2024-01-01T00:00:00.000Z" })
  timestamp!: string;

  @ApiProperty({
    example: {
      rss: 52428800,
      heapTotal: 62914560,
      heapUsed: 45088768,
      external: 1048576,
    },
  })
  memory!: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
  };
}
