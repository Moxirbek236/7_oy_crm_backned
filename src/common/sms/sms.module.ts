import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { EskizService } from "./sms.service";

/**
 * SMS_SERVICE token orqali inject qilinadi.
 *
 * Afzalligi: AuthService, UserService va boshqalar
 * EskizService ga to'g'ridan-to'g'ri bog'liq emas —
 * ISmsService interfeysiga bog'liq.
 *
 * Keyinchalik Twilio, Play Mobile yoki boshqa providerga
 * o'tish uchun faqat shu faylda provider ni almashtirish kifoya,
 * boshqa hech qaysi faylga tegmasdan.
 */
@Module({
    imports: [ConfigModule],
    providers: [
        {
            provide: Symbol("SMS_SERVICE"),
            useClass: EskizService,
        },
    ],
    exports: [Symbol("SMS_SERVICE")],
})
export class SmsModule { }