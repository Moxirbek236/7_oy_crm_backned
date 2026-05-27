import { IsEnum, IsOptional, IsNumber, Min, IsString } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { GroupStatus, WeekDay } from "@prisma/client";
import { Type } from "class-transformer";

export class FindAllGroupsDto {
  @IsOptional()
  @IsEnum(GroupStatus)
  @ApiPropertyOptional({ enum: GroupStatus, enumName: "GroupStatus" })
  status?: GroupStatus;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  name?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  search?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  description?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  start_date?: string;

  @IsOptional()
  @IsEnum(WeekDay)
  @ApiPropertyOptional({ enum: WeekDay, enumName: "WeekDay" })
  week_day?: WeekDay;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  start_time?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @ApiPropertyOptional()
  max_students?: number;

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
  @ApiPropertyOptional({ description: "Sort field: name, start_date, start_time, created_at. Default: id" })
  sort_by?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: "Sort order: asc or desc. Default: asc" })
  sort_order?: 'asc' | 'desc';

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: "Filter by week_day type: even, odd, or specific day name" })
  week_day_type?: string;

  @IsOptional()
  @Type(() => Boolean)
  @ApiPropertyOptional({ description: "If true, returns only minimal data (id, name) for dropdowns" })
  dropdown?: boolean;
}

export class GroupsStats {
  totalGroups!: number;
  uniqueTeachers!: number;
  totalStudents!: number;
  activeGroups!: number;
  archivedGroups!: number;
}