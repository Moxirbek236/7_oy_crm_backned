import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { CreateTeacherDto } from "./dto/create-teacher.dto";
import { UpdateTeacherDto } from "./dto/update-teacher.dto";
import { PrismaService } from "src/core/database/prisma.service";
import * as bcrypt from "bcrypt";
import { join } from "path";
import fs from "fs";
import { Prisma, Status } from "@prisma/client";
import { uploadToSupabase } from "src/core/utils/supabase-upload";
import { createClient } from "@supabase/supabase-js";
import { NotificationService } from "src/common/notifications/notification.service";
import { FindAllTeachersDto } from "./dto/query.dto";
@Injectable()
export class TeachersService {
  constructor(
    private prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}
  async create(payload: CreateTeacherDto, filename: string) {
    const [existUser, existTeacher, existStudent] = await Promise.all([
      this.prisma.user.findFirst({
        where: { OR: [{ email: payload.email }, { phone: payload.phone }] },
      }),
      this.prisma.teachers.findFirst({
        where: { OR: [{ email: payload.email }, { phone: payload.phone }] },
      }),
      this.prisma.students.findFirst({
        where: { OR: [{ email: payload.email }, { phone: payload.phone }] },
      }),
    ]);

    if (existUser || existTeacher || existStudent) {
      if (filename) {
        const filePath = join(process.cwd(), "src", "uploads", filename);
        try { fs.unlinkSync(filePath); } catch {}
      }
      throw new ConflictException("Email or phone already exists in the system");
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

      if (groups.length !== payload.groups.length) {
        throw new NotFoundException("Guruhlardan biri topilmadi");
      }
    }
    if (filename) {
      await uploadToSupabase(filename);
    }

    const passHash = await bcrypt.hash(payload.password, 10);

    try {
      await this.prisma.teachers.create({
        data: {
          full_name: payload.full_name,
          email: payload.email,
          phone: payload.phone,
          address: payload.address,
          password: passHash,
          photo: filename ?? null,
          teachersGroups: groupIds.length
            ? {
                create: groupIds.map((groupId) => ({
                  group_id: groupId,
                })),
              }
            : undefined,
        },
      });
    } catch (error) {
      if (error.code === "P2002") {
        throw new ConflictException("Email or phone already exists in the system");
      }
      throw error;
    }
    await this.notificationService.sendWelcomeCredentials(
      payload.phone,
      payload.email,
      payload.password,
    );

    return {
      success: true,
      message: "Teacher created successfully",
    };
  }

