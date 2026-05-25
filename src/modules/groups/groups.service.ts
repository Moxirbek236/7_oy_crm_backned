import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { CreateGroupDto } from './dto/create.dto';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { GroupStatus, Status, StudentStatus } from '@prisma/client';
import { filterDto } from './dto/search';

@Injectable()
export class GroupsService {
    constructor(private prisma: PrismaService) { }

    async getGroupOne(groupId: number) {
        const existGroup = await this.prisma.group.findFirst({
            where: {
                id: groupId,
                status: Status.active
            }
        })

        if (!existGroup) {
            throw new NotFoundException("Group not found with this id")
        }

        const groupStudents = await this.prisma.studentGroup.findMany({
            where: {
                group_id: groupId,
                status: Status.active
            },
            select: {
                students: {
                    select: {
                        id: true,
                        full_name: true,
                        phone: true,
                        email: true,
                        photo: true,
                        birth_date: true,
                        created_at: true
                    }
                }
            }
        })

        const dataFormatter = groupStudents.map(el => el.students)

        return {
            success: true,
            data: dataFormatter
        }
    }

    async getAllGroups(search: filterDto) {
        const { groupName, max_student, page, limit, search: q } = search as any

        const pageNum = page && page > 0 ? page : 1
        const limitNum = limit && limit > 0 ? limit : 20

        const where: any = { status: Status.active }

        if (groupName) {
            where.name = groupName
        }
        if (max_student) {
            where.max_student = +max_student
        }

        if (q && typeof q === 'string' && q.trim().length > 0) {
            where.OR = [
                { name: { contains: q.trim(), mode: 'insensitive' } },
            ]
        }

        const total = await this.prisma.group.count({ where })

        const groups = await this.prisma.group.findMany({
            where,
            select: {
                id: true,
                name: true,
                max_student: true,
                start_date: true,
                start_time: true,
                week_day: true,
                courses: {
                    select: {
                        id: true,
                        name: true,
                        duration_hours: true,
                        duration_month: true
                    }
                },
                rooms: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                GroupTeacher: {
                    select: {
                        Teacher: {
                            select: {
                                id: true,
                                full_name: true
                            }
                        }
                    }
                },
                studentGroups: {
                    select: {
                        students: {
                            select: {
                                id: true,
                                full_name: true
                            }
                        }
                    }
                }
            },
            skip: (pageNum - 1) * limitNum,
            take: limitNum
        })

        const dataFormatter = groups.map((el) => ({
            id: el.id,
            name: el.name,
            startDate: el.start_date.toISOString(),
            start_time: el.start_time,
            endDate: el.start_date instanceof Date
                ? new Date(el.start_date.getTime() + (el.courses.duration_month || 0) * 30 * 24 * 60 * 60 * 1000).toISOString()
                : (el.start_date as any),
            days: el.week_day,
            course: {
                name: el.courses.name,
                duration_month: el.courses.duration_month,
                duration_hours: el.courses.duration_hours,
            },
            room: el.rooms.name,
            teachers: el.GroupTeacher.map(gt => ({
                id: gt.Teacher.id,
                full_name: gt.Teacher.full_name
            })),
            student_count: el.studentGroups.length,
            students: el.studentGroups.map(sg => sg.students)
        }));

        const totalPages = Math.ceil(total / limitNum)

        return {
            success: true,
            data: dataFormatter,
            total,
            totalPages
        }
    }

