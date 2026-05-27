import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { UserSeeder } from './seeds/user.seeder';

@Injectable()
export class SeederService implements OnModuleInit {
  private readonly logger = new Logger(SeederService.name);

  constructor(
    private readonly userSeeder: UserSeeder,
  ) {}

  async onModuleInit() {
    this.logger.log('Running seeders...');

    try {
      await this.userSeeder.seedUsers();
      this.logger.log('All seeders completed');
    } catch (error) {
      this.logger.error(
        'Seeder execution failed',
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
