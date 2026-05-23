import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateAdminDto } from './dto/create.admin.dto';
import { AuthGuard } from 'src/common/guards/jwt-auth.guard';
import { Roles } from 'src/common/decorators/role';
import { Role } from '@prisma/client';
import { RolesGuard } from 'src/common/guards/role.guard';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiBearerAuth()
@Controller('users')
export class UsersController {
    constructor(private readonly userService: UsersService) { }

    @ApiOperation({
        summary: `${Role.SUPERADMIN}`
    })
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.SUPERADMIN)
    @Get('admin/all')
    getAllAdmins() {
        return this.userService.getAllAdmins()
    }

    @ApiOperation({
        summary: `${Role.SUPERADMIN}`
    })
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.SUPERADMIN)
    @Get('admin/:id')
    getAdminById(@Param('id', ParseIntPipe) id: number) {
        return this.userService.getAdminById(id)
    }

    @ApiOperation({
        summary: `${Role.SUPERADMIN}`
    })
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.SUPERADMIN)
    @Put('admin/:id')
    updateAdmin(
        @Param('id', ParseIntPipe) id: number,
        @Body() payload: CreateAdminDto
    ) {
        return this.userService.updateAdmin(id, payload)
    }

    @ApiOperation({
        summary: `${Role.SUPERADMIN}`
    })
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.SUPERADMIN)
    @Delete('admin/:id')
    deleteAdmin(@Param('id', ParseIntPipe) id: number) {
        return this.userService.deleteAdmin(id)
    }

    @ApiOperation({
        summary: `${Role.SUPERADMIN}, ${Role.ADMIN}`
    })
    @UseGuards(AuthGuard)
    @Roles(Role.ADMIN, Role.SUPERADMIN)
    @Post("admin")
    createAdmin(@Body() payload: CreateAdminDto) {
        return this.userService.createAdmin(payload)
    }
}
