import {
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
}