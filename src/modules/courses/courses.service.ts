import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateCourseDto } from './dto/create.dto';
import { UpdateCourseDto } from './dto/update.dto';
import { Status } from '@prisma/client';
import { PrismaService } from 'src/core/database/prisma.service';

@Injectable()
export class CoursesService {
    constructor(private prisma: PrismaService) { }

    async getAllCourses() {
        const courses = await this.prisma.course.findMany({
            where: { status: Status.active }
        })

        return {
            success: true,
            data: courses
        }
    }

    async getCourseById(id: number) {
        const course = await this.prisma.course.findFirst({
            where: {
                id,
                status: Status.active
            }
        })

        if (!course) {
            throw new NotFoundException("Course not found with this id")
        }

        return {
            success: true,
            data: course
        }
    }

    async createCourse(payload: CreateCourseDto) {
        const existCourse = await this.prisma.course.findUnique({
            where: { name: payload.name }
        })

        if (existCourse) {
            throw new ConflictException("Course already exists")
        }

        const course = await this.prisma.course.create({
            data: payload
        })

        return {
            success: true,
            data: course
        }
    }

    async updateCourse(id: number, payload: UpdateCourseDto) {
        const existCourse = await this.prisma.course.findFirst({
            where: {
                id,
                status: Status.active
            }
        })

        if (!existCourse) {
            throw new NotFoundException("Course not found with this id")
        }

        if (payload.name) {
            const duplicate = await this.prisma.course.findFirst({
                where: {
                    name: payload.name,
                    id: { not: id }
                }
            })
            if (duplicate) {
                throw new ConflictException("Course name already exists")
            }
        }

        await this.prisma.course.update({
            where: { id },
            data: {
                ...payload,
                update_at: new Date()
            }
        })

        return {
            success: true,
            message: "Course updated successfully"
        }
    }

    async deleteCourse(id: number) {
        const existCourse = await this.prisma.course.findFirst({
            where: {
                id,
                status: Status.active
            }
        })

        if (!existCourse) {
            throw new NotFoundException("Course not found with this id")
        }

        await this.prisma.course.update({
            where: { id },
            data: {
                status: Status.inactive,
                update_at: new Date()
            }
        })

        return {
            success: true,
            message: "Course deleted successfully"
        }
    }
}
