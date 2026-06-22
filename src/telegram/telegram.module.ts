import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TelegramController } from './telegram.controller';
import { TelegramService } from './telegram.service';
import { AiModule } from '../ai/ai.module';
import { FinanceModule } from '../finance/finance.module';
import { ReminderModule } from '../reminder/reminder.module';
import { NoteModule } from '../note/note.module';
import { TaskModule } from '../task/task.module';
import { TranscriptionService } from '../ai/transcription.service';

@Module({
    imports: [HttpModule, AiModule, FinanceModule, ReminderModule, NoteModule, TaskModule],
    controllers: [TelegramController],
    providers: [TelegramService, TranscriptionService],
    exports: [TelegramService],
})
export class TelegramModule { }