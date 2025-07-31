import { jsPDF } from 'jspdf';
// Ensure svg2pdf plugin registers itself on jsPDF. This import has side effects.
// @ts-ignore - no types available for this plugin
import 'svg2pdf.js';
import type { RefObject } from 'react';

interface GeneratePDFParams {
    analysisName: string;
    network: string;
    results: any;
    suggestions: string[];
    points: any[];
    countryCounts: any[];
    torCount: number;
    mapChartRef: RefObject<any>;
    barChartRef: RefObject<any>;
    pieChartRef?: RefObject<any>;
}

export async function generateAnalysisPDF(params: GeneratePDFParams) {
    const {
        analysisName,
        network,
        results,
        suggestions,
        points,
        countryCounts,
        torCount,
        mapChartRef,
        barChartRef,
        pieChartRef
    } = params;

    const doc = new jsPDF();

    // Helper converts SVG string into a high-resolution JPEG data URL
    const svgToJpeg = async (svgString: string, width: number, height: number): Promise<string> => {
        return new Promise((resolve) => {
            const div = document.createElement('div');
            div.style.position = 'absolute';
            div.style.left = '-9999px';
            div.innerHTML = svgString;
            document.body.appendChild(div);

            const svgEl = div.querySelector('svg') as SVGSVGElement;
            if (!svgEl) {
                document.body.removeChild(div);
                resolve('');
                return;
            }

            const canvas = document.createElement('canvas');
            const scale = 2; // render at 2× for crispness
            const svgW = width * scale;
            const svgH = height * scale;
            canvas.width = svgW;
            canvas.height = svgH;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                document.body.removeChild(div);
                resolve('');
                return;
            }

            const img = new Image();
            const svgBlob = new Blob([svgEl.outerHTML], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(svgBlob);
            img.onload = () => {
                ctx.drawImage(img, 0, 0, svgW, svgH);
                const jpegData = canvas.toDataURL('image/jpeg', 0.95);
                resolve(jpegData);
                URL.revokeObjectURL(url);
                document.body.removeChild(div);
            };
            img.onerror = () => {
                resolve('');
                URL.revokeObjectURL(url);
                document.body.removeChild(div);
            };
            img.src = url;
        });
    };

    // Add header
    doc.setFontSize(18);
    doc.text(`Analysis Report: ${analysisName || 'Untitled Analysis'}`, 10, 20);
    doc.setFontSize(12);
    doc.text(`Network: ${network.charAt(0).toUpperCase() + network.slice(1)}`, 10, 30);
    doc.text(`Date: ${new Date().toLocaleString()}`, 10, 40);

    // Add metrics
    doc.setFontSize(14);
    doc.text('Metrics', 10, 55);
    doc.setFontSize(10);
    const metrics = [
        `Total Nodes: ${results ? results.total_nodes : points.length}`,
        `Gini Coefficient: ${results ? results.gini.toFixed(3) : '-'}`,
        `Nakamoto Coefficient: ${results ? results.nakamoto : '-'}`,
        `Connectivity Loss: ${results ? results.connectivityLoss : '-'}`,
        `Countries Represented${results ? ' (Remaining)' : ''}: ${results ? results.remaining_countries || 0 : countryCounts.length}`,
        `Nodes via TOR: ${torCount}`,
        `Failed Nodes: ${results ? results.failed_nodes : '-'}`
    ];
    metrics.forEach((metric, index) => {
        doc.text(metric, 10, 65 + index * 10);
    });

    // Add map chart
    let currentY = 65 + metrics.length * 10 + 10; // After metrics
    if (mapChartRef?.current?.chart) {
        const pageHeight = doc.internal.pageSize.height;
        const chartHeight = 140;
        if (currentY + chartHeight > pageHeight - 20) {
            doc.addPage();
            currentY = 20;
        }

        const chart = mapChartRef.current.chart;
        const svgString = chart.getSVG({ chart: { width: 1200, height: 800 } });
        const jpeg = await svgToJpeg(svgString, 1200, 800);
        doc.setFontSize(14);
        doc.text('Map View', 10, currentY);
        if (jpeg) {
            doc.addImage(jpeg, 'JPEG', 10, currentY + 5, 180, 120);
        }
        currentY += 140;
    }

    // Add bar chart
    if (barChartRef?.current?.chart) {
        const pageHeight = doc.internal.pageSize.height;
        const chartHeight = 140;
        if (currentY + chartHeight > pageHeight - 20) {
            doc.addPage();
            currentY = 20;
        }

        const chart = barChartRef.current.chart;
        const svgString = chart.getSVG({ chart: { width: 1200, height: 800 } });
        const jpeg = await svgToJpeg(svgString, 1200, 800);
        doc.setFontSize(14);
        doc.text('Bar Chart View', 10, currentY);
        if (jpeg) {
            doc.addImage(jpeg, 'JPEG', 10, currentY + 5, 180, 120);
        }
        currentY += 140;
    }

    // Add pie chart if available (for Solana)
    if (pieChartRef?.current?.chart) {
        const pageHeight = doc.internal.pageSize.height;
        const chartHeight = 140;
        if (currentY + chartHeight > pageHeight - 20) {
            doc.addPage();
            currentY = 20;
        }

        const pieChart = pieChartRef.current.chart;
        const pieSvgString = pieChart.getSVG({ chart: { width: 1200, height: 800 } });
        const pieJpeg = await svgToJpeg(pieSvgString, 1200, 800);
        doc.setFontSize(14);
        doc.text('Cloud Provider Distribution', 10, currentY);
        if (pieJpeg) {
            doc.addImage(pieJpeg, 'JPEG', 10, currentY + 5, 180, 120);
        }
        currentY += 140;
    }

    // Add suggestions LAST
    const pageHeight = doc.internal.pageSize.height;
    const suggestionLineHeight = 10;
    const suggestionsHeight = 20 + suggestions.length * suggestionLineHeight; // Title + lines
    if (currentY + suggestionsHeight > pageHeight - 20) {
        doc.addPage();
        currentY = 20;
    }

    doc.setFontSize(14);
    doc.text('Optimization Suggestions', 10, currentY);
    currentY += 10;
    doc.setFontSize(10);
    suggestions.forEach((suggestion: string, index: number) => {
        doc.text(suggestion, 10, currentY + index * suggestionLineHeight);
    });

    // Save the PDF
    doc.save(`${analysisName || 'analysis'}-report.pdf`);
} 