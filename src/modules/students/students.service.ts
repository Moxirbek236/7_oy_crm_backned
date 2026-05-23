import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { CreateStudentDto } from './dto/create.dto';
import { UpdateStudentDto } from './dto/update.dto';
import * as bcrypt from "bcrypt"
import { Status, StudentStatus } from '@prisma/client';
import { EmailService } from 'src/common/email/email.service';
import { PaginationDto } from './dto/pagination.dto';
import { CreateHomeworkAnswerDto } from './dto/create.homework.dto';

@Injectable()
export class StudentsService {
    constructor(
        private prisma: PrismaService,
        private emailService: EmailService
    ) { }

    async getStudentById(id: number) {
        const student = await this.prisma.student.findFirst({
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
                birth_date: true,
                created_at: true,
                studentGroups: {
                    select: {
                        groups: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    }
                }
            }
        })

        if (!student) {
            throw new NotFoundException("Student not found with this id")
        }

        return {
            success: true,
            data: {
                ...student,
                groups: student.studentGroups.map(sg => sg.groups)
            }
        }
    }

    async updateStudent(id: number, payload: UpdateStudentDto) {
        const existStudent = await this.prisma.student.findFirst({
            where: {
                id,
                status: Status.active
            }
        })

        if (!existStudent) {
            throw new NotFoundException("Student not found with this id")
        }

        if (payload.phone || payload.email) {
            const duplicate = await this.prisma.student.findFirst({
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

        const { groups, ...studentData } = payload

        await this.prisma.student.update({
            where: { id },
            data: {
                ...studentData,
                photo: existStudent.photo,
                update_at: new Date()
            }
        })

        return {
            success: true,
            message: "Student updated successfully"
        }
    }

    async deleteStudent(id: number) {
        const existStudent = await this.prisma.student.findFirst({
            where: {
                id,
                status: Status.active
            }
        })

        if (!existStudent) {
            throw new NotFoundException("Student not found with this id")
        }

        await this.prisma.student.update({
            where: { id },
            data: {
                status: StudentStatus.inactive,
                update_at: new Date()
            }
        })

        return {
            success: true,
            message: "Student deleted successfully"
        }
    }

    async getMyGroups(currentUser: { id: number }) {
        const myGroups = await this.prisma.studentGroup.findMany({
            where:{
                student_id: currentUser.id
            },
            select:{
                groups:{
                    select:{
                        id:true,
                        name:true
                    }
                }
            }
        })

        return {
            success : true,
            data: myGroups.map(el => el.groups)
        }
    }

    async getAllStudents(pagination : PaginationDto){
        const {page,limit,search} = pagination
        const pageNum = page && page > 0 ? page : 1
        const limitNum = limit && limit > 0 ? limit : 10

        const where: any = { status: Status.active }

        if (search && search.trim().length > 0) {
            const q = search.trim()
            where.OR = [
                { full_name: { contains: q, mode: 'insensitive' } },
                { phone: { contains: q } },
                { email: { contains: q, mode: 'insensitive' } },
            ]
        }

        const total = await this.prisma.student.count({ where })

        const students = await this.prisma.student.findMany({
            where,
            select:{
                id:true,
                full_name:true,
                phone:true,
                photo:true,
                email:true,
                address:true,
                birth_date:true,
                created_at:true,
                studentGroups:{
                    select:{
                        groups:{
                            select:{
                                id:true,
                                name:true
                            }
                        }
                    }
                }
            },
            skip:(pageNum - 1) * limitNum,
            take:limitNum
        })

        const formattedStudents = students.map(student => {
            return {
                id:student.id,
                full_name:student.full_name,
                phone:student.phone,
                photo:student.photo,
                email:student.email, 
                address:student.address,
                birth_date:student.birth_date,
                created_at:student.created_at, 
                groups:student.studentGroups.map(group => group.groups)
            }
        })

        const totalPages = Math.ceil(total / limitNum)

        return {
            success:true,
            data:formattedStudents,
            total,
            totalPages
        }
    }

    async createStudent(payload : CreateStudentDto, filename? : string){

        const existStudent = await this.prisma.student.findFirst({
            where:{
                OR:[
                    {phone:payload.phone},
                    {email:payload.email}
                ]
            }
        })

        if(existStudent){

            throw new ConflictException()
        }

        // If groups are provided, validate they exist; otherwise skip
        const groupIds = payload.groups || [];
        if (groupIds.length > 0) {
            const existGroups = await this.prisma.group.findMany({
                where: {
                    id: {
                        in: groupIds
                    }
                }
            })
            if (existGroups.length !== groupIds.length) {
                throw new ConflictException("Group not found")
            }
        }

        const hashPass = await bcrypt.hash(payload.password,10)

        await this.prisma.student.create({
            data:{
                full_name:payload.full_name,
                photo:filename ?? null,
                phone:payload.phone,
                birth_date:new Date(payload.birth_date),
                email:payload.email,
                password:hashPass,
                address:payload.address,
                studentGroups: payload.groups?.length ? {
                    create:payload.groups?.map(gId => ({group_id : gId}))
                } : undefined
            }
        })

        // await this.emailService.sendEmail(payload.email,payload.phone,payload.password)

        return {
            success:true,
            message:"Student created"
        }
    }

    async createHomeworkAnswer(homeworkId : number, user : {id : number}, payload : CreateHomeworkAnswerDto, filename? : string){
        console.log(payload)
        const existHomework = await this.prisma.homework.findFirst({
            where:{
                id:homeworkId 
            }
        })

        if(!existHomework){
            throw new ConflictException("Homework not found")
        } 

        const existHomeworkAnswer = await this.prisma.homeworkAnswerStudent.findFirst({
            where:{
                homework_id:homeworkId,
                student_id:user.id
            }
        })

        if(existHomeworkAnswer){
            throw new ConflictException("Homework answer already exists")
        }

        await this.prisma.homeworkAnswerStudent.create({
            data:{
                homework_id:homeworkId,
                student_id:user.id,
                file:filename ?? null,
                title:payload.title,
            }
        })

        return {
            success:true,
            message:"Homework answer created"
        }
    }
}
