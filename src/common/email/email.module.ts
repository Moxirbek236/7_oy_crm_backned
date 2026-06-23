import { Global, Module } from "@nestjs/common";
import { EmailService } from "./email.service";
import { MailerModule } from "@nestjs-modules/mailer";
import { HandlebarsAdapter } from "@nestjs-modules/mailer/adapters/handlebars.adapter";
import { join } from "path";
import * as dns from "dns";

// Render va boshqa IPv6 qo'llab-quvvatlamaydigan muhitlarda 
// SMTP uchun IPv4 ni majburiy qilish:
dns.setDefaultResultOrder("ipv4first");

@Global()
@Module({
  imports: [
    MailerModule.forRoot({
      transport: {
        service: "gmail",
        auth: {
          user: "moxirbekmoxirbek29@gmail.com",
          pass: "nzzktepfnkjiyrmu",
        },
      },
      defaults: {
        from: '"N26 GROUP" abdukhoshim99@gmail.com',
      },
      template: {
        dir: join(process.cwd(), "src", "templates"),
        adapter: new HandlebarsAdapter(),
        options: {
          strict: true,
        },
      },
    }),
  ],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
