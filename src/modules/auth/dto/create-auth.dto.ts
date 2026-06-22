import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { transformPhone } from "src/common/utils/phone.transform";
import { IsMobilePhone, IsString } from "class-validator";

export class CreateAuthDto {
  @ApiProperty({
    type: "string",
    example: "+998901234567",
  })
  @Transform(transformPhone)
  @IsMobilePhone("uz-UZ")
  phone: string;

  @ApiProperty({
    example: "Rahmonbergan04@",
  })
  @IsString()
  password: string;
}
