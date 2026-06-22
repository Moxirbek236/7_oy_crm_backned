import { Module } from "@nestjs/common";
import { NotificationService } from "./notification.service";
import { EmailModule } from "../email/email.module";
import { EskizService } from "../sms/sms.service";

@Module({
  imports: [EmailModule],
  providers: [NotificationService, EskizService],
  exports: [NotificationService],
})
export class NotificationModule {}
