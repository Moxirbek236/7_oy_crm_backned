import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';

import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ShopService {
  constructor(
    private prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async getAllProducts() {
    const products = await this.prisma.product.findMany({
      where: { status: 'active' },
      orderBy: { price: 'asc' },
    });
    return { success: true, data: products };
  }

  async buyProduct(req: any, productId: number) {
    const studentId = req.user?.sub ?? req.user?.id;
    if (!studentId) throw new BadRequestException('User ID not found');

    const student = await this.prisma.students.findUnique({ where: { id: studentId } });
    if (!student) throw new NotFoundException('Student not found');

    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product || product.status !== 'active') throw new NotFoundException('Product not found or inactive');
    if (product.stock <= 0) throw new BadRequestException('Product is out of stock');

    if (student.coins < product.price) {
      throw new BadRequestException('Not enough coins');
    }

    // Transaction
    const purchase = await this.prisma.$transaction(async (tx) => {
      // Deduct coins
      await tx.students.update({
        where: { id: studentId },
        data: { coins: student.coins - product.price },
      });

      // Decrease stock
      await tx.product.update({
        where: { id: productId },
        data: { stock: product.stock - 1 },
      });

      // Create purchase record
      return tx.purchase.create({
        data: {
          student_id: studentId,
          product_id: productId,
          price: product.price,
        },
      });
    });

    await this.notificationsService.createNotification(studentId, "Do'kon", `Siz "${product.name}" sovg'asini sotib olishga so'rov yubordingiz. Narxi: ${product.price} coin. status: Kutilmoqda.`).catch(() => {});

    return {
      success: true,
      message: 'Product purchased successfully',
      data: purchase,
    };
  }

  async getMyPurchases(req: any) {
    const studentId = req.user?.sub ?? req.user?.id;
    if (!studentId) throw new BadRequestException('User ID not found');

    const purchases = await this.prisma.purchase.findMany({
      where: { student_id: studentId },
      include: {
        product: {
          select: { name: true, description: true, price: true, image: true },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return { success: true, data: purchases };
  }

  // Admin/Superadmin
  async createProduct(data: any) {
    const product = await this.prisma.product.create({ data });
    return { success: true, data: product };
  }

  async getAllPurchases() {
    const purchases = await this.prisma.purchase.findMany({
      include: {
        product: true,
        student: { select: { full_name: true, phone: true } },
      },
      orderBy: { created_at: 'desc' },
    });
    return { success: true, data: purchases };
  }

  async confirmPurchase(purchaseId: number) {
    const purchase = await this.prisma.purchase.findUnique({
      where: { id: purchaseId },
    });
    if (!purchase) throw new NotFoundException('Purchase not found');
    if (purchase.status !== 'PENDING') {
      throw new BadRequestException(`Purchase status is already ${purchase.status}`);
    }

    const updated = await this.prisma.purchase.update({
      where: { id: purchaseId },
      data: { status: 'COMPLETED' },
      include: { product: true }
    });

    await this.notificationsService.createNotification(purchase.student_id, "Do'kon", `Sizning "${updated.product?.name || 'sovg\'a'}" buyurtmangiz tasdiqlandi va topshirildi!`).catch(() => {});

    return { success: true, message: 'Purchase confirmed', data: updated };
  }

  async cancelPurchase(purchaseId: number) {
    const purchase = await this.prisma.purchase.findUnique({
      where: { id: purchaseId },
    });
    if (!purchase) throw new NotFoundException('Purchase not found');
    if (purchase.status !== 'PENDING') {
      throw new BadRequestException(`Purchase status is already ${purchase.status}`);
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      // Refund student coins
      await tx.students.update({
        where: { id: purchase.student_id },
        data: { coins: { increment: purchase.price } }
      });

      // Restore product stock
      await tx.product.update({
        where: { id: purchase.product_id },
        data: { stock: { increment: 1 } }
      });

      // Set status to CANCELLED
      return tx.purchase.update({
        where: { id: purchaseId },
        data: { status: 'CANCELLED' },
        include: { product: true }
      });
    });

    await this.notificationsService.createNotification(purchase.student_id, "Do'kon", `Sizning "${(updated as any).product?.name || 'sovg\'a'}" buyurtmangiz rad etildi. ${purchase.price} coiningiz qaytarib berildi.`).catch(() => {});

    return { success: true, message: 'Purchase cancelled and coins refunded', data: updated };
  }
}
