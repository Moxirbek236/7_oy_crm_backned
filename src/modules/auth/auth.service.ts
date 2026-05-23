import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService
    ) { }

    async getProfile(currentUser: { id: number, role: Role }) {
        let user: any;

        if (currentUser.role === Role.STUDENT) {
            user = await this.prisma.student.findFirst({
                where: { id: currentUser.id, status: 'active' as any },
                select: {
                    id: true,
                    full_name: true,
                    phone: true,
                    email: true,
                    photo: true,
                    address: true,
                    birth_date: true,
                    created_at: true
                }
            })
        } else if (currentUser.role === Role.TEACHER) {
            user = await this.prisma.teacher.findFirst({
                where: { id: currentUser.id, status: 'active' as any },
                select: {
                    id: true,
                    full_name: true,
                    phone: true,
                    email: true,
                    photo: true,
                    address: true,
                    created_at: true,
                    GroupTeacher: {
                        select: {
                            Group: { select: { id: true, name: true } }
                        }
                    }
                }
            })
            if (user) {
                user = { ...user, groups: user.GroupTeacher?.map(gt => gt.Group) }
                delete user.GroupTeacher
            }
        } else {
            user = await this.prisma.user.findFirst({
                where: { id: currentUser.id },
                select: {
                    id: true,
                    first_name: true,
                    last_name: true,
                    phone: true,
                    email: true,
                    photo: true,
                    address: true,
                    role: true,
                    created_at: true
                }
            })
        }

        if (!user) {
            throw new NotFoundException("User not found")
        }

        return {
            success: true,
            data: {
                ...user,
                role: currentUser.role
            }
        }
    }

    async userLogin(payload: LoginDto) {
        const { identifier, password } = payload;
        const q = identifier.trim();

        // Look up by phone or email across all three tables
        const existUser = await this.prisma.user.findFirst({
            where: { OR: [{ phone: q }, { email: q }] }
        })

        if (existUser) {
            const isMatch = await bcrypt.compare(password, existUser.password)
            if (!isMatch) {
                throw new UnauthorizedException("Invalid phone or password")
            }
            return {
                success: true,
                message: "You're logged",
                accessToken: this.jwtService.sign({ id: existUser.id, email: existUser.email, role: existUser.role })
            }
        }

        const existStudent = await this.prisma.student.findFirst({
            where: { OR: [{ phone: q }, { email: q }] }
        })

        if (existStudent) {
            const isMatch = await bcrypt.compare(password, existStudent.password)
            if (!isMatch) {
                throw new UnauthorizedException("Invalid phone or password")
            }
            return {
                success: true,
                message: "You're logged",
                accessToken: this.jwtService.sign({ id: existStudent.id, email: existStudent.email, role: Role.STUDENT })
            }
        }

        const existTeacher = await this.prisma.teacher.findFirst({
            where: { OR: [{ phone: q }, { email: q }] }
        })

        if (existTeacher) {
            const isMatch = await bcrypt.compare(password, existTeacher.password)
            if (!isMatch) {
                throw new UnauthorizedException("Invalid phone or password")
            }
            return {
                success: true,
                message: "You're logged",
                accessToken: this.jwtService.sign({ id: existTeacher.id, email: existTeacher.email, role: Role.TEACHER })
            }
        }

        throw new UnauthorizedException("Invalid phone or password")
    }
}
