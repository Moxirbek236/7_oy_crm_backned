import { UserRole } from "@prisma/client";

export interface JwtPayload {
  sub: number;
  full_name: string;
  email: string;
  phone: string;
  address: string | null;
  photo: string | null;
  status: string;
  role: UserRole;
}

export type UserLike = {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  address: string | null;
  photo: string | null;
  status: string;
  password: string;
  role?: UserRole;
};

export interface AuthResult {
  success: true;
  token: string;
}
