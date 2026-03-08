import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import BudgetPulse from '../components/BudgetPulse';
import VelocityMeter from '../components/VelocityMeter';
import StreakBadge from '../components/StreakBadge';
import ExpenseHeatmap from '../components/ExpenseHeatmap';
import './Dashboard.css';

const CATEGORY_ICONS = {
    food: '🍕', transport: '🚗', bills: '📄', entertainment: '🎬',
    shopping: '🛍️', health: '💊', education: '📚', subscriptions: '📱',
    groceries: '🥦', travel: '✈️', other: '📦',
};

export default function Dashboard() {
    const { user, logout, activeApi: api } = useAuth();
    const [month, setMonth] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });
    const [summary, setSummary] = useState(null);
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showBudgetModal, setShowBudgetModal] = useState(false);
    const [budgetInput, setBudgetInput] = useState('');

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [summaryData, expensesData] = await Promise.allSettled([
                api.getBudgetSummary(month),
                api.getExpenses(month),
            ]);
            if (summaryData.status === 'fulfilled') setSummary(summaryData.value);
            else setSummary(null);
            if (expensesData.status === 'fulfilled') setExpenses(expensesData.value);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [month]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    useEffect(() => {
        const handler = () => loadData();
        window.addEventListener('expense-added', handler);
        return () => window.removeEventListener('expense-added', handler);
    }, [loadData]);

    const handleSetBudget = async (e) => {
        e.preventDefault();
        try {
            await api.setBudget({ month, total_amount: parseFloat(budgetInput) });
            setShowBudgetModal(false);
            setBudgetInput('');
            loadData();
        } catch (err) {
            console.error(err);
        }
    };

    const recentExpenses = expenses.slice(0, 5);

    if (loading) {
        return <div className="page"><div className="loading-center"><div className="spinner" /></div></div>;
    }

    return (
        <div className="page" id="dashboard-page">
            {/* Header */}
            <div className="dash-header">
                <div>
                    <h1>👋 Hey, {user?.name?.split(' ')[0]}</h1>
                    <p className="text-muted text-sm">
                        {new Date(month + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </p>
                </div>
                <div className="dash-header-actions">
                    <input
                        type="month"
                        value={month}
                        onChange={e => setMonth(e.target.value)}
                        className="month-picker"
                    />
                    <button className="btn btn-ghost" onClick={logout} title="Logout">🚪</button>
                </div>
            </div>

            {/* No budget set */}
            {!summary ? (
                <div className="card-accent text-center" style={{ padding: '48px 24px' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '12px' }}>💰</div>
                    <h2>Set Your Budget</h2>
                    <p className="text-muted mt-sm mb-lg">Start by setting a monthly budget to track your spending</p>
                    <button className="btn btn-primary" onClick={() => setShowBudgetModal(true)} id="set-budget-btn">
                        Set Budget for {new Date(month + '-01').toLocaleDateString('en-US', { month: 'long' })}
                    </button>
                </div>
            ) : (
                <>
                    {/* Budget Pulse + Stats */}
                    <div className="card mb-md">
                        <BudgetPulse percentage={summary.budget_percentage} />
                        <div className="stats-grid mt-md">
                            <div className="stat-card">
                                <div className="stat-value">₹{summary.total_budget.toLocaleString()}</div>
                                <div className="stat-label">Budget</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-value" style={{ color: summary.remaining < 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>
                                    ₹{Math.abs(summary.remaining).toLocaleString()}
                                </div>
                                <div className="stat-label">{summary.remaining < 0 ? 'Over' : 'Left'}</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-value">₹{summary.total_spent.toLocaleString()}</div>
                                <div className="stat-label">Spent</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-value">₹{summary.daily_allowance.toLocaleString()}</div>
                                <div className="stat-label">Daily Limit</div>
                            </div>
                        </div>
                        <button className="btn btn-secondary btn-sm mt-md" onClick={() => { setBudgetInput(summary.total_budget); setShowBudgetModal(true); }}>
                            ✏️ Edit Budget
                        </button>
                    </div>

                    {/* Velocity Meter */}
                    <div className="card mb-md">
                        <h3 className="mb-sm">🏎️ Spending Velocity</h3>
                        <VelocityMeter
                            budgetPercentage={summary.budget_percentage}
                            timePercentage={summary.time_percentage}
                        />
                    </div>

                    {/* Streak */}
                    <div className="mb-md">
                        <h3 className="mb-sm">🔥 Spending Streak</h3>
                        <StreakBadge streak={summary.spending_streak} />
                    </div>

                    {/* Category Breakdown */}
                    {Object.keys(summary.category_spending).length > 0 && (
                        <div className="card mb-md">
                            <h3 className="mb-md">📊 Category Breakdown</h3>
                            <div className="category-breakdown">
                                {Object.entries(summary.category_spending)
                                    .sort(([, a], [, b]) => b - a)
                                    .map(([cat, amount]) => {
                                        const pct = (amount / summary.total_spent * 100) || 0;
                                        return (
                                            <div key={cat} className="cat-row">
                                                <div className="cat-info">
                                                    <span className={`category-pill category-${cat}`}>
                                                        {CATEGORY_ICONS[cat] || '📦'} {cat}
                                                    </span>
                                                    <span className="cat-amount">₹{amount.toLocaleString()}</span>
                                                </div>
                                                <div className="cat-bar-bg">
                                                    <div
                                                        className={`cat-bar category-bar-${cat}`}
                                                        style={{ width: `${Math.min(pct, 100)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                        </div>
                    )}

                    {/* Heatmap */}
                    <div className="card mb-md">
                        <h3 className="mb-sm">🗓️ Spending Heatmap</h3>
                        <ExpenseHeatmap
                            dailySpending={summary.daily_spending}
                            month={month}
                            dailyAllowance={summary.daily_allowance}
                        />
                    </div>

                    {/* Forecast */}
                    <div className="card mb-md">
                        <h3 className="mb-sm">📈 Month-End Forecast</h3>
                        <div className="forecast-info">
                            <div className="forecast-row">
                                <span className="text-muted">Projected total:</span>
                                <span className="font-bold" style={{
                                    color: summary.projected_total > summary.total_budget ? 'var(--color-danger)' : 'var(--color-success)'
                                }}>
                                    ₹{summary.projected_total.toLocaleString()}
                                </span>
                            </div>
                            <div className="forecast-row">
                                <span className="text-muted">Budget:</span>
                                <span className="font-bold">₹{summary.total_budget.toLocaleString()}</span>
                            </div>
                            <div className="forecast-bar-bg mt-sm">
                                <div
                                    className="forecast-bar"
                                    style={{
                                        width: `${Math.min((summary.projected_total / summary.total_budget) * 100, 100)}%`,
                                        background: summary.projected_total > summary.total_budget
                                            ? 'var(--color-danger)' : 'var(--accent-gradient)',
                                    }}
                                />
                                <div className="forecast-marker" style={{ left: `${Math.min((summary.total_spent / summary.total_budget) * 100, 100)}%` }} />
                            </div>
                            <div className="forecast-legend mt-sm">
                                <span className="text-xs text-muted">◆ Current spend</span>
                                <span className="text-xs text-muted">▰ Projected</span>
                            </div>
                        </div>
                    </div>

                    {/* Recent Transactions */}
                    <div className="card">
                        <h3 className="mb-md">🕐 Recent Transactions</h3>
                        {recentExpenses.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-state-icon">📝</div>
                                <p>No expenses yet. Tap + to add one!</p>
                            </div>
                        ) : (
                            <div className="transactions-list">
                                {recentExpenses.map(exp => (
                                    <div key={exp.id} className="transaction-item">
                                        <div className="transaction-icon">
                                            {CATEGORY_ICONS[exp.category] || '📦'}
                                        </div>
                                        <div className="transaction-info">
                                            <span className="transaction-desc">{exp.description}</span>
                                            <span className="transaction-meta">{exp.date} · {exp.category}</span>
                                        </div>
                                        <span className="transaction-amount">-₹{exp.amount.toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* Budget Modal */}
            {showBudgetModal && (
                <div className="modal-overlay" onClick={() => setShowBudgetModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>💰 Set Monthly Budget</h3>
                            <button className="btn btn-ghost" onClick={() => setShowBudgetModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleSetBudget}>
                            <div className="form-group">
                                <label>Budget Amount</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    placeholder="e.g. 50000"
                                    value={budgetInput}
                                    onChange={e => setBudgetInput(e.target.value)}
                                    min="0"
                                    step="100"
                                    required
                                    autoFocus
                                    id="budget-amount-input"
                                />
                            </div>
                            <button type="submit" className="btn btn-primary btn-full" id="save-budget-btn">
                                Save Budget
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
