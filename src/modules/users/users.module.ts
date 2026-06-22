import { Module } from "@nestjs/common";
import { UsersService } from "./users.service";
import { UsersController } from "./users.controller";
import { NotificationModule } from "src/common/notifications/notification.module";

@Module({
  imports: [NotificationModule],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
