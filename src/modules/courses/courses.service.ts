import {
  BadRequestException,
  ConflictException,
  Injectable,
} from "@nestjs/common";
import { CreateCourseDto } from "./dto/create-course.dto";
import { UpdateCourseDto } from "./dto/update-course.dto";
import { PrismaService } from "src/core/database/prisma.service";
import { Status, WeekDay } from "@prisma/client";
import { FindAllCoursesDto } from "./dto/query.dto";

@Injectable()
export class CoursesService {
  constructor(private prisma: PrismaService) {}
  async create(payload: CreateCourseDto) {
    const course = await this.prisma.courses.findFirst({
      where: {
        name: payload.name,
      },
    });

    if (course) {
      throw new ConflictException("Course already exists");
    }

    const { branchIds, ...restPayload } = payload;
    const res = await this.prisma.courses.create({
      data: {
        ...restPayload,
        branches: branchIds?.length
          ? { connect: branchIds.map(id => ({ id })) }
          : undefined,
      },
    });

    return {
      success: true,
      message: "Course created successfully",
    };
  }

  async findAll(query: FindAllCoursesDto) {
    const where: any = {};

    if (query.status) {
      where.status = query.status;
    } else {
      where.status = Status.active;
    }

    if (query.name) {
      where.name = query.name;
    }

    if (query.description) {
      where.description = query.description;
    }

    if (query.price) {
      where.price = query.price;
    }

    if (query.duration_month) {
      where.duration_month = query.duration_month;
    }

    if (query.duration_hours) {
      where.duration_hours = query.duration_hours;
    }
    
    if (query.search) {
      where.name = { contains: query.search, mode: "insensitive" };
    }

    const page = query.page ? Number(query.page) : 1;
    const limit = query.limit ? Number(query.limit) : 10;
    const skip = (page - 1) * limit;

    const [courses, totalCount] = await Promise.all([
      this.prisma.courses.findMany({
        where,
        skip,
        take: limit,
        orderBy: { id: "asc" },
        include: { branches: { select: { id: true, name: true } } },
      }),
      this.prisma.courses.count({ where }),
    ]);

    return {
      success: true,
      data: courses,
      pagination: {
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
        limit,
      },
    };
  }

  async findOne(id: number) {
    const course = await this.prisma.courses.findUnique({
      where: { id },
      include: { branches: { select: { id: true, name: true } } },
    });

    if (!course) {
      throw new BadRequestException("Course not fount");
    }

    return {
      success: true,
      data: course,
    };
  }
  async update(id: number, payload: UpdateCourseDto) {
    const course = await this.prisma.courses.findUnique({ where: { id } });

    if (!course) {
      throw new BadRequestException("Course not fount");
    }

    const { branchIds, ...restPayload } = payload;
    await this.prisma.courses.update({
      where: { id },
      data: {
        ...restPayload,
        branches: branchIds
          ? { set: branchIds.map(id => ({ id })) }
          : undefined,
      },
    });

    return {
      success: true,
      message: "Course update success",
    };
  }

  async remove(id: number) {
    const course = await this.prisma.courses.findUnique({ where: { id } });

    if (!course) {
      throw new BadRequestException("Course not fount");
    }

    await this.prisma.courses.update({
      where: { id },
      data: {
        status: Status.inactive,
      },
    });

    return {
      success: true,
      message: "Course delete success",
    };
  }
}
