import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from "@nestjs/common";
import { RedisService } from "../../core/redis/redis.service";
import { NotificationService } from "../notifications/notification.service";
import * as crypto from "crypto";

const OTP_TTL_SECONDS = 300;
const VERIFIED_TTL_SECONDS = 600;   

export const redisKey = {
  otp:              (phone: string)  => `otp:${phone}`,
  otpVerified:      (phone: string)  => `otp_verified:${phone}`,
  emailOtp:         (userId: number) => `email_otp:${userId}`,
  emailOtpVerified: (userId: number) => `email_otp_verified:${userId}`,
} as const;

@Injectable()
export class OtpService {
  constructor(
    private readonly redisService: RedisService,
    private readonly notificationService: NotificationService,
  ) {}

  async generateAndSendPhoneOtp(phone: string): Promise<void> {
    const otp = this.generateSecureOtp();
    await this.redisService.set(redisKey.otp(phone), otp, OTP_TTL_SECONDS);

    try {
      await this.notificationService.sendOtpSms(phone, otp);
    } catch {
      await this.redisService.delete(redisKey.otp(phone));
      throw new InternalServerErrorException("Failed to send OTP. Please try again.");
    }
  }

  async verifyPhoneOtp(phone: string, code: string): Promise<void> {
    const storedOtp = await this.redisService.get(redisKey.otp(phone));

    if (!storedOtp) {
      throw new BadRequestException("OTP expired or not found. Request a new one.");
    }

    if (!this.timingSafeCompare(storedOtp, code)) {
      throw new BadRequestException("Invalid OTP code");
    }

    await Promise.all([
      this.redisService.delete(redisKey.otp(phone)),
      this.redisService.set(redisKey.otpVerified(phone), "true", VERIFIED_TTL_SECONDS),
    ]);
  }

  async generateAndSendEmailOtp(userId: number, email: string): Promise<void> {
    const otp = this.generateSecureOtp();
    await this.redisService.set(redisKey.emailOtp(userId), otp, VERIFIED_TTL_SECONDS);

    try {
      await this.notificationService.sendOtpEmail(email, otp, VERIFIED_TTL_SECONDS / 60);
    } catch {
      await this.redisService.delete(redisKey.emailOtp(userId));
      throw new InternalServerErrorException("Failed to send confirmation email. Please try again.");
    }
  }

  async verifyEmailOtp(userId: number, code: string): Promise<void> {
    const storedOtp = await this.redisService.get(redisKey.emailOtp(userId));

    if (!storedOtp) {
      throw new BadRequestException("Confirmation code expired or not found. Please restart the process.");
    }

    if (!this.timingSafeCompare(storedOtp, code)) {
      throw new BadRequestException("Invalid confirmation code");
    }

    await this.redisService.delete(redisKey.emailOtp(userId));
  }

  async checkPhoneVerified(phone: string): Promise<boolean> {
    const isVerified = await this.redisService.get(redisKey.otpVerified(phone));
    return isVerified === "true";
  }

  async clearPhoneVerifiedFlag(phone: string): Promise<void> {
    await this.redisService.delete(redisKey.otpVerified(phone));
  }

  private generateSecureOtp(): string {
    const otp = (crypto.randomBytes(3).readUIntBE(0, 3) % 900000) + 100000;
    return String(otp);
  }

  private timingSafeCompare(a: string, b: string): boolean {
    const bufA = Buffer.alloc(32);
    const bufB = Buffer.alloc(32);
    bufA.write(a);
    bufB.write(b);
    return crypto.timingSafeEqual(bufA, bufB);
  }
}
