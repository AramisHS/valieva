import { Injectable } from '@nestjs/common';
import { FinanceService } from '../finance/finance.service';
import PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ReportService {
    constructor(private financeService: FinanceService) { }

    async generateFinancialReport(userId: string): Promise<Buffer> {
        console.log('📊 Generando reporte financiero para usuario:', userId);

        const transactions = await this.financeService.getTransactions(userId);
        const summary = await this.financeService.getSummary(userId);

        const doc = new PDFDocument({ margin: 60, size: 'A4', autoFirstPage: true });
        const buffers: Buffer[] = [];
        doc.on('data', (chunk) => buffers.push(chunk));

        if (transactions.length === 0) {
            doc.fontSize(12).fillColor('#071F5A').text('No hay transacciones registradas.', 60, 200, { align: 'center' });
            doc.end();
            return new Promise((resolve, reject) => {
                doc.on('end', () => resolve(Buffer.concat(buffers)));
                doc.on('error', reject);
            });
        }

        // --- Agrupación de gastos ---
        const categoryMap: Record<string, number> = {};
        transactions.filter(t => t.type === 'expense').forEach(t => {
            categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount;
        });
        const sortedCategories = Object.entries(categoryMap)
            .map(([category, amount]) => ({
                category,
                amount,
                percentage: summary.totalExpenses > 0 ? (amount / summary.totalExpenses) * 100 : 0,
            }))
            .sort((a, b) => b.amount - a.amount);

        const recent = transactions.slice(0, 10);

        // --- Consejo personalizado ---
        let advice = '';
        if (summary.balance < 0) {
            const top = sortedCategories[0] ?? { category: 'gastos', percentage: 0 };
            advice = `Tus gastos superan a tus ingresos en ${Math.abs(summary.balance).toFixed(2)} MXN. La categoría "${top.category}" representa el ${top.percentage.toFixed(1)}% del total. Te sugerimos revisar tu presupuesto.`;
        } else if (summary.balance > 0) {
            advice = `Excelente gestión. Tienes un ahorro de ${summary.balance.toFixed(2)} MXN. Considera invertir una parte para hacer crecer tu patrimonio.`;
        } else {
            advice = `Tu balance está en cero. Te sugerimos generar ingresos adicionales o reducir gastos para crear un colchón financiero.`;
        }

        // =====================
        // CONSTRUCCIÓN DEL PDF
        // =====================

        // --- HEADER: Logo + eslogan ---
        const logoPath = path.join(__dirname, '..', 'assets', 'valieva-logo.png');
        let logoBottom = 80;
        if (fs.existsSync(logoPath)) {
            try {
                doc.image(logoPath, 60, 30, { height: 80 });
                doc.font('Helvetica-Bold')
                    .fontSize(8)
                    .fillColor('#A9A9A9')
                    .text('MISS PERFECT', 155, 65, { characterSpacing: 4 });
                logoBottom = 120;
            } catch (_) {
                logoBottom = 80;
            }
        }

        // Línea decorativa bajo el header
        doc.moveTo(60, logoBottom)
            .lineTo(550, logoBottom)
            .strokeColor('#D5D5D5')
            .lineWidth(0.5)
            .stroke();

        // Fecha alineada a la derecha
        doc.font('Helvetica')
            .fontSize(8)
            .fillColor('#A9A9A9')
            .text(
                new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' }),
                60, logoBottom + 8,
                { align: 'right', width: 490 }
            );

        // --- TÍTULO PRINCIPAL ---
        doc.font('Times-Roman')
            .fontSize(22)
            .fillColor('#071F5A')
            .text('Reporte financiero personal', 60, logoBottom + 28, { align: 'left' });

        // --- KPIs ---
        let yPos = logoBottom + 80;
        const kpiX = [60, 180, 300, 420];
        const kpiWidth = 110;

        const kpis = [
            { label: 'Balance', value: `${summary.balance.toFixed(2)} MXN`, color: summary.balance >= 0 ? '#071F5A' : '#E74C3C' },
            { label: 'Ingresos', value: `${summary.totalIncome.toFixed(2)} MXN`, color: '#3D7CC9' },
            { label: 'Gastos', value: `${summary.totalExpenses.toFixed(2)} MXN`, color: '#071F5A' },
            { label: 'Transacciones', value: `${summary.count}`, color: '#071F5A' },
        ];

        kpis.forEach((kpi, i) => {
            doc.font('Helvetica')
                .fontSize(7)
                .fillColor('#A9A9A9')
                .text(kpi.label.toUpperCase(), kpiX[i], yPos, { width: kpiWidth, align: 'center' });
            doc.font('Helvetica-Bold')
                .fontSize(13)
                .fillColor(kpi.color)
                .text(kpi.value, kpiX[i], yPos + 13, { width: kpiWidth, align: 'center' });
        });

        yPos += 48;

        // --- Helper separador ---
        const drawSeparator = (y: number) => {
            doc.moveTo(60, y).lineTo(550, y).strokeColor('#D5D5D5').lineWidth(0.5).stroke();
        };

        drawSeparator(yPos);
        yPos += 20;

        // --- GASTOS POR CATEGORÍA ---
        doc.font('Times-Roman')
            .fontSize(12)
            .fillColor('#071F5A')
            .text('Análisis de gastos por categoría', 60, yPos);
        yPos += 20;

        if (sortedCategories.length === 0) {
            doc.font('Helvetica').fontSize(9).fillColor('#A9A9A9').text('No hay gastos registrados.', 60, yPos);
            yPos += 20;
        } else {
            for (const item of sortedCategories.slice(0, 8)) {
                const barWidth = 300 * (item.percentage / 100);
                doc.font('Helvetica').fontSize(9).fillColor('#0D2C72').text(item.category, 60, yPos + 2);
                doc.font('Helvetica-Bold').fillColor('#071F5A').text(`${item.amount.toFixed(2)} MXN`, 320, yPos + 2, { width: 80, align: 'right' });
                doc.font('Helvetica').fillColor('#A9A9A9').text(`${item.percentage.toFixed(1)}%`, 410, yPos + 2, { width: 60 });
                doc.rect(60, yPos + 16, barWidth, 3).fill('#CDE6F6');
                doc.rect(60, yPos + 16, 300, 3).stroke('#D5D5D5');
                yPos += 30;
            }
            if (sortedCategories.length > 8) {
                doc.font('Helvetica').fontSize(8).fillColor('#A9A9A9').text(`... y ${sortedCategories.length - 8} categorías más.`, 60, yPos);
                yPos += 15;
            }
        }

        yPos += 15;
        drawSeparator(yPos);
        yPos += 20;

        // --- MOVIMIENTOS RECIENTES ---
        doc.font('Times-Roman').fontSize(12).fillColor('#071F5A').text('Movimientos recientes', 60, yPos);
        yPos += 20;

        const colX = [60, 130, 220, 320, 420];
        const colWidths = [60, 80, 90, 90, 120];

        doc.font('Helvetica-Bold').fontSize(8).fillColor('#0D2C72');
        ['Fecha', 'Tipo', 'Categoría', 'Monto', 'Descripción'].forEach((h, i) => {
            doc.text(h, colX[i], yPos, { width: colWidths[i], align: i === 3 ? 'right' : 'left' });
        });
        yPos += 15;

        for (const t of recent) {
            if (yPos > 700) { doc.addPage(); yPos = 60; }
            const date = new Date(t.date).toLocaleDateString('es-MX');
            const typeLabel = t.type === 'expense' ? 'Gasto' : 'Ingreso';
            const montoColor = t.type === 'expense' ? '#071F5A' : '#3D7CC9';

            doc.font('Helvetica').fontSize(8);
            doc.fillColor('#071F5A').text(date, colX[0], yPos, { width: colWidths[0] });
            doc.fillColor(montoColor).text(typeLabel, colX[1], yPos, { width: colWidths[1] });
            doc.fillColor('#071F5A').text(t.category, colX[2], yPos, { width: colWidths[2] });
            doc.fillColor(montoColor).text(`${t.amount.toFixed(2)} MXN`, colX[3], yPos, { width: colWidths[3], align: 'right' });
            doc.fillColor('#A9A9A9').text(t.description || '', colX[4], yPos, { width: colWidths[4] });
            yPos += 16;
        }

        yPos += 15;

        if (yPos > 650) {
            doc.addPage();
            yPos = 60;
        } else {
            drawSeparator(yPos);
            yPos += 20;
        }

        // --- OBSERVACIONES ---
        doc.x = 60;
        doc.y = yPos;

        doc.font('Times-Roman').fontSize(12).fillColor('#071F5A');
        doc.text('Observaciones de Valieva', { lineBreak: true });
        yPos = doc.y + 5;

        // Línea decorativa con estrella
        doc.moveTo(60, yPos).lineTo(90, yPos).strokeColor('#D5D5D5').lineWidth(0.5).stroke();
        doc.font('Times-Roman').fontSize(8).fillColor('#071F5A').text('★', 93, yPos - 4, { width: 10 });
        doc.moveTo(107, yPos).lineTo(260, yPos).strokeColor('#D5D5D5').lineWidth(0.5).stroke();
        yPos += 15;

        doc.font('Helvetica').fontSize(9).fillColor('#071F5A')
            .text(advice, 60, yPos, { width: 490, align: 'justify', lineBreak: true });

        yPos = doc.y + 20;

        // --- PIE DE PÁGINA (sin forzar página nueva) ---
        const footerText = 'Generado por Valieva · Miss Perfect';
        const pageContentEnd = doc.page.height - doc.page.margins.bottom;

        if (yPos + 30 < pageContentEnd) {
            doc.font('Helvetica')
                .fontSize(7)
                .fillColor('#C0C0C0')
                .text(footerText, 60, yPos + 20, {
                    align: 'center',
                    width: 490,
                });
        } else {
            doc.moveDown(1);
            doc.font('Helvetica')
                .fontSize(7)
                .fillColor('#C0C0C0')
                .text(footerText, { align: 'center', width: 490 });
        }

        doc.end();

        return new Promise((resolve, reject) => {
            doc.on('end', () => {
                const pdfBuffer = Buffer.concat(buffers);
                console.log(`📄 PDF generado: ${pdfBuffer.length} bytes`);
                resolve(pdfBuffer);
            });
            doc.on('error', (err) => {
                console.error('❌ Error generando PDF:', err);
                reject(err);
            });
        });
    }

    private applyPremiumStyles(_doc: PDFKit.PDFDocument) {
        // no-op
    }
}