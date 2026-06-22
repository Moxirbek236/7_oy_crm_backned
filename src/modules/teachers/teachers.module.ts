import { Module } from "@nestjs/common";
import { TeachersService } from "./teachers.service";
import { TeachersController } from "./teachers.controller";
import { NotificationModule } from "src/common/notifications/notification.module";

@Module({
  imports: [NotificationModule],
  controllers: [TeachersController],
  providers: [TeachersService],
})
export class TeachersModule {}
