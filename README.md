# ⚜️ Valieva · Miss Perfect

> **Asistente financiero y personal** — gestiona gastos, ingresos, tareas, recordatorios, notas y voz, todo desde Telegram.

---

## 📌 ¿Qué es Valieva?

Valieva es un **asistente inteligente** que convierte Telegram en tu centro de control financiero y personal. Con solo escribir o hablar, puedes:

* 💸 Registrar gastos e ingresos en lenguaje natural (pesos mexicanos).
* ⏰ Crear recordatorios con fecha/hora y recibir notificaciones automáticas.
* 📋 Guardar notas rápidas y tareas con prioridad (alta, normal, baja).
* 📊 Generar un **resumen financiero en PDF**.
* 🎤 Usar mensajes de voz (transcripción con Whisper).
* ⚡ Ejecutar múltiples acciones en un solo mensaje.

> 🔹 **100% gratuito** (sin costes por mensajes)
> 🔹 **Privado y personal** — solo tú y tu bot
> 🔹 **Diseñado para la excelencia**, con estética minimalista y funcionalidad robusta

---

## 🧠 Tecnologías

| Área                  | Tecnología                      |
| --------------------- | ------------------------------- |
| **Backend**           | NestJS (TypeScript)             |
| **Base de datos**     | SQLite + Prisma ORM             |
| **Colas y Scheduler** | BullMQ + Redis                  |
| **IA principal**      | Groq (Llama 3.1 8B / 70B)       |
| **Transcripción**     | Whisper (Groq)                  |
| **Telegram API**      | Bot API Oficial                 |
| **Reportes PDF**      | PDFKit + Diseño Personalizado   |

---

## 🎨 Diseño de los reportes

Los resúmenes financieros se generan como **PDF premium** inspirados en marcas de lujo y publicaciones editoriales.

### Características

* 🖼️ Logotipo de Valieva
* ✨ Eslogan **MISS PERFECT**
* 🎨 Paleta de colores premium:

  * Azul Imperial Oscuro `#071F5A`
  * Azul Hielo `#CDE6F6`
  * Gris Perla `#D5D5D5`
  * Blanco Marfil `#F8F7F4`
* 📊 KPIs financieros destacados
* 📈 Análisis visual de categorías
* 🕒 Historial reciente de movimientos
* 💡 Observaciones personalizadas de Valieva
* 🧾 Diseño minimalista y elegante

📄 [Ver ejemplo de reporte financiero](./src/assets/ejemplo_reporte.png)
---

## ⚙️ Instalación

### 1. Clonar repositorio

```bash
git clone https://github.com/AramisHS/valieva.git
cd valieva
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Variables de entorno

Crear un archivo `.env`:

```env
PORT=3000

DATABASE_URL="file:./dev.db"

TELEGRAM_BOT_TOKEN=TU_TOKEN_DE_BOTFATHER

GROQ_API_KEY=TU_API_KEY_DE_GROQ
GROQ_MODEL=llama-3.1-8b-instant
```

### 4. Base de datos

```bash
npx prisma generate
npx prisma migrate dev --name init
```

### 5. Ejecutar aplicación

```bash
npm run start:dev
```

---

## 🔗 Configurar Webhook de Telegram

Iniciar túnel local:

```bash
ngrok http 3000
```

Registrar webhook:

```bash
curl -F "url=https://TU_URL.ngrok-free.app/webhook" https://api.telegram.org/botTU_TOKEN/setWebhook
```

---

## 🧩 Ejemplos de uso

| Acción             | Ejemplo                                               |
| ------------------ | ----------------------------------------------------- |
| Registrar gasto    | `gasté 150 pesos en tacos`                            |
| Registrar ingreso  | `recibí 2000 de freelance`                            |
| Generar reporte    | `resumen`                                             |
| Crear recordatorio | `recuérdame pagar la luz mañana a las 8 pm`           |
| Crear tarea        | `tarea: terminar documentación`                       |
| Crear nota         | `nota: comprar leche y huevos`                        |
| Múltiples acciones | `gasté 50 en café y recuérdame tomar agua en 2 horas` |
| Mensaje de voz     | Enviar audio con cualquier instrucción                |
| Ver tareas         | `mis tareas`                                          |
| Completar tarea    | `completar tarea 1`                                   |
| Borrar nota        | `borrar nota 2`                                       |
| Buscar nota        | `buscar leche en notas`                               |

---

## 🗂️ Estructura del proyecto

```text
src/
├── ai/                # IA, prompts, Groq y Whisper
├── finance/           # Finanzas y transacciones
├── reminder/          # Recordatorios y scheduler
├── task/              # Gestión de tareas
├── note/              # Notas rápidas
├── report/            # Generación de PDF premium
├── telegram/          # Webhook y mensajes
├── prisma/            # Acceso a base de datos
└── main.ts            # Punto de entrada
```

---

## 🚀 Despliegue

### Railway o Render

1. Subir proyecto a GitHub.
2. Conectar repositorio.
3. Configurar variables de entorno.
4. Desplegar automáticamente.
5. Actualizar webhook con la URL pública.

### Docker

```bash
docker build -t valieva .
docker run -p 3000:3000 --env-file .env valieva
```

---

## 📄 Licencia

MIT License

Puedes usar, modificar y distribuir este proyecto libremente.

---

<div align="center">

### ⚜️ Valieva

**MISS PERFECT**

*Asistente Financiero y Personal*

</div>
