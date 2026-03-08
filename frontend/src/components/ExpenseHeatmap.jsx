import './ExpenseHeatmap.css';

export default function ExpenseHeatmap({ dailySpending = {}, month, dailyAllowance = 0 }) {
    if (!month) return null;

    const [year, mo] = month.split('-').map(Number);
    const daysInMonth = new Date(year, mo, 0).getDate();
    const firstDayOfWeek = new Date(year, mo - 1, 1).getDay();

    const maxSpend = Math.max(...Object.values(dailySpending), dailyAllowance, 1);

    const cells = [];
    // Padding for the first week
    for (let i = 0; i < firstDayOfWeek; i++) {
        cells.push(<div key={`pad-${i}`} className="heatmap-cell heatmap-empty" />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${month}-${String(day).padStart(2, '0')}`;
        const amount = dailySpending[dateStr] || 0;
        const intensity = amount / maxSpend;

        let levelClass = 'level-0';
        if (amount > 0 && amount <= dailyAllowance * 0.5) levelClass = 'level-1';
        else if (amount <= dailyAllowance) levelClass = 'level-2';
        else if (amount <= dailyAllowance * 1.5) levelClass = 'level-3';
        else if (amount > dailyAllowance * 1.5) levelClass = 'level-4';

        cells.push(
            <div
                key={day}
                className={`heatmap-cell ${levelClass}`}
                title={`${dateStr}: ₹${amount.toFixed(0)}`}
            >
                <span className="heatmap-day">{day}</span>
            </div>
        );
    }

    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <div className="expense-heatmap" id="expense-heatmap">
            <div className="heatmap-weekdays">
                {weekdays.map(d => <span key={d} className="heatmap-weekday">{d}</span>)}
            </div>
            <div className="heatmap-grid">
                {cells}
            </div>
            <div className="heatmap-legend">
                <span className="text-xs text-muted">Less</span>
                <div className="heatmap-cell level-0 legend-cell" />
                <div className="heatmap-cell level-1 legend-cell" />
                <div className="heatmap-cell level-2 legend-cell" />
                <div className="heatmap-cell level-3 legend-cell" />
                <div className="heatmap-cell level-4 legend-cell" />
                <span className="text-xs text-muted">More</span>
            </div>
        </div>
    );
}
