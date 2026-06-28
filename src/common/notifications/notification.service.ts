import { Injectable, Logger } from "@nestjs/common";
import { EmailService } from "../email/email.service";
import { EskizService } from "../sms/sms.service";

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly emailService: EmailService,
    private readonly smsService: EskizService,
  ) {}

  async sendWelcomeCredentials(phone: string, email: string, pass: string): Promise<void> {
    try {
      await Promise.all([
        this.emailService.sendEmail({
          to: email,
          subject: "NajotEdu CRM — Hisob ma'lumotlari",
          text: [
            "NajotEdu CRM tizimiga xush kelibsiz!",
            "",
            `Login (telefon): ${phone}`,
            `Parol: ${pass}`,
            "",
            "Ilova orqali kirish: https://najotedu.softwareengineer.uz/login",
          ].join("\n"),
        }).catch(e => this.logger.error("Welcome email failed to send", e)),
        this.smsService.sendSms(
          phone,
          `NajotEdu kabinetingiz https://najotedu.softwareengineer.uz/login. Login: ${phone} Parol: ${pass}`
        ).catch(e => this.logger.error("Welcome SMS failed to send", e))
      ]);
    } catch (err) {
      this.logger.error("Failed to send welcome notifications", err);
    }
  }

  async sendOtpSms(phone: string, otp: string): Promise<void> {
    try {
      await this.smsService.sendSms(
        phone,
        `Fixoo platformasida parolingizni tiklash uchun tasdiqlash kodi: ${otp}. Kodni hech kimga bermang!`
      );
    } catch (err) {
      this.logger.error("Failed to send OTP SMS", err);
      throw err;
    }
  }

  async sendOtpEmail(email: string, otp: string, ttlMinutes: number): Promise<void> {
    try {
      await this.emailService.sendOtp(email, otp, ttlMinutes);
    } catch (err) {
      this.logger.error("Failed to send OTP Email", err);
      throw err;
    }
  }
}
