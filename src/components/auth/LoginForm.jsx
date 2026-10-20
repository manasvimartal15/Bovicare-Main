import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ROLE_DEFINITIONS } from '../../data/roles';
import RoleSelector from './RoleSelector';
import ForgotPasswordModal from './ForgotPasswordModal';
import RegisterModal from './RegisterModal';
import BrandLogo from '../common/BrandLogo';

export default function LoginForm() {
  const { selectedRole, setSelectedRole, login } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  // Modals state
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  // Active role details
  const activeRoleConfig = ROLE_DEFINITIONS.find((r) => r.id === selectedRole) || ROLE_DEFINITIONS[0];

  // Validate form inputs
  const validate = () => {
    const errors = {};
    if (!identifier.trim()) {
      errors.identifier = 'Please provide an email address or mobile number.';
    } else if (
      identifier.includes('@') &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier.trim())
    ) {
      errors.identifier = 'Please enter a valid email format (e.g., name@domain.com).';
    }

    if (!password) {
      errors.password = 'Please enter your password.';
    } else if (password.length < 4) {
      errors.password = 'Password must be at least 4 characters.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!validate()) {
      return;
    }

    setIsLoading(true);

    try {
      // Simulate authenticating against the selected role
      const result = await login(identifier, password, selectedRole);
      if (!result.success) {
        setErrorMessage(result.error);
      }
    } catch (err) {
      setErrorMessage('An unexpected authentication error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle registration mock
  const handleRegisteredLogin = (registeredId, role, name, kycStatus = null) => {
    setSelectedRole(role);
    setIdentifier(registeredId);
    setPassword('password123');
    login(registeredId, 'password123', role, kycStatus);
  };

  return (
    <div className="login-screen-wrapper">
      <main className="login-main-container">
        <div className="login-card-surface">
          {/* Brand Header */}
          <header className="login-header">
            <BrandLogo size="large" />
            <div className="login-welcome-text">
              <h1 className="login-heading">Welcome to BoviCare</h1>
              <p className="login-subheading">
                Sign in to access your dairy herd health records, diagnostics, and management tools.
              </p>
            </div>
          </header>

          {/* Three User Roles Selection Cards */}
          <section className="login-roles-section" aria-label="Role selection">
            <RoleSelector
              selectedRole={selectedRole}
              onSelectRole={(newRole) => {
                setSelectedRole(newRole);
                setErrorMessage('');
              }}
            />
          </section>

          {/* Authentication Form */}
          <section className="login-form-section" aria-label="Credentials entry">
            <div className="active-role-indicator">
              <span className="active-role-prompt">Signing in as:</span>
              <span className="active-role-pill">
                <strong>{activeRoleConfig.title}</strong> — {activeRoleConfig.tagline}
              </span>
            </div>

            {errorMessage && (
              <div className="auth-error-alert" role="alert">
                <AlertCircle size={18} className="error-alert-icon" />
                <div className="error-alert-text">{errorMessage}</div>
              </div>
            )}

            <form onSubmit={handleSignIn} className="auth-form" noValidate>
              {/* Email or Phone Input */}
              <div className={`form-field ${fieldErrors.identifier ? 'has-error' : ''}`}>
                <div className="field-label-row">
                  <label htmlFor="login-identifier" className="field-label">
                    Email or Mobile Number
                  </label>
                  <span className="field-hint">e.g. farmer@bovicare.com or +91 98765...</span>
                </div>
                <div className="input-control-wrap">
                  <Mail size={18} className="input-icon-left" />
                  <input
                    id="login-identifier"
                    type="text"
                    autoComplete="username"
                    className="text-input"
                    placeholder="Enter email or registered mobile number"
                    value={identifier}
                    onChange={(e) => {
                      setIdentifier(e.target.value);
                      if (fieldErrors.identifier) {
                        setFieldErrors({ ...fieldErrors, identifier: null });
                      }
                    }}
                    disabled={isLoading}
                    aria-invalid={!!fieldErrors.identifier}
                    aria-describedby={fieldErrors.identifier ? 'identifier-error' : undefined}
                  />
                </div>
                {fieldErrors.identifier && (
                  <span id="identifier-error" className="field-error-msg">
                    {fieldErrors.identifier}
                  </span>
                )}
              </div>

              {/* Password Input with Show/Hide toggle */}
              <div className={`form-field ${fieldErrors.password ? 'has-error' : ''}`}>
                <div className="field-label-row">
                  <label htmlFor="login-password" className="field-label">
                    Password
                  </label>
                  <button
                    type="button"
                    className="link-btn forgot-link"
                    onClick={() => setIsForgotModalOpen(true)}
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="input-control-wrap">
                  <Lock size={18} className="input-icon-left" />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    className="text-input has-toggle-btn"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (fieldErrors.password) {
                        setFieldErrors({ ...fieldErrors, password: null });
                      }
                    }}
                    disabled={isLoading}
                    aria-invalid={!!fieldErrors.password}
                    aria-describedby={fieldErrors.password ? 'password-error' : undefined}
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    tabIndex={0}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {fieldErrors.password && (
                  <span id="password-error" className="field-error-msg">
                    {fieldErrors.password}
                  </span>
                )}
              </div>

              {/* Sign In Button */}
              <button
                type="submit"
                className="btn-submit-primary"
                disabled={isLoading}
                id="sign-in-button"
              >
                {isLoading ? (
                  <span className="submit-loading-text">
                    <span className="loading-spinner" />
                    Authenticating {activeRoleConfig.title}...
                  </span>
                ) : (
                  <>
                    <span>Sign In to {activeRoleConfig.destinationName}</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>
          </section>

          {/* Footer Actions */}
          <footer className="login-card-footer">
            <p className="create-account-prompt">
              {selectedRole === 'vet' ? (
                <>
                  New to BoviCare Clinical Network?{' '}
                  <button
                    type="button"
                    className="link-btn register-link"
                    onClick={() => setIsRegisterModalOpen(true)}
                  >
                    Register as Vet & Submit KYC
                  </button>
                </>
              ) : (
                <>
                  Don't have a registered dairy account?{' '}
                  <button
                    type="button"
                    className="link-btn register-link"
                    onClick={() => setIsRegisterModalOpen(true)}
                  >
                    Create Account
                  </button>
                </>
              )}
            </p>

            <div className="security-notice">
              <ShieldAlert size={13} />
              <span>Role-Based Access Control · {activeRoleConfig.title} Portal</span>
            </div>
          </footer>
        </div>
      </main>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={isForgotModalOpen}
        onClose={() => setIsForgotModalOpen(false)}
        initialIdentifier={identifier}
      />

      {/* Create Account Modal */}
      <RegisterModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        selectedRole={selectedRole}
        onRegisteredLogin={handleRegisteredLogin}
      />
    </div>
  );
}
