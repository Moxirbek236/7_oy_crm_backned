import { Global, Module } from "@nestjs/common";
import { EmailService } from "./email.service";
import { MailerModule } from "@nestjs-modules/mailer";
import { HandlebarsAdapter } from "@nestjs-modules/mailer/adapters/handlebars.adapter";
import { join } from "path";
import * as dns from "dns";

dns.setDefaultResultOrder("ipv4first");

@Global()
@Module({
  imports: [
    MailerModule.forRoot({
      transport: {
        service: "gmail",
        auth: {
          user: process.env.MAIL_USER,
          pass: process.env.MAIL_PASS,
        },
      },
      defaults: {
        from: `"${process.env.MAIL_FROM_NAME ?? "N26 GROUP"}" <${process.env.MAIL_USER}>`,
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