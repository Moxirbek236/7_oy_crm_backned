import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { UserSeeder } from './seeds/user.seeder';
import { TestSeed } from './seeds/seed';
@Injectable()
export class SeederService implements OnModuleInit {
  private readonly logger = new Logger(SeederService.name);

  constructor(
    private readonly userSeeder: UserSeeder,
    private readonly TestSeed: TestSeed,
  ) {}

  async onModuleInit() {
    this.logger.log('Running seeders...');

    try {
      await this.userSeeder.seedUsers();
      await this.TestSeed.test_seed();
      this.logger.log('All seeders completed');
    } catch (error) {
      this.logger.error(
        'Seeder execution failed',
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}
