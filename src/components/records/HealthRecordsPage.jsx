import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  FileText,
  Search,
  Filter,
  Calendar,
  Clock,
  Thermometer,
  Milk,
  Syringe,
  Camera,
  Tractor,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Info,
  ExternalLink,
  ShieldCheck,
  Plus
} from 'lucide-react';
import { useCows } from '../../context/CowsContext';
import CowSelectModal from '../common/CowSelectModal';
import CowAvatar from '../common/CowAvatar';

export default function HealthRecordsPage({
  initialCowId,
  onBack,
  onOpenCowProfile,
  onStartAssessment,
  onLogFever,
  onLogMilk,
  onAddVaccine,
  roleContext = 'farmer',
}) {
  const { cows } = useCows();

  // Selected cow
  const [selectedCowId, setSelectedCowId] = useState(() => {
    if (initialCowId && cows.some((c) => c.id === initialCowId)) {
      return initialCowId;
    }
    // Prefer cow with records or first cow
    const alertCow = cows.find((c) => c.status === 'alert');
    return alertCow ? alertCow.id : cows[0]?.id || '';
  });

  const selectedCow = cows.find((c) => c.id === selectedCowId) || cows[0];

  // Cow picker modal
  const [isCowPickerOpen, setIsCowPickerOpen] = useState(false);

  // Active filter tab: 'all' | 'assessments' | 'fever' | 'vaccines' | 'milk'
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Assemble chronological timeline of all records for the selected cow
  const records = useMemo(() => {
    if (!selectedCow) return [];
    const list = [];

    // 1. Mastitis Health Assessments
    if (Array.isArray(selectedCow.assessments)) {
      selectedCow.assessments.forEach((asm) => {
        list.push({
          id: `rec-asm-${asm.id}`,
          category: 'assessment',
          categoryLabel: 'Health Assessment',
          icon: Camera,
          date: asm.date,
          title: asm.result || 'Mastitis Screening',
          description: asm.condition || 'Screening examination record.',
          status: asm.status || 'healthy',
          statusLabel: asm.result || 'Recorded',
          meta: [
            asm.assessedBy ? `Assessor: ${asm.assessedBy}` : null,
            asm.confidence ? `Clinical Confidence: ${asm.confidence}` : null,
          ].filter(Boolean),
          isPrototypeML: asm.isPrototype || false,
        });
      });
    }

    // 2. Fever & Temperature Measurements
    if (Array.isArray(selectedCow.feverLogs)) {
      selectedCow.feverLogs.forEach((fever) => {
        const tempVal = parseFloat(fever.temperature);
        const isElevated = tempVal > 39.3;
        const isLow = tempVal < 38.0;

        list.push({
          id: `rec-fever-${fever.id}`,
          category: 'fever',
          categoryLabel: 'Body Temperature',
          icon: Thermometer,
          date: `${fever.date}${fever.time ? ` · ${fever.time}` : ''}`,
          title: `${fever.temperature} °C`,
          description: fever.notes || (isElevated ? 'Elevated temperature reading.' : 'Standard physiological baseline.'),
          status: isElevated ? 'alert' : isLow ? 'watch' : 'healthy',
          statusLabel: isElevated ? 'Elevated' : isLow ? 'Low' : 'Normal (38.0–39.3 °C)',
          symptoms: fever.symptoms || [],
          meta: [
            fever.time ? `Time: ${fever.time}` : null,
            isElevated ? 'Requires Clinical Review' : 'Physiological Baseline',
          ].filter(Boolean),
        });
      });
    }

    // 3. Vaccination & Treatments
    if (Array.isArray(selectedCow.vaccinations)) {
      selectedCow.vaccinations.forEach((vac) => {
        let status = 'healthy';
        let statusLabel = vac.status || 'Completed';

        if (vac.nextDueDate) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const due = new Date(vac.nextDueDate);
          due.setHours(0, 0, 0, 0);
          const diffDays = Math.round((due - today) / (1000 * 60 * 60 * 24));

          if (diffDays < 0) {
            status = 'alert';
            statusLabel = `Overdue (${Math.abs(diffDays)}d ago)`;
          } else if (diffDays <= 14) {
            status = 'watch';
            statusLabel = `Due Soon (${vac.nextDueDate})`;
          } else {
            statusLabel = `Next: ${vac.nextDueDate}`;
          }
        }

        list.push({
          id: `rec-vac-${vac.id}`,
          category: 'vaccines',
          categoryLabel: 'Vaccine / Care',
          icon: Syringe,
          date: vac.date,
          title: vac.title,
          description: vac.notes || `Immunization administered to ${selectedCow.name}.`,
          status,
          statusLabel,
          meta: [
            vac.administrator ? `Administered by: ${vac.administrator}` : null,
            vac.nextDueDate ? `Next Due Date: ${vac.nextDueDate}` : null,
          ].filter(Boolean),
        });
      });
    }

    // 4. Milk Production Logs
    if (Array.isArray(selectedCow.milkLogs)) {
      selectedCow.milkLogs.forEach((milk) => {
        list.push({
          id: `rec-milk-${milk.id}`,
          category: 'milk',
          categoryLabel: 'Milk Production',
          icon: Milk,
          date: milk.date,
          title: `${milk.totalMilk} Litres Total`,
          description: milk.notes || `Morning: ${milk.morningMilk} L · Evening: ${milk.eveningMilk} L`,
          status: 'healthy',
          statusLabel: `${milk.totalMilk} L`,
          meta: [
            `Morning Milking: ${milk.morningMilk} L`,
            `Evening Milking: ${milk.eveningMilk} L`,
          ],
        });
      });
    }

    // Sort descending by date string
    return list.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [selectedCow]);

  // Filter and search
  const filteredRecords = useMemo(() => {
    return records.filter((rec) => {
      // Category filter
      if (activeFilter !== 'all' && rec.category !== activeFilter) {
        return false;
      }
      // Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          rec.title.toLowerCase().includes(q) ||
          rec.description.toLowerCase().includes(q) ||
          rec.date.toLowerCase().includes(q) ||
          rec.categoryLabel.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [records, activeFilter, searchQuery]);

  // Counts by category
  const counts = useMemo(() => {
    return {
      all: records.length,
      assessments: records.filter((r) => r.category === 'assessment').length,
      fever: records.filter((r) => r.category === 'fever').length,
      vaccines: records.filter((r) => r.category === 'vaccines').length,
      milk: records.filter((r) => r.category === 'milk').length,
    };
  }, [records]);

  return (
    <div className="health-records-page-wrapper">
      {/* Top Navigation Header */}
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
              <h1 className="nav-page-title">Health Records</h1>
              <p className="nav-page-subtitle">Historical clinical ledger & physiological events</p>
            </div>
          </div>

          {selectedCow && onOpenCowProfile && (
            <div className="header-actions-group">
              <button
                type="button"
                className="btn-header-action"
                onClick={() => onOpenCowProfile(selectedCow.id)}
                title="View Cow Profile"
              >
                <span>Cow Profile</span>
                <ExternalLink size={13} />
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="records-main-container">
        {/* Prototype Disclaimer Banner */}
        <div className="prototype-disclaimer-card" role="note">
          <Info size={16} className="disclaimer-icon" />
          <div>
            <strong>Local Prototype Storage:</strong> Health records reflect locally stored data from your browser session. Cloud EHR and automated ML diagnosis services are not connected. Unanalyzed scans indicate pending ML connection rather than fabricated scores.
          </div>
        </div>

        {/* 1. Selected Cow Card */}
        {selectedCow ? (
          <section className="selected-cow-summary-card" aria-label="Selected Cow Information">
            <div className="quick-cow-left">
              <CowAvatar
                photoUrl={selectedCow.photoUrl}
                name={selectedCow.name}
                tagId={selectedCow.tagId}
                breed={selectedCow.breed}
                avatarColor={selectedCow.avatarColor || '#17733E'}
                size="medium"
                rounded="circle"
              />
              <div className="quick-cow-details">
                <div className="quick-cow-title-row">
                  <span className="quick-cow-name">{selectedCow.name}</span>
                  <span className="quick-cow-tag">{selectedCow.tagId}</span>
                  <span className={`badge-pill ${selectedCow.status}`}>
                    {selectedCow.status === 'alert' ? 'Needs Attention' : selectedCow.status === 'watch' ? 'Monitoring' : 'Healthy'}
                  </span>
                </div>
                <span className="quick-cow-sub">
                  {selectedCow.breed} • Age: {selectedCow.ageYears} yrs • Current Temp: <strong>{selectedCow.temperature || '38.5 °C'}</strong>
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                type="button"
                className="btn-change-cow-pill"
                onClick={() => setIsCowPickerOpen(true)}
              >
                Change Cow
              </button>
            </div>
          </section>
        ) : (
          <button
            type="button"
            className="btn-select-cow-empty"
            onClick={() => setIsCowPickerOpen(true)}
          >
            Choose a cow from registered herd
          </button>
        )}

        {/* 2. Search & Filter Bar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Search Box */}
          <div className="picker-search-wrap" style={{ background: '#FFFFFF', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-subtle)' }}>
            <Search size={16} className="picker-search-icon" />
            <input
              type="text"
              className="picker-search-input"
              placeholder={`Search ${selectedCow?.name || 'cow'}'s health records...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Filter Tabs */}
          <div className="filter-tabs-strip" role="tablist" aria-label="Record Category Filter">
            <button
              type="button"
              className={`filter-tab-pill ${activeFilter === 'all' ? 'active' : ''}`}
              onClick={() => setActiveFilter('all')}
            >
              <span>All Records</span>
              <span className="pill-counter">{counts.all}</span>
            </button>
            <button
              type="button"
              className={`filter-tab-pill ${activeFilter === 'assessments' ? 'active' : ''}`}
              onClick={() => setActiveFilter('assessments')}
            >
              <Camera size={14} />
              <span>Assessments</span>
              <span className="pill-counter">{counts.assessments}</span>
            </button>
            <button
              type="button"
              className={`filter-tab-pill ${activeFilter === 'fever' ? 'active' : ''}`}
              onClick={() => setActiveFilter('fever')}
            >
              <Thermometer size={14} />
              <span>Fever & Temp</span>
              <span className="pill-counter">{counts.fever}</span>
            </button>
            <button
              type="button"
              className={`filter-tab-pill ${activeFilter === 'vaccines' ? 'active' : ''}`}
              onClick={() => setActiveFilter('vaccines')}
            >
              <Syringe size={14} />
              <span>Vaccinations</span>
              <span className="pill-counter">{counts.vaccines}</span>
            </button>
            <button
              type="button"
              className={`filter-tab-pill ${activeFilter === 'milk' ? 'active' : ''}`}
              onClick={() => setActiveFilter('milk')}
            >
              <Milk size={14} />
              <span>Milk Log</span>
              <span className="pill-counter">{counts.milk}</span>
            </button>
          </div>
        </div>

        {/* 3. Timeline of Records */}
        <section className="records-timeline-card" aria-label="Chronological Health History">
          <div className="history-card-header">
            <div className="history-title-wrap">
              <FileText size={18} className="text-primary" />
              <h3 className="history-title">
                {activeFilter === 'all'
                  ? 'Complete Health Ledger'
                  : activeFilter === 'assessments'
                  ? 'Mastitis Screening Archive'
                  : activeFilter === 'fever'
                  ? 'Temperature History'
                  : activeFilter === 'vaccines'
                  ? 'Vaccine & Medical History'
                  : 'Milk Production Logs'}
              </h3>
              <span className="history-counter-badge">
                {filteredRecords.length} Entries
              </span>
            </div>

            {selectedCow && (
              <span className="text-muted" style={{ fontSize: 12 }}>
                {selectedCow.name} ({selectedCow.tagId})
              </span>
            )}
          </div>

          {filteredRecords.length > 0 ? (
            <div className="timeline-items-stack">
              {filteredRecords.map((item) => {
                const IconComponent = item.icon;

                return (
                  <div key={item.id} className="timeline-record-row">
                    <div className="record-row-top">
                      <span className="record-type-badge">
                        <IconComponent size={14} />
                        <span>{item.categoryLabel}</span>
                      </span>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className={`badge-pill ${item.status}`}>
                          {item.statusLabel}
                        </span>
                        <div className="record-date-tag">
                          <Calendar size={12} />
                          <span>{item.date}</span>
                        </div>
                      </div>
                    </div>

                    <div className="record-content-body">
                      <h4 className="record-primary-title">{item.title}</h4>
                      <p className="record-secondary-desc">{item.description}</p>
                    </div>

                    {/* Symptoms pills for fever records */}
                    {item.symptoms && item.symptoms.length > 0 && (
                      <div className="history-symptoms-list">
                        {item.symptoms.map((sym, idx) => (
                          <span key={idx} className="symptom-tag-pill">
                            {sym}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Metadata strip */}
                    {item.meta && item.meta.length > 0 && (
                      <div className="record-meta-strip">
                        {item.meta.map((m, idx) => (
                          <span key={idx}>• {m}</span>
                        ))}
                      </div>
                    )}

                    {/* Prototype disclaimer note if assessment has no connected ML */}
                    {item.category === 'assessment' && (
                      <div className="ml-prototype-note-strip">
                        <Info size={13} />
                        <span>ML Model Not Connected — Assessment details reflect baseline intake notes. No automated predictions generated.</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="records-empty-state-card">
              <div className="empty-state-icon-box">
                <FileText size={24} />
              </div>
              <h4 className="empty-state-title">No Records Found</h4>
              <p className="empty-state-desc">
                {searchQuery
                  ? `No health entries match "${searchQuery}" for ${selectedCow?.name}. Try clearing your search filter.`
                  : activeFilter === 'assessments'
                  ? `No mastitis assessments recorded for ${selectedCow?.name} yet.`
                  : activeFilter === 'fever'
                  ? `No body temperature measurements logged for ${selectedCow?.name} yet.`
                  : activeFilter === 'vaccines'
                  ? `No vaccination or clinical treatments recorded for ${selectedCow?.name} yet.`
                  : activeFilter === 'milk'
                  ? `No milk production entries logged for ${selectedCow?.name} yet.`
                  : `No health history records found for ${selectedCow?.name}.`}
              </p>

              {roleContext === 'farmer' && (
                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  {activeFilter === 'fever' && onLogFever && (
                    <button
                      type="button"
                      className="btn-primary btn-sm"
                      onClick={() => onLogFever(selectedCow?.id)}
                    >
                      <Plus size={14} />
                      <span>Record Temperature</span>
                    </button>
                  )}
                  {activeFilter === 'milk' && onLogMilk && (
                    <button
                      type="button"
                      className="btn-primary btn-sm"
                      onClick={() => onLogMilk(selectedCow?.id)}
                    >
                      <Plus size={14} />
                      <span>Log Milk Yield</span>
                    </button>
                  )}
                  {activeFilter === 'vaccines' && onAddVaccine && (
                    <button
                      type="button"
                      className="btn-primary btn-sm"
                      onClick={() => onAddVaccine(selectedCow?.id)}
                    >
                      <Plus size={14} />
                      <span>Add Vaccination</span>
                    </button>
                  )}
                  {activeFilter === 'assessments' && onStartAssessment && (
                    <button
                      type="button"
                      className="btn-primary btn-sm"
                      onClick={() => onStartAssessment(selectedCow?.id)}
                    >
                      <Camera size={14} />
                      <span>Start Health Check</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </section>
      </main>

      {/* Cow Picker Modal */}
      <CowSelectModal
        isOpen={isCowPickerOpen}
        onClose={() => setIsCowPickerOpen(false)}
        selectedCowId={selectedCowId}
        onSelectCow={(cow) => setSelectedCowId(cow.id)}
        title="Select Cow for Health Records"
        badge="Medical History"
      />
    </div>
  );
}
