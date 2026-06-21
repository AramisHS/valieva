import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { TelegramService } from '../telegram/telegram.service';

@Injectable()
export class SchedulerService {
    constructor(
        private prisma: PrismaService,
        private telegramService: TelegramService,
    ) { }

    @Cron('*/10 * * * * *')
    async checkReminders() {
        // console.log('🕒 Revisando recordatorios...');
        const now = new Date();

        const reminders = await this.prisma.reminder.findMany({
            where: {
                notified: false,
                dateTime: { lte: now },
            },
            include: { user: true },
        });

        if (reminders.length > 0) {
            console.log(`📋 Encontrados ${reminders.length} recordatorios pendientes`);
        }

        for (const reminder of reminders) {
            const chatId = parseInt(reminder.user.telegramId);
            await this.telegramService.sendMessage(chatId, `⏰ ¡Recordatorio! ${reminder.title}`);
            await this.prisma.reminder.update({
                where: { id: reminder.id },
                data: { notified: true },
            });
            console.log(`✅ Enviado recordatorio: ${reminder.title}`);
        }
    }
}