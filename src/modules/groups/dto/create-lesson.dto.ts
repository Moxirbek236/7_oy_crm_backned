import { IsString, IsOptional, IsArray, IsDateString, ValidateNested, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AttendanceItemDto {
    @ApiProperty()
    @IsNumber()
    student_id: number;
}

export class CreateLessonDto {
    @ApiProperty()
    @IsString()
    topic: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({ example: '2026-05-12' })
    @IsDateString()
    lesson_date: string;

    @ApiProperty({ type: [AttendanceItemDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => AttendanceItemDto)
    attendances: AttendanceItemDto[];
}
