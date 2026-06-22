import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { transformPhone } from "src/common/utils/phone.transform";
import { IsMobilePhone, IsString, IsNotEmpty } from "class-validator";

export class SendOtpDto {
  @ApiProperty({ type: "string", example: "+998901234567" })
  @Transform(transformPhone)
  @IsMobilePhone("uz-UZ")
  phone: string;
}

export class VerifyOtpDto {
  @ApiProperty({ type: "string", example: "+998901234567" })
  @Transform(transformPhone)
  @IsMobilePhone("uz-UZ")
  phone: string;

  @ApiProperty({ example: "123456" })
  @IsString()
  @IsNotEmpty()
  code: string;
}

export class ResetPasswordDto {
  @ApiProperty({ type: "string", example: "+998901234567" })
  @Transform(transformPhone)
  @IsMobilePhone("uz-UZ")
  phone: string;

  @ApiProperty({ example: "NewPassword123!" })
  @IsString()
  @IsNotEmpty()
  newPassword: string;
}

export class InitiateChangePasswordDto {
  @ApiProperty({ example: "OldPassword123!" })
  @IsString()
  @IsNotEmpty()
  oldPassword: string;

  @ApiProperty({ example: "NewPassword123!" })
  @IsString()
  @IsNotEmpty()
  newPassword: string;
}

export class ConfirmChangePasswordDto {
  @ApiProperty({ example: "123456" })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ example: "OldPassword123!" })
  @IsString()
  @IsNotEmpty()
  oldPassword: string;

  @ApiProperty({ example: "NewPassword123!" })
  @IsString()
  @IsNotEmpty()
  newPassword: string;
}
