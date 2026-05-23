import { Module } from '@nestjs/common';
import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';
import { StudentGroupController } from './student-group/student-group.controller';
import { StudentGroupService } from './student-group/student-group.service';

@Module({
  controllers: [GroupsController, StudentGroupController],
  providers: [GroupsService, StudentGroupService]
})
export class GroupsModule {}
