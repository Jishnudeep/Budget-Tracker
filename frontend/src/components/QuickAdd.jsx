import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './QuickAdd.css';

const CATEGORIES = [
    { value: 'food', label: '🍕 Food', },
    { value: 'transport', label: '🚗 Transport' },
    { value: 'bills', label: '📄 Bills' },
    { value: 'entertainment', label: '🎬 Entertainment' },
    { value: 'shopping', label: '🛍️ Shopping' },
    { value: 'health', label: '💊 Health' },
    { value: 'education', label: '📚 Education' },
    { value: 'subscriptions', label: '📱 Subs' },
    { value: 'groceries', label: '🥦 Groceries' },
    { value: 'travel', label: '✈️ Travel' },
    { value: 'other', label: '📦 Other' },
];

export default function QuickAdd() {
    const { activeApi: api } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('food');
    const [description, setDescription] = useState('');
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!amount || !description) return;

        setSaving(true);
        try {
            const today = new Date().toISOString().split('T')[0];
            await api.createExpense({
                amount: parseFloat(amount),
                category,
                description,
                date: today,
            });
            setAmount('');
            setDescription('');
            setCategory('food');
            setIsOpen(false);
            // Dispatch custom event so pages can refresh
            window.dispatchEvent(new Event('expense-added'));
        } catch (err) {
            console.error('Failed to add expense:', err);
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            <button
                className="fab"
                onClick={() => setIsOpen(true)}
                id="quick-add-fab"
                aria-label="Quick add expense"
            >
                <span className="fab-icon">+</span>
            </button>

            {isOpen && (
                <div className="modal-overlay" onClick={() => setIsOpen(false)}>
                    <div className="modal quick-add-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>⚡ Quick Add Expense</h3>
                            <button className="btn btn-ghost" onClick={() => setIsOpen(false)}>✕</button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Amount</label>
                                <input
                                    type="number"
                                    className="form-input quick-add-amount"
                                    placeholder="0.00"
                                    value={amount}
                                    onChange={e => setAmount(e.target.value)}
                                    step="0.01"
                                    min="0.01"
                                    required
                                    autoFocus
                                    id="quick-add-amount"
                                />
                            </div>

                            <div className="form-group">
                                <label>Category</label>
                                <div className="quick-add-categories">
                                    {CATEGORIES.map(cat => (
                                        <button
                                            key={cat.value}
                                            type="button"
                                            className={`quick-cat-btn ${category === cat.value ? 'active' : ''}`}
                                            onClick={() => setCategory(cat.value)}
                                        >
                                            {cat.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Description</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="What did you spend on?"
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    required
                                    id="quick-add-description"
                                />
                            </div>

                            <button type="submit" className="btn btn-primary btn-full" disabled={saving} id="quick-add-submit">
                                {saving ? 'Saving...' : 'Add Expense'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
