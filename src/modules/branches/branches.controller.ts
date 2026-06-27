import { Controller, Get, UseGuards } from "@nestjs/common";
import { BranchesService } from "./branches.service";
import { TokenGuard } from "src/common/guards/token.guards";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";

@ApiTags("Branches")
@Controller("branches")
@UseGuards(TokenGuard)
@ApiBearerAuth()
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Get()
  findAll() {
    return this.branchesService.findAll();
  }
}
