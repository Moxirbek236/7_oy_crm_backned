import { ApiProperty } from "@nestjs/swagger";
import { CourseLevel } from "@prisma/client";
import { Type } from "class-transformer";
import { IsEnum, IsNumber, IsOptional, IsString } from "class-validator";


export class CreateCourseDto{
    @ApiProperty()
    @IsString()
    @Type(()=>String)
    name:string

    @ApiProperty()
    @IsOptional()
    @Type(()=>String)
    description:string

    @ApiProperty()  
    @IsNumber()
    @Type(()=>Number)
    price:number

    @ApiProperty()
    @IsNumber()
    @Type(()=>Number)
    duration_month : number

    @ApiProperty()
    @IsNumber()
    @Type(()=>Number)
    duration_hours : number

}

