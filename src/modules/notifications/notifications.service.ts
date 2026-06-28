import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "src/core/database/prisma.service";

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async createNotification(studentId: number, title: string, message: string) {
    return this.prisma.notification.create({
      data: {
        student_id: studentId,
        title,
        message,
      },
    });
  }

  async getMyNotifications(req: any) {
    const studentId = req.user?.sub ?? req.user?.id;
    if (!studentId) throw new BadRequestException("User ID not found");

    const notifications = await this.prisma.notification.findMany({
      where: { student_id: studentId },
      orderBy: { created_at: "desc" },
    });

    const unreadCount = await this.prisma.notification.count({
      where: { student_id: studentId, read: false },
    });

    return {
      success: true,
      data: {
        notifications,
        unreadCount,
      },
    };
  }

  async markAsRead(req: any, id: number) {
    const studentId = req.user?.sub ?? req.user?.id;
    if (!studentId) throw new BadRequestException("User ID not found");

    const notif = await this.prisma.notification.findFirst({
      where: { id, student_id: studentId },
    });
    if (!notif) throw new NotFoundException("Bildirishnoma topilmadi");

    const updated = await this.prisma.notification.update({
      where: { id },
      data: { read: true },
    });

    return { success: true, data: updated };
  }

  async markAllAsRead(req: any) {
    const studentId = req.user?.sub ?? req.user?.id;
    if (!studentId) throw new BadRequestException("User ID not found");

    await this.prisma.notification.updateMany({
      where: { student_id: studentId, read: false },
      data: { read: true },
    });

    return { success: true, message: "Barcha bildirishnomalar o'qildi deb belgilandi" };
  }
}
