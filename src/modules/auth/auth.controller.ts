import { Controller, Post, Get, Body, UseGuards, Req } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { CreateAuthDto } from "./dto/create-auth.dto";
import { TokenGuard } from "src/common/guards/token.guards";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("user/login")
  login(@Body() dto: CreateAuthDto) {
    return this.authService.login(dto);
  }

  @UseGuards(TokenGuard)
  @Get("me")
  me(@Req() req: any) {
    // req.user is populated by JwtAuthGuard (passport strategy)
    // AuthService.getProfile() only formats the already-decoded payload —
    // no extra DB call, no @Req() leaking into the service layer.
    return this.authService.getProfile(req.user);
  }
}