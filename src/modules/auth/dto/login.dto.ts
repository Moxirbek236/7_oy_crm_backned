import { ApiProperty } from "@nestjs/swagger"
import { IsMobilePhone, IsString } from "class-validator"

export class LoginDto {
    @ApiProperty({example:"998975661099"})
    @IsString()
    identifier:string

    @ApiProperty({example:"Benazir99!"})
    @IsString()
    password:string
}