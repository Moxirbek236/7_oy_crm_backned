import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class CreateHomeworkAnswerDto {
    @ApiProperty()
    @IsString()
    title : string 
}  