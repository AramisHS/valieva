import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FinanceService {
    constructor(private prisma: PrismaService) { }

    async createTransaction(data: {
        userId: string;
        amount: number;
        category: string;
        description?: string;
        type: 'expense' | 'income';
    }) {
        return this.prisma.transaction.create({
            data: {
                userId: data.userId,
                amount: data.amount,
                category: data.category,
                description: data.description,
                type: data.type,
            },
        });
    }

    async getSummary(userId: string) {
        const transactions = await this.prisma.transaction.findMany({
            where: { userId },
        });
        const totalExpenses = transactions
            .filter(t => t.type === 'expense')
            .reduce((acc, t) => acc + t.amount, 0);
        const totalIncome = transactions
            .filter(t => t.type === 'income')
            .reduce((acc, t) => acc + t.amount, 0);
        const balance = totalIncome - totalExpenses;
        return {
            totalExpenses,
            totalIncome,
            balance,
            count: transactions.length,
        };
    }

    async getTransactions(userId: string) {
        return this.prisma.transaction.findMany({
            where: { userId },
            orderBy: { date: 'desc' },
        });
    }

    async findOrCreateUser(telegramId: string) {
        let user = await this.prisma.user.findUnique({
            where: { telegramId },
        });
        if (!user) {
            user = await this.prisma.user.create({
                data: { telegramId },
            });
        }
        return user;
    }
}