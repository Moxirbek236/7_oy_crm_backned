import { IsEnum, IsOptional, IsNumber, Min, IsString } from "class-validator";
import { Type } from "class-transformer";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { Status } from "@prisma/client";

export class FindAllCoursesDto {
  @IsOptional()
  @IsEnum(Status)
  @ApiPropertyOptional({
    enum: Status,
    enumName: "Status",
  })
  status?: Status;

  @IsOptional()
  @ApiPropertyOptional()
  name?: string;

  @IsOptional()
  @ApiPropertyOptional()
  description?: string;

  @IsOptional()
  @ApiPropertyOptional()
  price?: number;

  @IsOptional()
  @ApiPropertyOptional()
  duration_month?: number;

  @IsOptional()
  @ApiPropertyOptional()
  duration_hours?: number;

  @IsOptional()
  @ApiPropertyOptional()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @ApiPropertyOptional()
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @ApiPropertyOptional()
  limit?: number;
}
