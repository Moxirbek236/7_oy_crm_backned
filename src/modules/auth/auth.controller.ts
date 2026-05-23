import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { AuthService } from './auth.service';
import { AuthGuard } from 'src/common/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post("login")
    userLogin(@Body() payload: LoginDto) {
        return this.authService.userLogin(payload)
    }

    @ApiBearerAuth()
    @ApiOperation({
        summary: "Get current user profile (works for all roles: STUDENT, TEACHER, ADMIN, SUPERADMIN)"
    })
    @UseGuards(AuthGuard)
    @Get("profile")
    getProfile(@Req() req: any) {
        return this.authService.getProfile(req['user'])
    }
}
 