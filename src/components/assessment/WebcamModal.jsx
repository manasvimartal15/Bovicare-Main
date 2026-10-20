import React, { useState, useEffect, useRef } from 'react';
import { X, Camera, RefreshCw, AlertTriangle, Check, Upload } from 'lucide-react';

export default function WebcamModal({ isOpen, onClose, onCapture, onSwitchToFileUpload }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [facingMode, setFacingMode] = useState('environment'); // environment (rear) or user (front)

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setIsLoading(true);
    setErrorMsg(null);

    const startCamera = async () => {
      // Check browser support
      if (!navigator?.mediaDevices?.getUserMedia) {
        if (isMounted) {
          setErrorMsg('Camera access is not supported by your current browser or connection.');
          setIsLoading(false);
        }
        return;
      }

      // Stop existing stream if any
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        });

        if (!isMounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play().catch((e) => console.warn('Play interrupted:', e));
            setIsLoading(false);
          };
        }
      } catch (err) {
        console.warn('Webcam stream error:', err);
        if (isMounted) {
          setIsLoading(false);
          if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            setErrorMsg('Camera permission was denied. Please allow camera access in your browser settings, or select an image from your gallery.');
          } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
            setErrorMsg('No camera hardware was detected on this device. Please use image upload instead.');
          } else {
            setErrorMsg(`Unable to connect to camera (${err.message || 'Access error'}). Please use image upload.`);
          }
        }
      }
    };

    startCamera();

    return () => {
      isMounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [isOpen, facingMode]);

  // Handle capture frame
  const handleSnap = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw frame without cropping
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

    // Stop camera
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    onCapture(dataUrl);
    onClose();
  };

  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="webcam-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="webcam-modal-header">
          <div className="webcam-header-title">
            <span className="modal-badge">Live Camera</span>
            <h3>Capture Udder Image</h3>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close camera"
          >
            <X size={18} />
          </button>
        </div>

        {/* Viewport */}
        <div className="webcam-viewport-wrap">
          {isLoading && (
            <div className="camera-loading-overlay">
              <div className="loading-spinner" />
              <span>Connecting to camera...</span>
            </div>
          )}

          {errorMsg ? (
            <div className="camera-error-container">
              <AlertTriangle size={36} className="text-danger" />
              <h4>Camera Unavailable</h4>
              <p>{errorMsg}</p>
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  onClose();
                  onSwitchToFileUpload?.();
                }}
              >
                <Upload size={16} />
                <span>Choose Image from Gallery</span>
              </button>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                playsInline
                muted
                autoPlay
                className="webcam-live-video"
              />

              {/* Udder Framing Target Overlay */}
              <div className="udder-framing-overlay" aria-hidden="true">
                <div className="framing-reticle">
                  <div className="reticle-corner top-left" />
                  <div className="reticle-corner top-right" />
                  <div className="reticle-corner bottom-left" />
                  <div className="reticle-corner bottom-right" />
                  <span className="framing-label">Frame udder area clearly</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Controls */}
        {!errorMsg && (
          <div className="webcam-modal-controls">
            <button
              type="button"
              className="btn-camera-flip"
              onClick={toggleFacingMode}
              title="Switch Camera (Front / Rear)"
              aria-label="Switch camera lens"
            >
              <RefreshCw size={18} />
              <span>Switch Lens</span>
            </button>

            <button
              type="button"
              className="btn-camera-shutter"
              onClick={handleSnap}
              disabled={isLoading}
              aria-label="Take photograph"
              title="Snap photograph"
            >
              <div className="shutter-inner-circle">
                <Camera size={26} />
              </div>
            </button>

            <button
              type="button"
              className="btn-camera-gallery"
              onClick={() => {
                onClose();
                onSwitchToFileUpload?.();
              }}
              title="Upload existing file instead"
            >
              <Upload size={18} />
              <span>Upload File</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
