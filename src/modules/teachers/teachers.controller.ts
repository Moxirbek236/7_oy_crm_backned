import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Put, Query, Req, UnsupportedMediaTypeException, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { Role, Status } from '@prisma/client';
import { TeachersService } from './teachers.service';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/role.guard';
import { Roles } from 'src/common/decorators/role';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { CreateTeacherDto } from './dto/create.dto';
import { UpdateTeacherDto } from './dto/update.dto';

@ApiBearerAuth()
@Controller('teachers')
export class TeachersController {
    constructor(private readonly teacherService: TeachersService) { }

    @ApiOperation({
        summary: `${Role.SUPERADMIN}, ${Role.ADMIN}`,
    })
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.SUPERADMIN, Role.ADMIN)
    @Get()
    getAllTeachers(
        @Query('search') search?: string,
        @Query('page', new ParseIntPipe({ optional: true })) page?: number,
        @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    ) {
        return this.teacherService.getAllTeachers(search, page, limit)
    }

    @ApiOperation({
        summary: `${Role.SUPERADMIN}, ${Role.ADMIN}`,
    })
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.SUPERADMIN, Role.ADMIN)
    @Get('group/:groupId')
    getTeachersByGroup(@Param('groupId', ParseIntPipe) groupId: number) {
        return this.teacherService.getTeachersByGroup(groupId)
    }

    // renamed from getTeacherSingleById to avoid duplicate route with /:id
    @ApiOperation({
        summary: `${Role.SUPERADMIN}, ${Role.ADMIN}`,
    })
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.SUPERADMIN, Role.ADMIN)
    @Get('single/:id')
    getTeacherSingleById(@Param('id', ParseIntPipe) id: number) {
        return this.teacherService.getTeacherById(id)
    }

    @ApiOperation({
        summary: `${Role.SUPERADMIN}, ${Role.ADMIN}`,
    })
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.SUPERADMIN, Role.ADMIN)
    @Get(':id')
    getTeacherById(@Param('id', ParseIntPipe) id: number) {
        return this.teacherService.getTeacherById(id)
    }

    @ApiOperation({
        summary: `${Role.SUPERADMIN}, ${Role.ADMIN}`,
    })
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.SUPERADMIN, Role.ADMIN)
    @Put(':id')
    updateTeacher(
        @Param('id', ParseIntPipe) id: number,
        @Body() payload: UpdateTeacherDto
    ) {
        return this.teacherService.updateTeacher(id, payload)
    }

    @ApiOperation({
        summary: `${Role.SUPERADMIN}, ${Role.ADMIN}`,
    })
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.SUPERADMIN, Role.ADMIN)
    @Delete(':id')
    deleteTeacher(@Param('id', ParseIntPipe) id: number) {
        return this.teacherService.deleteTeacher(id)
    }

    // ---- New /teacher-specific endpoints ----

    @ApiOperation({
        summary: 'Get teacher coins',
    })
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.SUPERADMIN, Role.ADMIN, Role.TEACHER)
    @Get(':id/coins')
    getTeacherCoins(
        @Param('id', ParseIntPipe) teacherId: number,
        @Query('page', new ParseIntPipe({ optional: true })) page?: number,
        @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
        @Query('month') month?: string,
        @Query('sort') sort?: string,
    ) {
        return this.teacherService.getTeacherCoins(teacherId, page, limit, month, sort)
    }

    @ApiOperation({
        summary: 'Get teacher profile (authenticated teacher)',
    })
    @UseGuards(AuthGuard)
    @Get('profile')
    getTeacherProfile(@Req() req: any) {
        return this.teacherService.getTeacherProfile(req.user.id)
    }

    @ApiOperation({
        summary: 'Get teacher info',
    })
    @UseGuards(AuthGuard)
    @Get('info')
    getTeacherInfo(@Req() req: any) {
        return this.teacherService.getTeacherInfo(req.user.id)
    }

    @ApiOperation({
        summary: `${Role.SUPERADMIN}, ${Role.ADMIN}`,
    })
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.SUPERADMIN, Role.ADMIN)
    @Get('history')
    getArchivedTeachers(
        @Query('page', new ParseIntPipe({ optional: true })) page?: number,
        @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    ) {
        return this.teacherService.getArchivedTeachers(page, limit)
    }

    @ApiOperation({
        summary: 'Update teacher status (activate / archive)',
    })
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.SUPERADMIN, Role.ADMIN)
    @Patch('status/:id')
    updateTeacherStatus(
        @Param('id', ParseIntPipe) id: number,
        @Query('status') status: string,
    ) {
        return this.teacherService.updateTeacherStatus(id, status)
    }

    @ApiOperation({
        summary: `${Role.SUPERADMIN}, ${Role.ADMIN}`,
    })
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.SUPERADMIN, Role.ADMIN)
    @ApiConsumes("multipart/form-data")
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                full_name: { type: 'string', example: "Alish" },
                email: { type: 'string' },
                password: { type: 'string' },
                phone: { type: 'string' },
                photo: { type: 'string', format: 'binary' },
                address: { type: "string" },
                birth_date: { type: 'string', format: 'date' },
                groups: { type: 'array', items: { type: 'number' }, example: [1, 2, 3] }
            }
        }
    })
    @UseInterceptors(FileInterceptor("photo", {
        storage: diskStorage({
            destination: "./src/uploads",
            filename: (req, file, cb) => {
                const filename = Date.now() + "." + file.mimetype.split("/")[1]
                cb(null, filename)
            }
        })
    }))
    @Post()
    createTeacher(
        @Body() payload: CreateTeacherDto,
        @UploadedFile() file?: Express.Multer.File
    ) {
        return this.teacherService.createTeacher(payload, file?.filename)
    }
}
