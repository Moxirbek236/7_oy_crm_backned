import { Controller, Get, UseGuards } from "@nestjs/common";
import { BranchesService } from "./branches.service";
import { TokenGuard } from "src/common/guards/token.guards";
import { ApiBearerAuth, ApiTags, ApiOperation } from "@nestjs/swagger";

@ApiTags("Centers")
@Controller("centers")
@UseGuards(TokenGuard)
@ApiBearerAuth()
export class CentersController {
  constructor(private readonly branchesService: BranchesService) {}

  @ApiOperation({ summary: "List all centers" })
  @Get()
  findAll() {
    return this.branchesService.findAllCenters();
  }
}
