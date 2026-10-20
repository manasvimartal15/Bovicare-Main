import React, { useState, useRef } from 'react';
import {
  ArrowLeft,
  Camera,
  AlertCircle,
  Save,
  Trash2,
  Info,
  Eye,
  X,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';
import { useCows } from '../../context/CowsContext';

const COMMON_BREEDS = [
  'Gir (Indigenous Dairy)',
  'Holstein Friesian (HF)',
  'Jersey Cross',
  'Sahiwal',
  'Red Sindhi',
  'HF Cross',
  'Kankrej',
  'Tharparkar',
  'Murrah (Buffalo)',
  'Other / Crossbreed',
];

const LACTATION_STAGES = [
  'Lactating (1st Lactation)',
  'Lactating (2nd Lactation)',
  'Lactating (3rd+ Lactation)',
  'Dry Period',
  'Pregnant & Dry',
  'Heifer (Pre-calving)',
  'Calf',
];

export default function AddCowPage({ onBack, onSaveSuccess, existingCow = null }) {
  const { addCow, updateCow } = useCows();
  const isEditMode = !!existingCow;

  const fileInputRef = useRef(null);

  // Form State
  const [formData, setFormData] = useState({
    name: existingCow?.name || '',
    tagId: existingCow?.tagId || '',
    breed: existingCow?.breed || COMMON_BREEDS[0],
    ageYears: existingCow?.ageYears || '',
    dateOfBirth: existingCow?.dateOfBirth || '',
    gender: existingCow?.gender || 'Female (Milking Cow)',
    weightKg: existingCow?.weightKg || '',
    milkYieldPerDay: existingCow?.milkYieldPerDay || (existingCow?.milkToday ? parseFloat(existingCow.milkToday) : '') || '',
    dateOfRegistration: existingCow?.dateOfRegistration || new Date().toISOString().split('T')[0],
    lactationStatus: existingCow?.lactationStatus || LACTATION_STAGES[0],
    photoUrl: existingCow?.photoUrl || null,
    notes: existingCow?.notes || '',
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(existingCow?.photoUrl || null);
  const [showFramingGuideModal, setShowFramingGuideModal] = useState(false);
  const [isPhotoLoading, setIsPhotoLoading] = useState(false);

  // Handle Photo selection (from device camera or file explorer)
  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setGeneralError('Selected image is too large (maximum 5MB).');
        return;
      }
      setIsPhotoLoading(true);
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const dataUrl = uploadEvent.target?.result;
        setPhotoPreview(dataUrl);
        setFormData((prev) => ({ ...prev, photoUrl: dataUrl }));
        setIsPhotoLoading(false);
      };
      reader.onerror = () => {
        setGeneralError('Failed to read image file. Please try a different photo.');
        setIsPhotoLoading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoPreview(null);
    setFormData((prev) => ({ ...prev, photoUrl: null }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Form Validation
  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) {
      errors.name = 'Cow name is required (e.g., Ganga, Kaveri).';
    }
    if (!formData.tagId.trim()) {
      errors.tagId = 'Unique Cow Tag / ID is required (e.g., Tag 021, 009).';
    }
    if (!formData.breed) {
      errors.breed = 'Please select a cattle breed.';
    }
    if (!formData.ageYears && !formData.dateOfBirth) {
      errors.ageYears = 'Please specify either cow age (years) or date of birth.';
    } else if (formData.ageYears && (isNaN(formData.ageYears) || parseFloat(formData.ageYears) <= 0 || parseFloat(formData.ageYears) > 25)) {
      errors.ageYears = 'Please enter a valid age between 0.1 and 25 years.';
    }

    if (formData.milkYieldPerDay !== '' && (isNaN(formData.milkYieldPerDay) || parseFloat(formData.milkYieldPerDay) < 0)) {
      errors.milkYieldPerDay = 'Milk yield must be a positive number (in Liters/day).';
    }

    if (formData.weightKg !== '' && (isNaN(formData.weightKg) || parseFloat(formData.weightKg) < 20 || parseFloat(formData.weightKg) > 1500)) {
      errors.weightKg = 'Weight should be a realistic value in kg (e.g., 350 - 650 kg).';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setGeneralError('');

    if (!validateForm()) {
      setGeneralError('Please review and correct the highlighted fields below.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEditMode) {
        // Update existing cow
        const result = updateCow(existingCow.id, formData);
        if (!result.success) {
          setGeneralError(result.error);
          setIsSubmitting(false);
          return;
        }
        onSaveSuccess?.(result.cow, 'Cow record updated successfully.');
      } else {
        // Add new cow
        const result = addCow(formData);
        if (!result.success) {
          setGeneralError(result.error);
          setIsSubmitting(false);
          return;
        }
        onSaveSuccess?.(result.cow, `Cow "${result.cow.name}" (${result.cow.tagId}) added to herd successfully.`);
      }
    } catch (err) {
      setGeneralError('An unexpected error occurred while saving. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="add-cow-page-wrapper">
      {/* Header matching Screen 3 */}
      <header className="page-nav-header">
        <div className="nav-header-inner">
          <div className="nav-left">
            <button
              type="button"
              className="nav-back-btn"
              onClick={onBack}
              aria-label="Cancel and return"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="nav-titles">
              <h1 className="nav-page-title">{isEditMode ? `Edit Cow (${existingCow.name})` : 'Add New Cow'}</h1>
              <p className="nav-page-subtitle">
                {isEditMode ? 'Update cow details and production records' : 'Enter cow details to manage health & yield'}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Form Body */}
      <main className="add-cow-main-container">
        {generalError && (
          <div className="form-error-banner" role="alert">
            <AlertCircle size={18} className="error-alert-icon" />
            <div className="error-alert-text">{generalError}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="cow-intake-form" noValidate>
          {/* 1. Photo Capture / Image Upload Box matching Screen 3 */}
          <div className="photo-upload-section">
            <div className="photo-section-header">
              <label className="form-field-label">Cow Identification Photo</label>
              <button
                type="button"
                className="btn-framing-guide-link"
                onClick={() => setShowFramingGuideModal(true)}
              >
                <HelpCircle size={14} />
                <span>View Framing Guide</span>
              </button>
            </div>

            {/* Photo Framing Guide Reference Card */}
            <div className="cow-framing-guidance-card">
              <div
                className="framing-thumb-preview"
                onClick={() => setShowFramingGuideModal(true)}
                role="button"
                tabIndex={0}
                title="Click to view reference framing photo"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setShowFramingGuideModal(true);
                  }
                }}
              >
                <img
                  src="/images/guidance/cow_framing_guide.jpg"
                  alt="Standard side-profile cow framing demonstration"
                  className="framing-guide-thumb"
                  loading="lazy"
                />
                <span className="framing-thumb-badge">
                  <Eye size={11} /> Guide
                </span>
              </div>

              <div className="framing-guidance-text">
                <span className="guidance-title">Veterinary Photography Standard</span>
                <ul className="guidance-bullets">
                  <li><strong>Full Side Profile:</strong> Frame shoulder to flank on level ground.</li>
                  <li><strong>Clear Ear Tag:</strong> Keep plastic yellow tag digits in focus.</li>
                  <li><strong>Natural Daylight:</strong> Avoid harsh flash or deep shadows.</li>
                </ul>
              </div>
            </div>

            <div
              className={`photo-dropzone-box ${photoPreview ? 'has-preview' : ''}`}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoChange}
                style={{ display: 'none' }}
                aria-label="Upload or take cow photograph"
              />

              {isPhotoLoading ? (
                <div className="dropzone-placeholder">
                  <div className="photo-spinner" />
                  <span className="dropzone-main-text">Processing image...</span>
                </div>
              ) : photoPreview ? (
                <div className="preview-container">
                  <img src={photoPreview} alt="Uploaded cow profile" className="preview-img" />
                  <div className="preview-overlay">
                    <button
                      type="button"
                      className="photo-action-chip change"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                    >
                      <Camera size={14} /> Change Photo
                    </button>
                    <button
                      type="button"
                      className="photo-action-chip remove"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemovePhoto();
                      }}
                    >
                      <Trash2 size={14} /> Remove
                    </button>
                  </div>
                </div>
              ) : (
                <div className="dropzone-placeholder">
                  <div className="camera-icon-circle">
                    <Camera size={26} />
                  </div>
                  <span className="dropzone-main-text">Tap to take photo or choose from gallery</span>
                  <span className="dropzone-sub-text">Recommended: Clear side-profile photo up to 5MB</span>
                </div>
              )}
            </div>
          </div>

          {/* 2. Core Cow Identifiers */}
          <div className="form-grid-two-col">
            {/* Cow Name */}
            <div className={`form-group ${fieldErrors.name ? 'has-error' : ''}`}>
              <label htmlFor="cow-name-input" className="form-field-label">
                Name <span className="req-star">*</span>
              </label>
              <input
                id="cow-name-input"
                type="text"
                className="form-text-input"
                placeholder="e.g. Ganga or Kaveri"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  if (fieldErrors.name) setFieldErrors({ ...fieldErrors, name: null });
                }}
                required
              />
              {fieldErrors.name && (
                <span className="field-error-text">{fieldErrors.name}</span>
              )}
            </div>

            {/* Tag / ID (Unique) */}
            <div className={`form-group ${fieldErrors.tagId ? 'has-error' : ''}`}>
              <label htmlFor="cow-tag-input" className="form-field-label">
                Tag / ID <span className="req-star">*</span>
              </label>
              <input
                id="cow-tag-input"
                type="text"
                className="form-text-input"
                placeholder="e.g. 021 or Tag 021"
                value={formData.tagId}
                onChange={(e) => {
                  setFormData({ ...formData, tagId: e.target.value });
                  if (fieldErrors.tagId) setFieldErrors({ ...fieldErrors, tagId: null });
                }}
                required
              />
              {fieldErrors.tagId && (
                <span className="field-error-text">{fieldErrors.tagId}</span>
              )}
            </div>
          </div>

          {/* 3. Breed & Gender */}
          <div className="form-grid-two-col">
            {/* Breed */}
            <div className={`form-group ${fieldErrors.breed ? 'has-error' : ''}`}>
              <label htmlFor="cow-breed-select" className="form-field-label">
                Breed <span className="req-star">*</span>
              </label>
              <select
                id="cow-breed-select"
                className="form-select-input"
                value={formData.breed}
                onChange={(e) => {
                  setFormData({ ...formData, breed: e.target.value });
                  if (fieldErrors.breed) setFieldErrors({ ...fieldErrors, breed: null });
                }}
              >
                {COMMON_BREEDS.map((breed) => (
                  <option key={breed} value={breed}>
                    {breed}
                  </option>
                ))}
              </select>
              {fieldErrors.breed && (
                <span className="field-error-text">{fieldErrors.breed}</span>
              )}
            </div>

            {/* Gender */}
            <div className="form-group">
              <label htmlFor="cow-gender-select" className="form-field-label">
                Gender
              </label>
              <select
                id="cow-gender-select"
                className="form-select-input"
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              >
                <option value="Female (Milking Cow)">Female (Milking Cow)</option>
                <option value="Female (Heifer)">Female (Heifer)</option>
                <option value="Female (Dry Cow)">Female (Dry Cow)</option>
                <option value="Male (Bull / Sire)">Male (Bull / Sire)</option>
              </select>
            </div>
          </div>

          {/* 4. Age, Weight & Milk Yield */}
          <div className="form-grid-three-col">
            {/* Age (years) */}
            <div className={`form-group ${fieldErrors.ageYears ? 'has-error' : ''}`}>
              <label htmlFor="cow-age-input" className="form-field-label">
                Age (years) <span className="req-star">*</span>
              </label>
              <input
                id="cow-age-input"
                type="number"
                step="0.5"
                min="0.1"
                max="25"
                className="form-text-input"
                placeholder="e.g. 3.5"
                value={formData.ageYears}
                onChange={(e) => {
                  setFormData({ ...formData, ageYears: e.target.value });
                  if (fieldErrors.ageYears) setFieldErrors({ ...fieldErrors, ageYears: null });
                }}
              />
              {fieldErrors.ageYears && (
                <span className="field-error-text">{fieldErrors.ageYears}</span>
              )}
            </div>

            {/* Weight (kg, optional) */}
            <div className={`form-group ${fieldErrors.weightKg ? 'has-error' : ''}`}>
              <label htmlFor="cow-weight-input" className="form-field-label">
                Weight (kg) <span className="field-optional">(optional)</span>
              </label>
              <input
                id="cow-weight-input"
                type="number"
                step="5"
                className="form-text-input"
                placeholder="e.g. 420"
                value={formData.weightKg}
                onChange={(e) => {
                  setFormData({ ...formData, weightKg: e.target.value });
                  if (fieldErrors.weightKg) setFieldErrors({ ...fieldErrors, weightKg: null });
                }}
              />
              {fieldErrors.weightKg && (
                <span className="field-error-text">{fieldErrors.weightKg}</span>
              )}
            </div>

            {/* Milk Yield per day */}
            <div className={`form-group ${fieldErrors.milkYieldPerDay ? 'has-error' : ''}`}>
              <label htmlFor="cow-milk-input" className="form-field-label">
                Milk Yield (L/day)
              </label>
              <input
                id="cow-milk-input"
                type="number"
                step="0.5"
                min="0"
                className="form-text-input"
                placeholder="e.g. 15"
                value={formData.milkYieldPerDay}
                onChange={(e) => {
                  setFormData({ ...formData, milkYieldPerDay: e.target.value });
                  if (fieldErrors.milkYieldPerDay) setFieldErrors({ ...fieldErrors, milkYieldPerDay: null });
                }}
              />
              {fieldErrors.milkYieldPerDay && (
                <span className="field-error-text">{fieldErrors.milkYieldPerDay}</span>
              )}
            </div>
          </div>

          {/* 5. Date of Registration & Lactation Status */}
          <div className="form-grid-two-col">
            <div className="form-group">
              <label htmlFor="cow-reg-date" className="form-field-label">
                Date of Registration
              </label>
              <input
                id="cow-reg-date"
                type="date"
                className="form-text-input"
                value={formData.dateOfRegistration}
                onChange={(e) => setFormData({ ...formData, dateOfRegistration: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label htmlFor="cow-lactation-select" className="form-field-label">
                Lactation Status
              </label>
              <select
                id="cow-lactation-select"
                className="form-select-input"
                value={formData.lactationStatus}
                onChange={(e) => setFormData({ ...formData, lactationStatus: e.target.value })}
              >
                {LACTATION_STAGES.map((stage) => (
                  <option key={stage} value={stage}>
                    {stage}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 6. Notes (Optional) */}
          <div className="form-group">
            <label htmlFor="cow-notes-textarea" className="form-field-label">
              Notes <span className="field-optional">(optional)</span>
            </label>
            <textarea
              id="cow-notes-textarea"
              rows={3}
              className="form-textarea-input"
              placeholder="Any clinical observations, maternal lineage, temperament, or dietary notes..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          {/* Action Buttons matching Screen 3 */}
          <div className="form-actions-row">
            <button
              type="button"
              className="btn-form-cancel"
              onClick={onBack}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-form-save"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span>Saving Record...</span>
              ) : (
                <>
                  <Save size={18} />
                  <span>{isEditMode ? 'Update Cow Record' : 'Save Cow'}</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Photo Framing Guide Reference Modal */}
        {showFramingGuideModal && (
          <div className="modal-backdrop" onClick={() => setShowFramingGuideModal(false)}>
            <div className="modal-container framing-modal-container" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div>
                  <span className="modal-badge healthy">Dairy Photography Standard</span>
                  <h3 className="modal-title">Cattle Side-Profile Framing Guide</h3>
                </div>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setShowFramingGuideModal(false)}
                  aria-label="Close modal"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="modal-body">
                <div className="framing-full-img-box">
                  <img
                    src="/images/guidance/cow_framing_guide.jpg"
                    alt="Standard side-profile cow framing demonstration"
                    className="framing-modal-full-img"
                  />
                  <div className="framing-img-caption">
                    <span>Reference Standard: Side profile with visible ear tag, level posture, and natural light</span>
                  </div>
                </div>

                <div className="framing-modal-tips">
                  <div className="framing-tip-item">
                    <CheckCircle2 size={16} color="#1E7C48" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <strong>Framing & Distance:</strong> Stand 2–3 meters away, holding phone at chest height level with cow's ribcage.
                    </div>
                  </div>
                  <div className="framing-tip-item">
                    <CheckCircle2 size={16} color="#1E7C48" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <strong>Ear Tag Visibility:</strong> Ensure the yellow plastic identification tag number is clearly legible in the shot.
                    </div>
                  </div>
                  <div className="framing-tip-item">
                    <CheckCircle2 size={16} color="#1E7C48" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <strong>Lighting & Stability:</strong> Photograph in diffuse daylight or well-lit stall without blinding flash or dark pen shadows.
                    </div>
                  </div>
                </div>

                <div className="modal-actions" style={{ marginTop: '18px' }}>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => {
                      setShowFramingGuideModal(false);
                      fileInputRef.current?.click();
                    }}
                  >
                    <Camera size={16} />
                    <span>Upload or Take Photo</span>
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setShowFramingGuideModal(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
