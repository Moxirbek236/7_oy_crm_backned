import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Query, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { HomeworkService } from './homework.service';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { CreateHomeworkDto } from './dto/create.dto';
import { UpdateHomeworkDto } from './dto/update.dto';
import { HomeworkStatus, Role, StudentStatus } from '@prisma/client';
import { AuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/role.guard';
import { Roles } from 'src/common/decorators/role';
import { HomeworkResultDto } from './dto/homework.result.dto';

@ApiBearerAuth()
@Controller()
export class HomeworkController {
    constructor(private readonly homeworkService: HomeworkService) { }

    @ApiOperation({
        summary: `${Role.STUDENT}`
    })
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.STUDENT)
    @Get("homework/own/:lessonId")
    getOwnHomework(
        @Param("lessonId", ParseIntPipe) lessonId : number,
        @Req() req : Request){
        return this.homeworkService.getOwnHomework(lessonId,req['user'])
    }

    @ApiOperation({
        summary: `${Role.SUPERADMIN}, ${Role.ADMIN}`
    })
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.SUPERADMIN, Role.ADMIN) 
    @Get("group/:groupId/homework/:homeworkId/results")
    @ApiQuery({
        name: "status",
        enum: HomeworkStatus, 
        required: false
    })
    getHomeworkResults(  
        @Param("groupId", ParseIntPipe) groupId : number,
        @Param("homeworkId", ParseIntPipe) homeworkId : number,
        @Query("status") status : HomeworkStatus
    ){ 
        return this.homeworkService.getHomeworkResults(groupId,homeworkId,status)
    } 


    @ApiOperation({ 
        summary: `${Role.SUPERADMIN}, ${Role.ADMIN}, ${Role.TEACHER}` 
    }) 
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.SUPERADMIN, Role.ADMIN, Role.TEACHER) 
    @Get("group/:groupId/homework/:homeworkId/result/:studentId")
    getGroupHomeworkStudentResult(
        @Param("groupId", ParseIntPipe) groupId : number,
        @Param("homeworkId", ParseIntPipe) homeworkId : number,
        @Param("studentId", ParseIntPipe) studentId : number,
    ){
        return this.homeworkService.getGroupHomeworkStudentResult(groupId,homeworkId,studentId)
    }
    

    @ApiOperation({
        summary: `${Role.SUPERADMIN}, ${Role.ADMIN}`
    })
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.SUPERADMIN, Role.ADMIN)
    @Get("homework/all")
    getAllHomework(){
        return this.homeworkService.getAllHomework()
    }

    @ApiOperation({
        summary: `${Role.ADMIN}, ${Role.TEACHER}, ${Role.SUPERADMIN}`
    })
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.TEACHER, Role.SUPERADMIN)
    @Get("homework/:groupId")
    getGroupHomework(
        @Param("groupId", ParseIntPipe) groupId : number,
        @Req() req : Request){
        return this.homeworkService.getGroupHomework(groupId,req['user'])
    }
    

    @ApiOperation({
        summary: `${Role.SUPERADMIN}, ${Role.ADMIN}`
    })
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.SUPERADMIN, Role.ADMIN, Role.TEACHER)
    @ApiConsumes("multipart/form-data")
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                lesson_id: { type: "number" },
                group_id: { type: "number" },
                file: { type: 'string', format: 'binary' },
                title: { type: "string" },
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
    @Post("homework")
    createHomework(
        @Req() req : Request,
        @Body() payload: CreateHomeworkDto,
        @UploadedFile() file?: Express.Multer.File
    ) {
        return this.homeworkService.createHomework(payload,req["user"],file?.filename)
    }

    @ApiOperation({
        summary: `${Role.SUPERADMIN}, ${Role.ADMIN}, ${Role.TEACHER}`
    })
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.SUPERADMIN, Role.ADMIN, Role.TEACHER)
    @Put("homework/:id")
    updateHomework(
        @Param("id", ParseIntPipe) id: number,
        @Body() payload: UpdateHomeworkDto
    ) {
        return this.homeworkService.updateHomework(id, payload)
    }

    @ApiOperation({
        summary: `${Role.SUPERADMIN}, ${Role.ADMIN}`
    })
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.SUPERADMIN, Role.ADMIN)
    @Delete("homework/:id")
    deleteHomework(@Param("id", ParseIntPipe) id: number) {
        return this.homeworkService.deleteHomework(id)
    }

    @ApiOperation({
        summary: `${Role.SUPERADMIN}, ${Role.ADMIN}, ${Role.TEACHER}`
    })
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.SUPERADMIN, Role.ADMIN, Role.TEACHER)
    @Post("group/:groupId/homework/:homeworkId/check")
    submitHomeworkResult(
        @Param("groupId", ParseIntPipe) groupId : number,
        @Param("homeworkId", ParseIntPipe) homeworkId : number,
        @Body() payload: HomeworkResultDto,  
        @Req() req : Request
    ) {
        return this.homeworkService.checkHomeworkResult(payload,req["user"],groupId,homeworkId)
    }
}
