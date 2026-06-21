import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class TelegramService {
    constructor(private readonly httpService: HttpService) { }

    async sendMessage(chatId: number, text: string) {
        const token = process.env.TELEGRAM_BOT_TOKEN;
        const url = `https://api.telegram.org/bot${token}/sendMessage`;
        const payload = {
            chat_id: chatId,
            text: text,
            parse_mode: 'Markdown',
        };

        try {
            const response = await firstValueFrom(this.httpService.post(url, payload));
            console.log('Mensaje enviado correctamente');
            return response.data;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
            console.error('Error al enviar mensaje:', errorMessage);
            throw error;
        }
    }

    // ⬇️ NUEVO MÉTODO para descargar archivos
    async getFile(fileId: string): Promise<Buffer> {
        const token = process.env.TELEGRAM_BOT_TOKEN;
        // Obtener la ruta del archivo
        const getFileUrl = `https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`;
        const fileInfo = await firstValueFrom(this.httpService.get(getFileUrl));
        const filePath = fileInfo.data.result.file_path;
        // Descargar el archivo
        const downloadUrl = `https://api.telegram.org/file/bot${token}/${filePath}`;
        const response = await firstValueFrom(
            this.httpService.get(downloadUrl, { responseType: 'arraybuffer' })
        );
        return Buffer.from(response.data);
    }
}