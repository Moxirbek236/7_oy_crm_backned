import { ApiProperty } from "@nestjs/swagger";
import { CourseLevel, WeekDay } from "@prisma/client";
import { Transform } from "class-transformer";
import { IsDateString, IsEnum, IsNumber, IsOptional, IsString } from "class-validator";


export class CreateGroupDto {
    @ApiProperty()
    @IsString()
    name: string

    @ApiProperty()
    @IsOptional()
    description: string

    @ApiProperty()
    @IsNumber()
    course_id: number

    @ApiProperty({ type: [Number] })
    @IsNumber({}, { each: true })
    @IsOptional()
    teachers?: number[]

    @ApiProperty({ type: [Number] })
    @IsNumber({}, { each: true })
    @IsOptional()
    students?: number[]

    @ApiProperty()
    @IsNumber()
    room_id: number

    @ApiProperty()
    @IsDateString()
    start_date: string

    @ApiProperty({ enum: WeekDay, isArray: true })
    @IsEnum(WeekDay, { each: true })
    week_day: WeekDay[];

    @ApiProperty()
    @IsString()
    start_time: string

    @ApiProperty()
    @IsNumber()
    max_student: number
}

