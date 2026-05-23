import { MailerModule } from "@nestjs-modules/mailer";
import { Global, Module } from "@nestjs/common";
import { join } from "path";
import { HandlebarsAdapter } from '@nestjs-modules/mailer/adapters/handlebars.adapter';
import { EmailService } from "./email.service";
@Global()
@Module({
    imports:[
        MailerModule.forRoot({
            transport:{ 
                service:"gmail",
                auth:{
                    user:"abdukhoshim99@gmail.com",
                    pass:"nrmpujlyopwlqya"
                }
            }, 
            defaults:{
                from:'"CRM" <abdukhoshim99@gmail.com>'
            },
            template:{
                dir:join(process.cwd(),"src","templates"),
                adapter:new HandlebarsAdapter(),
                options:{
                    strict:true
                }
            }
        })
    ],
    providers:[EmailService],
    exports:[EmailService]
})
export class EmailModule{}