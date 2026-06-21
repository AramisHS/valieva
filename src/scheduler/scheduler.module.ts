import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { SchedulerService } from './scheduler.service';
import { TelegramModule } from '../telegram/telegram.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [ScheduleModule.forRoot(), TelegramModule, PrismaModule],
    providers: [SchedulerService],
})
export class SchedulerModule { }