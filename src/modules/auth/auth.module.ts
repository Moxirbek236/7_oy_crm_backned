import { Module } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { JwtModule } from "@nestjs/jwt";
import { OtpModule } from "src/common/otp/otp.module";

@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: "shaftoli",
      signOptions: { expiresIn: "1h" },
    }),
    OtpModule,
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}