import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsNumber, IsOptional, IsString } from "class-validator";

export class UpdateTeacherDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @Type(() => String)
    full_name?: string

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @Type(() => String)
    email?: string

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @Type(() => String)
    phone?: string

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @Type(() => String)
    address?: string

    @ApiPropertyOptional({ type: [Number] })
    @IsOptional()
    @IsNumber({}, { each: true })
    groups?: number[]
}