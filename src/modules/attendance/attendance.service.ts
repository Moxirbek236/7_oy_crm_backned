import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Role, Status, WeekDay } from '@prisma/client';
import { PrismaService } from 'src/core/database/prisma.service';
import { CreateAttendanceDto } from './dto/create.dto';
import { UpdateAttendanceDto } from './dto/update.dto';

@Injectable()
export class AttendanceService {
    constructor(private prisma: PrismaService) { }

    async getAllAttendance(){
        const attendances = await this.prisma.attendance.findMany()

        return {
            seccess : true,
            data : attendances
        }
    }

    async getAttendanceById(id: number) {
        const attendance = await this.prisma.attendance.findFirst({
            where: { id },
            include: {
                students: {
                    select: { id: true, full_name: true }
                },
                groups: {
                    select: { id: true, name: true }
                }
            }
        })

        if (!attendance) {
            throw new NotFoundException("Attendance not found with this id")
        }

        return {
            success: true,
            data: attendance
        }
    }

    async updateAttendance(id: number, payload: UpdateAttendanceDto) {
        const existAttendance = await this.prisma.attendance.findFirst({
            where: { id }
        })

        if (!existAttendance) {
            throw new NotFoundException("Attendance not found with this id")
        }

        await this.prisma.attendance.update({
            where: { id },
            data: {
                ...payload,
                update_at: new Date()
            }
        })

        return {
            success: true,
            message: "Attendance updated successfully"
        }
    }

    async deleteAttendance(id: number) {
        const existAttendance = await this.prisma.attendance.findFirst({
            where: { id }
        })

        if (!existAttendance) {
            throw new NotFoundException("Attendance not found with this id")
        }

        await this.prisma.attendance.delete({
            where: { id }
        })

        return {
            success: true,
            message: "Attendance deleted successfully"
        }
    }

    async createAttendance(payload: CreateAttendanceDto, currentUser: { id: number, role: Role }) {

        const week = {
            "1": "MONDAY",
            "2": "TUESDAY",
            "3": "WEDNESDAY",
            "4": "THURSDAY",
            "5": "FRIDAY",
            "6": "SATURDAY",
            "7": "SUNDAY"
        }

        const group = await this.prisma.group.findFirst({
            where: {
                id: payload.group_id,
                status: Status.active
            },
            select: {
                start_time: true,
                start_date: true,
                GroupTeacher: {
                    select: {
                        teacher_id: true
                    }
                },
                week_day: true,
                courses: {
                    select: {
                        duration_hours: true
                    }
                },
                studentGroups: {
                    where: {
                        student_id: payload.student_id,
                        status: Status.active
                    }
                }
            }
        })

        if (!group?.studentGroups.length) {
            throw new BadRequestException("Student not found within this group")
        }

        if (currentUser.role == Role.TEACHER && !group?.GroupTeacher.some(gt => gt.teacher_id == currentUser.id)) {
            throw new ForbiddenException("Is not your group/lesson")
        }

        const week_day = group?.week_day
        const nowDate = new Date()
        const day = nowDate.getDay()

        if (!week_day?.includes(week[day])) {
            throw new BadRequestException("Dars vaqti xali boshlanmadi")
        }

        const timeToMinutes = (time: string) => {
            const [h, m] = time.split(":").map(Number);
            return h * 60 + m;
        };

        const startMinute = timeToMinutes(group!.start_time);
        const endMinute = startMinute + group!.courses.duration_hours * 60;
        const nowMinute = nowDate.getHours() * 60 + nowDate.getMinutes()

        // Checking if it's a past date or today's time
        if (group.start_date.getTime() > Date.now() && startMinute > nowMinute ) {
            throw new BadRequestException("Dars hali boshlanmadi")
        }

        if (!(startMinute < nowMinute && endMinute > nowMinute) && currentUser.role == Role.TEACHER) {
            throw new BadRequestException("Dars vaqtidan tashqarida davomat qilib bo'lmaydi")
        }

        await this.prisma.attendance.create({
            data: {
                ...payload,
                teacher_id: currentUser.role == "TEACHER" ? currentUser.id : null,
                user_id: currentUser.role != "TEACHER" ? currentUser.id : null
            }
        })

        return {
            success: true,
            message: "Attendance recorded"
        }
    }
}
