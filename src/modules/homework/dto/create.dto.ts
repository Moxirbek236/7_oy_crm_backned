import { ApiProperty } from "@nestjs/swagger"
import { Type } from "class-transformer"
import { IsNumber, IsString } from "class-validator"

export class CreateHomeworkDto {
    @ApiProperty()
    @IsNumber()
    @Type(() => Number)
    lesson_id: number

    @ApiProperty()
    @IsNumber()
    @Type(() => Number)
    group_id: number

    @ApiProperty()
    @IsString()
    title: string
}