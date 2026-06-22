import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import {
  IsArray,
  IsEmail,
  IsMobilePhone,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsStrongPassword,
} from "class-validator";
import { transformPhone } from "src/common/utils/phone.transform";

export class CreateTeacherDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  full_name: string;

  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsStrongPassword()
  password: string;

  @ApiProperty()
  @Transform(transformPhone)
  @IsMobilePhone("uz-UZ")
  phone: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({ type: [Number], example: [1, 2, 3] })
  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return [];
    if (typeof value === "string") {
      return value.split(",").map((v) => Number(v.trim()));
    }
    if (Array.isArray(value)) {
      return value.map((v) => Number(v));
    }
    return [Number(value)];
  })
  groups?: number[];
}
