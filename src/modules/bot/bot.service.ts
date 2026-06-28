import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import TelegramBot from 'node-telegram-bot-api';
import { PrismaService } from '../../core/database/prisma.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class BotService implements OnModuleInit {
  private bot: TelegramBot | null = null;
  private readonly logger = new Logger(BotService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  onModuleInit() {
    const token = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    if (!token) {
      this.logger.warn('TELEGRAM_BOT_TOKEN not provided, bot will not start.');
      return;
    }

    try {
      this.bot = new TelegramBot(token, { polling: true });
      this.logger.log('Telegram bot started.');
      this.initializeListeners();
    } catch (e) {
      this.logger.error('Failed to start telegram bot', e);
    }
  }

  private initializeListeners() {
    if (!this.bot) return;

    this.bot.onText(/\/start/, (msg) => {
      const chatId = msg.chat.id;
      this.bot!.sendMessage(
        chatId,
        'Assalomu alaykum! Profilingizni tasdiqlash uchun telefon raqamingizni yuboring.',
        {
          reply_markup: {
            keyboard: [
              [
                {
                  text: 'Raqamni yuborish 📱',
                  request_contact: true,
                },
              ],
            ],
            resize_keyboard: true,
            one_time_keyboard: true,
          },
        },
      );
    });

    this.bot.on('contact', async (msg) => {
      const chatId = msg.chat.id;
      const contact = msg.contact;
      
      if (!contact) return;

      let phoneNumber = contact.phone_number;
      if (!phoneNumber.startsWith('+')) {
        phoneNumber = '+' + phoneNumber;
      }

      try {
        // Try to find student
        let student = await this.prisma.students.findUnique({
          where: { phone: phoneNumber },
        });

        if (student) {
          await this.prisma.students.update({
            where: { id: student.id },
            data: { telegram_id: String(chatId) },
          });
          this.bot!.sendMessage(chatId, `Assalomu alaykum o'quvchi ${student.full_name}! Botga muvaffaqiyatli ulandingiz. Endi bildirishnomalar shu yerga keladi.`);
          return;
        }

        // Try to find teacher
        let teacher = await this.prisma.teachers.findUnique({
          where: { phone: phoneNumber },
        });

        if (teacher) {
          await this.prisma.teachers.update({
            where: { id: teacher.id },
            data: { telegram_id: String(chatId) },
          });
          this.bot!.sendMessage(chatId, `Assalomu alaykum ustoz ${teacher.full_name}! Botga muvaffaqiyatli ulandingiz.`);
          return;
        }

        this.bot!.sendMessage(chatId, `Kechirasiz, sizning raqamingiz tizimdan topilmadi: ${phoneNumber}`);
      } catch (error) {
        this.logger.error(error);
        this.bot!.sendMessage(chatId, 'Xatolik yuz berdi.');
      }
    });
  }

  // --- NOTIFICATION METHODS ---

   async sendMessage(telegramId: string | null | undefined, text: string) {
    if (!this.bot || !telegramId) return;
    try {
      await this.bot.sendMessage(telegramId, text, { parse_mode: 'HTML' });
    } catch (e) {
      this.logger.error(`Failed to send message to ${telegramId}`, e);
    }
  }

  async notifyStudentAttendance(studentId: number, isPresent: boolean, xp: number = 0, coins: number = 0) {
    const student = await this.prisma.students.findUnique({ where: { id: studentId } });
    if (!student || !student.telegram_id) return;

    if (isPresent) {
      await this.sendMessage(
        student.telegram_id,
        `🔔 <b>Davomat</b>\nSiz bugun darsda qatnashdingiz va +${xp} XP hamda +${coins} Coin ishlab oldingiz!`
      );
    } else {
      await this.sendMessage(
        student.telegram_id,
        `❗️ <b>Davomat</b>\nSiz bugun darsga kelmadingiz. Iltimos, darslarni qoldirmang.`
      );
    }
  }

  async notifyHomeworkAnnounced(studentId: number, title: string) {
    const student = await this.prisma.students.findUnique({ where: { id: studentId } });
    if (!student || !student.telegram_id) return;
    await this.sendMessage(
      student.telegram_id,
      `📚 <b>Yangi uy ishi</b>\nSizga yangi vazifa yuklandi:\n<i>${title}</i>`
    );
  }

  async notifyHomeworkGraded(studentId: number, grade: number, xp: number, coins: number) {
    const student = await this.prisma.students.findUnique({ where: { id: studentId } });
    if (!student || !student.telegram_id) return;
    await this.sendMessage(
      student.telegram_id,
      `✅ <b>Uy ishi baholandi</b>\nSizning uy ishingiz tekshirildi.\nBall: ${grade}\nSiz +${xp} XP va +${coins} Coin oldingiz!`
    );
  }

  async notifyExamAnnounced(studentId: number, title: string) {
    const student = await this.prisma.students.findUnique({ where: { id: studentId } });
    if (!student || !student.telegram_id) return;
    await this.sendMessage(
      student.telegram_id,
      `📝 <b>Yangi imtihon</b>\nSizga imtihon e'lon qilindi:\n<i>${title}</i>`
    );
  }

  async notifyTeacherNewStudent(teacherId: number, studentName: string, groupName: string) {
    const teacher = await this.prisma.teachers.findUnique({ where: { id: teacherId } });
    if (!teacher || !teacher.telegram_id) return;
    await this.sendMessage(
      teacher.telegram_id,
      `👥 <b>Yangi o'quvchi</b>\n<b>${groupName}</b> guruhingizga yangi o'quvchi qo'shildi: ${studentName}.`
    );
  }

  async notifyTeacherStudentLeft(teacherId: number, studentName: string, groupName: string) {
    const teacher = await this.prisma.teachers.findUnique({ where: { id: teacherId } });
    if (!teacher || !teacher.telegram_id) return;
    await this.sendMessage(
      teacher.telegram_id,
      `🚪 <b>O'quvchi ketdi</b>\n<b>${groupName}</b> guruhingizdan o'quvchi chiqib ketdi: ${studentName}.`
    );
  }

  async notifyTeacherNewGroup(teacherId: number, groupName: string) {
    const teacher = await this.prisma.teachers.findUnique({ where: { id: teacherId } });
    if (!teacher || !teacher.telegram_id) return;
    await this.sendMessage(
      teacher.telegram_id,
      `🎓 <b>Yangi guruh</b>\nSizga yangi guruh biriktirildi: <b>${groupName}</b>.`
    );
  }
}
