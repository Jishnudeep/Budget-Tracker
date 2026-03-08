import './BudgetPulse.css';

export default function BudgetPulse({ percentage = 0 }) {
    // Determine pulse speed and color based on budget usage
    let pulseClass = 'pulse-healthy';
    let statusText = 'On Track';
    let statusIcon = '💚';

    if (percentage >= 100) {
        pulseClass = 'pulse-critical';
        statusText = 'Over Budget!';
        statusIcon = '🔴';
    } else if (percentage >= 80) {
        pulseClass = 'pulse-warning';
        statusText = 'Almost There';
        statusIcon = '🟡';
    } else if (percentage >= 60) {
        pulseClass = 'pulse-caution';
        statusText = 'Watch Out';
        statusIcon = '🟠';
    }

    return (
        <div className={`budget-pulse ${pulseClass}`} id="budget-pulse">
            <div className="pulse-ring pulse-ring-outer" />
            <div className="pulse-ring pulse-ring-inner" />
            <div className="pulse-core">
                <span className="pulse-icon">{statusIcon}</span>
                <span className="pulse-percent">{Math.round(percentage)}%</span>
                <span className="pulse-status">{statusText}</span>
            </div>
        </div>
    );
}
