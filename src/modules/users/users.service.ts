import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { CreateAdminDto } from './dto/create.admin.dto';
import * as bcrypt from "bcrypt"
import { Role, Status } from '@prisma/client';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

    async getAllAdmins() {
        const admins = await this.prisma.user.findMany({
            where: {
                status: Status.active,
                role: Role.ADMIN
            },
            select: {
                id: true,
                first_name: true,
                last_name: true,
                email: true,
                phone: true,
                photo: true,
                role: true,
            }
        })

        return {
            success: true,
            data: admins
        }
    }

    async getAdminById(id: number) {
        const admin = await this.prisma.user.findFirst({
            where: {
                id,
                status: Status.active,
                role: Role.ADMIN
            },
            select: {
                id: true,
                first_name: true,
                last_name: true,
                email: true,
                phone: true,
                photo: true,
                role: true,
            }
        })

        if (!admin) {
            throw new NotFoundException("Admin not found with this id")
        }

        return {
            success: true,
            data: admin
        }
    }

    async updateAdmin(id: number, payload: Partial<CreateAdminDto>) {
        const admin = await this.prisma.user.findFirst({
            where: {
                id,
                status: Status.active,
                role: Role.ADMIN
            }
        })

        if (!admin) {
            throw new NotFoundException("Admin not found with this id")
        }

        if (payload.phone || payload.email) {
            const duplicate = await this.prisma.user.findFirst({
                where: {
                    OR: [
                        payload.phone ? { phone: payload.phone } : {},
                        payload.email ? { email: payload.email } : {}
                    ].filter(o => Object.keys(o).length > 0),
                    id: { not: id }
                }
            })
            if (duplicate) {
                throw new ConflictException("Phone or email already exists")
            }
        }

        const data: any = { ...payload, update_at: new Date() }
        if (payload.password) {
            data.password = await bcrypt.hash(payload.password, 10)
        }

        await this.prisma.user.update({
            where: { id },
            data
        })

        return {
            success: true,
            message: "Admin updated successfully"
        }
    }

    async deleteAdmin(id: number) {
        const admin = await this.prisma.user.findFirst({
            where: {
                id,
                status: Status.active,
                role: Role.ADMIN
            }
        })

        if (!admin) {
            throw new NotFoundException("Admin not found with this id")
        }

        await this.prisma.user.update({
            where: { id },
            data: {
                status: Status.inactive,
                update_at: new Date()
            }
        })

        return {
            success: true,
            message: "Admin deleted successfully"
        }
    }

    async createAdmin(payload: CreateAdminDto) {
        const adminExists = await this.prisma.user.findFirst({
            where: {
                OR: [
                    { phone: payload.phone },
                    { email: payload.email }
                ]

            }
        })

        if (adminExists) throw new ConflictException()

        const hashPass = await bcrypt.hash(payload.password, 10)

        await this.prisma.user.create({
            data: {
                ...payload,
                role: Role.ADMIN,
                password: hashPass
            }
        })

        return {
            success: true,
            message: "create admin successfully"
        }
    }

}
