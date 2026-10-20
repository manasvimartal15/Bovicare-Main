import React, { useState } from 'react';
import { Info, Sparkles, ChevronDown, ChevronUp, Check, Key } from 'lucide-react';
import { PROTOTYPE_USERS, DEFAULT_PROTOTYPE_PASSWORD } from '../../data/mockUsers';

export default function PrototypeNotice({ onQuickFill }) {
  const [expanded, setExpanded] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  const handleCopy = (user) => {
    onQuickFill?.(user);
    setCopiedId(user.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <aside className="prototype-banner" aria-label="Prototype environment notice">
      <div className="prototype-banner-top">
        <div className="prototype-badge-row">
          <span className="prototype-pill">
            <Sparkles size={13} className="spin-slow" />
            Prototype Mode
          </span>
          <span className="prototype-status-text">
            Step 1: Auth & Role Architecture (ML & DB unlinked)
          </span>
        </div>
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="prototype-toggle-btn"
          aria-expanded={expanded}
          aria-label="Toggle demo accounts panel"
        >
          <span>{expanded ? 'Hide Demo Logins' : 'View Demo Logins'}</span>
          {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>
      </div>

      {expanded && (
        <div className="prototype-drawer">
          <p className="drawer-intro">
            Click any demo profile to instantly autofill test credentials and select its role:
          </p>
          <div className="demo-accounts-grid">
            {PROTOTYPE_USERS.map((user) => {
              const isCopied = copiedId === user.id;
              const roleTitle = user.role === 'vet' ? 'Veterinarian' : user.role.charAt(0).toUpperCase() + user.role.slice(1);
              return (
                <button
                  key={user.id}
                  type="button"
                  className={`demo-account-card ${isCopied ? 'selected' : ''}`}
                  onClick={() => handleCopy(user)}
                >
                  <div className="demo-card-header">
                    <span className={`demo-role-tag role-${user.role}`}>
                      {roleTitle}
                    </span>
                    {isCopied ? (
                      <span className="demo-filled-text"><Check size={12} /> Auto-filled</span>
                    ) : (
                      <span className="demo-fill-action">Use account</span>
                    )}
                  </div>
                  <div className="demo-card-body">
                    <div className="demo-name">{user.fullName}</div>
                    <div className="demo-email">{user.email}</div>
                    <div className="demo-password">
                      <Key size={11} /> pwd: <code>{DEFAULT_PROTOTYPE_PASSWORD}</code>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </aside>
  );
}
