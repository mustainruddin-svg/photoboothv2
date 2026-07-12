import React, { useState, useEffect } from "react";
import { CheckCircle2, Clipboard, Globe, RefreshCw, X } from "lucide-react";
import { AppSettings } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface PostCaptureModalProps {
  imageBytes: string;  // Data URL Base64
  frameId: string;
  settings: AppSettings;
  onClose: () => void;
}

export default function PostCaptureModal({ imageBytes, frameId, settings, onClose }: PostCaptureModalProps) {
  const [uploadStatus, setUploadStatus] = useState<"uploading" | "success" | "error">("uploading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [driveUrl, setDriveUrl] = useState<string>("");
  const [uploadProgressText, setUploadProgressText] = useState("Menghubungkan ke server...");
  const [clipboardCopied, setClipboardCopied] = useState(false);
  // Bumping this manually re-triggers the upload effect below — needed because
  // imageBytes/gasUrl/isSimulatorMode alone don't change when the user retries.
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let active = true;

    async function uploadImage() {
      setUploadStatus("uploading");
      setErrorMessage(null);

      // 1. Simulation Mode
      if (settings.isSimulatorMode) {
        const progressSteps = [
          { time: 400, text: "Merender gambar resolusi tinggi..." },
          { time: 1000, text: "Menghubungkan ke API Google Drive (SIMULASI)..." },
          { time: 1600, text: "Mengunggah berkas ke Folder Ar-Rahmah..." },
          { time: 2200, text: "Selesai! Menghasilkan QR Code..." }
        ];

        for (const step of progressSteps) {
          if (!active) return;
          await new Promise(r => setTimeout(r, step.time - (progressSteps[progressSteps.indexOf(step)-1]?.time || 0)));
          if (active) setUploadProgressText(step.text);
        }

        if (active) {
          setDriveUrl(`https://drive.google.com/fill_with_your_google_apps_script_url_simulation_${Math.random().toString(36).substring(4)}`);
          setUploadStatus("success");
        }
        return;
      }

      // 2. Real Google Apps Script Integration
      if (!settings.googleAppsScriptUrl) {
        setUploadStatus("error");
        setErrorMessage(
          "URL Web App Google Apps Script belum dikonfigurasi! Ganti ke 'Mode Simulasi' di kanan atas atau paste URL Web App Anda untuk mengunggah beneran."
        );
        return;
      }

      try {
        setUploadProgressText("Mempersiapkan data Base64...");

        // Strip data:image/jpeg;base64, header to leave raw Base64
        const base64Data = imageBytes.split(",")[1];
        if (!base64Data) {
          throw new Error("Format Base64 tidak valid");
        }

        const timestampStr = new Date().toISOString().replace(/[:.]/g, "-");
        const filename = `Ar-Rahmah_Photobooth_${timestampStr}.jpg`;

        setUploadProgressText("Mengunggah foto langsung ke Google Drive...");

        // Google Apps Script expects raw POST payload usually, or JSON
        const response = await fetch(settings.googleAppsScriptUrl, {
          method: "POST",
          mode: "cors",
          headers: {
            "Content-Type": "text/plain;charset=utf-8", // avoids pre-flight CORS issues in some environments
          },
          body: JSON.stringify({
            image: base64Data,
            filename: filename,
            mimeType: "image/jpeg"
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
        }

        setUploadProgressText("Mendapatkan tautan publik...");
        const result = await response.json();

        if (result.success) {
          if (active) {
            setDriveUrl(result.url);
            setUploadStatus("success");
          }
        } else {
          throw new Error(result.error || "Google Apps Script gagal menyimpan file.");
        }

      } catch (err: any) {
        console.error("Upload error:", err);
        if (active) {
          setUploadStatus("error");
          setErrorMessage(
            err.message || "Gagal menghubungi Server Google Apps Script. Periksa kembali Web App URL & izin CORS Anda."
          );
        }
      }
    }

    uploadImage();

    return () => {
      active = false;
    };
  }, [imageBytes, settings.googleAppsScriptUrl, settings.isSimulatorMode, retryKey]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(driveUrl);
    setClipboardCopied(true);
    setTimeout(() => setClipboardCopied(false), 2000);
  };

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(driveUrl)}&color=0B3B66`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0b1420]/70 backdrop-blur-sm">
      {/* Modal Card Backdrop */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-[var(--rahmah-cream-flat)] border border-[var(--rahmah-line)] rounded-[16px] overflow-hidden w-full max-w-4xl shadow-[0_16px_50px_rgba(11,59,102,0.3)] grid grid-cols-1 md:grid-cols-12 max-h-[92vh]"
      >

        {/* Left Side: Captured Photo view (7 columns) — gold-trimmed like a finished keepsake */}
        <div className="md:col-span-7 bg-[#0c1a2e] flex items-center justify-center relative min-h-[300px] md:min-h-0 p-3">
          <div className="w-full h-full border-2 border-[var(--rahmah-gold)]/70 rounded-[8px] overflow-hidden relative">
            <img
              src={imageBytes}
              alt="Hasil Foto Photobooth"
              className="w-full h-full object-contain pointer-events-none bg-black"
            />
          </div>
          <div className="absolute top-6 left-6 bg-[var(--rahmah-cream-flat)] px-2.5 py-1 rounded-[4px] border border-[var(--rahmah-gold)]/60 text-[10.5px] text-[var(--rahmah-ink)] font-semibold tracking-wide shadow-sm font-mono-brand">
            SIAP DIBAGIKAN
          </div>
        </div>

        {/* Right Side: Status/Cloud sharing operations (5 columns) */}
        <div className="md:col-span-5 p-7 md:p-8 flex flex-col justify-between bg-[var(--rahmah-cream-flat)]">

          {/* Header Title with exit button */}
          <div className="flex items-center justify-between pb-5 border-b border-[var(--rahmah-line)]">
            <div>
              <span className="text-[10.5px] text-[var(--rahmah-gold-dark)] font-semibold tracking-[0.12em] uppercase font-mono-brand">Ar-Rahmah Cloud Server</span>
              <h2 className="font-display text-[var(--rahmah-ink)] font-semibold text-[21px] tracking-[-0.01em] mt-1">Bagikan Foto</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-[8px] bg-[var(--rahmah-cream)] hover:bg-[var(--rahmah-gold-soft)] text-[var(--rahmah-ink-soft)] hover:text-[var(--rahmah-ink)] transition-colors cursor-pointer border border-[var(--rahmah-line)]"
              title="Tutup"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="py-6 flex flex-col items-center justify-center flex-1">
            <AnimatePresence mode="wait">

              {/* STAGE 1: UPLOADING LOADING */}
              {uploadStatus === "uploading" && (
                <motion.div
                  key="uploading-state"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="flex flex-col items-center text-center space-y-4 py-8"
                >
                  <div className="relative flex items-center justify-center">
                    <div className="w-12 h-12 border-2 border-[var(--rahmah-line)] rounded-full animate-spin border-t-[var(--rahmah-royal)]" />
                  </div>
                  <div className="space-y-1.5 max-w-xs mt-4">
                    <p className="text-[var(--rahmah-ink)] text-[14px] font-medium tracking-[-0.01em]">Mengunggah Foto...</p>
                    <p className="text-[var(--rahmah-ink-soft)] text-[13px] leading-relaxed transition-all duration-300">
                      {uploadProgressText}
                    </p>
                  </div>
                </motion.div>
              )}

              {/* STAGE 2: UPLOAD ERROR */}
              {uploadStatus === "error" && (
                <motion.div
                  key="error-state"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="w-full text-center space-y-4 py-4"
                >
                  <div className="w-12 h-12 bg-[var(--rahmah-danger-soft)] border border-[var(--rahmah-danger)]/30 rounded-full flex items-center justify-center mx-auto text-[var(--rahmah-danger)]">
                    <X className="w-5 h-5" />
                  </div>
                  <div className="space-y-1 mt-4">
                    <h3 className="text-[var(--rahmah-ink)] font-medium text-[14px]">Gagal Mengunggah</h3>
                    <p className="text-[var(--rahmah-ink-soft)] text-[13px] leading-relaxed max-w-xs mx-auto">
                      {errorMessage}
                    </p>
                  </div>

                  {settings.isSimulatorMode ? null : (
                    <button
                      onClick={() => setRetryKey((k) => k + 1)}
                      className="inline-flex items-center gap-1.5 text-[13px] text-[var(--rahmah-royal)] font-semibold underline hover:text-[var(--rahmah-sky)] cursor-pointer mt-4"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Coba unggah lagi
                    </button>
                  )}
                </motion.div>
              )}

              {/* STAGE 3: UPLOAD SUCCESS & DISPLAY QR CODE */}
              {uploadStatus === "success" && (
                <motion.div
                  key="success-state"
                  initial={{ opacity: 0, scale: 0.93 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.93 }}
                  className="flex flex-col items-center text-center space-y-5 w-full"
                >
                  <div className="flex items-center space-x-1.5 text-[var(--rahmah-gold-dark)] text-[12px] font-semibold tracking-wide bg-[var(--rahmah-gold-soft)] px-3 py-1.5 rounded-full">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Unggahan Selesai</span>
                  </div>

                  {/* QR Code Container */}
                  <div className="relative p-2 bg-white rounded-[10px] shadow-[0_2px_10px_rgba(11,59,102,0.1)] border-2 border-[var(--rahmah-gold)]/70">
                    <img
                      src={qrCodeUrl}
                      alt="Link QR Code"
                      className="w-[140px] h-[140px]"
                    />
                  </div>

                  <div className="space-y-1">
                    <p className="text-[var(--rahmah-ink)] text-[14px] font-medium tracking-tight">Pindai untuk Unduh</p>
                    <p className="text-[var(--rahmah-ink-soft)] text-[13px] max-w-xs leading-normal">
                      Gunakan kamera ponsel untuk memindai kode dan menyimpan foto.
                    </p>
                  </div>

                  {/* Copy Link Utility Area */}
                  <div className="w-full flex items-center bg-[var(--rahmah-cream)] border border-[var(--rahmah-line)] rounded-[8px] p-1 h-[42px]">
                    <span className="flex-1 text-[12px] text-[var(--rahmah-ink-soft)] font-mono-brand text-left pl-3 truncate select-all">
                      {driveUrl}
                    </span>
                    <button
                      onClick={handleCopyLink}
                      className={`px-3 py-1.5 text-[12px] font-semibold rounded-[6px] transition-all cursor-pointer flex items-center space-x-1.5 h-full ${
                        clipboardCopied
                          ? "bg-[var(--rahmah-gold-soft)] text-[var(--rahmah-gold-dark)]"
                          : "bg-white hover:bg-[var(--rahmah-gold-soft)] text-[var(--rahmah-ink)] border border-[var(--rahmah-line)] shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
                      }`}
                    >
                      <Clipboard className="w-3.5 h-3.5" />
                      <span>{clipboardCopied ? "Tersalin" : "Salin"}</span>
                    </button>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>

          {/* Action buttons footer */}
          <div className="pt-6 border-t border-[var(--rahmah-line)] flex items-center space-x-3">
            <button
              onClick={onClose}
              className="flex-1 h-[42px] rounded-[8px] border border-[var(--rahmah-line)] bg-white hover:bg-[var(--rahmah-cream)] font-medium text-[14px] text-[var(--rahmah-ink)] transition-all cursor-pointer flex items-center justify-center space-x-2 shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Foto Baru</span>
            </button>

            {uploadStatus === "success" && (
              <a
                href={driveUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="flex-1 h-[42px] rounded-[8px] bg-[var(--rahmah-royal)] hover:bg-[#0e2d4d] text-white font-medium text-[14px] transition-all text-center flex items-center justify-center space-x-2"
              >
                <Globe className="w-4 h-4" />
                <span>Buka Tautan</span>
              </a>
            )}
          </div>

        </div>

      </motion.div>
    </div>
  );
}
