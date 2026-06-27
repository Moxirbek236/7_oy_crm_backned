import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  ParseIntPipe,
  Put,
  UseGuards,
  Query,
  Req,
} from "@nestjs/common";
import { StudentsService } from "./students.service";
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
} from "@nestjs/swagger";
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import { TokenGuard } from "src/common/guards/token.guards";
import { RolesGuard } from "src/common/guards/role.guards";
import { Roles } from "src/common/decorators/roles";
import { UserRole } from "@prisma/client";
import { CreateStudentDto } from "./dto/create-student.dto";
import { UpdateStudentDto } from "./dto/update-student.dto";
import { UpdateStudentProfileDto } from "./dto/update-student-profile.dto";
import { FindAllStudentsDto } from "./dto/query.dto";

@Controller("students")
@UseGuards(TokenGuard, RolesGuard)
@ApiBearerAuth()
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @ApiOperation({ summary: `${UserRole.CREATOR}, ${UserRole.SUPERADMIN}, ${UserRole.ADMIN}` })
  @Roles(UserRole.CREATOR, UserRole.SUPERADMIN, UserRole.ADMIN)
  @Post()
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        full_name: { type: "string" },
        email: { type: "string" },
        password: { type: "string" },
        phone: { type: "string" },
        address: { type: "string" },
        photo: { type: "string", format: "binary" },
        birth_date: { type: "string", example: "2006-02-07" },
        groups: { type: "array", items: { type: "number" }, example: [1, 2] },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor("photo", {
      storage: diskStorage({
        destination: "./src/uploads",
        filename: (req, file, cb) => {
          const filename = Date.now() + "." + file.originalname.split(".")[1];
          cb(null, filename);
        },
      }),
    }),
  )
  create(
    @Body() payload: CreateStudentDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.studentsService.create(payload, file?.filename);
  }

  @ApiOperation({
    summary: `${UserRole.CREATOR}, ${UserRole.SUPERADMIN}, ${UserRole.ADMIN}`,
  })
  @Roles(UserRole.CREATOR, UserRole.SUPERADMIN, UserRole.ADMIN)
  @Get("all")
  findAll(@Query() query: FindAllStudentsDto) {
    return this.studentsService.findAll(query);
  }

  // ─── STUDENT-SPECIFIC ENDPOINTS ──────────────────────────────────────────────

  @ApiOperation({ summary: `${UserRole.STUDENT} - My groups` })
  @Roles(UserRole.STUDENT)
  @Get("my/groups")
  getMyGroups(@Req() req: any) {
    return this.studentsService.getMyGroups(req);
  }

  @ApiOperation({ summary: `${UserRole.STUDENT} - Group teachers` })
  @Roles(UserRole.STUDENT)
  @Get("my/group/:id/teachers")
  getGroupTeachers(@Req() req: any, @Param("id", ParseIntPipe) id: number) {
    return this.studentsService.getGroupTeachers(req, id);
  }

  @ApiOperation({ summary: `${UserRole.STUDENT} - My dashboard` })
  @Roles(UserRole.STUDENT)
  @Get("my/dashboard")
  getMyDashboard(@Req() req: any) {
    return this.studentsService.getMyDashboard(req);
  }

  @ApiOperation({ summary: `${UserRole.STUDENT} - My stats` })
  @Roles(UserRole.STUDENT)
  @Get("my/stats")
  getMyStats(@Req() req: any) {
    return this.studentsService.getMyStats(req);
  }

  @ApiOperation({ summary: `${UserRole.STUDENT} - My rating` })
  @Roles(UserRole.STUDENT)
  @Get("my/rating")
  getMyRating(
    @Req() req: any,
    @Query("filter") filter: "group" | "branch" | "center",
    @Query("period") period: "weekly" | "monthly" | "3month" | "all"
  ) {
    return this.studentsService.getMyRating(req, filter, period);
  }

  @ApiOperation({ summary: `${UserRole.STUDENT} - Group lessons` })
  @Roles(UserRole.STUDENT)
  @Get("my/group/:id/lessons")
  getGroupLessons(@Req() req: any, @Param("id", ParseIntPipe) id: number) {
    return this.studentsService.getGroupLessons(req, id);
  }

  @ApiOperation({ summary: `${UserRole.STUDENT} - Group lessons lite` })
  @Roles(UserRole.STUDENT)
  @Get("my/group/:groupId/lessons-lite")
  getGroupLessonsLite(@Req() req: any, @Param("groupId", ParseIntPipe) groupId: number) {
    return this.studentsService.getGroupLessonsLite(req, groupId);
  }

  @ApiOperation({ summary: `${UserRole.STUDENT} - Group lesson details` })
  @Roles(UserRole.STUDENT)
  @Get("my/group/:groupId/lesson/:lessonId")
  getStudentLessonDetails(
    @Req() req: any,
    @Param("groupId", ParseIntPipe) groupId: number,
    @Param("lessonId", ParseIntPipe) lessonId: number,
  ) {
    return this.studentsService.getStudentLessonDetails(req, groupId, lessonId);
  }

  @ApiOperation({ summary: `${UserRole.STUDENT} - My profile` })
  @Roles(UserRole.STUDENT)
  @Get("my/profile")
  getProfile(@Req() req: any) {
    return this.studentsService.getProfile(req);
  }

  @ApiOperation({ summary: `${UserRole.STUDENT} - Update my profile` })
  @Roles(UserRole.STUDENT)
  @Put("my/profile")
  updateProfile(@Req() req: any, @Body() payload: UpdateStudentProfileDto) {
    return this.studentsService.updateProfile(req, payload);
  }

  // ─── ADMIN/SOFT DELETE ENDPOINTS ────────────────────────────────────────────
  @ApiOperation({
    summary: `${UserRole.CREATOR}, ${UserRole.SUPERADMIN}, ${UserRole.ADMIN}`,
  })
  @Roles(UserRole.CREATOR, UserRole.SUPERADMIN, UserRole.ADMIN)
  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.studentsService.findOne(id);
  }

  @ApiOperation({ summary: `${UserRole.CREATOR}, ${UserRole.SUPERADMIN}, ${UserRole.ADMIN}` })
  @Roles(UserRole.CREATOR, UserRole.SUPERADMIN, UserRole.ADMIN)
  @Put(":id")
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        full_name: { type: "string" },
        email: { type: "string" },
        password: { type: "string" },
        phone: { type: "string" },
        address: { type: "string" },
        photo: { type: "string", format: "binary" },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor("photo", {
      storage: diskStorage({
        destination: "./src/uploads",
        filename: (req, file, cb) => {
          const filename = Date.now() + "." + file.originalname.split(".")[1];
          cb(null, filename);
        },
      }),
    }),
  )
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() payload: UpdateStudentDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.studentsService.update(id, payload, file?.filename);
  }

  @ApiOperation({ summary: `${UserRole.CREATOR}, ${UserRole.SUPERADMIN}, ${UserRole.ADMIN}` })
  @Roles(UserRole.CREATOR, UserRole.SUPERADMIN, UserRole.ADMIN)
  @Delete(":id")
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.studentsService.remove(id);
  }
}
