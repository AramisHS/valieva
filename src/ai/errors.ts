export class RateLimitError extends Error {
    constructor(
        message: string,
        public retryAfterSeconds: number,
    ) {
        super(message);
        this.name = 'RateLimitError';
    }
}