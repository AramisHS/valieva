import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NoteService {
    constructor(private prisma: PrismaService) { }

    async createNote(userId: string, content: string) {
        try {
            return await this.prisma.note.create({
                data: { userId, content },
            });
        } catch (error) {
            const err = error as Error;
            throw new Error(`Error al crear nota: ${err.message}`);
        }
    }

    async getNotes(userId: string) {
        try {
            return await this.prisma.note.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
            });
        } catch (error) {
            const err = error as Error;
            throw new Error(`Error al obtener notas: ${err.message}`);
        }
    }

    async deleteNote(noteId: string, userId: string) {
        try {
            const note = await this.prisma.note.findFirst({
                where: { id: noteId, userId },
            });
            if (!note) throw new Error('Nota no encontrada o no te pertenece');
            return await this.prisma.note.delete({ where: { id: noteId } });
        } catch (error) {
            const err = error as Error;
            throw new Error(`Error al eliminar nota: ${err.message}`);
        }
    }

    async updateNote(noteId: string, userId: string, content: string) {
        try {
            const note = await this.prisma.note.findFirst({
                where: { id: noteId, userId },
            });
            if (!note) throw new Error('Nota no encontrada o no te pertenece');
            return await this.prisma.note.update({
                where: { id: noteId },
                data: { content },
            });
        } catch (error) {
            const err = error as Error;
            throw new Error(`Error al editar nota: ${err.message}`);
        }
    }

    async searchNotes(userId: string, query: string) {
        try {
            return await this.prisma.note.findMany({
                where: {
                    userId,
                    content: { contains: query },
                },
                orderBy: { createdAt: 'desc' },
            });
        } catch (error) {
            const err = error as Error;
            throw new Error(`Error al buscar notas: ${err.message}`);
        }
    }
}