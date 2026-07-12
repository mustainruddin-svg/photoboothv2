import React, { useState, useEffect, useRef } from "react";
import { Camera, FlipHorizontal, Settings } from "lucide-react";
import { FRAME_TEMPLATES } from "./FrameTemplates";
import { AppSettings, FrameTemplate, SettingsUpdater } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface PhotoboothProps {
  settings: AppSettings;
  setSettings: SettingsUpdater;
  onPhotoCaptured: (imageBytes: string, frameId: string) => void;
}

export default function Photobooth({ settings, setSettings, onPhotoCaptured }: PhotoboothProps) {
  const [selectedFrame, setSelectedFrame] = useState<FrameTemplate>(FRAME_TEMPLATES[0]);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Countdown and Flash States
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showFlash, setShowFlash] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Sound effects using Web Audio API (No files needed)
  const playBeep = (freq: number, duration: number) => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);

      oscillator.start();
      setTimeout(() => {
        oscillator.stop();
        audioCtx.close();
      }, duration);
    } catch (e) {
      console.warn("Audio Context failed to play sound", e);
    }
  };

  const playShutterSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();

      // Mimic camera shutter: white noise burst + quick high pitch click
      const bufferSize = audioCtx.sampleRate * 0.15; // 150ms
      const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const data = buffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noiseNode = audioCtx.createBufferSource();
      noiseNode.buffer = buffer;

      const filter = audioCtx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = 1000;

      const gainNode = audioCtx.createGain();
      gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.14);

      noiseNode.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      noiseNode.start();

      // Click spike
      const clickOsc = audioCtx.createOscillator();
      const clickGain = audioCtx.createGain();
      clickOsc.type = "triangle";
      clickOsc.frequency.setValueAtTime(2200, audioCtx.currentTime);
      clickGain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      clickGain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);

      clickOsc.connect(clickGain);
      clickGain.connect(audioCtx.destination);
      clickOsc.start();
      clickOsc.stop(audioCtx.currentTime + 0.06);

      setTimeout(() => {
        audioCtx.close();
      }, 200);
    } catch (e) {
      console.warn("Shutter audio simulation error", e);
    }
  };

  // Handle active camera streaming
  useEffect(() => {
    let active = true;

    async function startCamera() {
      // Stop active stream first
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      setCameraError(null);
      setIsCameraActive(false);

      try {
        // We use optimal photo definitions to capture beautiful crisp resolution
        const constraints: MediaStreamConstraints = {
          video: settings.cameraDeviceId ? {
            deviceId: { exact: settings.cameraDeviceId },
            width: { ideal: 1280 },
            height: { ideal: 720 },
            aspectRatio: { ideal: 1.7777777778 }, // 16:9
          } : {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            aspectRatio: { ideal: 1.7777777778 }, // 16:9
            facingMode: { ideal: "user" }
          },
          audio: false,
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);

        if (active) {
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play();
          }
          setIsCameraActive(true);

          // Re-enumerate devices now that permission is granted
          const devices = await navigator.mediaDevices.enumerateDevices();
          const videoDevices = devices.filter((d) => d.kind === "videoinput");
          if (videoDevices.length > 0 && !settings.cameraDeviceId && videoDevices[0].deviceId) {
            setSettings(prev => ({
              ...prev,
              cameraDeviceId: videoDevices[0].deviceId
            }));
          }
        }
      } catch (err: any) {
        console.error("Camera access failed", err);
        setCameraError(
          err.name === "NotAllowedError"
            ? "Kami membutuhkan izin kamera untuk memulai photobooth. Izinkan akses kamera di browser Anda."
            : "Gagal menyambungkan ke kamera. Pastikan kamera Anda dicolokkan dan tidak dipakai program lain."
        );
      }
    }

    startCamera();

    return () => {
      active = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [settings.cameraDeviceId, retryCount]);

  const triggerCaptureSequence = () => {
    if (isCapturing || !isCameraActive) return;
    setIsCapturing(true);
    let count = 3;
    setCountdown(count);
    playBeep(880, 80); // beep countdown

    const interval = setInterval(() => {
      count -= 1;
      if (count > 0) {
        setCountdown(count);
        playBeep(880, 80); // beep countdown
      } else {
        clearInterval(interval);
        setCountdown(null);
        performCapture();
      }
    }, 1000);
  };

  const performCapture = async () => {
    if (!videoRef.current) return;

    // Play shutter sound
    playShutterSound();

    // Trigger flash flash
    setShowFlash(true);
    setTimeout(() => {
      setShowFlash(false);
    }, 400);

    const video = videoRef.current;

    // Create drawing canvas
    const canvas = document.createElement("canvas");
    // Get high resolution from video size
    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Draw video feed (Mirrored if enabled)
    if (settings.mirrorCamera) {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, width, height);

    // Reset transform to draw frame overlay in correct orientation
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    if (settings.customOverlay) {
      const img = new Image();
      const promise = new Promise<string>((resolve, reject) => {
        img.onload = () => {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", settings.imageQuality));
        };
        img.onerror = (e) => reject(e);
        img.src = settings.customOverlay!;
      });
      try {
        const finalImageBytes = await promise;
        onPhotoCaptured(finalImageBytes, "custom-png");
      } catch (e) {
        console.error("Error blending image with custom overlay:", e);
      } finally {
        setIsCapturing(false);
      }
    } else if (selectedFrame.imageUrl) {
      const img = new Image();
      const promise = new Promise<string>((resolve, reject) => {
        img.onload = () => {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", settings.imageQuality));
        };
        img.onerror = (e) => reject(e);
        img.src = selectedFrame.imageUrl!;
      });
      try {
        const finalImageBytes = await promise;
        onPhotoCaptured(finalImageBytes, selectedFrame.id);
      } catch (e) {
        console.error("Error blending image with frame overlay:", e);
      } finally {
        setIsCapturing(false);
      }
    } else {
      // Merge Selected Frame SVG on top of the mirrored image
      const svgStr = selectedFrame.getSvgString(width, height, settings.customText);

      const svgImage = new Image();

      const svgPromise = new Promise<string>((resolve, reject) => {
        svgImage.onload = () => {
          ctx.drawImage(svgImage, 0, 0, width, height);
          // Convert to high quality JPEG
          const finalUrl = canvas.toDataURL("image/jpeg", settings.imageQuality);
          resolve(finalUrl);
        };
        svgImage.onerror = (e) => reject(e);
        svgImage.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgStr);
      });

      try {
        const finalImageBytes = await svgPromise;
        onPhotoCaptured(finalImageBytes, selectedFrame.id);
      } catch (e) {
        console.error("Error blending image with frame overlay:", e);
      } finally {
        setIsCapturing(false);
      }
    }
  };

  const handleManualUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      const imgObj = new Image();
      imgObj.onload = async () => {
        const canvas = document.createElement("canvas");
        const width = 1280;
        const height = 720;
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Draw uploaded image (scaled/centered)
        // We don't mirror uploaded photos usually, so no scale(-1, 1).
        ctx.drawImage(imgObj, 0, 0, width, height);

        if (settings.customOverlay) {
          const overlayImg = new Image();
          overlayImg.onload = () => {
            ctx.drawImage(overlayImg, 0, 0, width, height);
            onPhotoCaptured(canvas.toDataURL("image/jpeg", settings.imageQuality), "custom-png");
          };
          overlayImg.src = settings.customOverlay;
        } else if (selectedFrame.imageUrl) {
          const overlayImg = new Image();
          overlayImg.onload = () => {
            ctx.drawImage(overlayImg, 0, 0, width, height);
            onPhotoCaptured(canvas.toDataURL("image/jpeg", settings.imageQuality), selectedFrame.id);
          };
          overlayImg.src = selectedFrame.imageUrl;
        } else {
          const svgStr = selectedFrame.getSvgString(width, height, settings.customText);
          const svgImage = new Image();
          svgImage.onload = () => {
            ctx.drawImage(svgImage, 0, 0, width, height);
            onPhotoCaptured(canvas.toDataURL("image/jpeg", settings.imageQuality), selectedFrame.id);
          };
          svgImage.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgStr);
        }
      };
      imgObj.src = base64;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col items-center w-full max-w-5xl mx-auto space-y-5 p-4 md:p-6">
      {/* CAMERA SCREEN PREVIEW AREA — ornamental gold/navy bezel echoing the frame motif */}
      <div className="relative w-full rounded-[14px] p-[10px] bg-gradient-to-br from-[var(--rahmah-royal)] via-[#0e2d4d] to-[var(--rahmah-royal)] shadow-[0_10px_30px_rgba(11,59,102,0.25)]">
        {/* Corner triangle flags — signature ornament shared with the SVG frames */}
        <svg className="absolute top-0 left-0 w-10 h-10 pointer-events-none z-30" viewBox="0 0 40 40">
          <path d="M0 0 L28 0 L0 28 Z" fill="var(--rahmah-gold)" opacity="0.9" />
        </svg>
        <svg className="absolute top-0 right-0 w-10 h-10 pointer-events-none z-30 scale-x-[-1]" viewBox="0 0 40 40">
          <path d="M0 0 L28 0 L0 28 Z" fill="var(--rahmah-gold)" opacity="0.9" />
        </svg>
        <svg className="absolute bottom-0 left-0 w-10 h-10 pointer-events-none z-30 scale-y-[-1]" viewBox="0 0 40 40">
          <path d="M0 0 L28 0 L0 28 Z" fill="var(--rahmah-gold)" opacity="0.9" />
        </svg>
        <svg className="absolute bottom-0 right-0 w-10 h-10 pointer-events-none z-30 scale-x-[-1] scale-y-[-1]" viewBox="0 0 40 40">
          <path d="M0 0 L28 0 L0 28 Z" fill="var(--rahmah-gold)" opacity="0.9" />
        </svg>

        <div className="flex flex-col justify-between bg-black rounded-[8px] border border-[var(--rahmah-gold)]/50 relative shadow-[inset_0_0_0_1px_rgba(212,175,55,0.15)] overflow-hidden aspect-video w-full">

          {/* Dynamic Frame Overlay Rendering directly in DOM for lag-free preview */}
          <div className="absolute inset-0 z-10 pointer-events-none">
            {isCameraActive && settings.customOverlay ? (
              <img src={settings.customOverlay} alt="Custom Overlay" className="w-full h-full object-fill pointer-events-none" />
            ) : isCameraActive && selectedFrame.imageUrl ? (
              <img src={selectedFrame.imageUrl} alt="Frame Overlay" className="w-full h-full object-fill pointer-events-none" />
            ) : isCameraActive ? (
              <div
                className="w-full h-full"
                dangerouslySetInnerHTML={{
                  __html: selectedFrame.getSvgString(1280, 720, settings.customText)
                }}
              />
            ) : null}
          </div>

          {/* Live Video Preview container */}
          <div className="absolute inset-0 bg-black flex items-center justify-center">
            {cameraError ? (
              <div className="p-8 text-center max-w-md z-20 flex flex-col items-center">
                <div className="w-16 h-16 bg-red-950/40 border border-red-800/60 rounded-full flex items-center justify-center mb-4 text-red-400">
                  <Settings className="w-8 h-8 animate-spin-slow" />
                </div>
                <h3 className="text-white font-medium font-display text-lg mb-2">Akses Kamera Terkendala</h3>
                <p className="text-slate-400 text-sm mb-4">{cameraError}</p>
                <div className="flex space-x-3 justify-center">
                  <button
                    onClick={() => setRetryCount(c => c + 1)}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-colors border border-white/20"
                  >
                    Coba Ulang Izin
                  </button>
                  <label className="px-4 py-2 bg-[var(--rahmah-sky)] hover:bg-[var(--rahmah-sky-dark)] text-white rounded-lg text-sm font-medium transition-colors cursor-pointer border border-transparent shadow-lg flex items-center">
                    <span>Upload Foto Manual</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleManualUpload}
                    />
                  </label>
                </div>
              </div>
            ) : !isCameraActive ? (
              <div className="flex flex-col items-center space-y-3 z-20">
                <div className="w-12 h-12 border-2 border-dashed border-[var(--rahmah-gold)] rounded-full animate-spin border-t-transparent" />
                <p className="text-slate-400 font-medium text-xs tracking-wider uppercase font-mono-brand">Menghubungkan Kamera...</p>
              </div>
            ) : null}

            {/* Video Stream Element */}
            <video
              ref={videoRef}
              aria-label="Live camera preview"
              className={`w-full h-full object-cover transition-transform duration-500 ${
                isCameraActive ? "opacity-100" : "opacity-0"
              } ${settings.mirrorCamera ? "scale-x-[-1]" : ""}`}
              playsInline
              muted
            />
          </div>

          {/* Shutter Animation Flash */}
          <AnimatePresence>
            {showFlash && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="absolute inset-0 bg-white z-50 pointer-events-none"
              />
            )}
          </AnimatePresence>

          {/* Countdown Indicator Overlay */}
          <AnimatePresence>
            {countdown !== null && (
              <motion.div
                initial={{ scale: 0.2, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.8, opacity: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="absolute inset-0 flex items-center justify-center z-40 bg-black/30 backdrop-blur-xs pointer-events-none"
              >
                <div className="bg-slate-950/80 border-2 border-[var(--rahmah-gold)] h-40 w-40 rounded-full flex items-center justify-center shadow-2xl">
                  <span className="font-display text-6xl font-bold text-[var(--rahmah-gold)] animate-pulse">
                    {countdown}
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Top Floating Stats Panel: Mode and Status info */}
          <div className="absolute top-4 left-4 z-20 bg-black/50 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full flex items-center space-x-2 text-xs text-white">
            <span className={`w-2 h-2 rounded-full ${isCameraActive ? "bg-[var(--rahmah-gold)] animate-pulse" : "bg-[#d93025]"}`} />
            <span className="font-mono-brand text-white/90 font-medium tracking-wide text-[11px]">
              {isCameraActive ? "KAMERA AKTIF" : "KAMERA MATI"}
            </span>
            <span className="text-white/40">|</span>
            <span className="text-white/80 font-bold text-[11px]">16:9 HD</span>
          </div>

          {/* Mirror Toggle — prominent, always-visible segmented control */}
          {isCameraActive && (
            <div className="absolute top-4 right-4 z-20 flex bg-black/50 backdrop-blur-md border border-white/10 rounded-full p-1 gap-0.5">
              <button
                onClick={() => setSettings({ ...settings, mirrorCamera: false })}
                className={`px-3 py-1.5 rounded-full text-[11px] font-semibold tracking-wide transition-colors cursor-pointer flex items-center gap-1.5 ${
                  !settings.mirrorCamera ? "bg-[var(--rahmah-gold)] text-[var(--rahmah-ink)]" : "text-white/70 hover:text-white"
                }`}
                title="Tampilan normal (tidak dibalik)"
              >
                Normal
              </button>
              <button
                onClick={() => setSettings({ ...settings, mirrorCamera: true })}
                className={`px-3 py-1.5 rounded-full text-[11px] font-semibold tracking-wide transition-colors cursor-pointer flex items-center gap-1.5 ${
                  settings.mirrorCamera ? "bg-[var(--rahmah-gold)] text-[var(--rahmah-ink)]" : "text-white/70 hover:text-white"
                }`}
                title="Tampilan cermin (dibalik horizontal)"
              >
                <FlipHorizontal className="w-3 h-3" />
                Cermin
              </button>
            </div>
          )}

          {/* Bottom Captured Instruction Alert — circular shutter, camera-body inspired */}
          <div className="absolute bottom-6 left-4 right-4 z-20 pointer-events-none flex justify-center">
            <button
              onClick={triggerCaptureSequence}
              disabled={!isCameraActive || isCapturing}
              className={`pointer-events-auto group relative w-[64px] h-[64px] rounded-full flex items-center justify-center transition-all duration-150 shadow-[0_6px_24px_rgba(0,0,0,0.35)] ${
                !isCameraActive || isCapturing
                  ? "bg-white/30 cursor-not-allowed backdrop-blur-md"
                  : "bg-white hover:scale-105 active:scale-95"
              }`}
              title="Ambil Foto"
            >
              <span className={`absolute inset-[3px] rounded-full border-2 ${!isCameraActive || isCapturing ? "border-white/30" : "border-[var(--rahmah-gold)]"}`} />
              <Camera className={`w-6 h-6 ${!isCameraActive || isCapturing ? "text-white/60" : "text-[var(--rahmah-ink)]"} ${isCapturing ? "animate-spin" : ""}`} />
            </button>
          </div>
          <div className="absolute bottom-[18px] left-0 right-0 z-20 flex justify-center pointer-events-none">
            <span className="text-white/70 text-[11px] font-mono-brand tracking-wide bg-black/40 px-2.5 py-0.5 rounded-full mt-[74px]">
              {isCapturing ? "Memproses..." : "Ketuk untuk mulai (3 detik)"}
            </span>
          </div>
        </div>
      </div>

      {/* Frame Overlays Picker Row */}
      <div className="w-full bg-[var(--rahmah-cream-flat)] border border-[var(--rahmah-line)] p-5 rounded-[12px] flex flex-col shadow-[0_4px_16px_rgba(11,59,102,0.04)]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display text-[var(--rahmah-ink)] text-[16px] font-semibold tracking-[-0.01em]">Pilih Frame</h3>
            <p className="text-[13px] text-[var(--rahmah-ink-soft)] mt-0.5">Geser untuk melihat pratinjau frame photobooth Anda</p>
          </div>
        </div>

        {/* Horizontal Row Selection list with live thumbnail previews */}
        <div className={`flex overflow-x-auto space-x-4 pb-2 ${settings.customOverlay ? "opacity-50 pointer-events-none" : ""}`}>
          {FRAME_TEMPLATES.map((tpl) => {
            const isSelected = selectedFrame.id === tpl.id;
            return (
              <button
                key={tpl.id}
                onClick={() => setSelectedFrame(tpl)}
                className={`relative rounded-[10px] border flex flex-col shrink-0 w-[168px] overflow-hidden transition-all duration-150 text-left ${
                  isSelected
                    ? "border-[var(--rahmah-gold)] shadow-[0_2px_10px_rgba(212,175,55,0.25)]"
                    : "border-[var(--rahmah-line)] hover:border-[var(--rahmah-gold)]/60"
                }`}
              >
                {/* Mini live-rendered preview thumbnail */}
                <div className="w-full aspect-video bg-[#0c1a2e] relative overflow-hidden">
                  {tpl.imageUrl ? (
                    <img src={tpl.imageUrl} alt={tpl.name} className="w-full h-full object-cover opacity-90" />
                  ) : (
                    <div
                      className="w-full h-full scale-100"
                      dangerouslySetInnerHTML={{ __html: tpl.getSvgString(320, 180, settings.customText) }}
                    />
                  )}
                  {isSelected && (
                    <div className="absolute top-1.5 right-1.5 w-4 h-4 bg-[var(--rahmah-gold)] rounded-full flex items-center justify-center shadow">
                      <div className="w-1.5 h-1.5 bg-[var(--rahmah-ink)] rounded-full"></div>
                    </div>
                  )}
                </div>
                <div className="p-2.5 bg-[var(--rahmah-cream-flat)]">
                  <span className={`text-[12.5px] font-medium tracking-tight line-clamp-1 block ${isSelected ? "text-[var(--rahmah-ink)]" : "text-[var(--rahmah-ink-soft)]"}`}>{tpl.name}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
