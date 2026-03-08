import { useState } from 'react';
import './ExportModal.css';

export default function ExportModal({ onClose, activeApi, currentMonth }) {
    const [period, setPeriod] = useState('month'); // 'month', '3months', 'custom'
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [format, setFormat] = useState('csv'); // 'csv' or 'pdf'
    const [exporting, setExporting] = useState(false);

    const handleExport = async (e) => {
        e.preventDefault();
        setExporting(true);

        try {
            let start = null;
            let end = null;

            if (period === 'month') {
                start = `${currentMonth}-01`;
                const [y, m] = currentMonth.split('-').map(Number);
                end = `${currentMonth}-${new Date(y, m, 0).getDate()}`;
            } else if (period === '3months') {
                const now = new Date();
                const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);
                start = threeMonthsAgo.toISOString().split('T')[0];
                end = new Date().toISOString().split('T')[0];
            } else {
                start = startDate;
                end = endDate;
            }

            const data = await activeApi.getExpenses(null, null, start, end);

            if (format === 'csv') {
                exportCSV(data, start, end);
            } else {
                exportPDF(data, start, end);
            }

            onClose();
        } catch (err) {
            console.error('Export failed:', err);
            alert('Export failed. Please try again.');
        } finally {
            setExporting(false);
        }
    };

    const exportCSV = (data, start, end) => {
        const headers = ['Date', 'Description', 'Category', 'Amount', 'Notes'];
        const rows = data.map(ex => [
            ex.date,
            `"${ex.description.replace(/"/g, '""')}"`,
            ex.category,
            ex.amount,
            `"${(ex.notes || '').replace(/"/g, '""')}"`
        ]);

        const csvContent = [headers, ...rows].map(r => r.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `BudgetTracker_Expenses_${start}_to_${end}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const exportPDF = (data, start, end) => {
        // We use window.print() with a temporary printable element
        const printWindow = window.open('', '_blank');
        const total = data.reduce((s, e) => s + e.amount, 0);

        const html = `
            <html>
            <head>
                <title>Expense Report: ${start} to ${end}</title>
                <style>
                    body { font-family: 'Inter', sans-serif; color: #1a1a1a; padding: 40px; }
                    .header { display: flex; justify-content: space-between; border-bottom: 2px solid #10b981; padding-bottom: 20px; margin-bottom: 30px; }
                    .title { font-size: 24px; font-weight: 800; color: #10b981; }
                    .meta { text-align: right; font-size: 14px; color: #666; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th { text-align: left; background: #f8fafc; padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 12px; text-transform: uppercase; color: #64748b; }
                    td { padding: 12px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
                    .amount { text-align: right; font-weight: 600; }
                    .total-row { margin-top: 30px; text-align: right; border-top: 2px solid #f1f5f9; padding-top: 15px; }
                    .total-label { font-size: 14px; color: #64748b; }
                    .total-value { font-size: 20px; font-weight: 800; color: #10b981; margin-left: 10px; }
                    @media print { .no-print { display: none; } }
                </style>
            </head>
            <body>
                <div class="header">
                    <div>
                        <div class="title">BUDGET TRACKER</div>
                        <div style="font-size: 14px; color: #64748b; margin-top: 4px;">Expense Report</div>
                    </div>
                    <div class="meta">
                        Period: <strong>${start}</strong> to <strong>${end}</strong><br>
                        Generated: ${new Date().toLocaleDateString()}
                    </div>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Description</th>
                            <th>Category</th>
                            <th style="text-align: right">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.map(ex => `
                            <tr>
                                <td>${ex.date}</td>
                                <td>${ex.description}</td>
                                <td>${ex.category}</td>
                                <td class="amount">₹${ex.amount.toLocaleString()}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                <div class="total-row">
                    <span class="total-label">Grand Total:</span>
                    <span class="total-value">₹${total.toLocaleString()}</span>
                </div>

                <div style="margin-top: 50px; font-size: 10px; color: #94a3b8; text-align: center;">
                    This report was generated by Budget Tracker PWA.
                </div>
                
                <script>
                    window.onload = function() { window.print(); window.close(); };
                </script>
            </body>
            </html>
        `;

        printWindow.document.write(html);
        printWindow.document.close();
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal export-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>📄 Export Statement</h3>
                    <button className="btn btn-ghost" onClick={onClose}>✕</button>
                </div>

                <form onSubmit={handleExport}>
                    <div className="form-group">
                        <label>Report Period</label>
                        <div className="export-periods">
                            <button
                                type="button"
                                className={`period-btn ${period === 'month' ? 'active' : ''}`}
                                onClick={() => setPeriod('month')}
                            >
                                This Month
                            </button>
                            <button
                                type="button"
                                className={`period-btn ${period === '3months' ? 'active' : ''}`}
                                onClick={() => setPeriod('3months')}
                            >
                                Last 3 Months
                            </button>
                            <button
                                type="button"
                                className={`period-btn ${period === 'custom' ? 'active' : ''}`}
                                onClick={() => setPeriod('custom')}
                            >
                                Custom
                            </button>
                        </div>
                    </div>

                    {period === 'custom' && (
                        <div className="form-row">
                            <div className="form-group">
                                <label>From</label>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={startDate}
                                    onChange={e => setStartDate(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>To</label>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={endDate}
                                    onChange={e => setEndDate(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                    )}

                    <div className="form-group">
                        <label>Export Format</label>
                        <div className="export-formats">
                            <label className={`format-option ${format === 'csv' ? 'active' : ''}`}>
                                <input
                                    type="radio"
                                    name="format"
                                    value="csv"
                                    checked={format === 'csv'}
                                    onChange={e => setFormat(e.target.value)}
                                />
                                <span className="format-icon">📊</span>
                                <span className="format-name">Excel / CSV</span>
                            </label>
                            <label className={`format-option ${format === 'pdf' ? 'active' : ''}`}>
                                <input
                                    type="radio"
                                    name="format"
                                    value="pdf"
                                    checked={format === 'pdf'}
                                    onChange={e => setFormat(e.target.value)}
                                />
                                <span className="format-icon">🚩</span>
                                <span className="format-name">PDF Report</span>
                            </label>
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary btn-full mt-lg" disabled={exporting}>
                        {exporting ? 'Generating...' : `Download ${format.toUpperCase()}`}
                    </button>
                </form>
            </div>
        </div>
    );
}
