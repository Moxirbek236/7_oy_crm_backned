import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Query, UseGuards } from '@nestjs/common';
import { GroupsService } from './groups.service';
import { CreateGroupDto } from './dto/create.dto';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { AuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/role.guard';
import { Roles } from 'src/common/decorators/role';
import { Role } from '@prisma/client';
import { ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { filterDto } from './dto/search';

@ApiBearerAuth()
@Controller('groups')
export class GroupsController {
    constructor(private readonly groupService: GroupsService) { }

    @ApiOperation({ summary: `${Role.SUPERADMIN}, ${Role.ADMIN}` })
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.SUPERADMIN, Role.ADMIN)
    @Get("one/students/:groupId")
    getGroupOne(@Param("groupId", ParseIntPipe) groupId: number) {
        return this.groupService.getGroupOne(groupId)
    }

    @ApiOperation({ summary: `${Role.SUPERADMIN}, ${Role.ADMIN}` })
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.SUPERADMIN, Role.ADMIN)
    @Get("all")
    getAllGroups(@Query() search: filterDto) {
        return this.groupService.getAllGroups(search)
    }

    @ApiOperation({ summary: `${Role.SUPERADMIN}, ${Role.ADMIN}` })
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.SUPERADMIN, Role.ADMIN)
    @Get('report')
    getGroupReport(@Query('branchId', new ParseIntPipe({ optional: true })) branchId?: number) {
        return this.groupService.getGroupReport(branchId)
    }

    @ApiOperation({ summary: `${Role.SUPERADMIN}, ${Role.ADMIN}` })
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.SUPERADMIN, Role.ADMIN)
    @Post()
    createGroup(@Body() payload: CreateGroupDto) {
        return this.groupService.createGroup(payload)
    }

    @Get(":groupId/schedules")
    getSchedules(@Param("groupId", ParseIntPipe) groupId: number) {
        return this.groupService.getSchedules(groupId)
    }

    @ApiOperation({ summary: `${Role.SUPERADMIN}, ${Role.ADMIN}, ${Role.TEACHER}` })
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.SUPERADMIN, Role.ADMIN, Role.TEACHER)
    @Post(":groupId/lesson")
    createLesson(
        @Param("groupId", ParseIntPipe) groupId: number,
        @Body() payload: CreateLessonDto
    ) {
        return this.groupService.createLesson(groupId, payload)
    }

    @ApiOperation({ summary: `${Role.SUPERADMIN}, ${Role.ADMIN}, ${Role.TEACHER}` })
    @ApiQuery({ name: 'date', required: true, example: '2026-05-12' })
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.SUPERADMIN, Role.ADMIN, Role.TEACHER)
    @Get(":groupId/lesson")
    getLessonByDate(
        @Param("groupId", ParseIntPipe) groupId: number,
        @Query("date") date: string
    ) {
        return this.groupService.getLessonByDate(groupId, date)
    }

    @ApiOperation({ summary: `${Role.SUPERADMIN}, ${Role.ADMIN}, ${Role.TEACHER}` })
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.SUPERADMIN, Role.ADMIN, Role.TEACHER)
    @Get(":groupId")
    getGroupById(@Param("groupId", ParseIntPipe) groupId: number) {
        return this.groupService.getGroupById(groupId)
    }

    @ApiOperation({ summary: `${Role.SUPERADMIN}, ${Role.ADMIN}` })
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.SUPERADMIN, Role.ADMIN)
    @Put(":groupId")
    updateGroup(
        @Param("groupId", ParseIntPipe) groupId: number,
        @Body() payload: CreateGroupDto
    ) {
        return this.groupService.updateGroup(groupId, payload)
    }

    @ApiOperation({ summary: `${Role.SUPERADMIN}, ${Role.ADMIN}` })
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.SUPERADMIN, Role.ADMIN)
    @Delete(":groupId")
    deleteGroup(@Param("groupId", ParseIntPipe) groupId: number) {
        return this.groupService.deleteGroup(groupId)
    }
}
