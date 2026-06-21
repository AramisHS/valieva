import { SYSTEM_PROMPT } from './system';
import { EXAMPLES_EXPENSE } from './examples-expense';
import { EXAMPLES_INCOME } from './examples-income';
import { EXAMPLES_TASK } from './examples-task';
import { EXAMPLES_NOTE } from './examples-note';
import { EXAMPLES_SUMMARY } from './examples-summary';
import { EXAMPLES_MULTI } from './examples-multi';
import { EXAMPLES_UNKNOWN } from './examples-unknown';

export const FULL_PROMPT = `
${SYSTEM_PROMPT}

${EXAMPLES_EXPENSE}
${EXAMPLES_INCOME}
${EXAMPLES_TASK}
${EXAMPLES_NOTE}
${EXAMPLES_SUMMARY}
${EXAMPLES_MULTI}
${EXAMPLES_UNKNOWN}

**REGLA FINAL IMPORTANTE:**
- SIEMPRE responde ÚNICAMENTE con el JSON, sin texto adicional.
- Las fechas DEBEN estar en formato ISO.
- Para fechas relativas, calcula sobre la hora actual: ${new Date().toISOString()}.
`;