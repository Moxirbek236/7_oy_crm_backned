import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { CreateTeacherDto } from './dto/create.dto';
import { UpdateTeacherDto } from './dto/update.dto';
import * as bcrypt from "bcrypt"
import { Status } from '@prisma/client';

@Injectable()
export class TeachersService {
    constructor(private prisma: PrismaService) { }

    async getTeacherById(id: number) {
        const teacher = await this.prisma.teacher.findFirst({
            where: {
                id,
                status: Status.active
            },
            select: {
                id: true,
                full_name: true,
                phone: true,
                photo: true,
                email: true,
                address: true,
                created_at: true,
                GroupTeacher: {
                    select: {
                        Group: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    }
                }
            }
        })

        if (!teacher) {
            throw new NotFoundException("Teacher not found with this id")
        }

        return {
            success: true,
            data: {
                ...teacher,
                groups: teacher.GroupTeacher.map(gt => gt.Group)
            }
        }
    }

    async getTeachersByGroup(groupId: number) {
        const groupTeachers = await this.prisma.groupTeacher.findMany({
            where: {
                group_id: groupId,
            },
            select: {
                Teacher: {
                    select: {
                        id: true,
                        full_name: true,
                        phone: true,
                        photo: true,
                        email: true,
                    }
                }
            }
        });

        return {
            success: true,
            data: groupTeachers.map(gt => gt.Teacher)
        };
    }

    async getAllTeachers(search?: string, page?: number, limit?: number,) {

        page = page && page > 0 ? page : 1;
        limit = limit && limit > 0 ? limit : 20;

        const where: any = { status: Status.active };

        const teachers = await this.prisma.teacher.findMany({
            where,
            select: {
                id: true,
                full_name: true,
                phone: true,
                photo: true,
                email: true,
                address: true,
                created_at: true,
                GroupTeacher: {
                    select: {
                        Group: {
                            select: {
                                name: true
                            }
                        }
                    }
                }
            },
            skip: (page - 1) * limit,
            take: limit,
        })

        const dataFormatter = teachers.map(el => ({
            ...el,
            groups: el.GroupTeacher.map(gt => gt.Group.name)
        }))

        return {
            success: true,
            data: dataFormatter
        }
    }

    async updateTeacher(id: number, payload: UpdateTeacherDto) {
        const existTeacher = await this.prisma.teacher.findFirst({
            where: {
                id,
                status: Status.active
            }
        })

        if (!existTeacher) {
            throw new NotFoundException("Teacher not found with this id")
        }

        if (payload.phone || payload.email) {
            const duplicate = await this.prisma.teacher.findFirst({
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

        const { groups, ...teacherData } = payload

        await this.prisma.teacher.update({
            where: { id },
            data: {
                ...teacherData,
                update_at: new Date()
            }
        })

        return {
            success: true,
            message: "Teacher updated successfully"
        }
    }

    async deleteTeacher(id: number) {
        const existTeacher = await this.prisma.teacher.findFirst({
            where: {
                id,
                status: Status.active
            }
        })

        if (!existTeacher) {
            throw new NotFoundException("Teacher not found with this id")
        }

        await this.prisma.teacher.update({
            where: { id },
            data: {
                status: Status.inactive,
                update_at: new Date()
            }
        })

        return {
            success: true,
            message: "Teacher deleted successfully"
        }
    }

    async createTeacher(payload: CreateTeacherDto, filename?: string) {

        const existTeacher = await this.prisma.teacher.findFirst({
            where: {
                OR: [
                    { phone: payload.phone },
                    { email: payload.email }
                ]
            }
        })

        if (existTeacher) {

            throw new ConflictException()
        }

        const hashPass = await bcrypt.hash(payload.password, 10)

        const { groups, ...teacherData } = payload;

        const groupIds = groups || [];
        if (groupIds.length > 0) {
            const existingGroups = await this.prisma.group.findMany({
                where: {
                    id: {
                        in: groupIds
                    },
                    status: Status.active
                }
            })

            if (existingGroups.length != groupIds.length) {
                throw new NotFoundException("Group is not found or inactive with this id")
            }
        }

        await this.prisma.teacher.create({
            data: {
                full_name: teacherData.full_name,
                phone: teacherData.phone,
                email: teacherData.email,
                address: teacherData.address || "",
                photo: filename ?? null,
                password: hashPass,
                GroupTeacher: groupIds.length ? {
                    create: groupIds.map(id => ({ group_id: id }))
                } : undefined
            }
        })

        return {
            success: true,
            message: "Teacher created"
        }
    }
}
