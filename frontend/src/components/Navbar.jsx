import { NavLink, useLocation } from 'react-router-dom';
import './Navbar.css';

const navItems = [
    { path: '/', icon: '📊', label: 'Dashboard' },
    { path: '/expenses', icon: '💸', label: 'Expenses' },
    { path: '/goals', icon: '🎯', label: 'Goals' },
    { path: '/analytics', icon: '📈', label: 'Analytics' },
];

export default function Navbar() {
    const location = useLocation();

    return (
        <nav className="navbar" id="main-navbar">
            <div className="navbar-inner">
                {navItems.map(item => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                        end={item.path === '/'}
                    >
                        <span className="nav-icon">{item.icon}</span>
                        <span className="nav-label">{item.label}</span>
                        {location.pathname === item.path && <span className="nav-indicator" />}
                    </NavLink>
                ))}
            </div>
        </nav>
    );
}
