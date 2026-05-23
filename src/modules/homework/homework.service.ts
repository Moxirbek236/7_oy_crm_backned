import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { CreateHomeworkDto } from './dto/create.dto';
import { UpdateHomeworkDto } from './dto/update.dto';
import { HomeworkStatus, Role, Status } from '@prisma/client';
import { HomeworkResultDto } from './dto/homework.result.dto';

@Injectable()
export class HomeworkService {
    constructor(private prisma: PrismaService) { }

    async getOwnHomework(lessonId: number, currentUser: { id: number }) {
        const myLessons = await this.prisma.homework.findMany({
            where: {
                lesson_id: lessonId
            },
            select: {
                id: true,
                title: true,
                file: true,
                created_at: true,
                update_at: true,
                teachers: {
                    select: {
                        id: true,
                        full_name: true,
                        phone: true,
                        photo: true
                    }
                },
                users: {
                    select: {
                        id: true,
                        last_name: true,
                        first_name: true,
                        phone: true,
                        photo: true
                    }
                }
            }
        })

        const homeworkFormated = myLessons.map(el => {
            if (!el.teachers) {
                return {
                    id: el.id,
                    title: el.title,
                    file: el.file,
                    created_at: el.created_at,
                    update_at: el.update_at,
                    user: el.users
                }
            } else {
                return {
                    id: el.id,
                    title: el.title,
                    file: el.file,
                    created_at: el.created_at,
                    update_at: el.update_at,
                    teacher: el.teachers
                }
            }
        })

        return {
            success: true,
            data: homeworkFormated
        }
    }

    async getAllHomework() {
        const homeworks = await this.prisma.homework.findMany()

        return {
            success: true,
            data: homeworks
        }
    } 

    async getHomeworkResults(groupId : number, homeworkId : number, status?: HomeworkStatus) {
        let studentsResult : any;
        
        if(status == HomeworkStatus.PENDING) {
            studentsResult = await this.prisma.homeworkAnswerStudent.findMany({
                where : {
                    homework_id: homeworkId,
                    homeworkStatus: HomeworkStatus.PENDING 
                },select:{
                    students:{
                        select : {
                            id : true,
                            full_name : true, 
                        }
                    }
                }
                
            }) 
        }
 
        else if(status == HomeworkStatus.ACCEPTED || status == HomeworkStatus.REJECTED ) {
            studentsResult = await this.prisma.homeworkResult.findMany({
                where : {
                    homework_id: homeworkId,
                    group_id:groupId,
                    homeworkStatus:status 
                },select:{
                    homeworkAnswerStudent:{
                        select : {
                            students : {
                                select : {
                                    id : true,
                                    full_name : true,
                                }
                            }
                        }
                    } 
                }

            }) 
        }
 
        return {
            success: true,
            data:{ 
                students:status == "PENDING" ? studentsResult.map(el=>el.students): studentsResult.map(el=>el.homeworkAnswerStudent.students)
            }
        }
    } 

    async getGroupHomeworkStudentResult(groupId : number, homeworkId : number, studentId : number) {
        const studentResult = await this.prisma.homeworkAnswerStudent.findFirst({
            where : {
                homework_id: homeworkId, 
                student_id:studentId
            },select:{
                id:true,
                file:true,
                title:true,
                students:{
                    select:{
                        id:true,
                        full_name:true,
                    }
                }
            }
        })
        return {
            success: true,
            data: studentResult
        }
    }

    async getGroupHomework(groupId: number, currentUser: { id: number, role: Role }) {
        const group = await this.prisma.group.findMany({
            where: {
                id: groupId
            },
            include: {
                lessons: {
                    select: {
                        id: true,
                        topic: true,
                        created_at: true,
                        homework: {
                            select: {
                                id: true,
                                created_at: true,
                            }
                        }
                    }
                }
            }
        })

        const existStudentsIngroup = await this.prisma.studentGroup.count({
            where: { group_id: groupId }
        });

        const lessons = group[0].lessons;
        const groupFormated = await Promise.all(lessons.flatMap(lesson => 
            lesson.homework.map(async hw => {
                const pendingCount = await this.prisma.homeworkAnswerStudent.count({
                    where: {
                        homework_id: hw.id,
                        homeworkStatus: HomeworkStatus.PENDING
                    }
                });

                const acceptCount = await this.prisma.homeworkAnswerStudent.count({
                    where: {
                        homework_id: hw.id,
                        homeworkStatus: HomeworkStatus.ACCEPTED
                    }
                });

                return {
                    id: lesson.id,
                    topic: lesson.topic,
                    created_at: lesson.created_at,
                    homework: [hw],
                    homeworkPending: pendingCount,
                    homeworkAccept: acceptCount,
                    existStudentsIngroup: existStudentsIngroup
                };
            })
        ));

        return {
            success: true,
            data: groupFormated
        };


    }

    async createHomework(payload: CreateHomeworkDto, currentUser: { id: number, role: Role }, filename?: string) {
        const existLesson = await this.prisma.lesson.findFirst({
            where: {
                id: payload.lesson_id
            },
            select: {
                groups: {
                    select: {
                        GroupTeacher: {
                            select: {
                                teacher_id: true
                            }
                        }
                    }
                }
            }
        })

        if (!existLesson) {
            throw new NotFoundException("Lesson not fount with this id")
        }

        if (currentUser.role == Role.TEACHER && !existLesson.groups.GroupTeacher.some(gt => gt.teacher_id == currentUser.id)) {
            throw new ForbiddenException("Is not your lesson")
        }

        await this.prisma.homework.create({
            data: {
                ...payload,
                file: filename,
                teacher_id: currentUser.role == "TEACHER" ? currentUser.id : null,
                user_id: currentUser.role != "TEACHER" ? currentUser.id : null
            }
        })

        return {
            success: true,
            message: "Homework recorded"
        }
    }

    async updateHomework(id: number, payload: UpdateHomeworkDto) {
        const existHomework = await this.prisma.homework.findFirst({
            where: { id }
        })

        if (!existHomework) {
            throw new NotFoundException("Homework not found with this id")
        }

        await this.prisma.homework.update({
            where: { id },
            data: {
                ...payload,
                update_at: new Date()
            }
        })

        return {
            success: true,
            message: "Homework updated successfully"
        }
    }

    async deleteHomework(id: number) {
        const existHomework = await this.prisma.homework.findFirst({
            where: { id }
        })

        if (!existHomework) {
            throw new NotFoundException("Homework not found with this id")
        }

        await this.prisma.homework.delete({
            where: { id }
        })

        return {
            success: true,
            message: "Homework deleted successfully"
        }
    }

    async checkHomeworkResult(payload:HomeworkResultDto,currentUser:{id:number,role:Role},groupId:number,homeworkId:number){
        await this.prisma.homeworkResult.create({
            data: {
                homework_answer_id:payload.homework_answer_id,
                group_id: groupId,
                homework_id:homeworkId, 
                grade: payload.grade,
                homeworkStatus:payload.grade > 60 ? HomeworkStatus.ACCEPTED : HomeworkStatus.REJECTED, 
                title: payload.title,
                teacher_id: currentUser.role == Role.TEACHER ? currentUser.id : null,
                user_id: currentUser.role == Role.ADMIN ? currentUser.id : null,  
            }
        }) 

        await this.prisma.homeworkAnswerStudent.update({
            where: {
                id: payload.homework_answer_id 
            },
            data: {
                homeworkStatus:HomeworkStatus.CHECKED,
            }
        })

        return {
            success: true, 
            message: "Homework recorded"
        }
    }
}
 