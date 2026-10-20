import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Search,
  X,
  Plus,
  Filter,
  Users,
  Sparkles,
  Info,
  RefreshCw
} from 'lucide-react';
import { useCows } from '../../context/CowsContext';
import CowCard from './CowCard';
import DashboardBottomNav from '../common/DashboardBottomNav';

export default function MyCowsPage({ onBack, onSelectCow, onAddCow, roleContext = 'farmer' }) {
  const { cows, stats, resetDemoCows } = useCows();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // all | healthy | watch | alert
  const [feedbackToast, setFeedbackToast] = useState(null);

  // Filter & Search Logic
  const filteredCows = useMemo(() => {
    return cows.filter((cow) => {
      // 1. Health Status Filter
      if (activeFilter === 'healthy' && cow.status !== 'healthy') return false;
      if (activeFilter === 'watch' && cow.status !== 'watch') return false;
      if (activeFilter === 'alert' && cow.status !== 'alert') return false;

      // 2. Search Query (matches name, tagId, or breed)
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const nameMatch = (cow.name || '').toLowerCase().includes(query);
        const tagMatch = (cow.tagId || '').toLowerCase().includes(query);
        const breedMatch = (cow.breed || '').toLowerCase().includes(query);
        return nameMatch || tagMatch || breedMatch;
      }

      return true;
    });
  }, [cows, activeFilter, searchQuery]);

  const handleResetDemo = () => {
    resetDemoCows();
    setFeedbackToast('Demo herd restored to initial 5 cows.');
    setTimeout(() => setFeedbackToast(null), 3000);
  };

  return (
    <div className="my-cows-page-wrapper">
      {/* Top Header matching Screen 2 */}
      <header className="page-nav-header">
        <div className="nav-header-inner">
          <div className="nav-left">
            <button
              type="button"
              className="nav-back-btn"
              onClick={onBack}
              aria-label="Back to dashboard"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="nav-titles">
              <h1 className="nav-page-title">My Cows</h1>
              <p className="nav-page-subtitle">Manage your herd · {stats.total} total cows</p>
            </div>
          </div>

          <div className="nav-right">
            <button
              type="button"
              className="btn-add-cow-top"
              onClick={onAddCow}
              aria-label="Add new cow"
            >
              <Plus size={16} />
              <span>Add Cow</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="my-cows-main-container">
        {feedbackToast && (
          <div className="floating-feedback-toast" role="status">
            <Info size={16} />
            <span>{feedbackToast}</span>
          </div>
        )}

        {/* Search Bar matching Screen 2 */}
        <section className="cows-search-section" aria-label="Search cows">
          <div className="search-bar-wrap">
            <Search size={18} className="search-icon-prefix" aria-hidden="true" />
            <input
              type="text"
              className="cows-search-input"
              placeholder="Search by name, tag (e.g. 021), or breed..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search cows by name or tag ID"
            />
            {searchQuery && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </section>

        {/* Filter Chips matching Screen 2 */}
        <section className="cows-filter-section" aria-label="Filter cows by health status">
          <div className="filter-chips-row" role="tablist">
            <button
              type="button"
              className={`filter-chip ${activeFilter === 'all' ? 'active' : ''}`}
              onClick={() => setActiveFilter('all')}
              role="tab"
              aria-selected={activeFilter === 'all'}
            >
              All ({stats.total})
            </button>
            <button
              type="button"
              className={`filter-chip ${activeFilter === 'healthy' ? 'active' : ''}`}
              onClick={() => setActiveFilter('healthy')}
              role="tab"
              aria-selected={activeFilter === 'healthy'}
            >
              Healthy ({stats.healthy})
            </button>
            <button
              type="button"
              className={`filter-chip chip-watch ${activeFilter === 'watch' ? 'active' : ''}`}
              onClick={() => setActiveFilter('watch')}
              role="tab"
              aria-selected={activeFilter === 'watch'}
            >
              Under Observation ({stats.watch})
            </button>
            <button
              type="button"
              className={`filter-chip chip-alert ${activeFilter === 'alert' ? 'active' : ''}`}
              onClick={() => setActiveFilter('alert')}
              role="tab"
              aria-selected={activeFilter === 'alert'}
            >
              Needs Attention ({stats.alert})
            </button>
          </div>
        </section>

        {/* Cows List / Grid */}
        <section className="cows-list-section" aria-label="Cows roster">
          {filteredCows.length > 0 ? (
            <div className="cows-cards-stack">
              {filteredCows.map((cow) => (
                <CowCard
                  key={cow.id}
                  cow={cow}
                  onClick={onSelectCow}
                />
              ))}
            </div>
          ) : (
            /* Empty State Scenarios */
            <div className="cows-empty-state-card">
              <div className="empty-state-illustration-box">
                <img
                  src="/images/illustrations/empty_herd.jpg"
                  alt="Dairy cattle grazing peacefully on green pasture"
                  className="empty-state-illustration-img"
                  loading="lazy"
                />
              </div>

              {searchQuery || activeFilter !== 'all' ? (
                <>
                  <h3>No Cows Found Matching Criteria</h3>
                  <p>
                    {searchQuery
                      ? `No cattle records match "${searchQuery}". Check the spelling or tag number.`
                      : `There are currently no cows under the "${activeFilter === 'watch' ? 'Under Observation' : activeFilter === 'alert' ? 'Needs Attention' : activeFilter}" status.`}
                  </p>
                  <div className="empty-state-actions">
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => {
                        setSearchQuery('');
                        setActiveFilter('all');
                      }}
                    >
                      Clear Search & Filters
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h3>Your Herd is Currently Empty</h3>
                  <p>
                    You have not registered any cows yet. Click the button below to add your first cow with tag ID, breed, and baseline records.
                  </p>
                  <div className="empty-state-actions">
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={onAddCow}
                    >
                      <Plus size={16} />
                      <span>Add First Cow</span>
                    </button>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={handleResetDemo}
                      title="Load default herd records"
                    >
                      <RefreshCw size={14} />
                      <span>Restore Default Herd</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </section>

        {/* Floating / Sticky Mobile Bottom Add Cow Button */}
        <div className="mobile-floating-add-btn-wrap">
          <button
            type="button"
            className="mobile-floating-add-btn"
            onClick={onAddCow}
          >
            <Plus size={20} />
            <span>Add Cow</span>
          </button>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <DashboardBottomNav
        activeTab="my-cows"
        onTabClick={(tabId) => {
          if (tabId === 'home') {
            onBack();
          }
        }}
      />
    </div>
  );
}
