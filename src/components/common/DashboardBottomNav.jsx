import React from 'react';
import { Home, Users, Camera, FileText, User } from 'lucide-react';

export default function DashboardBottomNav({ activeTab = 'home', onTabClick }) {
  const tabs = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'my-cows', label: 'My Cows', icon: Users },
    { id: 'assess', label: 'Assess', icon: Camera },
    { id: 'records', label: 'Records', icon: FileText },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <nav className="dashboard-bottom-nav" aria-label="Mobile Navigation Bar">
      {tabs.map((tab) => {
        const IconComponent = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            className={`nav-tab-item ${isActive ? 'active' : ''}`}
            onClick={() => onTabClick?.(tab.id)}
            aria-current={isActive ? 'page' : undefined}
          >
            <div className="tab-icon-wrap">
              <IconComponent size={20} />
            </div>
            <span className="tab-label">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
