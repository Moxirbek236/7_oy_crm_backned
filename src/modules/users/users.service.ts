import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { PrismaService } from "src/core/database/prisma.service";
import { Status, UserRole } from "@prisma/client";
import * as bcrypt from "bcrypt";
import { EmailService } from "src/common/email/email.service";
import { FindAllUsersDto } from "./dto/query.dto";

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}
  async create(payload: CreateUserDto) {
    const admin = await this.prisma.user.findFirst({
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

    if (admin) {
      throw new ConflictException("User already exists");
    }

    const hashPass = await bcrypt.hash(payload.password, 10);

    await this.prisma.user.create({
      data: {
        ...payload,
        role: UserRole.ADMIN,
        password: hashPass,
      },
    });

    await this.emailService.sendEmail(
      payload.email,
      payload.phone,
      payload.password,
    );

    return {
      success: true,
      message: "User created successfully",
    };
  }

  async findAll(query: FindAllUsersDto) {
    const where: any = {};

    if (query.status) {
      where.status = query.status;
    }

    // Search across fields
    if (query.search) {
      where.OR = [
        { full_name: { contains: query.search, mode: "insensitive" } },
        { email: { contains: query.search, mode: "insensitive" } },
        { phone: { contains: query.search, mode: "insensitive" } },
        { role: { contains: query.search, mode: "insensitive" } },
      ];
    } else {
      if (query.first_name) {
        where.full_name = { contains: query.first_name, mode: "insensitive" };
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
    const total = await this.prisma.user.count({ where });

    const users = await this.prisma.user.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      select: {
        id: true,
        full_name: true,
        email: true,
        phone: true,
        address: true,
        role: true,
        status: true,
        created_at: true,
        updated_at: true,
      },
    });

    const totalPages = Math.ceil(total / limit);

    return {
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        full_name: true,
        email: true,
        phone: true,
        address: true,
      },
    });
    if (!user) {
      throw new NotFoundException("User not found");
    }
    return {
      success: true,
      data: user,
    };
  }

  async update(id: number, payload: UpdateUserDto) {
    const data: any = {
      ...payload,
      role: UserRole.ADMIN,
    };
    if (payload.password) {
      data.password = await bcrypt.hash(payload.password, 10);
    }
    await this.prisma.user.update({
      where: { id },
      data,
    });
    return {
      success: true,
      message: "User updated successfully",
    };
  }

  async delete(id: number) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException("User not found");
    }
    await this.prisma.user.update({
      where: { id },
      data: {
        status: Status.inactive,
      },
    });
    return {
      success: true,
      message: "User deleted successfully",
    };
  }
}