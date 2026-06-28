import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "src/core/database/prisma.service";
import { Status } from "@prisma/client";

@Injectable()
export class BranchesService {
  constructor(private prisma: PrismaService) {}

  // Helpers
  async getSuperadminCenterId(userId: number): Promise<number> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { branches: true },
    });
    if (!user) throw new NotFoundException("Foydalanuvchi topilmadi");
    if (user.branches.length === 0) {
      throw new BadRequestException("Superadmin hech qaysi filialga biriktirilmagan");
    }
    return user.branches[0].center_id;
  }

  // --- CENTERS (Creator only) ---
  async createCenter(data: { name: string; address?: string }) {
    const center = await this.prisma.center.create({ data });
    return { success: true, message: "Markaz yaratildi", data: center };
  }

  async findAllCenters() {
    const centers = await this.prisma.center.findMany({
      orderBy: { id: "asc" },
      include: { branches: true },
    });
    return { success: true, data: centers };
  }

  async updateCenter(id: number, data: { name?: string; address?: string; status?: Status }) {
    const center = await this.prisma.center.findUnique({ where: { id } });
    if (!center) throw new NotFoundException("Markaz topilmadi");

    const updated = await this.prisma.center.update({
      where: { id },
      data,
    });
    return { success: true, message: "Markaz tahrirlandi", data: updated };
  }

  async deleteCenter(id: number) {
    const center = await this.prisma.center.findUnique({ where: { id } });
    if (!center) throw new NotFoundException("Markaz topilmadi");

    await this.prisma.center.update({
      where: { id },
      data: { status: Status.inactive },
    });
    return { success: true, message: "Markaz o'chirildi" };
  }

  // --- BRANCHES ---
  async createBranch(data: { center_id: number; name: string; address?: string }) {
    const branch = await this.prisma.branch.create({ data });
    return { success: true, message: "Filial yaratildi", data: branch };
  }

  async findAll() {
    const branches = await this.prisma.branch.findMany({
      orderBy: { id: "asc" },
      select: { 
        id: true, 
        name: true, 
        center_id: true, 
        address: true, 
        status: true,
        center: { select: { name: true } }
      }
    });
    return {
      success: true,
      data: branches,
    };
  }

  async findBranchesByCenter(centerId: number) {
    const branches = await this.prisma.branch.findMany({
      where: { center_id: centerId },
      orderBy: { id: "asc" },
      select: {
        id: true,
        name: true,
        center_id: true,
        address: true,
        status: true,
        center: { select: { name: true } }
      }
    });
    return { success: true, data: branches };
  }

  async updateBranch(id: number, data: { name?: string; address?: string; status?: Status }) {
    const branch = await this.prisma.branch.findUnique({ where: { id } });
    if (!branch) throw new NotFoundException("Filial topilmadi");

    const updated = await this.prisma.branch.update({
      where: { id },
      data,
    });
    return { success: true, message: "Filial tahrirlandi", data: updated };
  }

  async deleteBranch(id: number) {
    const branch = await this.prisma.branch.findUnique({ where: { id } });
    if (!branch) throw new NotFoundException("Filial topilmadi");

    await this.prisma.branch.update({
      where: { id },
      data: { status: Status.inactive },
    });
    return { success: true, message: "Filial o'chirildi" };
  }
}
