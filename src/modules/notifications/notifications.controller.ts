import { Controller, Get, Post, Param, Req, UseGuards, ParseIntPipe } from "@nestjs/common";
import { NotificationsService } from "./notifications.service";
import { TokenGuard } from "src/common/guards/token.guards";
import { RolesGuard } from "src/common/guards/role.guards";
import { Roles } from "src/common/decorators/roles";
import { UserRole } from "@prisma/client";
import { ApiBearerAuth, ApiTags, ApiOperation } from "@nestjs/swagger";

@ApiTags("Notifications")
@Controller("notifications")
@UseGuards(TokenGuard, RolesGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @ApiOperation({ summary: "Student - Get my notifications" })
  @Roles(UserRole.STUDENT)
  @Get()
  getMyNotifications(@Req() req: any) {
    return this.notificationsService.getMyNotifications(req);
  }

  @ApiOperation({ summary: "Student - Mark notification as read" })
  @Roles(UserRole.STUDENT)
  @Post(":id/read")
  markAsRead(@Req() req: any, @Param("id", ParseIntPipe) id: number) {
    return this.notificationsService.markAsRead(req, id);
  }

  @ApiOperation({ summary: "Student - Mark all notifications as read" })
  @Roles(UserRole.STUDENT)
  @Post("read-all")
  markAllAsRead(@Req() req: any) {
    return this.notificationsService.markAllAsRead(req);
  }
}
