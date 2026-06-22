import { Module } from '@nestjs/common';
import { ReportService } from './report.service';
import { FinanceModule } from '../finance/finance.module';

@Module({
    imports: [FinanceModule],
    providers: [ReportService],
    exports: [ReportService],
})
export class ReportModule { }