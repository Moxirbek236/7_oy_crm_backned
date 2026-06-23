import { IsEnum, IsOptional, IsNumber, Min, IsString } from "class-validator";
import { Type } from "class-transformer";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { Status } from "@prisma/client";

export class FindAllRoomsDto {
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
