import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { UserRole } from "@prisma/client";
import * as bcrypt from "bcrypt";
import { PrismaService } from "src/core/database/prisma.service";
import { CreateAuthDto } from "./dto/create-auth.dto";

// ─── Constants ───────────────────────────────────────────────────────────────

/** Generic error message — never reveal which field was wrong (enumeration attack) */
const INVALID_CREDENTIALS = "Invalid credentials";

/** Dummy hash used for constant-time comparison when no user is found */
const DUMMY_HASH =
  "$2b$10$abcdefghijklmnopqrstuvuXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX";

// ─── Types ────────────────────────────────────────────────────────────────────

interface JwtPayload {
  sub: number;       // standard JWT claim for subject/id
  full_name: string;
  email: string;
  phone: string;
  address: string | null;
  photo: string | null;
  status: string;
  role: UserRole;
}

interface AuthResult {
  success: true;
  token: string;
}

// ─── Lookup helpers (defined once, reused) ───────────────────────────────────

type UserLike = {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  address: string | null;
  photo: string | null;
  status: string;
  password: string;
  role?: UserRole; // present on User, absent on Teachers / Students
};

// ─── Service ─────────────────────────────────────────────────────────────────

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  // ── Public API ─────────────────────────────────────────────────────────────

  async login(dto: CreateAuthDto): Promise<AuthResult> {
    const { account, role } = await this.findAccountByPhone(dto.phone);
    console.log(account, role);
    
    // Always run bcrypt — even when no account found — to prevent timing attacks
    const passwordHash = account?.password ?? DUMMY_HASH;
    const isValid = await bcrypt.compare(dto.password, passwordHash);

    if (!account || !isValid) {
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }

    if (account.status === "inactive" || account.status === "freeze") {
      throw new UnauthorizedException("Account is not active");
    }

    return { success: true, token: this.signToken(account, role) };
  }

  /** Returns the current user profile from an already-decoded JWT payload. */
  getProfile(payload: JwtPayload) {
    // No DB hit needed — JWT is the source of truth for the session
    const { sub: id, full_name, email, phone, address, photo, status, role } =
      payload;

    return {
      success: true,
      data: { id, full_name, email, phone, address, photo, status, role },
    };
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  /**
   * Looks up the three account tables in parallel.
   * Returns the first match together with the resolved role.
   *
   * Parallel queries are safe here because phone values are unique
   * across all three tables (enforced at the DB level).
   */
  private async findAccountByPhone(
    phone: string,
  ): Promise<{ account: UserLike | null; role: UserRole }> {
    const [user, teacher, student] = await Promise.all([
      this.prisma.user.findUnique({ where: { phone } }),
      this.prisma.teachers.findUnique({ where: { phone } }),
      this.prisma.students.findUnique({ where: { phone } }),
    ]);

    console.log(phone
    );
    

    if (user)    return { account: user,    role: user.role };
    if (teacher) return { account: teacher, role: UserRole.TEACHER };
    if (student) return { account: student, role: UserRole.STUDENT };

    return { account: null, role: UserRole.STUDENT }; // role is irrelevant here
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
}