import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { Status } from '@prisma/client';

@Injectable()
export class TestSeed {
  private readonly logger = new Logger(TestSeed.name);

  constructor(private readonly prisma: PrismaService) { }

  async test_seed() {
    console.log('🌱 Seeder boshlandi...');

    // ── 1. CENTER ─────────────────────────────────────────────────────────────
    const center = await this.prisma.center.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        name: "Najot Ta'lim",
        address: "Toshkent, O'zbekiston",
        status: Status.active,
      },
    });
    console.log(`✅ Center: ${center.name}`);

    // ── 2. BRANCHES ───────────────────────────────────────────────────────────
    const branch1 = await this.prisma.branch.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        center_id: 1,
        name: "Asosiy filial",
        address: "Toshkent, Yunusobod",
        status: Status.active,
      },
    });

    const branch2 = await this.prisma.branch.upsert({
      where: { id: 2 },
      update: {},
      create: {
        id: 2,
        center_id: 1,
        name: "Chilonzor filiali",
        address: "Toshkent, Chilonzor",
        status: Status.active,
      },
    });
    console.log(`✅ Branches: ${branch1.name}, ${branch2.name}`);

    // ── 3. Mavjud Students uchun branch_id = 1 default qilish ────────────────
    await this.prisma.students.updateMany({
      where: { branch_id: undefined as any },
      data: { branch_id: 1 },
    });

    // ── 4. Mavjud Teachers uchun branch_id = 1 ───────────────────────────────
    await this.prisma.teachers.updateMany({
      where: { branch_id: undefined as any },
      data: { branch_id: 1 },
    });

    // ── 5. Mavjud Groups uchun branch_id = 1 ─────────────────────────────────
    await this.prisma.groups.updateMany({
      where: { branch_id: undefined as any },
      data: { branch_id: 1 },
    });

    // ── 6. Demo Products (Do'kon) ─────────────────────────────────────────────
    const products = [
      { name: "Najot Ta'lim termosi", description: "Najot Ta'lim logotipi bilan chiroyli termos", price: 2200, stock: 10, status: Status.active },
      { name: "Quloqchin", description: "Professional gaming quloqchin", price: 10000, stock: 5, status: Status.active },
      { name: "Daftar to'plami", description: "5 ta A4 daftar to'plami", price: 500, stock: 50, status: Status.active },
      { name: "Qalam to'plami", description: "10 ta karandash + 2 ta ruchka", price: 300, stock: 100, status: Status.active },
    ];

    for (const product of products) {
      await this.prisma.product.upsert({
        where: { id: products.indexOf(product) + 1 },
        update: {},
        create: product,
      });
    }
    console.log(`✅ Products: ${products.length} ta qo'shildi`);

    console.log('\n✅ Seeder muvaffaqiyatli yakunlandi!');
  }
}