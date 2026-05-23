import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';

@Injectable()
export class DashboardService {
    constructor(private readonly prisma: PrismaService) { }

    async getDashboard(user: any) {
        const studentsCount = await this.prisma.student.count({
            where: { status: 'active' }
        });
        const groupsCount = await this.prisma.group.count({
            where: { status: { in: ['active', 'planned'] } }
        });
        const teachersCount = await this.prisma.teacher.count({
            where: { status: 'active' }
        });
        const leftStudentsCount = await this.prisma.student.count({
            where: { status: 'inactive' }
        });
        const freezeStudentsCount = await this.prisma.student.count({
            where: { status: 'freeze' }
        });

        return {
            success: true,
            data: {
                students: studentsCount,
                groups: groupsCount,
                teachers: teachersCount,
                leftStudents: leftStudentsCount,
                freezeStudents: freezeStudentsCount,
                allPaments: 0, // payment system not implemented yet
                debtorCount: 0, // debt system not implemented yet
            }
        };
    }
}