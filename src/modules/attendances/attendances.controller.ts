import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Req,
  Put,
  Query,
  ParseIntPipe,
} from "@nestjs/common";
import { AttendancesService } from "./attendances.service";
import { CreateAttendanceDto } from "./dto/create-attendance.dto";
import { UpdateAttendanceDto } from "./dto/update-attendance.dto";
import { TokenGuard } from "src/common/guards/token.guards";
import { RolesGuard } from "src/common/guards/role.guards";
import { ApiBearerAuth, ApiOperation, ApiQuery } from "@nestjs/swagger";
import { Roles } from "src/common/decorators/roles";
import { UserRole } from "@prisma/client";

@Controller("attendances")
@UseGuards(TokenGuard, RolesGuard)
@ApiBearerAuth()
export class AttendancesController {
  constructor(private readonly attendancesService: AttendancesService) {}

  @ApiOperation({
    summary: "Davomat yaratish: lesson + faqat kelgan o'quvchilar",
  })
  @Roles(UserRole.CREATOR, UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.TEACHER)
  @Post()
  create(@Body() payload: CreateAttendanceDto, @Req() req: Request) {
    return this.attendancesService.create(payload, req["user"]);
  }

  @ApiOperation({ summary: "Guruh va sana bo'yicha lesson + davomat olish" })
  @Roles(UserRole.CREATOR, UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.TEACHER)
  @ApiQuery({ name: "group_id", type: Number })
  @ApiQuery({ name: "date", type: String, example: "2025-05-13" })
  @Get("by-date")
  findByGroupAndDate(
    @Query("group_id", ParseIntPipe) group_id: number,
    @Query("date") date: string,
  ) {
    return this.attendancesService.findByGroupAndDate(group_id, date);
  }

  @ApiOperation({
    summary: `${UserRole.CREATOR}, ${UserRole.SUPERADMIN}, ${UserRole.ADMIN}, ${UserRole.TEACHER}`,
  })
  @Roles(UserRole.CREATOR, UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.TEACHER)
  @Get()
  findAll(@Req() req: Request) {
    return this.attendancesService.findAll(req["user"]);
  }

  @ApiOperation({
    summary: `${UserRole.CREATOR}, ${UserRole.SUPERADMIN}, ${UserRole.ADMIN}, ${UserRole.TEACHER}`,
  })
  @Roles(UserRole.CREATOR, UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.TEACHER)
  @Get(":id")
  async findOne(@Param("id", ParseIntPipe) id: number) {
    return await this.attendancesService.findOne(id);
  }

  @ApiOperation({
    summary: `${UserRole.CREATOR}, ${UserRole.SUPERADMIN}, ${UserRole.ADMIN}, ${UserRole.TEACHER}`,
  })
  @Roles(UserRole.CREATOR, UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.TEACHER)
  @Put(":id")
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateAttendanceDto: UpdateAttendanceDto,
  ) {
    return await this.attendancesService.update(id, updateAttendanceDto);
  }

  @ApiOperation({
    summary: `${UserRole.CREATOR}, ${UserRole.SUPERADMIN}, ${UserRole.ADMIN}, ${UserRole.TEACHER}`,
  })
  @Roles(UserRole.CREATOR, UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.TEACHER)
  @Delete(":id")
  async remove(@Param("id", ParseIntPipe) id: number) {
    return await this.attendancesService.remove(id);
  }
}