    async getGroupById(groupId: number) {
        const now = new Date();
        const existGroup = await this.prisma.group.findFirst({
            where: {
                id: groupId,
                status: Status.active
            },
            include: {
                courses: {
                    select: {
                        id: true,
                        name: true,
                        duration_hours: true,
                        duration_month: true,
                    }
                },
                rooms: {
                    select: {
                        id: true,
                        name: true,
                        capacity: true,
                    }
                },
                GroupTeacher: {
                    select: {
                        Teacher: {
                            select: {
                                id: true,
                                full_name: true,
                                photo: true
                            }
                        }
                    }
                },
                studentGroups: {
                    where: { status: Status.active },
                    select: {
                        students: {
                            select: {
                                id: true,
                                full_name: true,
                                phone: true,
                                photo: true,
                                birth_date: true,
                                status: true,
                            }
                        }
                    }
                }
            }
        })

        if (!existGroup) {
            throw new NotFoundException("Group not found with this id")
        }

        const groupStudentsCount = existGroup.studentGroups.length

        const ages = existGroup.studentGroups
            .filter((item: any) => item.students?.birth_date)
            .map((item: any) => {
                const birthDate = new Date(item.students.birth_date);
                let age = now.getFullYear() - birthDate.getFullYear();
                const monthDiff = now.getMonth() - birthDate.getMonth();
                if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birthDate.getDate())) {
                    age--;
                }
                return age;
            });

        const averageAge = ages.length > 0
            ? Math.round(ages.reduce((sum: number, age: number) => sum + age, 0) / ages.length)
            : 0;

        const studentsList = existGroup.studentGroups.map((sg: any) => sg.students).filter(Boolean)

        const end_date = new Date(existGroup.start_date);

        end_date.setMonth(
            end_date.getMonth() + existGroup.courses.duration_month
        );

        return {
            success: true,
            data: {
                id: existGroup.id,
                name: existGroup.name,
                status: existGroup.status === "active" ? "ACTIVE" : existGroup.status.toUpperCase(),
                days: existGroup.week_day,
                start_date: existGroup.start_date.toISOString().split("T")[0],
                start_time: existGroup.start_time,
                end_date: end_date?.toISOString().split("T")[0] ?? "",
                startTime: existGroup.start_time,
                startDate: existGroup.start_date.toISOString().split("T")[0],
                endDate: end_date?.toISOString().split("T")[0] ?? "",
                student_count: groupStudentsCount,
                teachers: existGroup.GroupTeacher.map((gt: any) => ({
                    id: gt.Teacher.id,
                    fullname: gt.Teacher.full_name,
                    full_name: gt.Teacher.full_name,
                    photo: gt.Teacher.photo,
                    phone: gt.Teacher.phone || "",
                })),
                students: studentsList.map((s: any) => ({
                    id: s.id,
                    fullname: s.full_name,
                    full_name: s.full_name,
                    phone: s.phone,
                    photo: s.photo,
                    status: s.status === "active" ? "ACTIVE" : s.status?.toUpperCase() || "ACTIVE",
                    hasDebt: false,
                    birth_date: s.birth_date,
                })),
                course: {
                    id: existGroup.courses.id,
                    name: existGroup.courses.name,
                    duration_month: existGroup.courses.duration_month,
                    duration_hours: existGroup.courses.duration_hours,
                    price: 0,
                    duration: `${existGroup.courses.duration_month} oy`,
                    days: existGroup.week_day,
                    startDate: existGroup.start_date.toISOString().split("T")[0],
                    endDate: end_date?.toISOString().split("T")[0] ?? "",
                    startTime: existGroup.start_time,
                },
                course_id: existGroup.course_id,
                room: {
                    id: existGroup.rooms.id,
                    name: existGroup.rooms.name,
                },
                room_id: existGroup.room_id,
                createdAt: existGroup.created_at.toISOString(),
                max_student: existGroup.max_student,
                user: { name: "" },
                averageAge: averageAge,
            }
        }
    }

    async getGroupReport(branchId?: number) {
        const whereGroups: any = {
            status: GroupStatus.active,
        };

        if (branchId) {
            whereGroups.branch_id = branchId;
        }

        const [groupCount, teacherCount, studentCount, teachers, students] = await Promise.all([
            this.prisma.group.count({ where: whereGroups }),
            this.prisma.teacher.count({ where: { status: Status.active, ...(branchId && { branch_id: branchId }) } }),
            this.prisma.student.count({ where: { status: StudentStatus.active, ...(branchId && { branch_id: branchId }) } }),
            this.prisma.teacher.findMany({
                where: { status: Status.active, ...(branchId && { branch_id: branchId }) },
                select: { photo: true },
                take: 5,
            }),
            this.prisma.student.findMany({
                where: { status: StudentStatus.active, ...(branchId && { branch_id: branchId }) },
                select: { photo: true },
                take: 5,
            }),
        ]);

        return {
            success: true,
            data: {
                _count: {
                    group: groupCount,
                    Teacher: teacherCount,
                    student: studentCount,
                },
                teachers,
                students,
            },
        };
    }

    async createGroup(payload: CreateGroupDto) {

        const timeToMinutes = (time: string) => {
            const [h, m] = time.split(":").map(Number);
            return h * 60 + m;
        };

        const existRoom = await this.prisma.room.findFirst({
            where: {
                id: payload.room_id,
                status: Status.active
            }
        });

        if (!existRoom) {
            throw new NotFoundException("Room is not found with this id");
        }

        const existCourse = await this.prisma.course.findFirst({
            where: {
                id: payload.course_id,
                status: Status.active
            }
        });

        if (!existCourse) {
            throw new NotFoundException("Course is not found or inactive with this id");
        }



        const existGroup = await this.prisma.group.findUnique({
            where: { name: payload.name }
        });

        if (existGroup) {
            throw new ConflictException("Group already exists");
        }

        const startNew = timeToMinutes(payload.start_time);
        const endNew = startNew + existCourse.duration_hours * 60;

        const roomGroups = await this.prisma.group.findMany({
            where: {
                room_id: payload.room_id,
                status: Status.active
            },
            select: {
                start_time: true,
                courses: {
                    select: {
                        duration_hours: true
                    }
                }
            }
        });

        const isRoomBusy = roomGroups.some(el => {
            const start = timeToMinutes(el.start_time);
            const end = start + el.courses.duration_hours * 60;

            return start < endNew && end > startNew;
        });

        if (isRoomBusy) {
            throw new ConflictException("Room is busy at this time");
        }

        const { teachers, students, ...groupData } = payload;

        const existingTeachers = await this.prisma.teacher.findMany({
            where: {
                id: {
                    in: teachers
                }
            }
        })

        const existingStudents = await this.prisma.student.findMany({
            where: {
                id: {
                    in: students
                }
            }
        })

        if (existingTeachers.length != teachers?.length) {
            throw new NotFoundException("Teacher is not found with this id")
        }

        if (existingStudents?.length != students?.length) {
            throw new NotFoundException("Student is not found with this id")
        }

        const newGroup = await this.prisma.group.create({
            data: {
                ...groupData,
                start_date: new Date(payload.start_date),
                GroupTeacher: teachers?.length ? {
                    create: teachers?.map(id => ({ teacher_id: id }))
                } : undefined,
                studentGroups: students?.length ? {
                    create: students?.map(id => ({ student_id: id }))
                } : undefined
            }
        });

        return {
            success: true,
            message: "Group created successfully",
            data: newGroup
        };
    }

    async getSchedules(groupId: number) {
        const group = await this.prisma.group.findUnique({
            where: { id: groupId },
            include: { courses: true }
        });

        if (!group) {
            throw new NotFoundException("Group not found");
        }

        const weekDayMap = {
            'SUNDAY': 0,
            'MONDAY': 1,
            'TUESDAY': 2,
            'WEDNESDAY': 3,
            'THURSDAY': 4,
            'FRIDAY': 5,
            'SATURDAY': 6
        };

        const monthNames = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];

        const { start_date, week_day, courses } = group;
        const duration = courses.duration_month;
        const targetWeekDays = week_day.map(wd => weekDayMap[wd]);

        // Fetch completed lesson dates by created_at field
        const completedLessons = await this.prisma.lesson.findMany({
            where: {
                group_id: groupId,
            },
            select: {
                created_at: true
            }
        });

        const completedDates = new Set(
            completedLessons.map(l => l.created_at.toISOString().split('T')[0])
        );

        const schedules = {};
        const now = new Date();
        let currentDate = new Date(start_date);

        for (let i = 1; i <= duration; i++) {
            const monthDates = [] as { day: number; month: string; isCompleted: boolean }[];
            const monthStart = new Date(currentDate);
            const endOfPeriod = new Date(currentDate);
            endOfPeriod.setMonth(endOfPeriod.getMonth() + 1);

            // A month is active if current date falls within its range
            const isActive = now >= monthStart && now < endOfPeriod;

            while (currentDate < endOfPeriod) {
                if (targetWeekDays.includes(currentDate.getDay())) {
                    const dateStr = currentDate.toISOString().split('T')[0];
                    monthDates.push({
                        day: currentDate.getDate(),
                        month: monthNames[currentDate.getMonth()],
                        isCompleted: completedDates.has(dateStr)
                    });
                }
                currentDate.setDate(currentDate.getDate() + 1);
            }
            schedules[i] = {
                isActive,
                days: monthDates
            };
        }

        return [schedules];
    }

    async updateGroup(groupId: number, payload: Partial<CreateGroupDto>) {
        const existGroup = await this.prisma.group.findFirst({
            where: {
                id: groupId,
                status: Status.active
            }
        });

        if (!existGroup) {
            throw new NotFoundException("Group not found with this id")
        }

        if (payload.name) {
            const duplicate = await this.prisma.group.findFirst({
                where: {
                    name: payload.name,
                    id: { not: groupId }
                }
            })
            if (duplicate) {
                throw new ConflictException("Group name already exists")
            }
        }

        const { teachers, students, ...groupData } = payload as any;

        // Convert start_date to Date if provided
        if (groupData.start_date && typeof groupData.start_date === 'string') {
            groupData.start_date = new Date(groupData.start_date);
        }

        // Handle teacher relationships update
        if (teachers && Array.isArray(teachers)) {
            // Delete existing teacher relationships
            await this.prisma.groupTeacher.deleteMany({
                where: { group_id: groupId }
            });
            // Create new teacher relationships
            if (teachers.length > 0) {
                await this.prisma.groupTeacher.createMany({
                    data: teachers.map(id => ({ group_id: groupId, teacher_id: id }))
                });
            }
        }

        // Handle student relationships update
        if (students && Array.isArray(students)) {
            // Delete existing student relationships
            await this.prisma.studentGroup.deleteMany({
                where: { group_id: groupId }
            });
            // Create new student relationships
            if (students.length > 0) {
                await this.prisma.studentGroup.createMany({
                    data: students.map(id => ({ group_id: groupId, student_id: id }))
                });
            }
        }

        await this.prisma.group.update({
            where: { id: groupId },
            data: {
                ...groupData,
                update_at: new Date()
            }
        })

        return {
            success: true,
            message: "Group updated successfully"
        }
    }

    async deleteGroup(groupId: number) {
        const existGroup = await this.prisma.group.findFirst({
            where: {
                id: groupId,
                status: Status.active
            }
        });

        if (!existGroup) {
            throw new NotFoundException("Group not found with this id")
        }

        await this.prisma.group.update({
            where: { id: groupId },
            data: {
                status: GroupStatus.completed,
                update_at: new Date()
            }
        })

        return {
            success: true,
            message: "Group deleted successfully"
        }
    }

    async createLesson(groupId: number, payload: CreateLessonDto) {
        const existGroup = await this.prisma.group.findFirst({
            where: { id: groupId, status: Status.active }
        });
        if (!existGroup) {
            throw new NotFoundException('Group not found');
        }

        // Duplicate lesson for same date check (using range for created_at)
        const date = new Date(payload.lesson_date);
        const startOfDay = new Date(date.setHours(0, 0, 0, 0));
        const endOfDay = new Date(date.setHours(23, 59, 59, 999));

        const existLesson = await this.prisma.lesson.findFirst({
            where: {
                group_id: groupId,
                created_at: {
                    gte: startOfDay,
                    lte: endOfDay
                }
            }
        });
        if (existLesson) {
            throw new ConflictException('Lesson already exists for this date');
        }

        const lesson = await this.prisma.lesson.create({
            data: {
                group_id: groupId,
                topic: payload.topic,
                description: payload.description,
                created_at: startOfDay
            }
        });

        // Create Attendance records separately linked to group
        if (payload.attendances?.length) {
            await this.prisma.attendance.createMany({
                data: payload.attendances.map(a => ({
                    group_id: groupId,
                    student_id: a.student_id,
                    isPresent: true,
                    created_at: startOfDay
                }))
            });
        }

        return {
            success: true,
            message: 'Lesson and attendance created successfully',
            data: lesson
        };
    }

    async getLessonByDate(groupId: number, dateStr: string) {
        const date = new Date(dateStr);
        const startOfDay = new Date(date.setHours(0, 0, 0, 0));
        const endOfDay = new Date(date.setHours(23, 59, 59, 999));

        const lesson = await this.prisma.lesson.findFirst({
            where: {
                group_id: groupId,
                created_at: {
                    gte: startOfDay,
                    lte: endOfDay
                }
            }
        });

        const attendances = await this.prisma.attendance.findMany({
            where: {
                group_id: groupId,
                created_at: {
                    gte: startOfDay,
                    lte: endOfDay
                }
            },
            include: {
                students: {
                    select: { id: true, full_name: true, photo: true }
                }
            }
        });

        // All students in group
        const groupStudents = await this.prisma.studentGroup.findMany({
            where: { group_id: groupId, status: Status.active },
            select: {
                students: {
                    select: { id: true, full_name: true, photo: true }
                }
            }
        });

        const students = groupStudents.map(sg => sg.students);
        const presentIds = new Set(
            attendances.map(a => a.student_id)
        );

        const attendanceList = students.map(s => ({
            student_id: s.id,
            full_name: s.full_name,
            photo: s.photo,
            isPresent: presentIds.has(s.id)
        }));

        return {
            success: true,
            data: {
                lesson: lesson ? {
                    id: lesson.id,
                    topic: lesson.topic,
                    description: lesson.description,
                    created_at: lesson.created_at
                } : null,
                attendance: attendanceList
            }
        };
    }
}
