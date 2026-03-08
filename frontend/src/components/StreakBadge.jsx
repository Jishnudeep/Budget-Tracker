import './StreakBadge.css';

export default function StreakBadge({ streak = 0 }) {
    let icon = '🌱';
    let label = 'Start a streak!';
    let badgeClass = 'streak-new';

    if (streak >= 30) {
        icon = '⚡';
        label = `${streak}-day Legend!`;
        badgeClass = 'streak-legend';
    } else if (streak >= 14) {
        icon = '💎';
        label = `${streak}-day Diamond!`;
        badgeClass = 'streak-diamond';
    } else if (streak >= 7) {
        icon = '🔥';
        label = `${streak}-day Fire!`;
        badgeClass = 'streak-fire';
    } else if (streak >= 3) {
        icon = '✨';
        label = `${streak}-day Spark!`;
        badgeClass = 'streak-spark';
    } else if (streak >= 1) {
        icon = '🌱';
        label = `${streak}-day Seedling`;
        badgeClass = 'streak-seed';
    }

    return (
        <div className={`streak-badge ${badgeClass}`} id="streak-badge">
            <span className="streak-icon">{icon}</span>
            <div className="streak-info">
                <span className="streak-count">{streak}</span>
                <span className="streak-label">{label}</span>
            </div>
        </div>
    );
}
