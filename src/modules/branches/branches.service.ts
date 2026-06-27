import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/core/database/prisma.service";

@Injectable()
export class BranchesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const branches = await this.prisma.branch.findMany({
      orderBy: { id: "asc" },
      select: { id: true, name: true, center_id: true }
    });
    return {
      success: true,
      data: branches,
    };
  }
}
