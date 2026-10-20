import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  Camera,
  Upload,
  RefreshCw,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  ArrowRight,
  Sparkles,
  ChevronRight,
  Tractor,
  Layers,
  Info,
  Check,
  Eye,
  X,
} from 'lucide-react';
import { useCows } from '../../context/CowsContext';
import { validateImageFile, prepareAssessmentPayload } from '../../services/assessmentService';
import WebcamModal from './WebcamModal';
import CowSelectModal from './CowSelectModal';
import CowAvatar from '../common/CowAvatar';

export default function AssessCowPage({ initialCowId = null, onBack, onComplete }) {
  const { cows, getCowById } = useCows();

  // Selected Cow (defaults to initialCowId or Kaveri Tag 021 if alert, or first cow)
  const [selectedCow, setSelectedCow] = useState(() => {
    if (initialCowId) {
      const found = getCowById(initialCowId);
      if (found) return found;
    }
    const alertCow = cows.find((c) => c.status === 'alert');
    return alertCow || cows[0] || null;
  });

  // Current Step: 2 (Image capture) or 3 (Preparation / Analysis view)
  const [currentStep, setCurrentStep] = useState(2);

  // Image State
  const [imageFile, setImageFile] = useState(null);
  const [imageDataUrl, setImageDataUrl] = useState(null);
  const [imageMeta, setImageMeta] = useState(null);

  // Modals & Errors
  const [isWebcamOpen, setIsWebcamOpen] = useState(false);
  const [isCowPickerOpen, setIsCowPickerOpen] = useState(false);
  const [showClinicalGuideModal, setShowClinicalGuideModal] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [preparedPayload, setPreparedPayload] = useState(null);

  const fileInputRef = useRef(null);
  const mobileCameraInputRef = useRef(null);

  // Check if cow is valid
  useEffect(() => {
    if (!selectedCow && cows.length > 0) {
      setSelectedCow(cows[0]);
    }
  }, [cows, selectedCow]);

  // Handle file selection from gallery/disk
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setValidationError('');
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setValidationError(validation.error);
      return;
    }

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const url = loadEvent.target?.result;
      const img = new Image();
      img.onload = () => {
        setImageFile(file);
        setImageDataUrl(url);
        setImageMeta({
          name: file.name,
          sizeFormatted: `${(file.size / 1024).toFixed(0)} KB`,
          width: img.naturalWidth,
          height: img.naturalHeight,
          aspectRatio: (img.naturalWidth / img.naturalHeight).toFixed(2),
        });
      };
      img.src = url;
    };
    reader.readAsDataURL(file);
  };

  // Handle photo from webcam
  const handleWebcamCapture = (dataUrl) => {
    setValidationError('');
    const img = new Image();
    img.onload = () => {
      setImageFile({ name: `udder-scan-${Date.now()}.jpg`, type: 'image/jpeg', size: Math.round(dataUrl.length * 0.75) });
      setImageDataUrl(dataUrl);
      setImageMeta({
        name: 'live-webcam-capture.jpg',
        sizeFormatted: `${Math.round((dataUrl.length * 0.75) / 1024)} KB`,
        width: img.naturalWidth,
        height: img.naturalHeight,
        aspectRatio: (img.naturalWidth / img.naturalHeight).toFixed(2),
      });
    };
    img.src = dataUrl;
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImageDataUrl(null);
    setImageMeta(null);
    setValidationError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (mobileCameraInputRef.current) mobileCameraInputRef.current.value = '';
  };

  // Proceed to Step 3 (Analysis Preparation)
  const handleProceedToAnalysis = async () => {
    setValidationError('');

    if (!selectedCow) {
      setValidationError('Please select a cow from your herd first.');
      return;
    }
    if (!imageDataUrl) {
      setValidationError('Please capture or upload an udder image before continuing.');
      return;
    }

    setIsProcessing(true);

    try {
      const payload = await prepareAssessmentPayload({
        cow: selectedCow,
        imageFile,
        imageDataUrl,
      });
      setPreparedPayload(payload);
      setCurrentStep(3); // Advance to analysis preparation view
    } catch (err) {
      setValidationError(err.message || 'Failed to prepare image for assessment.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="assess-cow-page-wrapper">
      {/* Top Header matching Screen 4 */}
      <header className="page-nav-header">
        <div className="nav-header-inner">
          <div className="nav-left">
            <button
              type="button"
              className="nav-back-btn"
              onClick={onBack}
              aria-label="Back"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="nav-titles">
              <h1 className="nav-page-title">Assess Cow</h1>
              <p className="nav-page-subtitle">Check udder health and overall condition</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Flow Container */}
      <main className="assess-cow-main-container">
        {/* Step Indicator matching Screen 4 (1: Cow -> 2: Image -> 3: Result) */}
        <div className="stepper-bar-card" aria-label="Assessment Progress Steps">
          <div className={`step-node ${currentStep >= 1 ? 'completed' : ''}`}>
            <div className="step-circle">{currentStep > 1 ? <Check size={14} /> : '1'}</div>
            <span className="step-name">Cow</span>
          </div>
          <div className={`step-connector ${currentStep >= 2 ? 'active' : ''}`} />

          <div className={`step-node ${currentStep === 2 ? 'active' : currentStep > 2 ? 'completed' : ''}`}>
            <div className="step-circle">{currentStep > 2 ? <Check size={14} /> : '2'}</div>
            <span className="step-name">Image</span>
          </div>
          <div className={`step-connector ${currentStep >= 3 ? 'active' : ''}`} />

          <div className={`step-node ${currentStep === 3 ? 'active' : ''}`}>
            <div className="step-circle">3</div>
            <span className="step-name">Result</span>
          </div>
        </div>

        {validationError && (
          <div className="form-error-banner" role="alert">
            <AlertCircle size={18} className="error-alert-icon" />
            <div className="error-alert-text">{validationError}</div>
          </div>
        )}

        {/* STEP 2: COW SELECTION & IMAGE CAPTURE */}
        {currentStep === 2 && (
          <div className="assess-step-body">
            {/* 1. Select Cow Section */}
            <section className="assess-section-card" aria-label="Select Cow">
              <div className="card-sub-header">
                <span className="sub-header-label">Select Cow</span>
                <button
                  type="button"
                  className="change-cow-link"
                  onClick={() => setIsCowPickerOpen(true)}
                >
                  Change Cow
                </button>
              </div>

              {selectedCow ? (
                <div
                  className="selected-cow-preview-card"
                  onClick={() => setIsCowPickerOpen(true)}
                  role="button"
                  tabIndex={0}
                >
                  <CowAvatar
                    photoUrl={selectedCow.photoUrl}
                    name={selectedCow.name}
                    tagId={selectedCow.tagId}
                    breed={selectedCow.breed}
                    avatarColor={selectedCow.avatarColor || '#17733E'}
                    size="medium"
                    rounded="circle"
                  />
                  <div className="sel-cow-info">
                    <div className="sel-cow-name-row">
                      <span className="sel-cow-name">{selectedCow.name}</span>
                      <span className="sel-cow-tag">• {selectedCow.tagId}</span>
                    </div>
                    <span className="sel-cow-breed">{selectedCow.breed}</span>
                  </div>
                  <ChevronRight size={18} className="sel-cow-chevron" />
                </div>
              ) : (
                <button
                  type="button"
                  className="btn-select-cow-empty"
                  onClick={() => setIsCowPickerOpen(true)}
                >
                  Choose a cow from registered herd
                </button>
              )}
            </section>

            {/* 2. Capture Image Section matching Screen 4 */}
            <section className="assess-section-card" aria-label="Capture Image">
              <span className="sub-header-label">Capture Image</span>

              {/* Hidden Inputs for Desktop & Mobile Upload/Capture */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
                aria-label="Upload udder photograph from gallery"
              />
              <input
                ref={mobileCameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                style={{ display: 'none' }}
                aria-label="Take picture with device camera"
              />

              {/* A. If Image Captured: Full Uncropped Aspect-Ratio Preview */}
              {imageDataUrl ? (
                <div className="image-preview-stage">
                  <div className="aspect-ratio-preview-box">
                    <img
                      src={imageDataUrl}
                      alt="Captured udder inspection"
                      className="uncropped-udder-img"
                    />
                    <div className="preview-badge-overlay">
                      <span className="aspect-badge">Full Frame (No Crop)</span>
                      {imageMeta?.aspectRatio && (
                        <span className="meta-badge">{imageMeta.width}×{imageMeta.height} px</span>
                      )}
                    </div>
                  </div>

                  {/* Actions for Captured Image */}
                  <div className="preview-actions-bar">
                    <button
                      type="button"
                      className="btn-secondary btn-sm"
                      onClick={() => setIsWebcamOpen(true)}
                    >
                      <Camera size={15} />
                      <span>Retake with Camera</span>
                    </button>
                    <button
                      type="button"
                      className="btn-secondary btn-sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload size={15} />
                      <span>Choose Different File</span>
                    </button>
                    <button
                      type="button"
                      className="btn-icon-danger"
                      onClick={handleRemoveImage}
                      title="Remove image"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ) : (
                /* B. If No Image Captured: Two Prominent Buttons matching Screen 4 */
                <div className="image-capture-choice-box">
                  <div className="capture-icon-hero">
                    <Camera size={38} className="text-primary" />
                  </div>
                  <h4>Photograph Cow Udder</h4>
                  <p>
                    Capture all four udder quadrants in clear lighting for subclinical mastitis evaluation.
                  </p>

                  <div className="capture-choice-buttons">
                    {/* Option 1: Take Photo (Desktop uses Webcam Modal, Mobile uses native camera) */}
                    <button
                      type="button"
                      className="btn-capture-option primary"
                      onClick={() => {
                        // If mobile device with touch, camera input works smoothly
                        if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
                          mobileCameraInputRef.current?.click();
                        } else {
                          setIsWebcamOpen(true);
                        }
                      }}
                    >
                      <Camera size={18} />
                      <span>Take Photo</span>
                    </button>

                    <span className="or-divider">or</span>

                    {/* Option 2: Choose from Gallery */}
                    <button
                      type="button"
                      className="btn-capture-option secondary"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload size={18} />
                      <span>Choose from Gallery</span>
                    </button>
                  </div>
                </div>
              )}
            </section>

            {/* 3. Clinical Mastitis Image-Capture Guidance */}
            <section className="clinical-guidance-card" aria-label="Veterinary Udder Image Guidance">
              <div className="clinical-guidance-header">
                <div className="guidance-header-title">
                  <Lightbulb size={17} color="#1E7C48" />
                  <h4>Clinical Udder Capture Guidance</h4>
                </div>
                <button
                  type="button"
                  className="btn-view-reference"
                  onClick={() => setShowClinicalGuideModal(true)}
                  title="View full-size veterinary capture standard"
                >
                  <Eye size={12} />
                  <span>Clinical Standard</span>
                </button>
              </div>

              <div className="clinical-guidance-body">
                <div
                  className="guidance-photo-box"
                  onClick={() => setShowClinicalGuideModal(true)}
                  role="button"
                  tabIndex={0}
                  title="Click to expand veterinary clinical benchmark"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setShowClinicalGuideModal(true);
                    }
                  }}
                >
                  <img
                    src="/images/guidance/udder_capture_guide.jpg"
                    alt="Veterinary clinical examination benchmark of dairy cow udder"
                    className="guidance-benchmark-img"
                    loading="lazy"
                  />
                  <span className="guidance-photo-badge">Standard Reference</span>
                </div>

                <div className="guidance-points-grid">
                  <div className="guidance-point-item">
                    <CheckCircle2 size={14} color="#1E7C48" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <strong>Distance (30–50 cm):</strong>
                      Frame all 4 udder quarters squarely.
                    </div>
                  </div>
                  <div className="guidance-point-item">
                    <CheckCircle2 size={14} color="#1E7C48" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <strong>Clean & Dry:</strong>
                      Wipe teats clean of dung, water or milk drops.
                    </div>
                  </div>
                  <div className="guidance-point-item">
                    <CheckCircle2 size={14} color="#1E7C48" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <strong>Natural Diffuse Light:</strong>
                      Avoid deep shadows and direct flash glare.
                    </div>
                  </div>
                  <div className="guidance-point-item">
                    <CheckCircle2 size={14} color="#1E7C48" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <strong>Stable Cattle:</strong>
                      Ensure cow is standing calm on flat floor.
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 4. Continue CTA Button matching Screen 4 */}
            <div className="assess-action-footer">
              <button
                type="button"
                className="btn-primary btn-next-step"
                onClick={handleProceedToAnalysis}
                disabled={isProcessing || !imageDataUrl}
              >
                <span>Continue to Assessment</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: ASSESSMENT PREPARATION (PROTOTYPE ML NOTICE) */}
        {currentStep === 3 && (
          <div className="assess-step-body">
            {/* Prototype Notice Banner as instructed */}
            <div className="ml-prototype-alert-card">
              <div className="prototype-sparkle-wrap">
                <Sparkles size={28} className="text-primary" />
              </div>
              <div className="prototype-alert-content">
                <span className="prototype-flag-pill">Step 4 Workflow Ready</span>
                <h3>Image ready for analysis — ML model not connected yet.</h3>
                <p>
                  The udder photograph for <strong>{selectedCow?.name} ({selectedCow?.tagId})</strong> has been captured, validated, and cached in the assessment pipeline.
                </p>
                <div className="prototype-security-note">
                  <Info size={14} />
                  <span>
                    In strict compliance with requirements, artificial predictions and simulated diagnoses are omitted until our trained ML model is connected in the next step.
                  </span>
                </div>
              </div>
            </div>

            {/* Assessment Payload Verification Summary */}
            <section className="assess-section-card" aria-label="Assessment Payload Details">
              <span className="sub-header-label">Prepared Inference Payload</span>

              <div className="prepared-summary-grid">
                <div className="prep-cow-card">
                  <div className="prep-cow-header">
                    <span className="prep-label">Target Cattle Record:</span>
                    <span className="badge-pill healthy">Verified</span>
                  </div>
                  <div className="prep-cow-details">
                    <h4>{selectedCow?.name}</h4>
                    <span className="prep-cow-meta">{selectedCow?.tagId} · {selectedCow?.breed}</span>
                    <span className="prep-cow-lact">{selectedCow?.lactationStatus || 'Lactating'}</span>
                  </div>
                </div>

                <div className="prep-image-card">
                  <div className="prep-image-header">
                    <span className="prep-label">Validated Udder Capture:</span>
                    <span className="meta-badge">{imageMeta?.sizeFormatted}</span>
                  </div>
                  <div className="prep-img-frame">
                    <img src={imageDataUrl} alt="Prepared udder" className="prep-img-preview" />
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="prepared-actions-row">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setCurrentStep(2)}
                >
                  <RefreshCw size={15} />
                  <span>Retake / Change Image</span>
                </button>

                <button
                  type="button"
                  className="btn-primary"
                  onClick={onBack}
                >
                  <CheckCircle2 size={16} />
                  <span>Return to Farmer Dashboard</span>
                </button>
              </div>
            </section>
          </div>
        )}
      </main>

      {/* Webcam Live Capture Modal */}
      <WebcamModal
        isOpen={isWebcamOpen}
        onClose={() => setIsWebcamOpen(false)}
        onCapture={handleWebcamCapture}
        onSwitchToFileUpload={() => fileInputRef.current?.click()}
      />

      {/* Cow Selector Modal */}
      <CowSelectModal
        isOpen={isCowPickerOpen}
        onClose={() => setIsCowPickerOpen(false)}
        selectedCowId={selectedCow?.id}
        onSelectCow={(cow) => setSelectedCow(cow)}
      />

      {/* Clinical Mastitis Photography Benchmark Modal */}
      {showClinicalGuideModal && (
        <div className="modal-backdrop" onClick={() => setShowClinicalGuideModal(false)}>
          <div className="modal-container clinical-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span className="modal-badge healthy">Veterinary Clinical Benchmark</span>
                <h3 className="modal-title">Clinical Udder Image-Capture Guide</h3>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowClinicalGuideModal(false)}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <div className="clinical-full-preview-box">
                <img
                  src="/images/guidance/udder_capture_guide.jpg"
                  alt="Veterinary clinical benchmark examination of clean dairy cow udder quarters"
                  className="clinical-modal-full-img"
                />
                <div className="clinical-img-caption">
                  <span>Standard Clinical Benchmark: Clean, dry udder quarters in diffuse parlor daylight</span>
                </div>
              </div>

              <div className="clinical-modal-checklist">
                <div className="clinical-check-row">
                  <CheckCircle2 size={16} color="#1E7C48" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong>Distance & Framing (30–50 cm):</strong> Stand safely at an angled 45° stance, holding camera level with mid-teat height to capture both anterior and posterior quarters.
                  </div>
                </div>
                <div className="clinical-check-row">
                  <CheckCircle2 size={16} color="#1E7C48" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong>Surface Cleanliness:</strong> Teats must be cleaned with a single-service dry cloth to remove dirt, manure particles, or excess moisture prior to imaging.
                  </div>
                </div>
                <div className="clinical-check-row">
                  <CheckCircle2 size={16} color="#1E7C48" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong>Lighting & Contrast:</strong> Utilize ambient natural daylight or diffuse barn overhead fixtures. Avoid direct smartphone LED flash that washes out teat erythema.
                  </div>
                </div>
              </div>

              <div className="modal-actions" style={{ marginTop: '18px' }}>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => {
                    setShowClinicalGuideModal(false);
                    if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
                      mobileCameraInputRef.current?.click();
                    } else {
                      setIsWebcamOpen(true);
                    }
                  }}
                >
                  <Camera size={16} />
                  <span>Start Live Capture</span>
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowClinicalGuideModal(false)}
                >
                  Close Reference
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
