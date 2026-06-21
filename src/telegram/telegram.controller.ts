import { Controller, Post, Body, Res, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import { TelegramService } from './telegram.service';
import { AiService } from '../ai/ai.service';
import { TranscriptionService } from '../ai/transcription.service';
import { FinanceService } from '../finance/finance.service';
import { ReminderService } from '../reminder/reminder.service';
import { NoteService } from '../note/note.service';

@Controller('webhook')
export class TelegramController {
    constructor(
        private readonly telegramService: TelegramService,
        private readonly aiService: AiService,
        private readonly transcriptionService: TranscriptionService,
        private readonly financeService: FinanceService,
        private readonly reminderService: ReminderService,
        private readonly noteService: NoteService,
    ) { }

    @Post()
    async handleWebhook(@Body() update: any, @Res() res: Response) {
        res.status(HttpStatus.OK).send('OK');

        const message = update.message;
        if (!message) return;

        const chatId = message.chat.id;
        const telegramId = String(message.from.id);
        let text: string | null = null;

        // Si es mensaje de texto
        if (message.text) {
            text = message.text;
        }
        // Si es mensaje de voz
        else if (message.voice) {
            console.log('🎤 Mensaje de voz recibido, transcribiendo...');
            const fileBuffer = await this.telegramService.getFile(message.voice.file_id);
            const mimeType = 'audio/ogg'; // Telegram usa OGG para voice
            text = await this.transcriptionService.transcribeAudio(fileBuffer, mimeType);
            console.log('📝 Transcripción:', text);
        }
        // Si es mensaje de audio (otro formato)
        else if (message.audio) {
            console.log('🎵 Audio recibido, transcribiendo...');
            const fileBuffer = await this.telegramService.getFile(message.audio.file_id);
            const mimeType = message.audio.mime_type || 'audio/mpeg';
            text = await this.transcriptionService.transcribeAudio(fileBuffer, mimeType);
            console.log('📝 Transcripción:', text);
        }

        if (!text) {
            await this.telegramService.sendMessage(chatId, '❌ No entendí el mensaje (solo texto o audio).');
            return;
        }

        // Obtener o crear usuario
        const user = await this.financeService.findOrCreateUser(telegramId);
        if (!user) {
            await this.telegramService.sendMessage(chatId, '❌ Error al crear usuario');
            return;
        }

        // Procesar con IA
        const parsed = await this.aiService.parseMessage(text);
        let replies: string[] = [];

        if (parsed.actions && Array.isArray(parsed.actions)) {
            for (const action of parsed.actions) {
                const reply = await this.processAction(action, user.id);
                if (reply) replies.push(reply);
            }
        } else {
            const reply = await this.processAction(parsed, user.id);
            if (reply) replies.push(reply);
        }

        for (const reply of replies) {
            await this.telegramService.sendMessage(chatId, reply);
        }
    }

    private async processAction(action: any, userId: string): Promise<string | null> {
        switch (action.intent) {
            case 'expense':
                await this.financeService.createTransaction({
                    userId,
                    amount: action.amount,
                    category: action.category,
                    description: action.description,
                    type: 'expense',
                });
                return `💸 *Gasto registrado*\nMonto: *${action.amount} MXN*\nCategoría: ${action.category}\n📝 ${action.description || ''}`;

            case 'income':
                await this.financeService.createTransaction({
                    userId,
                    amount: action.amount,
                    category: action.category,
                    description: action.description,
                    type: 'income',
                });
                return `💰 *Ingreso registrado*\nMonto: *${action.amount} MXN*\nCategoría: ${action.category}`;

            case 'summary':
                const summary = await this.financeService.getSummary(userId);
                return `📊 *Resumen financiero*\n\n💸 Gastos: *${summary.totalExpenses.toFixed(2)} MXN*\n💰 Ingresos: *${summary.totalIncome.toFixed(2)} MXN*\n📈 Balance: *${summary.balance.toFixed(2)} MXN*\n\n📌 Total transacciones: ${summary.count}`;

            case 'task':
                if (action.dateTime) {
                    await this.reminderService.createReminder({
                        userId,
                        title: action.description,
                        dateTime: new Date(action.dateTime),
                    });
                    const fecha = new Date(action.dateTime).toLocaleString('es-MX', {
                        timeZone: 'America/Mexico_City',
                    });
                    return `⏰ *Recordatorio guardado*\n📝 "${action.description}"\n📅 ${fecha}\n*Prioridad:* ${action.priority || 'normal'}\n*Estado:* ${action.status || 'pending'}\n\nTe avisaré cuando llegue el momento.`;
                } else {
                    return `📌 *Tarea recordada*\n📝 ${action.description}\n(Sin fecha específica)\n*Prioridad:* ${action.priority || 'normal'}`;
                }

            case 'note':
                await this.noteService.createNote(userId, action.description);
                return `📝 *Nota guardada*\n"${action.description}"\n\nPuedes consultar tus notas con "mis notas".`;

            default:
                return `🤔 No entendí esa parte del mensaje.`;
        }
    }
}