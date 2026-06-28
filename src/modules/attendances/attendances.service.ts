import { BadRequestException, Injectable } from "@nestjs/common";
import { CreateAttendanceDto } from "./dto/create-attendance.dto";
import { UpdateAttendanceDto } from "./dto/update-attendance.dto";
import { UserRole } from "@prisma/client";
import { PrismaService } from "src/core/database/prisma.service";
import { BotService } from "../bot/bot.service";
import { NotificationsService } from "../notifications/notifications.service";

@Injectable()
export class AttendancesService {
  constructor(
    private prisma: PrismaService,
    private botService: BotService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(
    payload: CreateAttendanceDto,
    currentUser: { id: number; role: UserRole },
  ) {
    const { group_id, date, topic, type, records } = payload;

    // 1. Guruh dars kunini tekshirish
    const group = await this.prisma.groups.findUnique({
      where: { id: group_id },
      select: {
        week_day: true,
        start_time: true,
        course: { select: { duration_hours: true } },
      },
    });

    if (!group) throw new BadRequestException("Guruh topilmadi");

    const weekMap: Record<string, string> = {
      "0": "Sunday",
      "1": "Monday",
      "2": "Tuesday",
      "3": "Wednesday",
      "4": "Thursday",
      "5": "Friday",
      "6": "Saturday",
    };

    // Use the submitted date's weekday (not necessarily today)
    const lessonDateForCheck = new Date(date);
    const lessonDayName = weekMap[String(lessonDateForCheck.getUTCDay())];

    if (!group.week_day?.includes(lessonDayName)) {
      throw new BadRequestException(
        `Guruh dars jadvalida bu kun (${lessonDayName}) yo'q`,
      );
    }

    // 2. Vaqt tekshirish (faqat TEACHER uchun)
    if (currentUser.role === UserRole.TEACHER) {
      const today = new Date();
      const todayStr = today.toISOString().slice(0, 10);
      const isFuture = date > todayStr;
      const isToday = date === todayStr;

      // Teacher can NOT take attendance for FUTURE dates
      if (isFuture) {
        throw new BadRequestException(
          "Hali dars boshlanish vaqti kelmagan! Kelajak sanasi uchun davomat olib bo'lmaydi",
        );
      }

      // For TODAY: Teacher can take attendance anytime during the day
      if (isToday) {
        // No specific time restriction within the day
      }
      // For PAST dates: no time restriction (teacher can take attendance for past lessons)
    }

    // 3. Shu kun uchun allaqachon lesson bor-yo'qligini tekshirish
    const lessonDate = new Date(date);
    const startOfDay = new Date(lessonDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(lessonDate);
    endOfDay.setHours(23, 59, 59, 999);

    const existingLesson = await this.prisma.lesson.findFirst({
      where: {
        group_id,
        date: { gte: startOfDay, lte: endOfDay },
      },
    });

    if (existingLesson) {
      if (currentUser.role === UserRole.TEACHER) {
        throw new BadRequestException(
          `Bu kun (${date}) uchun davomat allaqachon olingan`,
        );
      }

      // Admin yoki SuperAdmin bo'lsa update qilish
      await this.prisma.lesson.update({
        where: { id: existingLesson.id },
        data: {
          topic,
          type,
        },
      });

      // Eski davomatlarni o'chirib yuborishdan oldin ularning holatini olib qo'yamiz
      const oldAttendances = await this.prisma.attendance.findMany({
        where: {
          group_id,
          date: { gte: startOfDay, lte: endOfDay },
        },
      });
      const oldMap = new Map(oldAttendances.map(a => [a.student_id, a.isPresent]));

      for (const r of records) {
        const wasPresent = oldMap.get(r.student_id) || false;
        if (r.present && !wasPresent) {
          // Absent -> Present (Gain XP/Coin)
          await this.prisma.students.update({
            where: { id: r.student_id },
            data: { xp: { increment: 2 }, coins: { increment: 10 } }
          }).catch(() => {});
          await this.botService.notifyStudentAttendance(r.student_id, true, 2, 10);
          await this.notificationsService.createNotification(r.student_id, "Davomat", "Darsda qatnashdingiz: +2 XP, +10 Coin!").catch(() => {});
        } else if (!r.present && wasPresent) {
          // Present -> Absent (Lose XP/Coin)
          await this.prisma.students.update({
            where: { id: r.student_id },
            data: { xp: { decrement: 2 }, coins: { decrement: 10 } }
          }).catch(() => {});
          await this.botService.notifyStudentAttendance(r.student_id, false);
          await this.notificationsService.createNotification(r.student_id, "Davomat", "Darsda qatnashmadingiz: -2 XP, -10 Coin!").catch(() => {});
        }
      }

      // Eski davomatlarni o'chirib yuborish
      await this.prisma.attendance.deleteMany({
        where: {
          group_id,
          date: { gte: startOfDay, lte: endOfDay },
        },
      });
    } else {
      // 4. Lesson yaratish (mavzu saqlash uchun)
      await this.prisma.lesson.create({
        data: {
          group_id,
          topic,
          type,
          date: lessonDate,
          teacher_id:
            currentUser.role === UserRole.TEACHER ? currentUser.id : null,
          user_id:
            currentUser.role !== UserRole.TEACHER ? currentUser.id : null,
        },
      });
    }

    // 5. Barcha studentlarni Attendance'ga yozish (ham kelgan, ham kelmagan)
    if (records.length > 0) {
      await this.prisma.attendance.createMany({
        data: records.map((r) => ({
          group_id,
          student_id: r.student_id,
          isPresent: r.present,
          date: lessonDate,
          teacher_id:
            currentUser.role === UserRole.TEACHER ? currentUser.id : null,
          user_id:
            currentUser.role !== UserRole.TEACHER ? currentUser.id : null,
        })),
      });

      // Agar lesson endi yaratilayotgan bo'lsa (existingLesson yo'q bo'lsa), XP/Coin beramiz
      if (!existingLesson) {
        for (const r of records) {
          if (r.present) {
            await this.prisma.students.update({
              where: { id: r.student_id },
              data: { xp: { increment: 2 }, coins: { increment: 10 } }
            }).catch(() => {});
            await this.notificationsService.createNotification(r.student_id, "Davomat", "Darsda qatnashdingiz: +2 XP, +10 Coin!").catch(() => {});
          } else {
            await this.notificationsService.createNotification(r.student_id, "Davomat", "Darsda qatnashmadingiz!").catch(() => {});
          }
          await this.botService.notifyStudentAttendance(r.student_id, r.present, r.present ? 2 : 0, r.present ? 10 : 0);
        }
      }
    }

    const presentCount = records.filter((r) => r.present).length;
    return {
      success: true,
      message: existingLesson
        ? "Davomat muvaffaqiyatli yangilandi"
        : "Davomat muvaffaqiyatli saqlandi",
      present_count: presentCount,
      absent_count: records.length - presentCount,
    };
  }

  // GET: guruh va sana bo'yicha lesson + davomat
  async findByGroupAndDate(group_id: number, date: string) {
    const lessonDate = new Date(date);
    const startOfDay = new Date(lessonDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(lessonDate);
    endOfDay.setHours(23, 59, 59, 999);

    const lesson = await this.prisma.lesson.findFirst({
      where: {
        group_id,
        date: { gte: startOfDay, lte: endOfDay },
      },
      select: {
        id: true,
        topic: true,
        type: true,
        date: true,
        teachers: { select: { id: true, full_name: true } },
      },
    });

    const attendances = await this.prisma.attendance.findMany({
      where: {
        group_id,
        date: { gte: startOfDay, lte: endOfDay },
      },
      select: {
        id: true,
        student_id: true,
        isPresent: true,
        students: { select: { id: true, full_name: true, photo: true } },
      },
    });

    return {
      lesson: lesson || null,
      attendances,
    };
  }

  async findAll(currentUser: { id: number; role: UserRole }) {
    if (
      currentUser.role === UserRole.ADMIN ||
      currentUser.role === UserRole.SUPERADMIN
    ) {
      return await this.prisma.attendance.findMany({
        select: {
          id: true,
          isPresent: true,
          date: true,
          created_at: true,
          groups: { select: { id: true, name: true } },
          teachers: { select: { id: true, full_name: true } },
          students: { select: { id: true, full_name: true } },
        },
      });
    }

    return await this.prisma.attendance.findMany({
      where: { teacher_id: currentUser.id },
      select: {
        id: true,
        isPresent: true,
        date: true,
        created_at: true,
        students: { select: { id: true, full_name: true } },
      },
    });
  }

  findOne(id: number) {
    return this.prisma.attendance.findUnique({ where: { id } });
  }

  update(id: number, updateAttendanceDto: UpdateAttendanceDto) {
    return `This action updates a #${id} attendance`;
  }

  remove(id: number) {
    return `This action removes a #${id} attendance`;
  }
}
