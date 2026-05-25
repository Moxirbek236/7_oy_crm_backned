import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Query, Req, UnsupportedMediaTypeException, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { Role, StudentStatus, Status } from '@prisma/client';
import { StudentsService } from './students.service';
import { AuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/role.guard';
import { Roles } from 'src/common/decorators/role';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation } from '@nestjs/swagger';
import { CreateStudentDto } from './dto/create.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { PaginationDto } from './dto/pagination.dto';
import { UpdateStudentDto } from './dto/update.dto';
import { CreateHomeworkAnswerDto } from './dto/create.homework.dto';

@ApiBearerAuth()
@Controller('students')
export class StudentsController {
    constructor(private readonly studentService: StudentsService) { }

    // ---- Specific named routes (must come BEFORE generic :id routes) ----

    @ApiOperation({
        summary: `${Role.STUDENT}`,
    })
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.STUDENT)
    @Get("my/groups")
    getMyGroups(@Req() req:  Request){
        return this.studentService.getMyGroups(req['user'])
    }

    @ApiOperation({
        summary: `${Role.SUPERADMIN}, ${Role.ADMIN}`,
    })
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.SUPERADMIN, Role.ADMIN)
    @Get("archive-history")
    getArchivedStudents(
        @Query('page', new ParseIntPipe({ optional: true })) page?: number,
        @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    ) {
        return this.studentService.getArchivedStudents(page, limit)
    }

    // ---- Generic routes ----

    @ApiOperation({
        summary: `${Role.SUPERADMIN}, ${Role.ADMIN}`,
    })
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.SUPERADMIN, Role.ADMIN)
    @Get()
    getAllStudents(
        @Query() pagination : PaginationDto
    ) {
        return this.studentService.getAllStudents(pagination)
    }

    @ApiOperation({
        summary: `${Role.SUPERADMIN}, ${Role.ADMIN} - single student detail`,
    })
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.SUPERADMIN, Role.ADMIN)
    @Get('single/:id')
    getStudentSingleById(@Param('id', ParseIntPipe) id: number) {
        return this.studentService.getStudentById(id)
    }

    @ApiOperation({
        summary: `${Role.SUPERADMIN}, ${Role.ADMIN}`,
    })
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.SUPERADMIN, Role.ADMIN)
    @Get(':id')
    getStudentById(@Param('id', ParseIntPipe) id: number) {
        return this.studentService.getStudentById(id)
    }

    @ApiOperation({
        summary: `${Role.SUPERADMIN}, ${Role.ADMIN}`,
    })
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.SUPERADMIN, Role.ADMIN)
    @Put(':id')
    updateStudent(
        @Param('id', ParseIntPipe) id: number,
        @Body() payload: UpdateStudentDto
    ) {
        return this.studentService.updateStudent(id, payload)
    }

    @ApiOperation({
        summary: `${Role.SUPERADMIN}, ${Role.ADMIN}`,
    })
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.SUPERADMIN, Role.ADMIN)
    @Delete(':id')
    deleteStudent(@Param('id', ParseIntPipe) id: number) {
        return this.studentService.deleteStudent(id)
    }

    @ApiOperation({
        summary: `${Role.SUPERADMIN}, ${Role.ADMIN}`,
        description: "Bu endpointga admin va superadmin huquqi bor"
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
                birth_date: { type: 'string', format: 'date', example: '2000-01-01' },
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
        }),
        fileFilter:(req,file,cb) =>{
            const existFile = ["png","jpg","jpeg"]

            if(!existFile.includes(file.mimetype.split("/")[1])){
                return cb(new UnsupportedMediaTypeException(),false)
            }

            return cb(null,true)
        }
    }))
    @Post()
    createStudent(
        @Body() payload: CreateStudentDto,
        @UploadedFile() file?: Express.Multer.File
    ) {
        return this.studentService.createStudent(payload, file?.filename)
    }

    @ApiOperation({
        summary: `${Role.STUDENT}`,
    })
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.STUDENT) 
    @ApiConsumes("multipart/form-data")
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                title: { type: 'string', example: "Homework Answer" },
                file: { type: 'string', format: 'binary' },
            }
        }
    })
    @UseInterceptors(FileInterceptor("file", {
        storage: diskStorage({
            destination: "./src/uploads/files",
            filename: (req, file, cb) => {
                const filename = Date.now() + "." + file.mimetype.split("/")[1]
                cb(null, filename)
            } 
        })
    })) 
    @Post("homeworkAnswer/:homeworkId") 
    createHomeworkAnswer(
        @Param("homeworkId", ParseIntPipe) homeworkId : number, 
        @Body() payload: CreateHomeworkAnswerDto,  
        @Req() req : Request,
        @UploadedFile() file?: Express.Multer.File,  
    ) { 
        return this.studentService.createHomeworkAnswer(homeworkId,req['user'],payload,file?.filename)
    }

    @ApiOperation({
        summary: `${Role.SUPERADMIN}, ${Role.ADMIN}`,
    })
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.SUPERADMIN, Role.ADMIN)
    @Post("freeze/:id")
    freezStudent(
        @Param('id', ParseIntPipe) id: number,
        @Body() payload: { groupId: number; startDate: string; endDate: string; reasonId: number },
    ) {
        return this.studentService.freezStudent(id, payload)
    }

    @ApiOperation({
        summary: `${Role.SUPERADMIN}, ${Role.ADMIN}`,
    })
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.SUPERADMIN, Role.ADMIN)
    @Post("activate/:id")
    unfreezStudent(
        @Param('id', ParseIntPipe) id: number,
        @Body() payload: { groupId: number },
    ) {
        return this.studentService.unfreezStudent(id, payload.groupId)
    }

    @ApiOperation({
        summary: `${Role.SUPERADMIN}, ${Role.ADMIN}`,
    })
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.SUPERADMIN, Role.ADMIN)
    @Get("status-history/:studentId")
    getStudentStatusHandling(@Param('studentId', ParseIntPipe) studentId: number) {
        return this.studentService.getStudentStatusHistory(studentId)
    }
}
