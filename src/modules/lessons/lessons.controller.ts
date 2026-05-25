import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Req, UseGuards } from '@nestjs/common';
import { LessonsService } from './lessons.service';
import { CreateLessonDto } from './dto/create.lesson.dto';
import { UpdateLessonDto } from './dto/update.lesson.dto';
import { Roles } from 'src/common/decorators/role';
import { Role } from '@prisma/client';
import { AuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/role.guard';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiBearerAuth()
@Controller('lessons')
export class LessonsController {
    constructor(private readonly lessonService: LessonsService) { }

    @ApiOperation({
        summary: `${Role.STUDENT},${Role.TEACHER},${Role.ADMIN},${Role.SUPERADMIN}`
    })
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.STUDENT, Role.TEACHER, Role.ADMIN, Role.SUPERADMIN)
    @Get("my/group/:groupId")
    getMyGroupLessons(
        @Param("groupId", ParseIntPipe) groupId: number,
        @Req() req: Request
    ) {
        return this.lessonService.getMyGroupLessons(groupId, req['user'])
    }

    @ApiOperation({
        summary: `${Role.ADMIN}, ${Role.TEACHER}, ${Role.SUPERADMIN} - Get lesson attendance`
    })
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.TEACHER, Role.SUPERADMIN)
    @Get(':id/attendance')
    getLessonAttendance(@Param('id', ParseIntPipe) lessonId: number) {
        return this.lessonService.getLessonAttendance(lessonId)
    }

    @ApiOperation({
        summary: `${Role.ADMIN}, ${Role.TEACHER}, ${Role.SUPERADMIN} - Mark student attendance`
    })
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.TEACHER, Role.SUPERADMIN)
    @Post(':id/attendance')
    markAttendance(
        @Param('id', ParseIntPipe) lessonId: number,
        @Body() payload: { studentId: number; status: string },
        @Req() req: Request
    ) {
        return this.lessonService.markAttendance(lessonId, payload, req['user'])
    }

    @ApiOperation({
        summary: `${Role.ADMIN}`
    })
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.SUPERADMIN)
    @Get()
    getAllLessons() {
        return this.lessonService.getAllLessons()
    }

    @ApiOperation({
        summary: `${Role.ADMIN}, ${Role.TEACHER}`
    })
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.TEACHER, Role.SUPERADMIN)
    @Post()
    createLesson(
        @Body() payload: CreateLessonDto,
        @Req() req: Request
    ) {
        return this.lessonService.createLesson(payload, req['user'])
    }

    @ApiOperation({
        summary: `${Role.ADMIN}, ${Role.TEACHER}, ${Role.SUPERADMIN}`
    })
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.TEACHER, Role.SUPERADMIN)
    @Get(':id')
    getLessonById(@Param('id', ParseIntPipe) id: number) {
        return this.lessonService.getLessonById(id)
    }

    @ApiOperation({
        summary: `${Role.ADMIN}, ${Role.TEACHER}, ${Role.SUPERADMIN}`
    })
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.TEACHER, Role.SUPERADMIN)
    @Put(':id')
    updateLesson(
        @Param('id', ParseIntPipe) id: number,
        @Body() payload: UpdateLessonDto
    ) {
        return this.lessonService.updateLesson(id, payload)
    }

    @ApiOperation({
        summary: `${Role.ADMIN}, ${Role.TEACHER}, ${Role.SUPERADMIN}`
    })
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.TEACHER, Role.SUPERADMIN)
    @Delete(':id')
    deleteLesson(@Param('id', ParseIntPipe) id: number) {
        return this.lessonService.deleteLesson(id)
    }
}
