import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './core/database/prisma.module';
import { PrismaService } from './core/database/prisma.service';
import { UsersModule } from './modules/users/users.module';
import { StudentsModule } from './modules/students/students.module';
import { TeachersModule } from './modules/teachers/teachers.module';
import { CoursesModule } from './modules/courses/courses.module';
import { GroupsModule } from './modules/groups/groups.module';
import { RoomsModule } from './modules/rooms/rooms.module';
import { AuthModule } from './modules/auth/auth.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from "path"
import { LessonsModule } from './modules/lessons/lessons.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { HomeworkModule } from './modules/homework/homework.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { SeedModule } from './common/seeder/seed.module';
import { OwnershipGuard } from './common/guards/ownership.guard';
import { HealthModule } from './common/health/health.module';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), "src", "uploads"),
      serveRoot: "/files"
    }),
    ConfigModule.forRoot({
      isGlobal: true
    }),
    AuthModule,
    PrismaModule,
    UsersModule,
    StudentsModule,
    TeachersModule,
    CoursesModule,
    GroupsModule,
    RoomsModule,
    LessonsModule,
    AttendanceModule,
    HomeworkModule,
    DashboardModule,
    SeedModule,
    HealthModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: OwnershipGuard,
    },
    PrismaService,
  ],
  exports: [PrismaService],
})
export class AppModule { }
