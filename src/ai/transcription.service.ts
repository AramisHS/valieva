import { Injectable } from '@nestjs/common';
import Groq from 'groq-sdk';

@Injectable()
export class TranscriptionService {
    private groq: Groq;

    constructor() {
        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) {
            throw new Error('GROQ_API_KEY no está definida en .env');
        }
        this.groq = new Groq({ apiKey });
    }

    async transcribeAudio(fileBuffer: Buffer, mimeType: string): Promise<string> {
        try {
            // Convertir Buffer a Uint8Array para que sea compatible con Blob
            const uint8Array = new Uint8Array(fileBuffer);
            const blob = new Blob([uint8Array], { type: mimeType });
            const file = new File([blob], 'audio.ogg', { type: mimeType });

            const transcription = await this.groq.audio.transcriptions.create({
                file,
                model: 'whisper-large-v3-turbo',
                language: 'es',
                response_format: 'text',
            });

            // Si response_format: 'text', la respuesta es un string.
            // Pero por si acaso, extraemos .text si es un objeto.
            return typeof transcription === 'string'
                ? transcription
                : (transcription as any).text || '';
        } catch (error) {
            console.error('Error transcribiendo audio:', error);
            throw new Error('No se pudo transcribir el audio');
        }
    }
}