import { Controller, Get, Post, Put, Delete, Body, Param, Req, UseGuards, ParseIntPipe, ForbiddenException, NotFoundException } from "@nestjs/common";
import { BranchesService } from "./branches.service";
import { TokenGuard } from "src/common/guards/token.guards";
import { RolesGuard } from "src/common/guards/role.guards";
import { Roles } from "src/common/decorators/roles";
import { UserRole, Status } from "@prisma/client";
import { PrismaService } from "src/core/database/prisma.service";
import { ApiBearerAuth, ApiTags, ApiOperation } from "@nestjs/swagger";

@ApiTags("Branches & Centers")
@Controller("branches")
@UseGuards(TokenGuard, RolesGuard)
@ApiBearerAuth()
export class BranchesController {
  constructor(
    private readonly branchesService: BranchesService,
    private readonly prisma: PrismaService
  ) {}

  // ==========================================
  // --- CENTERS ENDPOINTS (CREATOR ONLY) -----
  // ==========================================
  @ApiOperation({ summary: "Creator - Create center" })
  @Roles(UserRole.CREATOR)
  @Post("centers")
  createCenter(@Body() body: { name: string; address?: string }) {
    return this.branchesService.createCenter(body);
  }

  @ApiOperation({ summary: "Creator - Get all centers" })
  @Roles(UserRole.CREATOR)
  @Get("centers")
  findAllCenters() {
    return this.branchesService.findAllCenters();
  }

  @ApiOperation({ summary: "Creator - Update center" })
  @Roles(UserRole.CREATOR)
  @Put("centers/:id")
  updateCenter(
    @Param("id", ParseIntPipe) id: number,
    @Body() body: { name?: string; address?: string; status?: Status }
  ) {
    return this.branchesService.updateCenter(id, body);
  }

  @ApiOperation({ summary: "Creator - Delete center" })
  @Roles(UserRole.CREATOR)
  @Delete("centers/:id")
  deleteCenter(@Param("id", ParseIntPipe) id: number) {
    return this.branchesService.deleteCenter(id);
  }

  // ==========================================
  // --- BRANCHES ENDPOINTS -------------------
  // ==========================================

  @ApiOperation({ summary: "All - List all branches" })
  @Roles(UserRole.CREATOR, UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT)
  @Get()
  findAll() {
    return this.branchesService.findAll();
  }

  @ApiOperation({ summary: "Superadmin - List branches of my center" })
  @Roles(UserRole.SUPERADMIN)
  @Get("my-center")
  async findMyCenterBranches(@Req() req: any) {
    const userId = req.user?.sub ?? req.user?.id;
    const centerId = await this.branchesService.getSuperadminCenterId(userId);
    return this.branchesService.findBranchesByCenter(centerId);
  }

  @ApiOperation({ summary: "Creator / Superadmin - Create branch" })
  @Roles(UserRole.CREATOR, UserRole.SUPERADMIN)
  @Post()
  async createBranch(@Req() req: any, @Body() body: { center_id?: number; name: string; address?: string }) {
    const role = req.user?.role;
    const userId = req.user?.sub ?? req.user?.id;

    if (role === UserRole.SUPERADMIN) {
      const centerId = await this.branchesService.getSuperadminCenterId(userId);
      body.center_id = centerId; // enforce own center
    } else {
      if (!body.center_id) {
        throw new ForbiddenException("Creator center_id kiritishi shart!");
      }
    }

    return this.branchesService.createBranch({
      center_id: body.center_id,
      name: body.name,
      address: body.address,
    });
  }

  @ApiOperation({ summary: "Creator / Superadmin - Update branch" })
  @Roles(UserRole.CREATOR, UserRole.SUPERADMIN)
  @Put(":id")
  async updateBranch(
    @Req() req: any,
    @Param("id", ParseIntPipe) id: number,
    @Body() body: { name?: string; address?: string; status?: Status }
  ) {
    const role = req.user?.role;
    const userId = req.user?.sub ?? req.user?.id;

    if (role === UserRole.SUPERADMIN) {
      const centerId = await this.branchesService.getSuperadminCenterId(userId);
      const branch = await this.prisma.branch.findFirst({
        where: { id, center_id: centerId },
      });
      if (!branch) {
        throw new ForbiddenException("Siz faqat o'zingizga tegishli filialni tahrirlashingiz mumkin!");
      }
    }

    return this.branchesService.updateBranch(id, body);
  }

  @ApiOperation({ summary: "Creator / Superadmin - Delete branch" })
  @Roles(UserRole.CREATOR, UserRole.SUPERADMIN)
  @Delete(":id")
  async deleteBranch(@Req() req: any, @Param("id", ParseIntPipe) id: number) {
    const role = req.user?.role;
    const userId = req.user?.sub ?? req.user?.id;

    if (role === UserRole.SUPERADMIN) {
      const centerId = await this.branchesService.getSuperadminCenterId(userId);
      const branch = await this.prisma.branch.findFirst({
        where: { id, center_id: centerId },
      });
      if (!branch) {
        throw new ForbiddenException("Siz faqat o'zingizga tegishli filialni o'chirishingiz mumkin!");
      }
    }

    return this.branchesService.deleteBranch(id);
  }
}
