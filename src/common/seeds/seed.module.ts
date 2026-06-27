import { Module } from '@nestjs/common';
import { SeederService } from './seed.service';
import { UserSeeder } from './seeds/user.seeder';
import { TestSeed } from './seeds/seed';
import { PrismaModule } from 'src/core/database/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [SeederService, UserSeeder, TestSeed],
})
export class SeedModule {}