  async findAll(query: FindAllTeachersDto) {
    const where: any = {};

    if (query.status) {
      where.status = query.status;
    } else {
      where.status = Status.active;
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
    const total = await this.prisma.teachers.count({ where });

    const teachers = await this.prisma.teachers.findMany({
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
        status: true,
        created_at: true,
        teachersGroups: {
          select: {
            group: {
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
      data: teachers.map(teacher => {
        const { teachersGroups, ...rest } = teacher;
        return {
          ...rest,
          groups: teachersGroups.map((tg) => tg.group)
        };
      }),
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  async findOne(id: number) {
    const teacher = await this.prisma.teachers.findUnique({
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
        created_at: true,
        teachersGroups: {
          select: {
            group: {
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
      throw new NotFoundException("Teacher not found");
    }
    return {
      success: true,
      data: teacher,
    };
  }

  async findGroupStudents(req) {
    const userId = req.user?.sub ?? req.user?.id;
    const role = req.user?.role;

    if (role == "SUPERADMIN" || role == "ADMIN") {
      throw new NotFoundException("This is for teachers only");
    }

    const groups = await this.prisma.groups.findMany({
      where: {
        teachersGroups: {
          some: {
            teacher_id: userId,
          },
        },
      },
      select: {
        id: true,
        name: true,
        max_students: true,
        start_date: true,
        start_time: true,
        week_day: true,
        studentGroups: {
          select: {
            students: {
              select: {
                id: true,
                full_name: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    return groups.map((el) => ({
      id: el.id,
      name: el.name,
      max_students: el.max_students,
      start_date: el.start_date,
      start_time: el.start_time,
      week_day: el.week_day,
      studentCount: el.studentGroups.length,
      students: el.studentGroups.map((el) => el.students),
    }));
  }

  async getMyGroups(req) {
    const userId = req.user?.sub ?? req.user?.id;

    const groups = await this.prisma.groups.findMany({
      where: {
        teachersGroups: {
          some: {
            teacher_id: userId,
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
      })),
    };
  }

  async updateProfile(req, payload: { full_name?: string; address?: string }) {
    const userId = req.user?.sub ?? req.user?.id;
    if (!userId) {
      throw new BadRequestException("User ID not found in token");
    }

    const role = req.user?.role;
    if (role === "SUPERADMIN" || role === "ADMIN") {
      const data: any = {};
      if (payload.full_name) data.full_name = payload.full_name;
      if (payload.address !== undefined) data.address = payload.address;

      await this.prisma.user.update({
        where: { id: userId },
        data,
      });

      return {
        success: true,
        message: "Profile updated successfully",
      };
    }

    const teacher = await this.prisma.teachers.findUnique({
      where: { id: userId },
    });

    if (!teacher) {
      throw new NotFoundException("Teacher not found");
    }

    const data: any = {};
    if (payload.full_name) data.full_name = payload.full_name;
    if (payload.address !== undefined) data.address = payload.address;

    await this.prisma.teachers.update({
      where: { id: userId },
      data,
    });

    return {
      success: true,
      message: "Profile updated successfully",
    };
  }

  async getProfile(req) {
    const userId = req.user?.sub ?? req.user?.id;
    if (!userId) {
      throw new BadRequestException("User ID not found in token");
    }

    const role = req.user?.role;
    if (role === "SUPERADMIN" || role === "ADMIN") {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });
      if (!user) throw new NotFoundException("User not found");
      return {
        success: true,
        data: {
          ...user,
          groups: [],
        },
      };
    }

    const teacher = await this.prisma.teachers.findUnique({
      where: { id: userId },
      select: {
        id: true,
        full_name: true,
        email: true,
        phone: true,
        photo: true,
        address: true,
        status: true,
        created_at: true,
        teachersGroups: {
          select: {
            group: {
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
      throw new NotFoundException("Teacher not found");
    }

    return {
      success: true,
      data: {
        ...teacher,
        groups: teacher.teachersGroups.map((tg) => tg.group.name),
        teachersGroups: undefined,
      },
    };
  }

  async update(id: number, payload: UpdateTeacherDto, filename?: string) {
    const teacher = await this.prisma.teachers.findUnique({ where: { id } });

    if (!teacher) {
      throw new NotFoundException("Teacher not found");
    }
    let photo = teacher.photo;

    if (filename) {
      if (teacher.photo) {
        const filePath = join(process.cwd(), "src", "uploads", teacher.photo);
        try {
          fs.unlinkSync(filePath);
        } catch {}

        const url = process.env.SUPABASE_URL;
        const key = process.env.SUPABASE_KEY;
        if (url && key) {
          try {
            const supabase = createClient(url, key);
            await supabase.storage.from("NajotEdu").remove([teacher.photo]);
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

    const { groups: _, password: __, ...teacherData } = payload;

    await this.prisma.teachers.update({
      where: { id },
      data: {
        ...teacherData,
        photo,
        password: passHash,
        teachersGroups: groupIds.length
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
      message: "Teacher updated successfully",
    };
  }

  async remove(id: number) {
    const teacher = await this.prisma.teachers.findUnique({ where: { id } });
    if (!teacher) {
      throw new NotFoundException("Teacher not found");
    }
    if (teacher.photo) {
      const filePath = join(process.cwd(), "src", "uploads", teacher.photo);
      if (fs.existsSync(filePath)) {
        await fs.unlinkSync(filePath);
      }
    }

    await this.prisma.teachers.update({
      where: { id },
      data: {
        status: Status.inactive,
      },
    });
    return {
      success: true,
      message: "Teacher deleted successfully",
    };
  }
}