import { Module } from '@nestjs/common';
import { StudentsController } from './students.controller';
import { StudentsService } from './students.service';
import { EmailModule } from 'src/common/email/email.module';

@Module({
  imports:[EmailModule],
  controllers: [StudentsController],
  providers: [StudentsService]
})
export class StudentsModule {}
