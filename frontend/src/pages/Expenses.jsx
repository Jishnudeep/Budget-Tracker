import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import ExportModal from '../components/ExportModal';
import './Expenses.css';

const CATEGORIES = [
    { value: 'food', label: '🍕 Food' },
    { value: 'transport', label: '🚗 Transport' },
    { value: 'bills', label: '📄 Bills' },
    { value: 'entertainment', label: '🎬 Entertainment' },
    { value: 'shopping', label: '🛍️ Shopping' },
    { value: 'health', label: '💊 Health' },
    { value: 'education', label: '📚 Education' },
    { value: 'subscriptions', label: '📱 Subscriptions' },
    { value: 'groceries', label: '🥦 Groceries' },
    { value: 'travel', label: '✈️ Travel' },
    { value: 'other', label: '📦 Other' },
];

const CATEGORY_ICONS = {
    food: '🍕', transport: '🚗', bills: '📄', entertainment: '🎬',
    shopping: '🛍️', health: '💊', education: '📚', subscriptions: '📱',
    groceries: '🥦', travel: '✈️', other: '📦',
};

export default function Expenses() {
    const { activeApi: api } = useAuth();
    const [month, setMonth] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterCat, setFilterCat] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        amount: '', category: 'food', description: '', date: '', notes: '',
    });
    const [showExport, setShowExport] = useState(false);

    const loadExpenses = useCallback(async () => {
        setLoading(true);
        try {
            const data = await api.getExpenses(month, filterCat || undefined);
            setExpenses(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [month, filterCat]);

    useEffect(() => {
        loadExpenses();
    }, [loadExpenses]);

    useEffect(() => {
        const handler = () => loadExpenses();
        window.addEventListener('expense-added', handler);
        return () => window.removeEventListener('expense-added', handler);
    }, [loadExpenses]);

    const openAdd = () => {
        setEditingId(null);
        setFormData({
            amount: '', category: 'food', description: '',
            date: new Date().toISOString().split('T')[0], notes: '',
        });
        setShowModal(true);
    };

    const openEdit = (expense) => {
        setEditingId(expense.id);
        setFormData({
            amount: expense.amount,
            category: expense.category,
            description: expense.description,
            date: expense.date,
            notes: expense.notes || '',
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                amount: parseFloat(formData.amount),
            };
            if (editingId) {
                await api.updateExpense(editingId, payload);
            } else {
                await api.createExpense(payload);
            }
            setShowModal(false);
            loadExpenses();
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this expense?')) return;
        try {
            await api.deleteExpense(id);
            loadExpenses();
        } catch (err) {
            console.error(err);
        }
    };

    const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);

    return (
        <div className="page" id="expenses-page">
            <div className="page-header">
                <div className="flex justify-between items-center">
                    <h1>💸 Expenses</h1>
                    <div className="flex gap-sm">
                        <button className="btn btn-secondary btn-sm" onClick={() => setShowExport(true)} title="Export Statement">
                            📄 Export
                        </button>
                        <button className="btn btn-primary btn-sm" onClick={openAdd} id="add-expense-btn">
                            + Add
                        </button>
                    </div>
                </div>
                <div className="expenses-controls mt-md">
                    <input
                        type="month"
                        value={month}
                        onChange={e => setMonth(e.target.value)}
                        className="month-picker"
                    />
                    <select
                        className="form-input filter-select"
                        value={filterCat}
                        onChange={e => setFilterCat(e.target.value)}
                    >
                        <option value="">All Categories</option>
                        {CATEGORIES.map(c => (
                            <option key={c.value} value={c.value}>{c.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Summary */}
            <div className="expense-summary card-flat mb-md">
                <div className="flex justify-between items-center">
                    <span className="text-muted text-sm">{expenses.length} transactions</span>
                    <span className="font-bold" style={{ fontSize: '1.1rem' }}>₹{totalSpent.toLocaleString()}</span>
                </div>
            </div>

            {/* List */}
            {loading ? (
                <div className="loading-center"><div className="spinner" /></div>
            ) : expenses.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">📝</div>
                    <p>No expenses found for this period</p>
                </div>
            ) : (
                <div className="expenses-list">
                    {expenses.map(exp => (
                        <div key={exp.id} className="expense-item card-flat" onClick={() => openEdit(exp)}>
                            <div className="expense-item-left">
                                <span className="expense-icon">{CATEGORY_ICONS[exp.category] || '📦'}</span>
                                <div className="expense-details">
                                    <span className="expense-desc">{exp.description}</span>
                                    <div className="expense-meta">
                                        <span className={`category-pill category-${exp.category}`}>{exp.category}</span>
                                        <span className="text-xs text-muted">{exp.date}</span>
                                    </div>
                                    {exp.notes && <span className="expense-notes">{exp.notes}</span>}
                                </div>
                            </div>
                            <div className="expense-item-right">
                                <span className="expense-amount">-₹{exp.amount.toLocaleString()}</span>
                                <button
                                    className="btn btn-ghost btn-sm delete-btn"
                                    onClick={(e) => { e.stopPropagation(); handleDelete(exp.id); }}
                                    title="Delete"
                                >
                                    🗑️
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{editingId ? '✏️ Edit Expense' : '➕ New Expense'}</h3>
                            <button className="btn btn-ghost" onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Amount</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        value={formData.amount}
                                        onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                        step="0.01" min="0.01" required
                                        id="expense-amount-input"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Date</label>
                                    <input
                                        type="date"
                                        className="form-input"
                                        value={formData.date}
                                        onChange={e => setFormData({ ...formData, date: e.target.value })}
                                        required
                                        id="expense-date-input"
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Category</label>
                                <select
                                    className="form-input"
                                    value={formData.category}
                                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                                    id="expense-category-input"
                                >
                                    {CATEGORIES.map(c => (
                                        <option key={c.value} value={c.value}>{c.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="What was the expense?"
                                    required
                                    id="expense-desc-input"
                                />
                            </div>
                            <div className="form-group">
                                <label>Notes (optional)</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.notes}
                                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                    placeholder="Any additional notes"
                                />
                            </div>
                            <button type="submit" className="btn btn-primary btn-full" id="save-expense-btn">
                                {editingId ? 'Update Expense' : 'Add Expense'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Export Modal */}
            {showExport && (
                <ExportModal
                    onClose={() => setShowExport(false)}
                    activeApi={api}
                    currentMonth={month}
                />
            )}
        </div>
    );
}
