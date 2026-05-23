import { Module } from '@nestjs/common';
import { SeederService } from './seed.service';
import { UserSeeder } from './seeds/user.seeder';
import { PrismaModule } from 'src/core/database/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [SeederService, UserSeeder],
  exports: [SeederService],
})
export class SeedModule {} 
