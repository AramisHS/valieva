import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import axios from 'axios';
import FormData from 'form-data';

@Injectable()
export class TelegramService {
    constructor(private readonly httpService: HttpService) { }

    async sendMessage(chatId: number, text: string) {
        const token = process.env.TELEGRAM_BOT_TOKEN;
        const url = `https://api.telegram.org/bot${token}/sendMessage`;
        const payload = { chat_id: chatId, text, parse_mode: 'Markdown' };
        try {
            const response = await firstValueFrom(this.httpService.post(url, payload));
            return response.data;
        } catch (error) {
            const err = error instanceof Error ? error : new Error('Unknown error');
            console.error('❌ sendMessage error:', err.message);
            throw err;
        }
    }

    async sendDocument(chatId: number, fileName: string, content: string, mimeType: string = 'text/plain') {
        const token = process.env.TELEGRAM_BOT_TOKEN;
        const url = `https://api.telegram.org/bot${token}/sendDocument`;
        const form = new FormData();
        const buffer = Buffer.from(content, 'utf-8');
        form.append('chat_id', String(chatId));
        form.append('document', buffer, { filename: fileName, contentType: mimeType });
        try {
            const response = await axios.post(url, form, { headers: { ...form.getHeaders() } });
            return response.data;
        } catch (error) {
            const err = error instanceof Error ? error : new Error('Unknown error');
            console.error('❌ sendDocument error:', err.message);
            throw err;
        }
    }

    async sendPDFDocument(chatId: number, fileName: string, buffer: Buffer) {
        const token = process.env.TELEGRAM_BOT_TOKEN;
        const url = `https://api.telegram.org/bot${token}/sendDocument`;
        const form = new FormData();
        form.append('chat_id', String(chatId));
        form.append('document', buffer, { filename: fileName, contentType: 'application/pdf' });
        try {
            const response = await axios.post(url, form, { headers: { ...form.getHeaders() } });
            console.log(`📄 PDF enviado: ${fileName}`);
            return response.data;
        } catch (error) {
            const err = error instanceof Error ? error : new Error('Unknown error');
            console.error('❌ sendPDF error:', err.message);
            throw err;
        }
    }

    async getFile(fileId: string): Promise<Buffer> {
        const token = process.env.TELEGRAM_BOT_TOKEN;
        try {
            const getFileUrl = `https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`;
            const fileInfo = await firstValueFrom(this.httpService.get(getFileUrl));
            const filePath = fileInfo.data.result.file_path;
            const downloadUrl = `https://api.telegram.org/file/bot${token}/${filePath}`;
            const response = await firstValueFrom(
                this.httpService.get(downloadUrl, { responseType: 'arraybuffer' })
            );
            return Buffer.from(response.data);
        } catch (error) {
            const err = error instanceof Error ? error : new Error('Unknown error');
            console.error('❌ getFile error:', err.message);
            throw err;
        }
    }
}