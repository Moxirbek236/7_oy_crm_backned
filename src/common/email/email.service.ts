import { Injectable, InternalServerErrorException, Logger } from "@nestjs/common";
import { MailerService } from "@nestjs-modules/mailer";
import { SendEmailDto } from "./dto/send-email.dto";
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly from = process.env.MAIL_FROM ?? "noreply@yourdomain.com";

  constructor(private readonly mailerService: MailerService) {}

  async sendEmail(dto: SendEmailDto): Promise<void> {
    await this.send(dto);
  }

  async sendOtp(email: string, otp: string, ttlMinutes: number): Promise<void> {
    await this.send({
      to: email,
      subject: "Tasdiqlash kodi",
      text: [
        `Tasdiqlash kodingiz: ${otp}`,
        `Kod ${ttlMinutes} daqiqa amal qiladi.`,
        `Agar siz bu so'rovni yubormagan bo'lsangiz, bu xabarni e'tiborsiz qoldiring.`,
      ].join("\n\n"),
    });
  }

  private async send(dto: SendEmailDto): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to:       dto.to,
        from:     this.from,
        subject:  dto.subject,
        template: "index",
        context:  { text: dto.text },
      });
    } catch (error) {
      this.logger.error(`Failed to send email to ${dto.to}: ${error.message}`, error.stack);
      throw new InternalServerErrorException("Failed to send email. Please try again.");
    }
  }
}