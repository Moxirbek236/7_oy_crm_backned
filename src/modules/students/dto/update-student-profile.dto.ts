import { IsOptional, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class UpdateStudentProfileDto {
  @ApiProperty({ required: false, description: "To'liq ism" })
  @IsOptional()
  @IsString()
  full_name?: string;

  @ApiProperty({ required: false, description: "Manzil" })
  @IsOptional()
  @IsString()
  address?: string;
}