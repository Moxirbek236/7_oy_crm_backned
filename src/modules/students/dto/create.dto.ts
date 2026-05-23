import { ApiProperty } from "@nestjs/swagger"
import { Transform, Type } from "class-transformer"
import { IsDateString, IsEmail, IsMobilePhone, IsOptional, IsString } from "class-validator"


export class CreateStudentDto {
    @ApiProperty()
    @IsString()
    @Type(() => String)
    full_name: string

    @ApiProperty()
    @IsString()
    @Type(() => String)
    password: string

    @ApiProperty()
    @IsMobilePhone()
    phone: string

    @ApiProperty()
    @IsEmail()
    email: string

    @ApiProperty()
    @IsDateString()
    birth_date: string

    @ApiProperty()
    @IsString()
    @Type(() => String)
    address: string

    @ApiProperty({ type: [Number], example: [1, 2, 3] })
    @IsOptional()
    @Transform(({ value }) => {
        if (!value) return [];
        if (typeof value === 'string') {
            return value.split(',').map((v) => Number(v.trim()));
        }
        if (Array.isArray(value)) {
            return value.map((v) => Number(v));
        }
        return [Number(value)];
    })
    groups?: number[];
}