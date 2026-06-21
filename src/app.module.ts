import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TelegramModule } from './telegram/telegram.module';
import { AiModule } from './ai/ai.module';
import { FinanceModule } from './finance/finance.module';
import { ReminderModule } from './reminder/reminder.module';
import { SchedulerModule } from './scheduler/scheduler.module';
import { NoteModule } from './note/note.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    TelegramModule,
    AiModule,
    FinanceModule,
    ReminderModule,
    SchedulerModule,
    NoteModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }