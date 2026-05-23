import { ApiProperty } from "@nestjs/swagger"
import { IsNumber, IsString } from "class-validator"
import { Type } from "class-transformer"

export class HomeworkResultDto {

    @ApiProperty()
    @IsNumber()
    @Type(() => Number)
    grade: number

    @ApiProperty()
    @IsString()
    title: string

    @ApiProperty()
    @IsNumber()
    @Type(() => Number) 
    homework_answer_id: number

}