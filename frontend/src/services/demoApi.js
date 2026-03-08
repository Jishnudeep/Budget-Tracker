/**
 * Demo API — localStorage-based drop-in replacement for the real API.
 * Lets users explore the app without MongoDB.
 */

function getStore(key) {
    return JSON.parse(localStorage.getItem(`bt_demo_${key}`) || '[]');
}
function setStore(key, data) {
    localStorage.setItem(`bt_demo_${key}`, JSON.stringify(data));
}
function uid() {
    return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

const demoApi = {
    // ─── Auth (no-op in demo) ────────────────────
    setToken() { },
    getToken() { return localStorage.getItem('bt_demo_mode'); },

    async register(data) {
        const user = { id: 'demo', name: data.name, email: data.email, created_at: new Date().toISOString() };
        return { access_token: 'demo', user };
    },
    async login(data) {
        const user = { id: 'demo', name: 'Demo User', email: data.email, created_at: new Date().toISOString() };
        return { access_token: 'demo', user };
    },
    async getMe() {
        return { id: 'demo', name: 'Demo User', email: 'demo@example.com', created_at: new Date().toISOString() };
    },

    // ─── Budget ──────────────────────────────────
    async getBudget(month) {
        const budgets = getStore('budgets');
        const b = budgets.find(x => x.month === month);
        if (!b) throw new Error('No budget set for this month');
        return b;
    },

    async setBudget(data) {
        const budgets = getStore('budgets');
        const idx = budgets.findIndex(x => x.month === data.month);
        const budget = {
            id: uid(), user_id: 'demo', month: data.month,
            total_amount: data.total_amount, category_limits: data.category_limits || null,
            created_at: new Date().toISOString(),
        };
        if (idx >= 0) { budget.id = budgets[idx].id; budgets[idx] = budget; }
        else budgets.push(budget);
        setStore('budgets', budgets);
        return budget;
    },

    async getBudgetSummary(month) {
        const budgets = getStore('budgets');
        const budget = budgets.find(x => x.month === month);
        if (!budget) throw new Error('No budget set');

        const allExpenses = getStore('expenses');
        const expenses = allExpenses.filter(e => e.date.startsWith(month));
        const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);
        const remaining = budget.total_amount - totalSpent;

        const categorySpending = {};
        expenses.forEach(e => { categorySpending[e.category] = (categorySpending[e.category] || 0) + e.amount; });

        const dailySpending = {};
        expenses.forEach(e => { dailySpending[e.date] = (dailySpending[e.date] || 0) + e.amount; });

        const [y, m] = month.split('-').map(Number);
        const daysInMonth = new Date(y, m, 0).getDate();
        const now = new Date();
        let daysElapsed = (now.getFullYear() === y && now.getMonth() + 1 === m)
            ? now.getDate()
            : (new Date(y, m - 1, 1) < now ? daysInMonth : 0);

        const timePct = daysInMonth > 0 ? (daysElapsed / daysInMonth * 100) : 0;
        const budgetPct = budget.total_amount > 0 ? (totalSpent / budget.total_amount * 100) : 0;
        const dailyAllowance = daysInMonth > 0 ? budget.total_amount / daysInMonth : 0;

        let streak = 0;
        if (daysElapsed > 0) {
            for (let d = daysElapsed; d >= 1; d--) {
                const ds = `${month}-${String(d).padStart(2, '0')}`;
                if ((dailySpending[ds] || 0) <= dailyAllowance) streak++;
                else break;
            }
        }

        const projectedTotal = daysElapsed > 0 ? (totalSpent / daysElapsed) * daysInMonth : 0;

        return {
            month, total_budget: budget.total_amount, total_spent: +totalSpent.toFixed(2),
            remaining: +remaining.toFixed(2), budget_percentage: +budgetPct.toFixed(1),
            time_percentage: +timePct.toFixed(1), category_spending: categorySpending,
            category_limits: budget.category_limits, daily_spending: dailySpending,
            spending_streak: streak, daily_allowance: +dailyAllowance.toFixed(2),
            projected_total: +projectedTotal.toFixed(2), days_in_month: daysInMonth,
            days_elapsed: daysElapsed,
        };
    },

    // ─── Expenses ────────────────────────────────
    async getExpenses(month, category) {
        let list = getStore('expenses');
        if (month) list = list.filter(e => e.date.startsWith(month));
        if (category) list = list.filter(e => e.category === category);
        return list.sort((a, b) => b.date.localeCompare(a.date));
    },

    async createExpense(data) {
        const expenses = getStore('expenses');
        const expense = {
            id: uid(), user_id: 'demo', amount: data.amount, category: data.category,
            description: data.description, date: data.date, notes: data.notes || null,
            created_at: new Date().toISOString(),
        };
        expenses.push(expense);
        setStore('expenses', expenses);
        return expense;
    },

    async updateExpense(id, data) {
        const expenses = getStore('expenses');
        const idx = expenses.findIndex(e => e.id === id);
        if (idx < 0) throw new Error('Not found');
        Object.keys(data).forEach(k => { if (data[k] != null) expenses[idx][k] = data[k]; });
        setStore('expenses', expenses);
        return expenses[idx];
    },

    async deleteExpense(id) {
        const expenses = getStore('expenses').filter(e => e.id !== id);
        setStore('expenses', expenses);
    },

    // ─── Goals ───────────────────────────────────
    async getGoals() {
        return getStore('goals').sort((a, b) => b.created_at?.localeCompare(a.created_at));
    },

    async createGoal(data) {
        const goals = getStore('goals');
        const goal = {
            id: uid(), user_id: 'demo', name: data.name, target_amount: data.target_amount,
            current_amount: 0, deadline: data.deadline || null, icon: data.icon || '🎯',
            contributions: [], created_at: new Date().toISOString(),
        };
        goals.push(goal);
        setStore('goals', goals);
        return goal;
    },

    async updateGoal(id, data) {
        const goals = getStore('goals');
        const idx = goals.findIndex(g => g.id === id);
        if (idx < 0) throw new Error('Not found');
        Object.keys(data).forEach(k => { if (data[k] != null) goals[idx][k] = data[k]; });
        setStore('goals', goals);
        return goals[idx];
    },

    async deleteGoal(id) {
        setStore('goals', getStore('goals').filter(g => g.id !== id));
    },

    async contributeToGoal(id, amount) {
        const goals = getStore('goals');
        const idx = goals.findIndex(g => g.id === id);
        if (idx < 0) throw new Error('Not found');
        goals[idx].current_amount += amount;
        goals[idx].contributions.push({ amount, date: new Date().toISOString() });
        setStore('goals', goals);
        return goals[idx];
    },
};

export default demoApi;
