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
                where: { id: currentUser.id },
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
                where: { id: currentUser.id },
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
                            Group: {
                                select: { id: true, name: true }
                            }
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

        console.log(payload);
        
        const existUser = await this.prisma.user.findUnique({
            where: {
                phone: payload.identifier
            }
        })

        if (!existUser) {
            const existStudent = await this.prisma.student.findUnique({
                where: {
                    phone: payload.identifier
                }
            })
            if (!existStudent) {
                const existteacher = await this.prisma.teacher.findUnique({
                    where: {
                        phone: payload.identifier
                    }
                })

                if(!existteacher){
                    throw new UnauthorizedException("Invalid phone or password")
                }

                const isMatch = await bcrypt.compare(payload.password, existteacher.password)
                if (!isMatch) {
                    throw new UnauthorizedException("Invalid username or password")
                }

                return {
                    success: true,
                    message: "You're logged",
                    accessToken: this.jwtService.sign({ id: existteacher.id, email: existteacher.email, role:Role.TEACHER })
                }
            }

            const isMatch = await bcrypt.compare(payload.password, existStudent.password)
            if (!isMatch) {
                throw new UnauthorizedException("Invalid username or password")
            }

            return {
                success: true,
                message: "You're logged",
                accessToken: this.jwtService.sign({ id: existStudent.id, email: existStudent.email, role: Role.STUDENT })
            }

        }

        const isMatch = await bcrypt.compare(payload.password, existUser.password)
        if (!isMatch) {
            throw new UnauthorizedException("Invalid username or password")
        }

        return {
            success: true,
            message: "You're logged",
            accessToken: this.jwtService.sign({ id: existUser.id, email: existUser.email, role: existUser.role })
        }
    }

}
