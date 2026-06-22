import { Controller, Post, Body, Res, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import { TelegramService } from './telegram.service';
import { AiService } from '../ai/ai.service';
import { TranscriptionService } from '../ai/transcription.service';
import { FinanceService } from '../finance/finance.service';
import { ReminderService } from '../reminder/reminder.service';
import { NoteService } from '../note/note.service';
import { TaskService } from '../task/task.service';
import { ReportService } from '../report/report.service';
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
    private readonly reportService: ReportService,
  ) {}

  @Post()
  async handleWebhook(@Body() update: any, @Res() res: Response) {
    res.status(HttpStatus.OK).send('OK');
    const message = update.message;
    if (!message) return;

    const chatId = message.chat.id;
    const telegramId = String(message.from.id);
    let text: string | null = null;

    if (message.text) text = message.text;
    else if (message.voice) {
      try {
        const fileBuffer = await this.telegramService.getFile(message.voice.file_id);
        text = await this.transcriptionService.transcribeAudio(fileBuffer, 'audio/ogg');
      } catch (e) {
        await this.telegramService.sendMessage(chatId, '❌ Error al transcribir audio.');
        return;
      }
    } else if (message.audio) {
      try {
        const fileBuffer = await this.telegramService.getFile(message.audio.file_id);
        text = await this.transcriptionService.transcribeAudio(fileBuffer, message.audio.mime_type || 'audio/mpeg');
      } catch (e) {
        await this.telegramService.sendMessage(chatId, '❌ Error al transcribir audio.');
        return;
      }
    }

    if (!text) {
      await this.telegramService.sendMessage(chatId, '❌ No entendí el mensaje (solo texto o audio).');
      return;
    }

    const user = await this.financeService.findOrCreateUser(telegramId);
    if (!user) {
      await this.telegramService.sendMessage(chatId, '❌ Error al crear usuario');
      return;
    }

    const manualHandled = await this.handleManualCommands(text, user.id, chatId);
    if (manualHandled) return;

    let parsed;
    try {
      parsed = await this.aiService.parseMessage(text);
    } catch (error) {
      if (error instanceof RateLimitError) {
        const mins = Math.ceil(error.retryAfterSeconds / 60);
        await this.telegramService.sendMessage(chatId, `😅 *¡Se acabaron los tokens!*\nReinicia en *${mins} minutos*.`);
        return;
      }
      await this.telegramService.sendMessage(chatId, '❌ Error al procesar el mensaje.');
      return;
    }

    const actions = parsed.actions && Array.isArray(parsed.actions) ? parsed.actions : [parsed];
    const replies: string[] = [];
    const pdfBuffers: { fileName: string; buffer: Buffer }[] = [];

    for (const action of actions) {
      const result = await this.processAction(action, user.id, chatId);
      if (result) {
        if (result.type === 'pdf') {
          pdfBuffers.push({ fileName: result.fileName, buffer: result.buffer });
        } else if (result.type === 'message') {
          replies.push(result.message);
        }
      }
    }

    if (replies.length > 0) {
      await this.telegramService.sendMessage(chatId, replies.join('\n'));
    }
    for (const pdf of pdfBuffers) {
      await this.telegramService.sendPDFDocument(chatId, pdf.fileName, pdf.buffer);
    }
  }

  private async processAction(action: any, userId: string, chatId: number): Promise<any> {
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
          return { type: 'message', message: `💸 Gasto registrado` };

        case 'income':
          await this.financeService.createTransaction({
            userId,
            amount: action.amount,
            category: action.category,
            description: action.description,
            type: 'income',
          });
          return { type: 'message', message: `💰 Ingreso registrado` };

        case 'summary': {
          // ✅ Generar PDF usando ReportService
          const pdfBuffer = await this.reportService.generateFinancialReport(userId);
          const fileName = `resumen_${new Date().toISOString().slice(0,10)}.pdf`;
          return { type: 'pdf', fileName, buffer: pdfBuffer };
        }

        case 'task':
          if (action.dateTime) {
            await this.reminderService.createReminder({
              userId,
              title: action.description,
              dateTime: new Date(action.dateTime),
            });
            return { type: 'message', message: `⏰ Recordatorio: "${action.description}"` };
          } else {
            return { type: 'message', message: `📌 Tarea: "${action.description}"` };
          }

        case 'task_create':
          await this.taskService.createTask({
            userId,
            title: action.title || action.description,
            description: action.description,
            dueDate: action.dueDate ? new Date(action.dueDate) : undefined,
            priority: action.priority || 'normal',
          });
          return { type: 'message', message: `✅ Tarea creada` };

        case 'task_list': {
          const tasks = await this.taskService.getTasks(userId, action.filter);
          if (!tasks.length) return { type: 'message', message: `📭 No tienes tareas.` };
          const statusMap: Record<string, string> = { pending: '⏳', in_progress: '🔄', done: '✅' };
          const list = tasks.map((t, i) =>
            `${i+1}. ${statusMap[t.status] || '📌'} *${t.title}* ${t.priority === 'high' ? '🔥' : ''}`
          ).join('\n');
          return { type: 'message', message: `📋 *Tus tareas (${tasks.length})*\n\n${list}` };
        }

        case 'task_status': {
          const all = await this.taskService.getTasks(userId);
          const idx = (action.taskIndex || 1) - 1;
          if (idx < 0 || idx >= all.length) return { type: 'message', message: '❌ No encontré esa tarea.' };
          await this.taskService.updateTaskStatus(all[idx].id, userId, action.status);
          return { type: 'message', message: `✅ Tarea marcada como *${action.status}*` };
        }

        case 'task_delete': {
          const all = await this.taskService.getTasks(userId);
          const idx = (action.taskIndex || 1) - 1;
          if (idx < 0 || idx >= all.length) return { type: 'message', message: '❌ No encontré esa tarea.' };
          await this.taskService.deleteTask(all[idx].id, userId);
          return { type: 'message', message: `🗑️ Tarea eliminada` };
        }

        case 'task_search': {
          const results = await this.taskService.searchTasks(userId, action.query);
          if (!results.length) return { type: 'message', message: `🔍 No encontré tareas con "${action.query}"` };
          const list = results.map((t, i) => `${i+1}. *${t.title}* ${t.status === 'done' ? '✅' : `(${t.status})`}`).join('\n');
          return { type: 'message', message: `🔍 *Resultados (${results.length})*\n\n${list}` };
        }

        case 'note':
          await this.noteService.createNote(userId, action.description);
          return { type: 'message', message: `📝 Nota guardada` };

        case 'notes': {
          const notes = await this.noteService.getNotes(userId);
          if (!notes.length) return { type: 'message', message: '📭 No tienes notas.' };
          const list = notes.map((n, i) => `${i+1}. ${n.content}`).join('\n');
          return { type: 'message', message: `📋 *Tus notas (${notes.length})*\n\n${list}` };
        }

        case 'edit_note': {
          const notes = await this.noteService.getNotes(userId);
          const idx = (action.noteIndex || 1) - 1;
          if (idx < 0 || idx >= notes.length) return { type: 'message', message: '❌ Nota no encontrada.' };
          await this.noteService.updateNote(notes[idx].id, userId, action.newContent);
          return { type: 'message', message: `✏️ Nota editada` };
        }

        case 'delete_note': {
          const notes = await this.noteService.getNotes(userId);
          const idx = (action.noteIndex || 1) - 1;
          if (idx < 0 || idx >= notes.length) return { type: 'message', message: '❌ Nota no encontrada.' };
          await this.noteService.deleteNote(notes[idx].id, userId);
          return { type: 'message', message: `🗑️ Nota eliminada` };
        }

        case 'search_notes': {
          const results = await this.noteService.searchNotes(userId, action.query);
          if (!results.length) return { type: 'message', message: `🔍 No encontré notas con "${action.query}"` };
          const list = results.map((n, i) => `${i+1}. ${n.content}`).join('\n');
          return { type: 'message', message: `🔍 *Resultados (${results.length})*\n\n${list}` };
        }

        default:
          return null;
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown');
      console.error('❌ processAction error:', err.message);
      return { type: 'message', message: `❌ Error: ${err.message}` };
    }
  }

  // ------------------------------------------------------------
  // Comandos manuales (notas y tareas por regex)
  // ------------------------------------------------------------
  private async handleManualCommands(text: string, userId: string, chatId: number): Promise<boolean> {
    try {
      // NOTAS
      const delNote = text.match(/^(borrar|eliminar)\s+nota\s+(\d+)/i);
      if (delNote) {
        const notes = await this.noteService.getNotes(userId);
        const idx = parseInt(delNote[2]) - 1;
        if (idx >= 0 && idx < notes.length) {
          await this.noteService.deleteNote(notes[idx].id, userId);
          await this.telegramService.sendMessage(chatId, `🗑️ Nota eliminada`);
        } else {
          await this.telegramService.sendMessage(chatId, '❌ No encontré esa nota.');
        }
        return true;
      }

      const editNote = text.match(/^editar\s+nota\s+(\d+)\s*:?\s*(.*)/i);
      if (editNote) {
        const notes = await this.noteService.getNotes(userId);
        const idx = parseInt(editNote[1]) - 1;
        const content = editNote[2].trim();
        if (!content) {
          await this.telegramService.sendMessage(chatId, '❌ Escribe el nuevo contenido.');
          return true;
        }
        if (idx >= 0 && idx < notes.length) {
          await this.noteService.updateNote(notes[idx].id, userId, content);
          await this.telegramService.sendMessage(chatId, `✏️ Nota editada`);
        } else {
          await this.telegramService.sendMessage(chatId, '❌ No encontré esa nota.');
        }
        return true;
      }

      const searchNote = text.match(/^buscar\s+(.*?)\s+en\s+notas/i) || text.match(/^notas\s+con\s+(.*)/i);
      if (searchNote) {
        const query = searchNote[1].trim();
        if (!query) { await this.telegramService.sendMessage(chatId, '❌ Escribe algo para buscar.'); return true; }
        const results = await this.noteService.searchNotes(userId, query);
        if (results.length === 0) {
          await this.telegramService.sendMessage(chatId, `🔍 No encontré notas con "${query}"`);
        } else {
          const list = results.map((n, i) => `${i+1}. ${n.content}`).join('\n');
          await this.telegramService.sendMessage(chatId, `🔍 *Resultados (${results.length})*\n\n${list}`);
        }
        return true;
      }

      // TAREAS
      const completeTask = text.match(/^completar\s+tarea\s+(\d+)/i);
      if (completeTask) {
        const tasks = await this.taskService.getTasks(userId);
        const idx = parseInt(completeTask[1]) - 1;
        if (idx >= 0 && idx < tasks.length) {
          await this.taskService.updateTaskStatus(tasks[idx].id, userId, 'done');
          await this.telegramService.sendMessage(chatId, `✅ Tarea completada`);
        } else {
          await this.telegramService.sendMessage(chatId, '❌ No encontré esa tarea.');
        }
        return true;
      }

      const delTask = text.match(/^(borrar|eliminar)\s+tarea\s+(\d+)/i);
      if (delTask) {
        const tasks = await this.taskService.getTasks(userId);
        const idx = parseInt(delTask[2]) - 1;
        if (idx >= 0 && idx < tasks.length) {
          await this.taskService.deleteTask(tasks[idx].id, userId);
          await this.telegramService.sendMessage(chatId, `🗑️ Tarea eliminada`);
        } else {
          await this.telegramService.sendMessage(chatId, '❌ No encontré esa tarea.');
        }
        return true;
      }

      const searchTask = text.match(/^buscar\s+tarea\s+(.*)/i);
      if (searchTask) {
        const query = searchTask[1].trim();
        if (!query) { await this.telegramService.sendMessage(chatId, '❌ Escribe algo para buscar.'); return true; }
        const results = await this.taskService.searchTasks(userId, query);
        if (results.length === 0) {
          await this.telegramService.sendMessage(chatId, `🔍 No encontré tareas con "${query}"`);
        } else {
          const list = results.map((t, i) => `${i+1}. ${t.title} ${t.status === 'done' ? '✅' : `(${t.status})`}`).join('\n');
          await this.telegramService.sendMessage(chatId, `🔍 *Resultados (${results.length})*\n\n${list}`);
        }
        return true;
      }

      return false;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown');
      await this.telegramService.sendMessage(chatId, `❌ Error: ${err.message}`);
      return true;
    }
  }
}