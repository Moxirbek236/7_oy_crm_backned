import { Injectable, Logger } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/core/database/prisma.service';

@Injectable()
export class UserSeeder {
  private readonly logger = new Logger(UserSeeder.name);

  constructor(private readonly prisma: PrismaService) {}

  async seedUsers(): Promise<void> {
    const phone = '998991459686';
    const password = 'sjtmsimram10';
    this.logger.log('Seeding SUPERADMIN with email superadmin@example.com');
    const passwordHash = await bcrypt.hash(password, 10);

    const superAdmin = await this.prisma.user.upsert({
      where: { phone },
      update: {
        full_name: 'SUPERADMIN',
        password: passwordHash,
        role: UserRole.SUPERADMIN,
        photo: null,
      },
      create: {
        full_name: 'SUPERADMIN',
        email: 'moxirbekmoxirbek292gmail.com',
        address: 'Tashkent',
        phone,
        password: passwordHash,
        role: UserRole.SUPERADMIN,
        photo: null,
      },
      select: { id: true },
    });

    this.logger.log(`SUPERADMIN seed synced: ${JSON.stringify(superAdmin)}`);
  }
}
