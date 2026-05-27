import { IsEnum, IsOptional, IsNumber, Min, IsString } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { StudentStatus } from "@prisma/client";
import { Type } from "class-transformer";

export class FindAllStudentsDto {
  @IsOptional()
  @IsEnum(StudentStatus)
  @ApiPropertyOptional({
    enum: StudentStatus,
    enumName: "StudentStatus",
  })
  status?: StudentStatus;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  search?: string;

  @IsOptional()
  @ApiPropertyOptional()
  full_name?: string;

  @IsOptional()
  @ApiPropertyOptional()
  email?: string;

  @IsOptional()
  @ApiPropertyOptional()
  phone?: string;

  @IsOptional()
  @ApiPropertyOptional()
  address?: string;

  @IsOptional()
  @ApiPropertyOptional()
  birth_date?: string;

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