import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { CreateStudentDto } from "./dto/create-student.dto";
import { UpdateStudentDto } from "./dto/update-student.dto";
import { PrismaService } from "src/core/database/prisma.service";
import * as bcrypt from "bcrypt";
import { join } from "path";
import fs from "fs";
import { EmailService } from "src/common/email/email.service";
import { StudentStatus } from "@prisma/client";
import { uploadToSupabase } from "src/core/utils/supabase-upload";
import { createClient } from "@supabase/supabase-js";
@Injectable()
export class StudentsService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}
  async create(payload: CreateStudentDto, filename: string) {
    const existStudent = await this.prisma.students.findFirst({
      where: {
        OR: [
          {
            email: payload.email,
          },
          {
            phone: payload.phone,
          },
        ],
      },
    });

    if (existStudent) {
      if (filename) {
        const filePath = join(process.cwd(), "src", "uploads", filename);
        await fs.unlinkSync(filePath);
      }
      throw new ConflictException("Student already exists");
    }

    if (payload.groups?.length) {
      const groups = await this.prisma.groups.findMany({
        where: {
          id: {
            in: payload.groups,
          },
        },
        select: {
          id: true,
        },
      });

      if (groups.length !== payload.groups.length) {
        throw new NotFoundException("Guruhlardan biri topilmadi");
      }
    }

    if (filename) {
      await uploadToSupabase(filename);
    }

    const passHash = await bcrypt.hash(payload.password, 10);

    await this.prisma.students.create({
      data: {
        full_name: payload.full_name,
        email: payload.email,
        phone: payload.phone,
        address: payload.address,
        password: passHash,
        photo: filename ?? null,
        birth_date: new Date(payload.birth_date),
        studentGroups: payload.groups?.length
          ? {
              create: payload.groups?.map((groupId) => ({
                group_id: groupId,
              })),
            }
          : undefined,
      },
    });

    this.emailService.sendEmail(payload.email, payload.phone, payload.password);

    return {
      success: true,
      message: "Student created successfully",
    };
  }

  async findAll(query) {
    const where: any = {};

    if (query.status) {
      where.status = query.status;
    } else {
      where.status = StudentStatus.active;
    }

    // Search across multiple fields
    if (query.search) {
      where.OR = [
        { full_name: { contains: query.search, mode: "insensitive" } },
        { email: { contains: query.search, mode: "insensitive" } },
        { phone: { contains: query.search, mode: "insensitive" } },
      ];
    } else {
      if (query.full_name) {
        where.full_name = { contains: query.full_name, mode: "insensitive" };
      }
      if (query.email) {
        where.email = { contains: query.email, mode: "insensitive" };
      }
      if (query.phone) {
        where.phone = { contains: query.phone, mode: "insensitive" };
      }
    }

    if (query.address) {
      where.address = { contains: query.address, mode: "insensitive" };
    }

    if (query.birth_date) {
      where.birth_date = query.birth_date;
    }

    // Pagination
    const page = query.page || 1;
    const limit = query.limit || 1000;
    const skip = (page - 1) * limit;

    // Sorting
    const orderBy: any = {};
    const sortField = query.sort_by || 'id';
    const sortOrder = query.sort_order || 'asc';
    orderBy[sortField] = sortOrder;

    // Total count
    const total = await this.prisma.students.count({ where });

    const students = await this.prisma.students.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      select: {
        id: true,
        full_name: true,
        email: true,
        phone: true,
        photo: true,
        address: true,
        birth_date: true,
        status: true,
        created_at: true,
        studentGroups: {
          select: {
            groups: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    const totalPages = Math.ceil(total / limit);

    return {
      success: true,
      data: students,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  async findOne(id: number) {
    const teacher = await this.prisma.students.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        full_name: true,
        email: true,
        phone: true,
        photo: true,
        address: true,
        status: true,
        studentGroups: {
          select: {
            groups: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });
    if (!teacher) {
      throw new NotFoundException("Student not found");
    }
    return {
      success: true,
      data: teacher,
    };
  }

  async update(id: number, payload: UpdateStudentDto, filename?: string) {
    const student = await this.prisma.students.findUnique({ where: { id } });

    if (!student) {
      throw new NotFoundException("Student not found");
    }
    let photo = student.photo;

    if (filename) {
      if (student.photo) {
        const filePath = join(process.cwd(), "src", "uploads", student.photo);
        try {
          fs.unlinkSync(filePath);
        } catch {}

        const url = process.env.SUPABASE_URL;
        const key = process.env.SUPABASE_KEY;
        if (url && key) {
          try {
            const supabase = createClient(url, key);
            await supabase.storage.from("NajotEdu").remove([student.photo]);
          } catch {}
        }
      }
      await uploadToSupabase(filename);
      photo = filename;
    }
    let groupIds: number[] = [];
    if (payload.groups) {
      groupIds = (
        Array.isArray(payload.groups) ? payload.groups : [payload.groups]
      )
        .map(Number)
        .filter(Boolean);
    }

    if (groupIds.length) {
      const groups = await this.prisma.groups.findMany({
        where: {
          id: {
            in: groupIds,
          },
        },
        select: {
          id: true,
        },
      });

      if (groups.length !== groupIds.length) {
        throw new NotFoundException("Guruhlardan biri topilmadi");
      }
    }
    let passHash;
    if (payload.password) {
      passHash = await bcrypt.hash(payload.password, 10);
    }
    let birth_date;
    if (payload.birth_date) {
      birth_date = new Date(payload.birth_date);
    }

    const {
      groups: _,
      password: __,
      birth_date: ___,
      ...studentData
    } = payload;

    await this.prisma.students.update({
      where: { id },
      data: {
        ...studentData,
        photo,
        password: passHash,
        birth_date,
        studentGroups: groupIds.length
          ? {
              deleteMany: {},
              create: groupIds.map((groupId) => ({
                group_id: groupId,
              })),
            }
          : undefined,
      },
    });
    return {
      success: true,
      message: "Student updated successfully",
    };
  }

  async remove(id: number) {
    const student = await this.prisma.students.findUnique({ where: { id } });
    if (!student) {
      throw new NotFoundException("Student not found");
    }
    if (student.photo) {
      const filePath = join(process.cwd(), "src", "uploads", student.photo);
      if (fs.existsSync(filePath)) {
        await fs.unlinkSync(filePath);
      }
    }

    await this.prisma.students.update({
      where: { id },
      data: {
        status: StudentStatus.inactive,
      },
    });

    return {
      success: true,
      message: "Student deleted successfully",
    };
  }

  // ─── STUDENT-SPECIFIC ENDPOINTS ──────────────────────────────────────────────

  async getGroupLessons(req, groupId: number) {
    const studentId = req.user?.sub ?? req.user?.id;

    // Verify student belongs to this group
    const studentGroup = await this.prisma.studentGroup.findFirst({
      where: {
        student_id: studentId,
        group_id: groupId,
        status: "active",
      },
    });
    if (!studentGroup) {
      throw new NotFoundException("Group not found or not assigned to you");
    }

    const lessons = await this.prisma.lesson.findMany({
      where: { group_id: groupId },
      orderBy: { date: "desc" },
      select: {
        id: true,
        topic: true,
        date: true,
        type: true,
        _count: {
          select: { videos: true },
        },
        homeWorks: {
          where: {
            OR: [
              { teacher_id: { not: null } },
              { user_id: { not: null } },
            ],
          },
          select: {
            id: true,
            title: true,
            created_at: true,
            homeWorkAnswers: {
              where: { student_id: studentId },
              select: {
                id: true,
                homeworkStatus: true,
                homeWorkResults: { select: { grade: true } },
              },
            },
          },
        },
      },
    });

    const weekDayNames: Record<string, string> = {
      Monday: "Du", Tuesday: "Se", Wednesday: "Chor",
      Thursday: "Pay", Friday: "Ju", Saturday: "Shan", Sunday: "Yak",
    };
    const group = await this.prisma.groups.findUnique({
      where: { id: groupId },
      select: { name: true, start_time: true, week_day: true },
    });

    const fmtDate = (d: Date) => {
      if (!d) return '';
      const months = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyun', 'Iyul', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'];
      return `${String(d.getDate()).padStart(2, '0')} ${months[d.getMonth()]}, ${d.getFullYear()}`;
    };

    const fmtDateTimeStr = (d: Date) => {
      if (!d) return '';
      return `${fmtDate(d)} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    };

    const data = lessons.map((lesson) => {
      const hw = lesson.homeWorks?.[0];
      const answer = hw?.homeWorkAnswers?.[0];
      const status = answer ? answer.homeworkStatus : null;
      const grade = answer?.homeWorkResults?.[0]?.grade;

      let homeWorkStatus = 'Berilmagan';
      if (status === 'PENDING') homeWorkStatus = 'Kutayotganlar';
      else if (status === 'ACCEPTED') homeWorkStatus = 'Qabul qilingan';
      else if (status === 'RETURNED') homeWorkStatus = 'Qaytarilgan';
      else if (status === 'NOT_DONE') homeWorkStatus = 'Bajarilmagan';

      return {
        id: lesson.id,
        topic: lesson.topic || '',
        videoCount: lesson._count.videos,
        lessonType: lesson.type || null,
        homeWorkTitle: hw?.title || null,
        homeWorkStatus,
        homeWorkDeadline: hw?.created_at ? fmtDateTimeStr(hw.created_at) : null,
        dueDate: lesson.date ? fmtDate(lesson.date) : null,
        isExam: lesson.type === 'exam',
      };
    });

    // Get exams too
    const exams = await this.prisma.exam.findMany({
      where: { group_id: groupId },
      orderBy: { start_date: "desc" },
      select: {
        id: true,
        title: true,
        start_date: true,
        created_at: true,
        examAnswers: {
          where: { student_id: studentId },
          select: {
            id: true,
            examStatus: true,
            score: true,
          },
        },
      },
    });

    const examRows = exams.map((exam) => {
      const answer = exam.examAnswers?.[0];
      const status = answer ? answer.examStatus : null;
      let homeWorkStatus = 'Berilmagan';
      if (status === 'PENDING') homeWorkStatus = 'Kutayotganlar';
      else if (status === 'ACCEPTED') homeWorkStatus = 'Qabul qilingan';
      else if (status === 'RETURNED') homeWorkStatus = 'Qaytarilgan';
      else if (status === 'NOT_DONE') homeWorkStatus = 'Bajarilmagan';

      return {
        id: exam.id,
        topic: exam.title,
        videoCount: 0,
        lessonType: 'exam',
        homeWorkTitle: 'Imtihon',
        homeWorkStatus,
        homeWorkDeadline: exam.created_at ? fmtDateTimeStr(exam.created_at) : null,
        dueDate: exam.start_date ? fmtDate(exam.start_date) : fmtDate(exam.created_at),
        isExam: true,
      };
    });

    // Merge and sort by dueDate descending
    const allRows = [...data, ...examRows].sort((a, b) => {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
    });

    return {
      success: true,
      data: {
        group_name: group?.name || '',
        lessons: allRows,
      },
    };
  }

  async getGroupTeachers(req, groupId: number) {
    const studentId = req.user?.sub ?? req.user?.id;

    // Verify student belongs to this group
    const studentGroup = await this.prisma.studentGroup.findFirst({
      where: {
        student_id: studentId,
        group_id: groupId,
        status: "active",
      },
    });

    if (!studentGroup) {
      throw new NotFoundException("Group not found or not assigned to you");
    }

    const group = await this.prisma.groups.findUnique({
      where: { id: groupId },
      select: {
        name: true,
        week_day: true,
        start_time: true,
        course: {
          select: {
            duration_hours: true,
          },
        },
        teachersGroups: {
          where: {
            teacher: { status: "active" },
          },
          select: {
            teacher: {
              select: {
                id: true,
                full_name: true,
                photo: true,
              },
            },
          },
        },
      },
    });

    if (!group) {
      throw new NotFoundException("Group not found");
    }

    const weekDayNames: Record<string, string> = {
      Monday: "Du", Tuesday: "Se", Wednesday: "Chor",
      Thursday: "Pay", Friday: "Ju", Saturday: "Shan", Sunday: "Yak",
    };

    const daysStr = group.week_day.map(d => weekDayNames[d] || d).join(", ");
    const timeStr = group.start_time;
    const durationHours = group.course?.duration_hours || 1;
    const endTime = timeStr
      ? `${String(Number(timeStr.split(":")[0]) + durationHours).padStart(2, "0")}:${timeStr.split(":")[1]}`
      : "";

    return {
      success: true,
      data: {
        group_name: group.name,
        teachers: group.teachersGroups.map((tg) => ({
          ...tg.teacher,
          role: "Teacher",
          days: daysStr,
          time: timeStr && endTime ? `${timeStr} - ${endTime}` : "",
        })),
      },
    };
  }

  async getMyGroups(req) {
    const studentId = req.user?.sub ?? req.user?.id;

    const groups = await this.prisma.groups.findMany({
      where: {
        studentGroups: {
          some: {
            student_id: studentId,
            status: "active",
          },
        },
        status: { not: "cancelled" },
      },
      select: {
        id: true,
        name: true,
        start_date: true,
        end_date: true,
        week_day: true,
        start_time: true,
        max_students: true,
        status: true,
        course: {
          select: {
            id: true,
            name: true,
            duration_hours: true,
            duration_month: true,
          },
        },
        rooms: {
          select: {
            id: true,
            name: true,
          },
        },
        teachersGroups: {
          select: {
            teacher: {
              select: {
                id: true,
                full_name: true,
              },
            },
          },
        },
        _count: {
          select: {
            studentGroups: true,
          },
        },
      },
    });

    return {
      success: true,
      data: groups.map((g) => ({
        id: g.id,
        name: g.name,
        start_date: g.start_date,
        end_date: g.end_date,
        week_day: g.week_day,
        start_time: g.start_time,
        max_students: g.max_students,
        status: g.status,
        course: g.course?.name,
        course_duration: g.course?.duration_hours,
        rooms: g.rooms?.name,
        students: g._count.studentGroups,
        teachers: g.teachersGroups.map((tg) => tg.teacher),
        teachers_count: g.teachersGroups.length,
      })),
    };
  }

  async getProfile(req) {
    const studentId = req.user?.sub ?? req.user?.id;
    if (!studentId) {
      throw new BadRequestException("User ID not found in token");
    }

    const student = await this.prisma.students.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        full_name: true,
        email: true,
        phone: true,
        photo: true,
        address: true,
        birth_date: true,
        status: true,
        created_at: true,
        studentGroups: {
          select: {
            groups: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!student) {
      throw new NotFoundException("Student not found");
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { studentGroups, ...rest } = student;

    return {
      success: true,
      data: {
        ...rest,
        groups: studentGroups.map((sg) => sg.groups),
        studentGroups: undefined,
      },
    };
  }

  async updateProfile(req, payload: { full_name?: string; address?: string }) {
    const studentId = req.user?.sub ?? req.user?.id;
    if (!studentId) {
      throw new BadRequestException("User ID not found in token");
    }

    const student = await this.prisma.students.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      throw new NotFoundException("Student not found");
    }

    const data: any = {};
    if (payload.full_name) data.full_name = payload.full_name;
    if (payload.address !== undefined) data.address = payload.address;

    await this.prisma.students.update({
      where: { id: studentId },
      data,
    });

    return {
      success: true,
      message: "Profile updated successfully",
    };
  }
}
