import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { transformPhone } from "src/common/utils/phone.transform";
import {
  IsEmail,
  IsMobilePhone,
  IsNotEmpty,
  IsPassportNumber,
  IsString,
  IsStrongPassword,
} from "class-validator";

export class CreateUserDto {
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

  @ApiProperty({ example: "+998901234567" })
  @Transform(transformPhone)
  @IsMobilePhone("uz-UZ")
  phone: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  address: string;
}
