import { Injectable, Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';
import { PrismaService } from 'src/core/database/prisma.service';

@Injectable()
export class UserSeeder {
  private readonly logger = new Logger(UserSeeder.name);

  constructor(private readonly prisma: PrismaService) {}

  async seedUsers(): Promise<void> {
    const phone = '998975661099';
    const password = process.env.SUPERADMIN_PASSWORD || "Benazir99!";
    this.logger.log('Seeding SUPERADMIN with email superadmin@example.com');
    const passwordHash = await bcrypt.hash(password, 10);

    const superAdmin = await this.prisma.user.upsert({
      where: { phone },
      update: {
        first_name: 'SUPERADMIN',
        last_name: 'SUPERADMIN',
        password: passwordHash,
        role: Role.SUPERADMIN,
        photo: null,
      },
      create: {
        first_name: 'SUPERADMIN',
        last_name: 'SUPERADMIN',
        email: 'abdukhoshim99@gmail.com',
        address: 'Tashkent',
        phone, 
        password: passwordHash,
        role: Role.SUPERADMIN, 
        photo: null,
      },
      select: { id: true },
    });

    this.logger.log(`SUPERADMIN seed synced: ${JSON.stringify(superAdmin)}`);
  }
}
