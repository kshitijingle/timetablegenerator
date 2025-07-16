import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Settings, Calendar, Github } from 'lucide-react';
import styles from './SharedLayout.module.css';
import { ThemeModeSwitch } from './ThemeModeSwitch';

export const SharedLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();

  const navLinks = [
    { to: '/', label: 'Home', icon: <Home size={18} /> },
    { to: '/setup', label: 'Setup', icon: <Settings size={18} /> },
    { to: '/timetable', label: 'Timetable', icon: <Calendar size={18} /> },
  ];

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <div className={styles.logo}>
          <Link to="/" className={styles.logoLink}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 6H20M4 12H20M4 18H12" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Smart Timetable</span>
          </Link>
        </div>
        <nav className={styles.nav}>
          {navLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className={`${styles.navLink} ${location.pathname === link.to ? styles.active : ''}`}
            >
              {link.icon}
              <span>{link.label}</span>
            </Link>
          ))}
        </nav>
        <div className={styles.headerActions}>
          <a href="https://github.com/flot-ai/examples" target="_blank" rel="noopener noreferrer" className={styles.githubLink}>
            <Github size={20} />
          </a>
          <ThemeModeSwitch />
        </div>
      </header>
      <main className={styles.main}>
        {children}
      </main>
    </div>
  );
};