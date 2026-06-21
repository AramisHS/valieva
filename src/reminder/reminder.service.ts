import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReminderService {
    constructor(private prisma: PrismaService) { }

    async createReminder(data: {
        userId: string;
        title: string;
        dateTime: Date;
    }) {
        // Validar que la fecha sea válida
        if (isNaN(data.dateTime.getTime())) {
            console.error('❌ Fecha inválida recibida:', data.dateTime);
            throw new Error('Fecha inválida para recordatorio');
        }

        return this.prisma.reminder.create({
            data: {
                userId: data.userId,
                title: data.title,
                dateTime: data.dateTime,
                notified: false,
            },
        });
    }

    async getPendingReminders() {
        return this.prisma.reminder.findMany({
            where: {
                notified: false,
                dateTime: { lte: new Date() },
            },
            include: { user: true },
        });
    }

    async markAsNotified(reminderId: string) {
        return this.prisma.reminder.update({
            where: { id: reminderId },
            data: { notified: true },
        });
    }

    async getRemindersByUser(userId: string) {
        return this.prisma.reminder.findMany({
            where: { userId },
            orderBy: { dateTime: 'asc' },
        });
    }
}