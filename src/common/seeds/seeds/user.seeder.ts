import { Injectable, Logger } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/core/database/prisma.service';

@Injectable()
export class UserSeeder {
  private readonly logger = new Logger(UserSeeder.name);

  constructor(private readonly prisma: PrismaService) { }

  async seedUsers(): Promise<void> {
    const phone = '+998888888888';
    const password = 'Sjtmsimram_10';
    this.logger.log('Seeding CREATOR with email superadmin@example.com');
    const passwordHash = await bcrypt.hash(password, 10);

    let superAdmin = await this.prisma.user.findFirst({
      where: { phone },
      select: { id: true },
    });

    if (!superAdmin) {
      superAdmin = await this.prisma.user.create({
        data: {
          full_name: 'SUPERADMIN',
          email: 'moxirbekmoxirbek2921gmail.com',
          address: 'Tashkent',
          phone,
          password: passwordHash,
          role: UserRole.CREATOR,
          photo: null,
        },
        select: { id: true },
      });
      this.logger.log(`CREATOR seed created: ${superAdmin.id}`);
    } else {
      this.logger.log(`CREATOR already exists, skipping creation.`);
    }

    this.logger.log(`CREATOR seed synced: ${JSON.stringify(superAdmin)}`);
  }
}