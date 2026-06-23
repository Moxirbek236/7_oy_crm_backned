import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { UserRole } from "@prisma/client";
import * as bcrypt from "bcrypt";
import * as crypto from "crypto";
import { PrismaService } from "src/core/database/prisma.service";
import { CreateAuthDto } from "./dto/create-auth.dto";
import { OtpService } from "src/common/otp/otp.service";
import { AuthResult, JwtPayload, UserLike } from "./interfaces/auth.interface";
import {
  ConfirmChangePasswordDto,
  InitiateChangePasswordDto,
  ResetPasswordDto,
  SendOtpDto,
  VerifyOtpDto,
} from "./dto/otp.dto";

const INVALID_CREDENTIALS = "Invalid credentials";
const BCRYPT_ROUNDS = 10;

const DUMMY_HASH =
  "$2b$10$abcdefghijklmnopqrstuvuXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly otpService: OtpService,
  ) {}


  async login(dto: CreateAuthDto): Promise<AuthResult> {
    const { account, role } = await this.findAccountByPhone(dto.phone);
    const passwordHash = account?.password ?? DUMMY_HASH;
    const isValid = await bcrypt.compare(dto.password, passwordHash);

    if (!account || !isValid) {
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }

    if (account.status === "inactive" || account.status === "freeze") {
      throw new UnauthorizedException("Account is not active");
    }

    return { success: true, accessToken: this.signToken(account, role), role };
  }


  async sendOtp(dto: SendOtpDto): Promise<{ success: true; message: string }> {
    const { account } = await this.findAccountByPhone(dto.phone);
    if (!account) {
      await this.simulateDelay();
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }

    await this.otpService.generateAndSendPhoneOtp(dto.phone);

    return { success: true, message: "OTP sent successfully" };
  }

  async verifyOtp(dto: VerifyOtpDto): Promise<{ success: true; message: string }> {
    const { account } = await this.findAccountByPhone(dto.phone);

    if (!account) {
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }

    await this.otpService.verifyPhoneOtp(dto.phone, dto.code);

    return { success: true, message: "OTP verified successfully" };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ success: true; message: string }> {
    const { account, role } = await this.findAccountByPhone(dto.phone);

    if (!account) {
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }

    const isVerified = await this.otpService.checkPhoneVerified(dto.phone);

    if (!isVerified) {
      throw new BadRequestException(
        "Phone not verified. Please complete OTP verification first.",
      );
    }

    const passHash = await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS);
    await this.updatePasswordById(account.id, role, passHash);

    await this.otpService.clearPhoneVerifiedFlag(dto.phone);

    return { success: true, message: "Password reset successfully" };
  }

  async initiateChangePassword(
    payload: JwtPayload,
    dto: InitiateChangePasswordDto,
  ): Promise<{ success: true; message: string }> {
    const { account } = await this.findAccountById(payload.sub);

    if (!account) {
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }

    const isOldPasswordValid = await bcrypt.compare(dto.oldPassword, account.password);

    if (!isOldPasswordValid) {
      throw new BadRequestException("Current password is incorrect");
    }

    const isSamePassword = await bcrypt.compare(dto.newPassword, account.password);

    if (isSamePassword) {
      throw new BadRequestException("New password must differ from the current password");
    }

    await this.otpService.generateAndSendEmailOtp(payload.sub, account.email);

    return {
      success: true,
      message: `Confirmation code sent to ${this.maskEmail(account.email)}`,
    };
  }

  async confirmChangePassword(
    payload: JwtPayload,
    dto: ConfirmChangePasswordDto,
  ): Promise<{ success: true; message: string }> {
    const { account, role } = await this.findAccountById(payload.sub);

    if (!account) {
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }

    await this.otpService.verifyEmailOtp(payload.sub, dto.code);

    const isOldPasswordValid = await bcrypt.compare(dto.oldPassword, account.password);

    if (!isOldPasswordValid) {
      throw new BadRequestException("Current password is incorrect");
    }

    const newPassHash = await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS);
    await this.updatePasswordById(account.id, role, newPassHash);

    return { success: true, message: "Password changed successfully" };
  }

  getProfile(payload: JwtPayload) {
    const { sub: id, full_name, email, phone, address, photo, status, role } = payload;

    return {
      success: true,
      data: { id, full_name, email, phone, address, photo, status, role },
    };
  }

  private async findAccountByPhone(
    phone: string,
  ): Promise<{ account: UserLike | null; role: UserRole }> {
    const [user, teacher, student] = await Promise.all([
      this.prisma.user.findUnique({ where: { phone } }),
      this.prisma.teachers.findUnique({ where: { phone } }),
      this.prisma.students.findUnique({ where: { phone } }),
    ]);

    if (user)    return { account: user,    role: user.role };
    if (teacher) return { account: teacher, role: UserRole.TEACHER };
    if (student) return { account: student, role: UserRole.STUDENT };

    return { account: null, role: UserRole.STUDENT };
  }

  private async findAccountById(
    id: number,
  ): Promise<{ account: UserLike | null; role: UserRole }> {
    const [user, teacher, student] = await Promise.all([
      this.prisma.user.findUnique({ where: { id } }),
      this.prisma.teachers.findUnique({ where: { id } }),
      this.prisma.students.findUnique({ where: { id } }),
    ]);

    if (user)    return { account: user,    role: user.role };
    if (teacher) return { account: teacher, role: UserRole.TEACHER };
    if (student) return { account: student, role: UserRole.STUDENT };

    return { account: null, role: UserRole.STUDENT };
  }

  private async updatePasswordById(id: number, role: UserRole, passHash: string): Promise<void> {
    if (role === UserRole.SUPERADMIN || role === UserRole.ADMIN) {
      await this.prisma.user.update({ where: { id }, data: { password: passHash } });
    } else if (role === UserRole.TEACHER) {
      await this.prisma.teachers.update({ where: { id }, data: { password: passHash } });
    } else if (role === UserRole.STUDENT) {
      await this.prisma.students.update({ where: { id }, data: { password: passHash } });
    } else {
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }
  }

  private signToken(account: UserLike, role: UserRole): string {
    const payload: JwtPayload = {
      sub:       account.id,
      full_name: account.full_name,
      email:     account.email,
      phone:     account.phone,
      address:   account.address,
      photo:     account.photo,
      status:    account.status,
      role,
    };
    return this.jwtService.sign(payload);
  }

  private maskEmail(email: string): string {
    const [local, domain] = email.split("@");
    return `${local.slice(0, 2)}****@${domain}`;
  }

  private simulateDelay(): Promise<void> {
    return new Promise((resolve) =>
      setTimeout(resolve, 200 + Math.random() * 100),
    );
  }
}