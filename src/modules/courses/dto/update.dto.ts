import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsNumber, IsOptional, IsString } from "class-validator";

export class UpdateCourseDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @Type(() => String)
    name?: string

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @Type(() => String)
    description?: string

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    price?: number

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    duration_month?: number

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    duration_hours?: number
}