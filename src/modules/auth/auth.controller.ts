import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  UseGuards,
  Res,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import {
  SendOtpDto,
  VerifyOtpDto,
  ResetPasswordDto,
  InitiateChangePasswordDto,
  ConfirmChangePasswordDto,
} from "./dto/otp.dto";
import { JwtPayload } from "./interfaces/auth.interface";
import { CreateAuthDto } from "./dto/create-auth.dto";
import { TokenGuard } from "src/common/guards/token.guards";
import { CurrentUser } from "src/common/decorators/currentUser.decorator";

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ── Public endpoints ───────────────────────────────────────────────────────

  @Post("login")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Login with phone + password" })
  async login(@Body() dto: CreateAuthDto, @Res({ passthrough: true }) res: any) {
    const result = await this.authService.login(dto);
    res.cookie("token", result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    });
    return { success: true, role: result.role };
  }

  @Post("logout")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Logout user and clear cookie" })
  async logout(@Res({ passthrough: true }) res: any) {
    res.cookie("token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
    });
    return { success: true, message: "Logged out successfully" };
  }

  @Post("send-otp")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Send OTP to phone (forgot password — step 1)" })
  sendOtp(@Body() dto: SendOtpDto) {
    return this.authService.sendOtp(dto);
  }

  @Post("verify-otp")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Verify phone OTP (forgot password — step 2)" })
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto);
  }

  @Post("reset-password")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Set new password after OTP verification (forgot password — step 3)" })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  // ── Authenticated endpoints ────────────────────────────────────────────────

  @Get("profile")
  @UseGuards(TokenGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get current user profile" })
  getProfile(@CurrentUser() user: JwtPayload) {
    return this.authService.getProfile(user);
  }

  @Post("change-password/initiate")
  @HttpCode(HttpStatus.OK)
  @UseGuards(TokenGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Initiate password change: verify old password, send OTP to email (step 1)",
  })
  initiateChangePassword(
    @CurrentUser() user: JwtPayload,
    @Body() dto: InitiateChangePasswordDto,
  ) {
    return this.authService.initiateChangePassword(user, dto);
  }

  @Patch("change-password/confirm")
  @HttpCode(HttpStatus.OK)
  @UseGuards(TokenGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Confirm password change with email OTP (step 2)",
  })
  confirmChangePassword(
    @CurrentUser() user: JwtPayload,
    @Body() dto: ConfirmChangePasswordDto,
  ) {
    return this.authService.confirmChangePassword(user, dto);
  }
}