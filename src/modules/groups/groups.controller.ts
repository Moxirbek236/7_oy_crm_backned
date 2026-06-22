import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Put,
  ParseIntPipe,
  UseGuards,
  Query,
  Req,
} from "@nestjs/common";
import { GroupsService } from "./groups.service";
import { CreateGroupDto } from "./dto/create-group.dto";
import { UpdateGroupDto } from "./dto/update-group.dto";
import { TokenGuard } from "src/common/guards/token.guards";
import { RolesGuard } from "src/common/guards/role.guards";
import { ApiBearerAuth, ApiConsumes, ApiOperation } from "@nestjs/swagger";
import { Roles } from "src/common/decorators/roles";
import { UserRole } from "@prisma/client";
import { FindAllGroupsDto } from "./dto/query.dto";

@Controller("groups")
@UseGuards(TokenGuard, RolesGuard)
@ApiBearerAuth()
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @ApiOperation({ summary: `${UserRole.SUPERADMIN}, ${UserRole.ADMIN}` })
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  @Post()
  create(@Body() payload: CreateGroupDto) {
    return this.groupsService.create(payload);
  }

  @ApiOperation({ summary: `${UserRole.SUPERADMIN}, ${UserRole.ADMIN}` })
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  @Get(["", "all"])
  findAll(@Query() query: FindAllGroupsDto) {
    return this.groupsService.findAll(query);
  }

  @ApiOperation({ summary: `${UserRole.SUPERADMIN}, ${UserRole.ADMIN}` })
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  @Get("stats")
  getStats() {
    return this.groupsService.getStats();
  }

  @ApiOperation({ summary: `${UserRole.SUPERADMIN}, ${UserRole.ADMIN}, ${UserRole.TEACHER}, ${UserRole.STUDENT}` })
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT)
  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number, @Req() req: any) {
    return this.groupsService.findOne(id, req?.user);
  }

  @ApiOperation({ summary: `${UserRole.SUPERADMIN}, ${UserRole.ADMIN}, ${UserRole.TEACHER}, ${UserRole.STUDENT}` })
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT)
  @Get(":id/schedule")
  getSchedule(@Param("id", ParseIntPipe) id: number, @Req() req: any) {
    return this.groupsService.getSchedule(id, req?.user);
  }

  @ApiOperation({ summary: `${UserRole.SUPERADMIN}, ${UserRole.ADMIN}, ${UserRole.TEACHER}, ${UserRole.STUDENT}` })
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT)
  @Get(":id/student-attendances")
  getStudentAttendances(@Param("id", ParseIntPipe) id: number) {
    return this.groupsService.getStudentAttendances(id);
  }

  @ApiOperation({ summary: `${UserRole.SUPERADMIN}, ${UserRole.ADMIN}` })
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  @Put(":id")
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() payload: UpdateGroupDto,
  ) {
    return this.groupsService.update(id, payload);
  }

  @ApiOperation({ summary: `${UserRole.SUPERADMIN}, ${UserRole.ADMIN}` })
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  @Delete(":id")
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.groupsService.remove(id);
  }
}
