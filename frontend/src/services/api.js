const API_BASE = '/api';

class ApiService {
    constructor() {
        this.token = localStorage.getItem('bt_token');
    }

    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('bt_token', token);
        } else {
            localStorage.removeItem('bt_token');
        }
    }

    getToken() {
        return this.token || localStorage.getItem('bt_token');
    }

    async request(endpoint, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        const token = this.getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${API_BASE}${endpoint}`, {
            ...options,
            headers,
        });

        if (response.status === 204) return null;

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || 'Something went wrong');
        }

        return data;
    }

    // Auth
    register(data) {
        return this.request('/auth/register', { method: 'POST', body: JSON.stringify(data) });
    }

    login(data) {
        return this.request('/auth/login', { method: 'POST', body: JSON.stringify(data) });
    }

    getMe() {
        return this.request('/auth/me');
    }

    // Budget
    getBudget(month) {
        return this.request(`/budget/${month}`);
    }

    setBudget(data) {
        return this.request('/budget/', { method: 'POST', body: JSON.stringify(data) });
    }

    getBudgetSummary(month) {
        return this.request(`/budget/${month}/summary`);
    }

    // Expenses
    getExpenses(month, category) {
        let url = '/expenses/';
        const params = new URLSearchParams();
        if (month) params.set('month', month);
        if (category) params.set('category', category);
        const qs = params.toString();
        return this.request(url + (qs ? `?${qs}` : ''));
    }

    createExpense(data) {
        return this.request('/expenses/', { method: 'POST', body: JSON.stringify(data) });
    }

    updateExpense(id, data) {
        return this.request(`/expenses/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    }

    deleteExpense(id) {
        return this.request(`/expenses/${id}`, { method: 'DELETE' });
    }

    // Goals
    getGoals() {
        return this.request('/goals/');
    }

    createGoal(data) {
        return this.request('/goals/', { method: 'POST', body: JSON.stringify(data) });
    }

    updateGoal(id, data) {
        return this.request(`/goals/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    }

    deleteGoal(id) {
        return this.request(`/goals/${id}`, { method: 'DELETE' });
    }

    contributeToGoal(id, amount) {
        return this.request(`/goals/${id}/contribute`, { method: 'POST', body: JSON.stringify({ amount }) });
    }
}

const api = new ApiService();
export default api;
