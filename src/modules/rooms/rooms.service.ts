import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { CreateRoomDto } from './dto/create.dto';
import { UpdateRoomDto } from './dto/update.dto';
import { Status } from '@prisma/client';

@Injectable()
export class RoomsService {
    constructor(private prisma: PrismaService) { }

    async getAllRooms() {
        const rooms = await this.prisma.room.findMany({
            where: { status: Status.active }
        })

        return {
            success: true,
            data: rooms
        }
    }

    async getRoomById(id: number) {
        const room = await this.prisma.room.findFirst({
            where: {
                id,
                status: Status.active
            }
        })

        if (!room) {
            throw new NotFoundException("Room not found with this id")
        }

        return {
            success: true,
            data: room
        }
    }

    async createRoom(payload: CreateRoomDto) {
        const existRoom = await this.prisma.room.findUnique({
            where: { name: payload.name }
        })

        if (existRoom) {
            throw new ConflictException("Room already exists")
        }

        await this.prisma.room.create({
            data: payload
        })

        return {
            success: true,
            message: "Room created"
        }
    }

    async updateRoom(id: number, payload: UpdateRoomDto) {
        const existRoom = await this.prisma.room.findFirst({
            where: {
                id,
                status: Status.active
            }
        })

        if (!existRoom) {
            throw new NotFoundException("Room not found with this id")
        }

        if (payload.name) {
            const duplicate = await this.prisma.room.findFirst({
                where: {
                    name: payload.name,
                    id: { not: id }
                }
            })
            if (duplicate) {
                throw new ConflictException("Room name already exists")
            }
        }

        await this.prisma.room.update({
            where: { id },
            data: {
                ...payload,
                update_at: new Date()
            }
        })

        return {
            success: true,
            message: "Room updated successfully"
        }
    }

    async deleteRoom(id: number) {
        const existRoom = await this.prisma.room.findFirst({
            where: {
                id,
                status: Status.active
            }
        })

        if (!existRoom) {
            throw new NotFoundException("Room not found with this id")
        }

        await this.prisma.room.update({
            where: { id },
            data: {
                status: Status.inactive,
                update_at: new Date()
            }
        })

        return {
            success: true,
            message: "Room deleted successfully"
        }
    }
}
