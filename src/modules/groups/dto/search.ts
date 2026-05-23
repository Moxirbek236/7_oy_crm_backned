import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional } from "class-validator";

export class filterDto {
    @ApiPropertyOptional()
    @IsOptional()
    groupName? : string

    @ApiPropertyOptional()
    @IsOptional()
    max_student? : number
    
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