import React from 'react';
import { ROLE_DEFINITIONS } from '../../data/roles';
import RoleCard from './RoleCard';

export default function RoleSelector({ selectedRole, onSelectRole }) {
  return (
    <div className="role-selector-container">
      <div className="role-selector-header">
        <label className="section-label">Select Your Account Role</label>
        <span className="role-helper-text">
          Defines your operational dashboard & diagnostic tooling
        </span>
      </div>

      <div
        className="role-cards-grid"
        role="radiogroup"
        aria-label="Select BoviCare Account Role"
      >
        {ROLE_DEFINITIONS.map((role) => (
          <RoleCard
            key={role.id}
            role={role}
            isSelected={selectedRole === role.id}
            onSelect={onSelectRole}
          />
        ))}
      </div>
    </div>
  );
}
