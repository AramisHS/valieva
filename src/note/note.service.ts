import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NoteService {
    constructor(private prisma: PrismaService) { }

    async createNote(userId: string, content: string) {
        return this.prisma.note.create({
            data: { userId, content },
        });
    }

    async getNotes(userId: string) {
        return this.prisma.note.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
    }
}