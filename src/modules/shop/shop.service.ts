import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';

@Injectable()
export class ShopService {
  constructor(private prisma: PrismaService) {}

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
}
