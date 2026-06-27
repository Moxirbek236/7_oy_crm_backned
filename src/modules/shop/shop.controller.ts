import { Controller, Get, Post, Body, Param, UseGuards, Req, ParseIntPipe } from '@nestjs/common';
import { ShopService } from './shop.service';
import { TokenGuard } from 'src/common/guards/token.guards';
import { RolesGuard } from 'src/common/guards/role.guards';
import { Roles } from 'src/common/decorators/roles';
import { UserRole } from '@prisma/client';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@Controller('products')
@UseGuards(TokenGuard, RolesGuard)
@ApiBearerAuth()
export class ShopController {
  constructor(private readonly shopService: ShopService) {}

  @ApiOperation({ summary: 'Barcha uchun - Get all active products' })
  @Roles(UserRole.CREATOR, UserRole.STUDENT, UserRole.ADMIN, UserRole.SUPERADMIN)
  @Get()
  getAllProducts() {
    return this.shopService.getAllProducts();
  }

  @ApiOperation({ summary: 'Student - Buy product' })
  @Roles(UserRole.STUDENT)
  @Post(':id/buy')
  buyProduct(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.shopService.buyProduct(req, id);
  }

  @ApiOperation({ summary: 'Student - My purchases' })
  @Roles(UserRole.STUDENT)
  @Get('my-purchases')
  getMyPurchases(@Req() req: any) {
    return this.shopService.getMyPurchases(req);
  }

  @ApiOperation({ summary: 'Admin - Create product' })
  @Roles(UserRole.CREATOR, UserRole.ADMIN, UserRole.SUPERADMIN)
  @Post()
  createProduct(@Body() data: any) {
    return this.shopService.createProduct(data);
  }

  @ApiOperation({ summary: 'Admin - All purchases' })
  @Roles(UserRole.CREATOR, UserRole.ADMIN, UserRole.SUPERADMIN)
  @Get('purchases')
  getAllPurchases() {
    return this.shopService.getAllPurchases();
  }
}
