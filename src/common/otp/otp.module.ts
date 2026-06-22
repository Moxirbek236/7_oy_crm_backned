import { Module } from "@nestjs/common";
import { OtpService } from "./otp.service";
import { NotificationModule } from "../notifications/notification.module";
import { RedisModule } from "../../core/redis/redis.module";

@Module({
  imports: [RedisModule, NotificationModule],
  providers: [OtpService],
  exports: [OtpService],
})
export class OtpModule {}
