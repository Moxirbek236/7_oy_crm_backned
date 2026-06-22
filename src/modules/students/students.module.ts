import { Module } from "@nestjs/common";
import { StudentsService } from "./students.service";
import { StudentsController } from "./students.controller";
import { NotificationModule } from "src/common/notifications/notification.module";

@Module({
  imports: [NotificationModule],
  controllers: [StudentsController],
  providers: [StudentsService],
})
export class StudentsModule {}