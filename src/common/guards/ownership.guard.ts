import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PrismaService } from "src/core/database/prisma.service";
import { Role } from "@prisma/client";

/**
 * Ownership Guard - validates that:
 * 1. STUDENT can only access their own data
 * 2. TEACHER can access their own groups/students data
 * 3. ADMIN/SUPERADMIN can access anything
 * 
 * Usage: @Ownership({ model: 'student', paramId: 'id' })
 */
export interface OwnershipMetadata {
    model: 'student' | 'teacher' | 'user' | 'group' | 'lesson' | 'homework' | 'attendance' | 'course' | 'room';
    paramId: string;
    allowAdmin?: boolean; // default true
}

@Injectable()
export class OwnershipGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
        private prisma: PrismaService
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const ownership = this.reflector.getAllAndOverride<OwnershipMetadata>("ownership", [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!ownership) {
            return true;
        }

        const req = context.switchToHttp().getRequest();
        const user = req['user'];
        const resourceId = parseInt(req.params[ownership.paramId]);

        if (!user || !user.role) {
            throw new ForbiddenException("Access denied");
        }

        // SUPERADMIN and ADMIN can access everything
        if (ownership.allowAdmin !== false &&
            (user.role === Role.SUPERADMIN || user.role === Role.ADMIN)) {
            return true;
        }

        // STUDENT - can only access their own data
        if (user.role === Role.STUDENT) {
            return this.validateStudentAccess(user.id, ownership.model, resourceId);
        }

        // TEACHER - can access their own teaching data
        if (user.role === Role.TEACHER) {
            return this.validateTeacherAccess(user.id, ownership.model, resourceId);
        }

        return true;
    }

    private async validateStudentAccess(
        userId: number,
        model: string,
        resourceId: number
    ): Promise<boolean> {
        switch (model) {
            case 'student':
                return userId === resourceId;

            case 'attendance':
                const attendance = await this.prisma.attendance.findFirst({
                    where: { id: resourceId, student_id: userId }
                });
                if (!attendance) throw new ForbiddenException("You can only view your own attendance");
                return true;

            case 'homework': {
                const answer = await this.prisma.homeworkAnswerStudent.findFirst({
                    where: { homework_id: resourceId, student_id: userId }
                });
                if (!answer) throw new ForbiddenException("You can only view your own homework");
                return true;
            }

            case 'group': {
                const group = await this.prisma.studentGroup.findFirst({
                    where: { group_id: resourceId, student_id: userId }
                });
                if (!group) throw new ForbiddenException("You are not a member of this group");
                return true;
            }

            case 'lesson': {
                const lesson = await this.prisma.lesson.findFirst({
                    where: {
                        id: resourceId,
                        groups: {
                            studentGroups: {
                                some: { student_id: userId }
                            }
                        }
                    }
                });
                if (!lesson) throw new ForbiddenException("You can only access your group's lessons");
                return true;
            }

            default:
                throw new ForbiddenException("You don't have permission to access this resource");
        }
    }

    private async validateTeacherAccess(
        userId: number,
        model: string,
        resourceId: number
    ): Promise<boolean> {
        switch (model) {
            case 'teacher':
                return userId === resourceId;

            case 'group': {
                const groupTeacher = await this.prisma.groupTeacher.findFirst({
                    where: { group_id: resourceId, teacher_id: userId }
                });
                if (!groupTeacher) throw new ForbiddenException("You are not assigned to this group");
                return true;
            }

            case 'lesson': {
                const lesson = await this.prisma.lesson.findFirst({
                    where: {
                        id: resourceId,
                        groups: {
                            GroupTeacher: {
                                some: { teacher_id: userId }
                            }
                        }
                    }
                });
                if (!lesson) throw new ForbiddenException("You can only access your group's lessons");
                return true;
            }

            case 'attendance': {
                const att = await this.prisma.attendance.findFirst({
                    where: {
                        id: resourceId,
                        groups: {
                            GroupTeacher: { some: { teacher_id: userId } }
                        }
                    }
                });
                if (!att) throw new ForbiddenException("You can only access your group's attendance");
                return true;
            }

            case 'homework': {
                const hw = await this.prisma.homework.findFirst({
                    where: {
                        id: resourceId,
                        groups: {
                            GroupTeacher: { some: { teacher_id: userId } }
                        }
                    }
                });
                if (!hw) throw new ForbiddenException("You can only access your group's homework");
                return true;
            }

            default:
                throw new ForbiddenException("You don't have permission to access this resource");
        }
    }
}