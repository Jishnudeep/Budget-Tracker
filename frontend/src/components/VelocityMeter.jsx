import './VelocityMeter.css';

export default function VelocityMeter({ budgetPercentage = 0, timePercentage = 0 }) {
    const ratio = timePercentage > 0 ? budgetPercentage / timePercentage : 0;

    let status, color, label;
    if (ratio <= 0.8) {
        status = 'under';
        color = 'var(--color-success)';
        label = 'Under pace 🐢';
    } else if (ratio <= 1.1) {
        status = 'on-track';
        color = 'var(--color-info)';
        label = 'On pace 👍';
    } else if (ratio <= 1.5) {
        status = 'fast';
        color = 'var(--color-warning)';
        label = 'Spending fast ⚡';
    } else {
        status = 'danger';
        color = 'var(--color-danger)';
        label = 'Way too fast 🔥';
    }

    // Gauge angle: -90 to 90 degrees
    const angle = Math.min(Math.max((ratio - 1) * 90, -90), 90);

    return (
        <div className="velocity-meter" id="velocity-meter">
            <div className="velocity-gauge">
                <svg viewBox="0 0 200 120" className="velocity-svg">
                    {/* Background arc */}
                    <path
                        d="M 20 110 A 80 80 0 0 1 180 110"
                        fill="none"
                        stroke="var(--border-subtle)"
                        strokeWidth="8"
                        strokeLinecap="round"
                    />
                    {/* Colored arc */}
                    <path
                        d="M 20 110 A 80 80 0 0 1 180 110"
                        fill="none"
                        stroke={color}
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray="251"
                        strokeDashoffset={251 - (Math.min(budgetPercentage, 100) / 100) * 251}
                        style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                    />
                    {/* Needle */}
                    <line
                        x1="100"
                        y1="110"
                        x2="100"
                        y2="40"
                        stroke={color}
                        strokeWidth="3"
                        strokeLinecap="round"
                        transform={`rotate(${angle}, 100, 110)`}
                        style={{ transition: 'transform 0.8s ease' }}
                    />
                    <circle cx="100" cy="110" r="6" fill={color} />
                </svg>
            </div>

            <div className="velocity-info">
                <span className="velocity-label" style={{ color }}>{label}</span>
                <div className="velocity-details">
                    <span className="velocity-stat">
                        <span className="velocity-val">{Math.round(budgetPercentage)}%</span>
                        <span className="velocity-desc">budget used</span>
                    </span>
                    <span className="velocity-divider">|</span>
                    <span className="velocity-stat">
                        <span className="velocity-val">{Math.round(timePercentage)}%</span>
                        <span className="velocity-desc">month elapsed</span>
                    </span>
                </div>
            </div>
        </div>
    );
}
