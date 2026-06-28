import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../core/database/prisma.service";
import { Status, StudentStatus, GroupStatus } from "@prisma/client";

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats() {
    const groups = await this.prisma.groups.count({ where: { status: GroupStatus.active } });
    const courses = await this.prisma.courses.count({ where: { status: Status.active } });
    const students = await this.prisma.students.count({ where: { status: StudentStatus.active } });
    const teachers = await this.prisma.teachers.count({ where: { status: Status.active } });
    const rooms = await this.prisma.rooms.count({ where: { status: Status.active } });

    // 1. Dars davomati (Attendance rate)
    const totalAttendance = await this.prisma.attendance.count();
    const presentAttendance = await this.prisma.attendance.count({ where: { isPresent: true } });
    const attendanceRate =
      totalAttendance > 0
        ? Math.round((presentAttendance / totalAttendance) * 100)
        : 0;

    // 2. Vazifalar bajarilishi (Homework completion rate)
    const totalHomeworkAnswers = await this.prisma.homeWorkAnswer.count();
    const acceptedHomeworkAnswers = await this.prisma.homeWorkAnswer.count({
      where: { homeworkStatus: "ACCEPTED" },
    });
    const homeworkCompletionRate =
      totalHomeworkAnswers > 0
        ? Math.round((acceptedHomeworkAnswers / totalHomeworkAnswers) * 100)
        : 0;

    // 3. Kurs to'liqlanishi (Course occupancy rate)
    const activeGroupsList = await this.prisma.groups.findMany({
      where: { status: GroupStatus.active },
      include: {
        _count: {
          select: { studentGroups: true },
        },
      },
    });
    let totalMaxStudents = 0;
    let totalEnrolled = 0;
    activeGroupsList.forEach((g) => {
      totalMaxStudents += g.max_students;
      totalEnrolled += g._count.studentGroups;
    });
    const courseOccupancyRate =
      totalMaxStudents > 0
        ? Math.round((totalEnrolled / totalMaxStudents) * 100)
        : 0;

    // 4. Faol o'quvchilar ulushi (Active students rate)
    const totalStudentsCount = await this.prisma.students.count();
    const activeStudentsCount = await this.prisma.students.count({ where: { status: StudentStatus.active } });
    const activeStudentsRate =
      totalStudentsCount > 0
        ? Math.round((activeStudentsCount / totalStudentsCount) * 100)
        : 0;

    // 5. So'nggi faoliyat (Recent activity)
    const latestStudents = await this.prisma.students.findMany({
      take: 3,
      orderBy: { created_at: "desc" },
      select: { full_name: true, created_at: true },
    });
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const currentWeekDay = days[new Date().getDay()];

    const allActiveGroups = await this.prisma.groups.findMany({
      where: { status: GroupStatus.active },
    });
    const groupsToday = allActiveGroups.filter(g => g.week_day.includes(currentWeekDay));

    const todaysAttendances = await this.prisma.attendance.findMany({
      where: {
        created_at: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      select: { group_id: true },
    });
    
    const attendedGroupIds = new Set(todaysAttendances.map(a => a.group_id));
    const missingAttendanceGroups = groupsToday.filter(g => !attendedGroupIds.has(g.id));

    const latestHomeworks = await this.prisma.homeWorkAnswer.findMany({
      take: 3,
      orderBy: { created_at: "desc" },
      select: {
        title: true,
        created_at: true,
        students: { select: { full_name: true } },
      },
    });
    const latestGroups = await this.prisma.groups.findMany({
      take: 3,
      orderBy: { created_at: "desc" },
      select: { name: true, created_at: true },
    });

    const activities: { dot: string; text: string; date: Date }[] = [];

    latestStudents.forEach((s) => {
      activities.push({
        dot: "#10b981",
        text: `Yangi o'quvchi ro'yxatga qo'shildi: ${s.full_name}`,
        date: s.created_at,
      });
    });

    missingAttendanceGroups.forEach((g) => {
      activities.push({
        dot: "#ef4444",
        text: `"${g.name}" guruhi uchun bugungi davomat olinmagan`,
        date: new Date(),
      });
    });

    latestHomeworks.forEach((hw) => {
      activities.push({
        dot: "#f59e0b",
        text: `${hw.students?.full_name || "O'quvchi"} uyga vazifa topshirdi: ${hw.title}`,
        date: hw.created_at,
      });
    });

    latestGroups.forEach((g) => {
      activities.push({
        dot: "#0ea5e9",
        text: `Yangi guruh yaratildi: ${g.name}`,
        date: g.created_at,
      });
    });

    activities.sort((a, b) => b.date.getTime() - a.date.getTime());
    const recentActivity = activities.slice(0, 5);

    return {
      success: true,
      data: {
        groups,
        courses,
        students,
        teachers,
        rooms,
        attendanceRate,
        homeworkCompletionRate,
        courseOccupancyRate,
        activeStudentsRate,
        recentActivity,
      },
    };
  }
}
