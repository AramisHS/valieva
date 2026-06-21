import { Injectable } from '@nestjs/common';
import Groq from 'groq-sdk';
import { FULL_PROMPT } from './prompts';

@Injectable()
export class AiService {
    private groq: Groq;

    constructor() {
        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) {
            throw new Error('GROQ_API_KEY no está definida en .env');
        }
        this.groq = new Groq({ apiKey });
    }

    async parseMessage(text: string): Promise<any> {
        try {
            const chatCompletion = await this.groq.chat.completions.create({
                messages: [
                    { role: 'system', content: FULL_PROMPT },
                    { role: 'user', content: text },
                ],
                model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
                temperature: 0.2,
                response_format: { type: 'json_object' },
            });

            const content = chatCompletion.choices[0]?.message?.content;
            if (!content) throw new Error('Groq no devolvió contenido');
            console.log('🔍 Groq devolvió:', content);
            const parsed = JSON.parse(content);
            console.log('🧠 Parsed:', parsed);
            return parsed;
        } catch (error) {
            console.error('Error parseando con Groq:', error);
            return { intent: 'unknown' };
        }
    }
}