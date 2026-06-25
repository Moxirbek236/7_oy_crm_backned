import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { UsersModule } from "./modules/users/users.module";
import { AuthModule } from "./modules/auth/auth.module";
import { StudentsModule } from "./modules/students/students.module";
import { TeachersModule } from "./modules/teachers/teachers.module";
import { GroupsModule } from "./modules/groups/groups.module";
import { RoomsModule } from "./modules/rooms/rooms.module";
import { CoursesModule } from "./modules/courses/courses.module";

import { PrismaModule } from "./core/database/prisma.module";
import { EmailModule } from "./common/email/email.module";
import { LesssonModule } from "./modules/lessson/lessson.module";
import { AttendancesModule } from "./modules/attendances/attendances.module";
import { HomeWorksModule } from "./modules/homeworks/home-works.module";
import { VideosModule } from "./modules/videos/videos.module";
import { ExamsModule } from "./modules/exams/exams.module";
import { DashboardModule } from "./modules/dashboard/dashboard.module";
import { SeedModule } from "./common/seeds/seed.module";
import { RedisModule } from "./core/redis/redis.module";
import { HealthModule } from "./modules/health/health.module";
import { MonitoringModule } from "./modules/monitoring/monitoring.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule,
    UsersModule,
    TeachersModule,
    StudentsModule,
    RoomsModule,
    CoursesModule,
    GroupsModule,
    PrismaModule,
    EmailModule,
    LesssonModule,
    AttendancesModule,
    HomeWorksModule,
    VideosModule,
    ExamsModule,
    DashboardModule,
    SeedModule,
    RedisModule,
    HealthModule,
    MonitoringModule,
  ],
})
export class AppModule {}
