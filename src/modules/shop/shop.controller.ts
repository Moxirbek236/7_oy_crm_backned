import { Controller, Get, Post, Body, Param, UseGuards, Req, ParseIntPipe, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
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
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, uniqueSuffix + extname(file.originalname));
        },
      }),
    }),
  )
  createProduct(@Body() data: any, @UploadedFile() file?: Express.Multer.File) {
    if (file) {
      data.image = file.filename;
    }
    // Parse numeric fields from form-data string
    if (data.price) data.price = Number(data.price);
    if (data.stock) data.stock = Number(data.stock);
    
    return this.shopService.createProduct(data);
  }

  @ApiOperation({ summary: 'Admin - All purchases' })
  @Roles(UserRole.CREATOR, UserRole.ADMIN, UserRole.SUPERADMIN)
  @Get('purchases')
  getAllPurchases() {
    return this.shopService.getAllPurchases();
  }
}
