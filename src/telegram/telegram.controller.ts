import { Controller, Post, Body, Res, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import { TelegramService } from './telegram.service';
import { AiService } from '../ai/ai.service';
import { TranscriptionService } from '../ai/transcription.service';
import { FinanceService } from '../finance/finance.service';
import { ReminderService } from '../reminder/reminder.service';
import { NoteService } from '../note/note.service';
import { TaskService } from '../task/task.service';
import { RateLimitError } from '../ai/errors';

@Controller('webhook')
export class TelegramController {
    constructor(
        private readonly telegramService: TelegramService,
        private readonly aiService: AiService,
        private readonly transcriptionService: TranscriptionService,
        private readonly financeService: FinanceService,
        private readonly reminderService: ReminderService,
        private readonly noteService: NoteService,
        private readonly taskService: TaskService,
    ) { }

    @Post()
    async handleWebhook(@Body() update: any, @Res() res: Response) {
        res.status(HttpStatus.OK).send('OK');

        const message = update.message;
        if (!message) return;

        const chatId = message.chat.id;
        const telegramId = String(message.from.id);
        let text: string | null = null;

        // ---- Texto ----
        if (message.text) {
            text = message.text;
        }
        // ---- Voz ----
        else if (message.voice) {
            console.log('🎤 Mensaje de voz recibido, transcribiendo...');
            try {
                const fileBuffer = await this.telegramService.getFile(message.voice.file_id);
                const mimeType = 'audio/ogg';
                text = await this.transcriptionService.transcribeAudio(fileBuffer, mimeType);
                console.log('📝 Transcripción:', text);
            } catch (error) {
                const err = error as Error;
                console.error('Error al transcribir voz:', err.message);
                await this.telegramService.sendMessage(chatId, '❌ Error al transcribir el audio.');
                return;
            }
        }
        // ---- Audio ----
        else if (message.audio) {
            console.log('🎵 Audio recibido, transcribiendo...');
            try {
                const fileBuffer = await this.telegramService.getFile(message.audio.file_id);
                const mimeType = message.audio.mime_type || 'audio/mpeg';
                text = await this.transcriptionService.transcribeAudio(fileBuffer, mimeType);
                console.log('📝 Transcripción:', text);
            } catch (error) {
                const err = error as Error;
                console.error('Error al transcribir audio:', err.message);
                await this.telegramService.sendMessage(chatId, '❌ Error al transcribir el audio.');
                return;
            }
        }

        if (!text) {
            await this.telegramService.sendMessage(chatId, '❌ No entendí el mensaje (solo texto o audio).');
            return;
        }

        // ---- Usuario ----
        const user = await this.financeService.findOrCreateUser(telegramId);
        if (!user) {
            await this.telegramService.sendMessage(chatId, '❌ Error al crear usuario');
            return;
        }

        // ---- Comandos manuales (no usan IA) ----
        const manualHandled = await this.handleManualCommands(text, user.id, chatId);
        if (manualHandled) return;

        // ---- IA ----
        let parsed;
        try {
            parsed = await this.aiService.parseMessage(text);
        } catch (error) {
            if (error instanceof RateLimitError) {
                const minutos = Math.ceil(error.retryAfterSeconds / 60);
                const segundosRestantes = Math.ceil(error.retryAfterSeconds);
                await this.telegramService.sendMessage(
                    chatId,
                    `😅 *¡Se acabaron los tokens del día!*\n\n` +
                    `El límite se reinicia en aproximadamente *${minutos} minutos* (${segundosRestantes} segundos).\n\n` +
                    `Mientras tanto, usa comandos manuales como "mis notas", "mis tareas" o "resumen" (no usan IA).\n\n` +
                    `⏳ Vuelve en un ratito. ¡Nos vemos! 👋`
                );
                return;
            }
            console.error('Error en IA:', error);
            await this.telegramService.sendMessage(chatId, '❌ Hubo un error al procesar tu mensaje. Intenta de nuevo.');
            return;
        }

        // ---- Procesar acciones ----
        let actions = [];
        if (parsed.actions && Array.isArray(parsed.actions)) {
            actions = parsed.actions;
        } else {
            actions = [parsed];
        }

        const shortReplies: string[] = [];

        for (const action of actions) {
            const result = await this.processAction(action, user.id);
            if (result) {
                shortReplies.push(result.shortMessage);
                // Los detalles ya se imprimieron en processAction
            }
        }

        // Enviar respuestas cortas
        if (shortReplies.length > 0) {
            // Si hay varias acciones, enviamos un solo mensaje resumen
            const finalMessage = shortReplies.join('\n');
            await this.telegramService.sendMessage(chatId, finalMessage);
        } else {
            await this.telegramService.sendMessage(chatId, '🤔 No entendí ese mensaje.');
        }
    }

    // ------------------------------------------------------------
    // Procesa una acción individual – respuesta ultra corta + logs
    // ------------------------------------------------------------
    private async processAction(action: any, userId: string): Promise<{ shortMessage: string } | null> {
        try {
            switch (action.intent) {
                case 'expense':
                    await this.financeService.createTransaction({
                        userId,
                        amount: action.amount,
                        category: action.category,
                        description: action.description,
                        type: 'expense',
                    });
                    console.log(`💸 Gasto: ${action.amount} MXN | ${action.category} | ${action.description || ''}`);
                    return { shortMessage: `💸 Gasto registrado` };

                case 'income':
                    await this.financeService.createTransaction({
                        userId,
                        amount: action.amount,
                        category: action.category,
                        description: action.description,
                        type: 'income',
                    });
                    console.log(`💰 Ingreso: ${action.amount} MXN | ${action.category} | ${action.description || ''}`);
                    return { shortMessage: `💰 Ingreso registrado` };

                case 'summary':
                    const summary = await this.financeService.getSummary(userId);
                    const detail = `📊 Resumen:\n💸 Gastos: ${summary.totalExpenses.toFixed(2)} MXN\n💰 Ingresos: ${summary.totalIncome.toFixed(2)} MXN\n📈 Balance: ${summary.balance.toFixed(2)} MXN`;
                    console.log(detail);
                    // Para el resumen, enviamos el detalle completo porque es informativo
                    return { shortMessage: detail };

                case 'task':
                    if (action.dateTime) {
                        await this.reminderService.createReminder({
                            userId,
                            title: action.description,
                            dateTime: new Date(action.dateTime),
                        });
                        const fecha = new Date(action.dateTime).toLocaleString('es-MX', { timeZone: 'America/Mexico_City' });
                        console.log(`⏰ Recordatorio: "${action.description}" para ${fecha}`);
                        return { shortMessage: `⏰ Recordatorio: "${action.description}" para ${fecha}` };
                    } else {
                        console.log(`📌 Tarea: "${action.description}" (sin fecha)`);
                        return { shortMessage: `📌 Tarea: "${action.description}"` };
                    }

                case 'task_create':
                    await this.taskService.createTask({
                        userId,
                        title: action.title || action.description,
                        description: action.description,
                        dueDate: action.dueDate ? new Date(action.dueDate) : undefined,
                        priority: action.priority || 'normal',
                    });
                    console.log(`✅ Tarea creada: "${action.title || action.description}"`);
                    return { shortMessage: `✅ Tarea creada` };

                case 'task_list':
                    const tasks = await this.taskService.getTasks(userId, action.filter);
                    if (tasks.length === 0) {
                        return { shortMessage: `📭 No tienes tareas${action.filter ? ` ${action.filter}` : ''}.` };
                    }
                    const statusMap: Record<string, string> = { pending: '⏳', in_progress: '🔄', done: '✅' };
                    const taskList = tasks.map((t, i) =>
                        `${i + 1}. ${statusMap[t.status] || '📌'} *${t.title}* ${t.priority === 'high' ? '🔥' : ''}`
                    ).join('\n');
                    const listMsg = `📋 *Tus tareas (${tasks.length})*\n\n${taskList}`;
                    console.log(listMsg);
                    return { shortMessage: listMsg };

                case 'task_status':
                    const allTasksForStatus = await this.taskService.getTasks(userId);
                    const idxStatus = action.taskIndex - 1;
                    if (idxStatus < 0 || idxStatus >= allTasksForStatus.length) return { shortMessage: '❌ No encontré esa tarea.' };
                    const taskIdStatus = allTasksForStatus[idxStatus].id;
                    await this.taskService.updateTaskStatus(taskIdStatus, userId, action.status);
                    console.log(`✅ Tarea "${allTasksForStatus[idxStatus].title}" → ${action.status}`);
                    return { shortMessage: `✅ Tarea marcada como *${action.status}*` };

                case 'task_delete':
                    const allTasksForDelete = await this.taskService.getTasks(userId);
                    const idxDelete = action.taskIndex - 1;
                    if (idxDelete < 0 || idxDelete >= allTasksForDelete.length) return { shortMessage: '❌ No encontré esa tarea.' };
                    const taskIdDelete = allTasksForDelete[idxDelete].id;
                    const titleDel = allTasksForDelete[idxDelete].title;
                    await this.taskService.deleteTask(taskIdDelete, userId);
                    console.log(`🗑️ Tarea eliminada: "${titleDel}"`);
                    return { shortMessage: `🗑️ Tarea eliminada` };

                case 'task_search':
                    const searchResults = await this.taskService.searchTasks(userId, action.query);
                    if (searchResults.length === 0) return { shortMessage: `🔍 No encontré tareas con "${action.query}"` };
                    const searchListTasks = searchResults.map((t, i) =>
                        `${i + 1}. *${t.title}* ${t.status === 'done' ? '✅' : `(${t.status})`}`
                    ).join('\n');
                    const searchMsg = `🔍 *Resultados para "${action.query}" (${searchResults.length})*\n\n${searchListTasks}`;
                    console.log(searchMsg);
                    return { shortMessage: searchMsg };

                case 'note':
                    await this.noteService.createNote(userId, action.description);
                    console.log(`📝 Nota: "${action.description}"`);
                    return { shortMessage: `📝 Nota guardada` };

                case 'notes':
                    const notes = await this.noteService.getNotes(userId);
                    if (notes.length === 0) return { shortMessage: '📭 No tienes notas guardadas.' };
                    const noteList = notes.map((n, i) => `${i + 1}. ${n.content} *(${new Date(n.createdAt).toLocaleDateString('es-MX')})*`).join('\n');
                    const noteMsg = `📋 *Tus notas (${notes.length})*\n\n${noteList}`;
                    console.log(noteMsg);
                    return { shortMessage: noteMsg };

                case 'edit_note':
                    const notesForEdit = await this.noteService.getNotes(userId);
                    const idxEdit = action.noteIndex - 1;
                    if (idxEdit < 0 || idxEdit >= notesForEdit.length) return { shortMessage: '❌ No encontré esa nota.' };
                    const noteIdEdit = notesForEdit[idxEdit].id;
                    await this.noteService.updateNote(noteIdEdit, userId, action.newContent);
                    console.log(`✏️ Nota editada: "${notesForEdit[idxEdit].content}" → "${action.newContent}"`);
                    return { shortMessage: `✏️ Nota editada` };

                case 'delete_note':
                    const notesForDelete = await this.noteService.getNotes(userId);
                    const idxDelNote = action.noteIndex - 1;
                    if (idxDelNote < 0 || idxDelNote >= notesForDelete.length) return { shortMessage: '❌ No encontré esa nota.' };
                    const noteIdDel = notesForDelete[idxDelNote].id;
                    await this.noteService.deleteNote(noteIdDel, userId);
                    console.log(`🗑️ Nota eliminada: "${notesForDelete[idxDelNote].content}"`);
                    return { shortMessage: `🗑️ Nota eliminada` };

                case 'search_notes':
                    const searchNoteResults = await this.noteService.searchNotes(userId, action.query);
                    if (searchNoteResults.length === 0) return { shortMessage: `🔍 No encontré notas con "${action.query}"` };
                    const searchListNotes = searchNoteResults.map((n, i) => `${i + 1}. ${n.content} *(${new Date(n.createdAt).toLocaleDateString('es-MX')})*`).join('\n');
                    const searchNoteMsg = `🔍 *Resultados para "${action.query}" (${searchNoteResults.length})*\n\n${searchListNotes}`;
                    console.log(searchNoteMsg);
                    return { shortMessage: searchNoteMsg };

                default:
                    return null;
            }
        } catch (error) {
            const err = error as Error;
            console.error('Error en processAction:', err.message);
            return { shortMessage: `❌ Error: ${err.message}` };
        }
    }

    // ------------------------------------------------------------
    // Comandos manuales (notas y tareas por regex) – también cortos
    // ------------------------------------------------------------
    private async handleManualCommands(text: string, userId: string, chatId: number): Promise<boolean> {
        try {
            // ========== NOTAS ==========
            const deleteNoteMatch = text.match(/^(borrar|eliminar)\s+nota\s+(\d+)/i);
            if (deleteNoteMatch) {
                const index = parseInt(deleteNoteMatch[2]) - 1;
                const notes = await this.noteService.getNotes(userId);
                if (index >= 0 && index < notes.length) {
                    await this.noteService.deleteNote(notes[index].id, userId);
                    console.log(`🗑️ Nota eliminada: "${notes[index].content}"`);
                    await this.telegramService.sendMessage(chatId, `🗑️ Nota eliminada`);
                } else {
                    await this.telegramService.sendMessage(chatId, '❌ No encontré esa nota.');
                }
                return true;
            }

            const editNoteMatch = text.match(/^editar\s+nota\s+(\d+)\s*:?\s*(.*)/i);
            if (editNoteMatch) {
                const index = parseInt(editNoteMatch[1]) - 1;
                const newContent = editNoteMatch[2].trim();
                if (!newContent) {
                    await this.telegramService.sendMessage(chatId, '❌ Debes escribir el nuevo contenido.');
                    return true;
                }
                const notes = await this.noteService.getNotes(userId);
                if (index >= 0 && index < notes.length) {
                    await this.noteService.updateNote(notes[index].id, userId, newContent);
                    console.log(`✏️ Nota editada: "${notes[index].content}" → "${newContent}"`);
                    await this.telegramService.sendMessage(chatId, `✏️ Nota editada`);
                } else {
                    await this.telegramService.sendMessage(chatId, '❌ No encontré esa nota.');
                }
                return true;
            }

            const searchNoteMatch = text.match(/^buscar\s+(.*?)\s+en\s+notas/i) || text.match(/^notas\s+con\s+(.*)/i);
            if (searchNoteMatch) {
                const query = searchNoteMatch[1].trim();
                if (!query) {
                    await this.telegramService.sendMessage(chatId, '❌ Debes escribir algo para buscar.');
                    return true;
                }
                const results = await this.noteService.searchNotes(userId, query);
                if (results.length === 0) {
                    await this.telegramService.sendMessage(chatId, `🔍 No encontré notas con "${query}"`);
                } else {
                    const list = results.map((n, i) => `${i + 1}. ${n.content}`).join('\n');
                    const msg = `🔍 *Resultados (${results.length})*\n\n${list}`;
                    console.log(msg);
                    await this.telegramService.sendMessage(chatId, msg);
                }
                return true;
            }

            // ========== TAREAS ==========
            const completeTaskMatch = text.match(/^completar\s+tarea\s+(\d+)/i);
            if (completeTaskMatch) {
                const index = parseInt(completeTaskMatch[1]) - 1;
                const tasks = await this.taskService.getTasks(userId);
                if (index >= 0 && index < tasks.length) {
                    await this.taskService.updateTaskStatus(tasks[index].id, userId, 'done');
                    console.log(`✅ Tarea completada: "${tasks[index].title}"`);
                    await this.telegramService.sendMessage(chatId, `✅ Tarea completada`);
                } else {
                    await this.telegramService.sendMessage(chatId, '❌ No encontré esa tarea.');
                }
                return true;
            }

            const deleteTaskMatch = text.match(/^(borrar|eliminar)\s+tarea\s+(\d+)/i);
            if (deleteTaskMatch) {
                const index = parseInt(deleteTaskMatch[2]) - 1;
                const tasks = await this.taskService.getTasks(userId);
                if (index >= 0 && index < tasks.length) {
                    await this.taskService.deleteTask(tasks[index].id, userId);
                    console.log(`🗑️ Tarea eliminada: "${tasks[index].title}"`);
                    await this.telegramService.sendMessage(chatId, `🗑️ Tarea eliminada`);
                } else {
                    await this.telegramService.sendMessage(chatId, '❌ No encontré esa tarea.');
                }
                return true;
            }

            const searchTaskMatch = text.match(/^buscar\s+tarea\s+(.*)/i);
            if (searchTaskMatch) {
                const query = searchTaskMatch[1].trim();
                if (!query) {
                    await this.telegramService.sendMessage(chatId, '❌ Debes escribir algo para buscar.');
                    return true;
                }
                const results = await this.taskService.searchTasks(userId, query);
                if (results.length === 0) {
                    await this.telegramService.sendMessage(chatId, `🔍 No encontré tareas con "${query}"`);
                } else {
                    const list = results.map((t, i) => `${i + 1}. ${t.title} ${t.status === 'done' ? '✅' : `(${t.status})`}`).join('\n');
                    const msg = `🔍 *Resultados (${results.length})*\n\n${list}`;
                    console.log(msg);
                    await this.telegramService.sendMessage(chatId, msg);
                }
                return true;
            }

            return false;
        } catch (error) {
            const err = error as Error;
            console.error('Error en handleManualCommands:', err.message);
            await this.telegramService.sendMessage(chatId, `❌ Error: ${err.message}`);
            return true;
        }
    }
}