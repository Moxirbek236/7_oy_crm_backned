import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsNumber, IsOptional } from "class-validator";

export class PaginationDto{
    @ApiPropertyOptional()
    @IsOptional()
    page?: number

    @ApiPropertyOptional()
    @IsOptional()
    limit?: number
    
    @ApiPropertyOptional()
    @IsOptional()
    search?: string
}