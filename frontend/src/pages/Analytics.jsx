import { useState, useEffect, useCallback } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Filler } from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import api from '../services/api';
import StreakBadge from '../components/StreakBadge';
import './Analytics.css';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Filler);

const CATEGORY_COLORS = {
    food: '#f97316', transport: '#3b82f6', bills: '#ef4444', entertainment: '#a855f7',
    shopping: '#ec4899', health: '#10b981', education: '#06b6d4', subscriptions: '#8b5cf6',
    groceries: '#22c55e', travel: '#f59e0b', other: '#6b7280',
};

const CHART_OPTIONS = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            labels: { color: '#8888aa', font: { family: 'Inter', size: 11 } },
        },
    },
};

export default function Analytics() {
    const [month, setMonth] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });
    const [summary, setSummary] = useState(null);
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [summaryRes, expensesRes] = await Promise.allSettled([
                api.getBudgetSummary(month),
                api.getExpenses(month),
            ]);
            if (summaryRes.status === 'fulfilled') setSummary(summaryRes.value);
            else setSummary(null);
            if (expensesRes.status === 'fulfilled') setExpenses(expensesRes.value);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [month]);

    useEffect(() => { loadData(); }, [loadData]);

    useEffect(() => {
        const handler = () => loadData();
        window.addEventListener('expense-added', handler);
        return () => window.removeEventListener('expense-added', handler);
    }, [loadData]);

    if (loading) {
        return <div className="page"><div className="loading-center"><div className="spinner" /></div></div>;
    }

    if (!summary) {
        return (
            <div className="page" id="analytics-page">
                <div className="page-header"><h1>📈 Analytics</h1></div>
                <div className="empty-state">
                    <div className="empty-state-icon">📊</div>
                    <p>Set a budget first to see analytics</p>
                </div>
            </div>
        );
    }

    // Doughnut chart data
    const catEntries = Object.entries(summary.category_spending).sort(([, a], [, b]) => b - a);
    const doughnutData = {
        labels: catEntries.map(([cat]) => cat.charAt(0).toUpperCase() + cat.slice(1)),
        datasets: [{
            data: catEntries.map(([, val]) => val),
            backgroundColor: catEntries.map(([cat]) => CATEGORY_COLORS[cat] || CATEGORY_COLORS.other),
            borderColor: 'transparent',
            borderWidth: 2,
            hoverOffset: 8,
        }],
    };

    // Daily spending trend (line chart)
    const [year, mo] = month.split('-').map(Number);
    const daysInMonth = new Date(year, mo, 0).getDate();
    const dailyLabels = [];
    const dailyData = [];
    const cumulativeData = [];
    let cumulative = 0;

    for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${month}-${String(d).padStart(2, '0')}`;
        dailyLabels.push(d);
        const dayAmount = summary.daily_spending[dateStr] || 0;
        dailyData.push(dayAmount);
        cumulative += dayAmount;
        cumulativeData.push(cumulative);
    }

    const lineData = {
        labels: dailyLabels,
        datasets: [
            {
                label: 'Cumulative Spending',
                data: cumulativeData,
                borderColor: '#7c6ff7',
                backgroundColor: 'rgba(124, 111, 247, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                pointHitRadius: 10,
            },
            {
                label: 'Budget Line',
                data: dailyLabels.map(d => (summary.total_budget / daysInMonth) * d),
                borderColor: 'rgba(136, 136, 170, 0.4)',
                borderDash: [5, 5],
                fill: false,
                pointRadius: 0,
                tension: 0,
            },
        ],
    };

    // Category bar chart
    const barData = {
        labels: catEntries.map(([cat]) => cat.charAt(0).toUpperCase() + cat.slice(1)),
        datasets: [{
            label: 'Amount',
            data: catEntries.map(([, val]) => val),
            backgroundColor: catEntries.map(([cat]) => CATEGORY_COLORS[cat] || CATEGORY_COLORS.other),
            borderRadius: 6,
            barThickness: 24,
        }],
    };

    const barOptions = {
        ...CHART_OPTIONS,
        indexAxis: 'y',
        scales: {
            x: {
                grid: { color: 'rgba(255,255,255,0.04)' },
                ticks: { color: '#8888aa', font: { family: 'Inter', size: 10 } },
            },
            y: {
                grid: { display: false },
                ticks: { color: '#8888aa', font: { family: 'Inter', size: 11 } },
            },
        },
        plugins: { ...CHART_OPTIONS.plugins, legend: { display: false } },
    };

    return (
        <div className="page" id="analytics-page">
            <div className="page-header">
                <div className="flex justify-between items-center">
                    <h1>📈 Analytics</h1>
                    <input
                        type="month"
                        value={month}
                        onChange={e => setMonth(e.target.value)}
                        className="month-picker"
                    />
                </div>
            </div>

            {/* Key Stats */}
            <div className="stats-grid mb-md">
                <div className="stat-card">
                    <div className="stat-value">₹{summary.total_spent.toLocaleString()}</div>
                    <div className="stat-label">Total Spent</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value" style={{ fontSize: '1.2rem' }}>{expenses.length}</div>
                    <div className="stat-label">Transactions</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value" style={{ fontSize: '1.2rem' }}>
                        ₹{expenses.length > 0 ? Math.round(summary.total_spent / expenses.length).toLocaleString() : 0}
                    </div>
                    <div className="stat-label">Avg / Txn</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value" style={{ fontSize: '1.2rem' }}>
                        ₹{summary.days_elapsed > 0 ? Math.round(summary.total_spent / summary.days_elapsed).toLocaleString() : 0}
                    </div>
                    <div className="stat-label">Avg / Day</div>
                </div>
            </div>

            {/* Streak */}
            <div className="mb-md">
                <StreakBadge streak={summary.spending_streak} />
            </div>

            {/* Spending Trend */}
            <div className="card mb-md">
                <h3 className="mb-md">📉 Spending Trend</h3>
                <div className="chart-container">
                    <Line data={lineData} options={{
                        ...CHART_OPTIONS,
                        scales: {
                            x: {
                                grid: { color: 'rgba(255,255,255,0.04)' },
                                ticks: { color: '#8888aa', font: { family: 'Inter', size: 10 }, maxTicksLimit: 10 },
                            },
                            y: {
                                grid: { color: 'rgba(255,255,255,0.04)' },
                                ticks: { color: '#8888aa', font: { family: 'Inter', size: 10 } },
                            },
                        },
                    }} />
                </div>
            </div>

            {/* Category Breakdown */}
            {catEntries.length > 0 && (
                <>
                    <div className="card mb-md">
                        <h3 className="mb-md">🍩 Category Split</h3>
                        <div className="chart-container-doughnut">
                            <Doughnut data={doughnutData} options={{
                                ...CHART_OPTIONS,
                                cutout: '65%',
                                plugins: {
                                    ...CHART_OPTIONS.plugins,
                                    legend: { position: 'bottom', labels: { color: '#8888aa', font: { family: 'Inter', size: 11 }, padding: 12 } },
                                },
                            }} />
                        </div>
                    </div>

                    <div className="card mb-md">
                        <h3 className="mb-md">📊 Category Totals</h3>
                        <div className="chart-container">
                            <Bar data={barData} options={barOptions} />
                        </div>
                    </div>
                </>
            )}

            {/* Top Expenses */}
            {expenses.length > 0 && (
                <div className="card">
                    <h3 className="mb-md">💸 Top Expenses</h3>
                    <div className="top-expenses">
                        {[...expenses].sort((a, b) => b.amount - a.amount).slice(0, 5).map((exp, i) => (
                            <div key={exp.id} className="top-expense-item">
                                <span className="top-rank">#{i + 1}</span>
                                <div className="top-expense-info">
                                    <span className="font-bold text-sm">{exp.description}</span>
                                    <span className="text-xs text-muted">{exp.date} · {exp.category}</span>
                                </div>
                                <span className="font-bold" style={{ color: 'var(--color-danger)' }}>
                                    ₹{exp.amount.toLocaleString()}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
