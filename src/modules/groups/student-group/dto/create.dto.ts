import { ApiProperty } from "@nestjs/swagger";
import { IsNumber } from "class-validator";


export class CreateStudentGroupDto {
    @ApiProperty()
    @IsNumber()
    student_id:number

    @ApiProperty()
    @IsNumber()
    group_id:number
}