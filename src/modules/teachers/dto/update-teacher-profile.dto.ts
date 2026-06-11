import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString, IsMobilePhone } from "class-validator";

export class UpdateTeacherProfileDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  full_name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  address?: string;
}