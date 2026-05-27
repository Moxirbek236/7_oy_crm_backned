import { Module } from '@nestjs/common';
import { SeederService } from './seed.service';
import { UserSeeder } from './seeds/user.seeder';
import { PrismaModule } from 'src/core/database/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [SeederService, UserSeeder],
})
export class SeedModule {}
