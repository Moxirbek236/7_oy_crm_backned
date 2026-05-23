import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { CreateLessonDto } from './dto/create.lesson.dto';
import { UpdateLessonDto } from './dto/update.lesson.dto';
import { Role, Status } from '@prisma/client';

@Injectable()
export class LessonsService {
    constructor(private prisma: PrismaService) { }

    async getMyGroupLessons(groupId: number, currentUser: { id: number }) {
        const existGroup = await this.prisma.group.findFirst({
            where: {
                id: groupId,
                status: Status.active
            }
        })

        if (!existGroup) {
            throw new NotFoundException("Group not found with this id")
        }

        const groupLessons = await this.prisma.lesson.findMany({
            where: {
                group_id: groupId,
                status: Status.active
            },
            select: {
                id: true,
                topic: true,
                created_at: true
            }
        })

        return {
            success: true,
            data: groupLessons
        }
    }

    async getLessonById(lessonId: number) {
        const lesson = await this.prisma.lesson.findFirst({
            where: {
                id: lessonId,
                status: Status.active
            },
            include: {
                groups: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                teachers: {
                    select: {
                        id: true,
                        full_name: true
                    }
                },
                users: {
                    select: {
                        id: true,
                        first_name: true,
                        last_name: true
                    }
                }
            }
        })

        if (!lesson) {
            throw new NotFoundException("Lesson not found with this id")
        }

        return {
            success: true,
            data: lesson
        }
    }

    async getAllLessons() {
        const lessons = await this.prisma.lesson.findMany({
            where: { status: "active" }
        })

        return {
            sucess: true,
            data: lessons
        }
    }

    async createLesson(payload: CreateLessonDto, currentUser: { id: number, role: Role }) {
        const existGroup = await this.prisma.group.findFirst({
            where: {
                id: payload.group_id,
                status: Status.active
            },
            include: {
                GroupTeacher: true
            }
        })

        if (!existGroup) {
            throw new NotFoundException("Group not found with this id")
        }

        if (currentUser.role == "TEACHER" && !existGroup.GroupTeacher.some(gt => gt.teacher_id == currentUser.id)) {
            throw new ForbiddenException("Bu seni guruhing emas")
        }

        await this.prisma.lesson.create({
            data: {
                ...payload,
                teacher_id: currentUser.role == "TEACHER" ? currentUser.id : null,
                user_id: currentUser.role != "TEACHER" ? currentUser.id : null
            }
        })

        return {
            success: true,
            message: "Lesson created"
        }
    }

    async updateLesson(lessonId: number, payload: UpdateLessonDto) {
        const existLesson = await this.prisma.lesson.findFirst({
            where: {
                id: lessonId,
                status: Status.active
            }
        })

        if (!existLesson) {
            throw new NotFoundException("Lesson not found with this id")
        }

        await this.prisma.lesson.update({
            where: { id: lessonId },
            data: {
                ...payload,
                update_at: new Date()
            }
        })

        return {
            success: true,
            message: "Lesson updated successfully"
        }
    }

    async deleteLesson(lessonId: number) {
        const existLesson = await this.prisma.lesson.findFirst({
            where: {
                id: lessonId,
                status: Status.active
            }
        })

        if (!existLesson) {
            throw new NotFoundException("Lesson not found with this id")
        }

        await this.prisma.lesson.update({
            where: { id: lessonId },
            data: {
                status: Status.inactive,
                update_at: new Date()
            }
        })

        return {
            success: true,
            message: "Lesson deleted successfully"
        }
    }
}
