import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsOptional, IsString } from "class-validator";

export class UpdateLessonDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @Type(() => String)
    topic?: string

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @Type(() => String)
    description?: string
}