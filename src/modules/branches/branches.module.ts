import { Module } from "@nestjs/common";
import { BranchesService } from "./branches.service";
import { BranchesController } from "./branches.controller";
import { CentersController } from "./centers.controller";

@Module({
  controllers: [BranchesController, CentersController],
  providers: [BranchesService],
})
export class BranchesModule {}
