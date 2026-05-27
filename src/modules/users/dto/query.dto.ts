import { IsEnum, IsOptional, IsNumber, Min, IsString } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { Status } from "@prisma/client";
import { Type } from "class-transformer";

export class FindAllUsersDto {
  @IsOptional()
  @IsEnum(Status)
  @ApiPropertyOptional({
    enum: Status,
    enumName: "Status",
  })
  status?: Status;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  search?: string;

  @IsOptional()
  @ApiPropertyOptional()
  first_name?: string;

  @IsOptional()
  @ApiPropertyOptional()
  last_name?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  email?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  phone?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  address?: string;

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

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: "Sort field: full_name, email, created_at. Default: id" })
  sort_by?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: "Sort order: asc or desc. Default: asc" })
  sort_order?: 'asc' | 'desc';
}