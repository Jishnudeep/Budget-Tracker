import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import './Goals.css';

const GOAL_ICONS = ['🎯', '🏠', '🚗', '✈️', '💻', '📱', '🎓', '💍', '🏥', '🎮', '📚', '💰'];

export default function Goals() {
    const { activeApi: api } = useAuth();
    const [goals, setGoals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showContributeModal, setShowContributeModal] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({ name: '', target_amount: '', deadline: '', icon: '🎯' });
    const [contributeAmount, setContributeAmount] = useState('');

    const loadGoals = useCallback(async () => {
        setLoading(true);
        try {
            const data = await api.getGoals();
            setGoals(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadGoals(); }, [loadGoals]);

    const openAdd = () => {
        setEditingId(null);
        setFormData({ name: '', target_amount: '', deadline: '', icon: '🎯' });
        setShowModal(true);
    };

    const openEdit = (goal) => {
        setEditingId(goal.id);
        setFormData({
            name: goal.name,
            target_amount: goal.target_amount,
            deadline: goal.deadline || '',
            icon: goal.icon,
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                target_amount: parseFloat(formData.target_amount),
                deadline: formData.deadline || null,
            };
            if (editingId) {
                await api.updateGoal(editingId, payload);
            } else {
                await api.createGoal(payload);
            }
            setShowModal(false);
            loadGoals();
        } catch (err) {
            console.error(err);
        }
    };

    const handleContribute = async (e) => {
        e.preventDefault();
        if (!showContributeModal) return;
        try {
            await api.contributeToGoal(showContributeModal, parseFloat(contributeAmount));
            setShowContributeModal(null);
            setContributeAmount('');
            loadGoals();
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this goal?')) return;
        try {
            await api.deleteGoal(id);
            loadGoals();
        } catch (err) {
            console.error(err);
        }
    };

    const totalSaved = goals.reduce((s, g) => s + g.current_amount, 0);
    const totalTarget = goals.reduce((s, g) => s + g.target_amount, 0);

    return (
        <div className="page" id="goals-page">
            <div className="page-header">
                <div className="flex justify-between items-center">
                    <h1>🎯 Savings Goals</h1>
                    <button className="btn btn-primary btn-sm" onClick={openAdd} id="add-goal-btn">
                        + New Goal
                    </button>
                </div>
            </div>

            {/* Summary */}
            {goals.length > 0 && (
                <div className="card-accent mb-md">
                    <div className="flex justify-between items-center">
                        <div>
                            <div className="text-xs text-muted">Total Saved</div>
                            <div className="stat-value">₹{totalSaved.toLocaleString()}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div className="text-xs text-muted">Total Target</div>
                            <div className="font-bold">₹{totalTarget.toLocaleString()}</div>
                        </div>
                    </div>
                    <div className="goal-total-bar mt-sm">
                        <div
                            className="goal-total-fill"
                            style={{ width: `${Math.min((totalSaved / totalTarget) * 100, 100)}%` }}
                        />
                    </div>
                    <div className="text-xs text-muted mt-sm text-center">
                        {totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0}% of total goals
                    </div>
                </div>
            )}

            {/* Goals List */}
            {loading ? (
                <div className="loading-center"><div className="spinner" /></div>
            ) : goals.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">🎯</div>
                    <p>No savings goals yet. Start saving for something special!</p>
                </div>
            ) : (
                <div className="goals-grid">
                    {goals.map(goal => {
                        const progress = goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0;
                        const isComplete = progress >= 100;
                        const circumference = 2 * Math.PI * 45;
                        const offset = circumference - (Math.min(progress, 100) / 100) * circumference;

                        return (
                            <div key={goal.id} className={`goal-card card ${isComplete ? 'goal-complete' : ''}`}>
                                <div className="goal-card-header">
                                    <div className="goal-ring">
                                        <svg viewBox="0 0 100 100" className="goal-ring-svg">
                                            <circle cx="50" cy="50" r="45" className="goal-ring-bg" />
                                            <circle
                                                cx="50" cy="50" r="45"
                                                className="goal-ring-fill"
                                                stroke={isComplete ? 'var(--color-success)' : 'var(--accent-primary)'}
                                                strokeDasharray={circumference}
                                                strokeDashoffset={offset}
                                            />
                                        </svg>
                                        <span className="goal-ring-icon">{goal.icon}</span>
                                    </div>
                                    <div className="goal-actions">
                                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(goal)}>✏️</button>
                                        <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(goal.id)}>🗑️</button>
                                    </div>
                                </div>

                                <h3 className="goal-name">{goal.name}</h3>
                                <div className="goal-amounts">
                                    <span className="goal-current">₹{goal.current_amount.toLocaleString()}</span>
                                    <span className="text-muted"> / ₹{goal.target_amount.toLocaleString()}</span>
                                </div>

                                <div className="goal-progress-bar">
                                    <div
                                        className="goal-progress-fill"
                                        style={{
                                            width: `${Math.min(progress, 100)}%`,
                                            background: isComplete ? 'var(--color-success)' : 'var(--accent-gradient)',
                                        }}
                                    />
                                </div>

                                <div className="flex justify-between items-center mt-sm">
                                    <span className="text-xs text-muted">
                                        {Math.round(progress)}% {isComplete && '✅ Complete!'}
                                    </span>
                                    {goal.deadline && (
                                        <span className="text-xs text-muted">⏰ {goal.deadline}</span>
                                    )}
                                </div>

                                {!isComplete && (
                                    <button
                                        className="btn btn-secondary btn-sm btn-full mt-md"
                                        onClick={() => { setShowContributeModal(goal.id); setContributeAmount(''); }}
                                    >
                                        💰 Add Savings
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{editingId ? '✏️ Edit Goal' : '🎯 New Goal'}</h3>
                            <button className="btn btn-ghost" onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Icon</label>
                                <div className="icon-picker">
                                    {GOAL_ICONS.map(icon => (
                                        <button
                                            key={icon}
                                            type="button"
                                            className={`icon-btn ${formData.icon === icon ? 'active' : ''}`}
                                            onClick={() => setFormData({ ...formData, icon })}
                                        >
                                            {icon}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Goal Name</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g. Emergency Fund"
                                    required
                                    id="goal-name-input"
                                />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Target Amount</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        value={formData.target_amount}
                                        onChange={e => setFormData({ ...formData, target_amount: e.target.value })}
                                        min="1"
                                        required
                                        id="goal-amount-input"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Deadline</label>
                                    <input
                                        type="date"
                                        className="form-input"
                                        value={formData.deadline}
                                        onChange={e => setFormData({ ...formData, deadline: e.target.value })}
                                    />
                                </div>
                            </div>
                            <button type="submit" className="btn btn-primary btn-full" id="save-goal-btn">
                                {editingId ? 'Update Goal' : 'Create Goal'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Contribute Modal */}
            {showContributeModal && (
                <div className="modal-overlay" onClick={() => setShowContributeModal(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>💰 Add Savings</h3>
                            <button className="btn btn-ghost" onClick={() => setShowContributeModal(null)}>✕</button>
                        </div>
                        <form onSubmit={handleContribute}>
                            <div className="form-group">
                                <label>Amount</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={contributeAmount}
                                    onChange={e => setContributeAmount(e.target.value)}
                                    placeholder="How much did you save?"
                                    min="1"
                                    required
                                    autoFocus
                                    id="contribute-amount-input"
                                />
                            </div>
                            <button type="submit" className="btn btn-primary btn-full" id="contribute-btn">
                                Add to Savings
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
