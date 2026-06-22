import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TaskService {
    constructor(private prisma: PrismaService) { }

    async createTask(data: {
        userId: string;
        title: string;
        description?: string;
        dueDate?: Date;
        priority?: 'low' | 'normal' | 'high';
    }) {
        try {
            return await this.prisma.task.create({
                data: {
                    userId: data.userId,
                    title: data.title,
                    description: data.description,
                    dueDate: data.dueDate,
                    priority: data.priority || 'normal',
                    status: 'pending',
                },
            });
        } catch (error) {
            const err = error as Error;
            throw new Error(`Error al crear tarea: ${err.message}`);
        }
    }

    async getTasks(userId: string, status?: string) {
        try {
            const where: any = { userId };
            if (status) where.status = status;
            return await this.prisma.task.findMany({
                where,
                orderBy: [
                    { priority: 'desc' },
                    { createdAt: 'desc' },
                ],
            });
        } catch (error) {
            const err = error as Error;
            throw new Error(`Error al obtener tareas: ${err.message}`);
        }
    }

    async updateTaskStatus(taskId: string, userId: string, status: string) {
        try {
            const task = await this.prisma.task.findFirst({
                where: { id: taskId, userId },
            });
            if (!task) throw new Error('Tarea no encontrada o no te pertenece');
            return await this.prisma.task.update({
                where: { id: taskId },
                data: { status },
            });
        } catch (error) {
            const err = error as Error;
            throw new Error(`Error al actualizar estado: ${err.message}`);
        }
    }

    async updateTaskPriority(taskId: string, userId: string, priority: string) {
        try {
            const task = await this.prisma.task.findFirst({
                where: { id: taskId, userId },
            });
            if (!task) throw new Error('Tarea no encontrada o no te pertenece');
            return await this.prisma.task.update({
                where: { id: taskId },
                data: { priority },
            });
        } catch (error) {
            const err = error as Error;
            throw new Error(`Error al actualizar prioridad: ${err.message}`);
        }
    }

    async deleteTask(taskId: string, userId: string) {
        try {
            const task = await this.prisma.task.findFirst({
                where: { id: taskId, userId },
            });
            if (!task) throw new Error('Tarea no encontrada o no te pertenece');
            return await this.prisma.task.delete({ where: { id: taskId } });
        } catch (error) {
            const err = error as Error;
            throw new Error(`Error al eliminar tarea: ${err.message}`);
        }
    }

    async searchTasks(userId: string, query: string) {
        try {
            return await this.prisma.task.findMany({
                where: {
                    userId,
                    OR: [
                        { title: { contains: query } },
                        { description: { contains: query } },
                    ],
                },
                orderBy: { createdAt: 'desc' },
            });
        } catch (error) {
            const err = error as Error;
            throw new Error(`Error al buscar tareas: ${err.message}`);
        }
    }
}