import { MailerService } from "@nestjs-modules/mailer";
import { Injectable } from "@nestjs/common";


@Injectable()
export class EmailService{
    constructor(private readonly mailerService : MailerService){}

    async sendEmail(email:string,login:string,password:string){
        await this.mailerService.sendMail({
            to:email,
            from:process.env.EMAIL,
            subject:"CRM tizmidan foydalanish uchun login/password",
            template:"index",
            context:{
                text:`login : ${login}<br>password : ${password}`
            }
        })
    }
} 