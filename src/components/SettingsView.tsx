import React, { useState } from "react";
import { AppSettings, SettingsUpdater } from "../types";
import { RefreshCw, Eye, EyeOff, FlipHorizontal } from "lucide-react";

interface SettingsViewProps {
  settings: AppSettings;
  setSettings: SettingsUpdater;
  cameras: MediaDeviceInfo[];
}

export function SettingsView({ settings, setSettings, cameras }: SettingsViewProps) {
  const [showUrl, setShowUrl] = useState(false);

  return (
    <div className="w-full h-full max-w-3xl mx-auto p-4 md:p-8 flex flex-col items-center">
      <div className="w-full bg-[var(--rahmah-cream-flat)] border border-[var(--rahmah-line)] p-6 md:p-8 rounded-[14px] flex flex-col space-y-7 shadow-[0_4px_16px_rgba(11,59,102,0.04)]">
        <div>
          <h2 className="font-display text-[var(--rahmah-ink)] text-[22px] font-semibold tracking-[-0.01em]">Pengaturan</h2>
          <p className="text-[14px] text-[var(--rahmah-ink-soft)] mt-1">Atur teks banner, sinkronisasi data, dan perangkat kamera.</p>
        </div>

        <div className="h-[1px] bg-[var(--rahmah-line)] w-full" />

        <div className="flex flex-col space-y-7 w-full max-w-xl">
          {/* Dynamic Label Customization Input */}
          <div className="flex flex-col">
            <label htmlFor="custom-text-input" className="block text-[13.5px] font-semibold text-[var(--rahmah-ink)] mb-2">Teks Banner Kustom</label>
            <input
              id="custom-text-input"
              type="text"
              className="w-full h-[46px] px-4 text-[14px] border border-[var(--rahmah-line)] rounded-[8px] bg-white text-[var(--rahmah-ink)] focus:outline-none focus:border-[var(--rahmah-sky)] focus:ring-1 focus:ring-[var(--rahmah-sky)] transition-all"
              placeholder="cth: Wisuda SIT Ar-Rahmah"
              value={settings.customText}
              onChange={(e) => setSettings({ ...settings, customText: e.target.value })}
            />
            <p className="text-[12px] text-[var(--rahmah-ink-soft)] mt-1.5 leading-snug">
              Teks ini tampil pada banner emas di setiap frame hasil foto.
            </p>
          </div>

          {/* Google Apps Script / Database URL Input */}
          <div className="flex flex-col">
            <label htmlFor="gas-url-input" className="text-[13.5px] font-semibold text-[var(--rahmah-ink)] mb-2 flex items-center justify-between">
              <span>URL Sinkronisasi Google Drive</span>
              <span className="text-[10.5px] text-[var(--rahmah-gold-dark)] bg-[var(--rahmah-gold-soft)] px-2 py-0.5 rounded-full font-mono-brand tracking-wide">TERSIMPAN OTOMATIS</span>
            </label>
            <div className="relative">
              <input
                id="gas-url-input"
                type={showUrl ? "text" : "password"}
                className="w-full h-[46px] pl-4 pr-11 text-[14px] border border-[var(--rahmah-line)] rounded-[8px] bg-[var(--rahmah-cream)] text-[var(--rahmah-ink)] focus:outline-none focus:border-[var(--rahmah-sky)] focus:ring-1 focus:ring-[var(--rahmah-sky)] transition-all font-mono-brand"
                placeholder="Tempel URL Web App Google Apps Script..."
                value={settings.googleAppsScriptUrl || ""}
                onChange={(e) => setSettings({ ...settings, googleAppsScriptUrl: e.target.value })}
                autoComplete="off"
                spellCheck={false}
              />
              <button
                type="button"
                onClick={() => setShowUrl((v) => !v)}
                className="absolute right-0 top-0 h-[46px] w-[44px] flex items-center justify-center text-[var(--rahmah-ink-soft)] hover:text-[var(--rahmah-ink)] cursor-pointer"
                title={showUrl ? "Sembunyikan URL" : "Tampilkan URL"}
              >
                {showUrl ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[12px] text-[var(--rahmah-ink-soft)] mt-1.5 leading-snug">
              Ini bukan kata sandi — hanya disamarkan agar tidak terbaca orang lain saat layar dilihat langsung. Kosongkan untuk kembali ke Mode Simulasi. Jangan bagikan URL ini di luar tim operator, karena siapa pun yang memilikinya dapat mengunggah berkas ke Drive tujuan.
            </p>
          </div>

          {/* Swap Camera Device Selection */}
          {cameras.length > 1 && (
            <div className="flex flex-col">
              <label htmlFor="camera-select" className="block text-[13.5px] font-semibold text-[var(--rahmah-ink)] mb-2">Sumber Kamera</label>
              <div className="relative">
                <select
                  id="camera-select"
                  className="w-full h-[46px] px-4 text-[14px] border border-[var(--rahmah-line)] rounded-[8px] bg-white text-[var(--rahmah-ink)] focus:outline-none focus:border-[var(--rahmah-sky)] focus:ring-1 focus:ring-[var(--rahmah-sky)] transition-all appearance-none cursor-pointer"
                  value={settings.cameraDeviceId}
                  onChange={(e) => setSettings({ ...settings, cameraDeviceId: e.target.value })}
                >
                  <option value="">Kamera Default Sistem</option>
                  {cameras.map((c, idx) => (
                    <option key={c.deviceId} value={c.deviceId}>
                      {c.label || `Kamera ${idx + 1}`}
                    </option>
                  ))}
                </select>
                <RefreshCw className="absolute right-4 top-[16px] w-4 h-4 text-[var(--rahmah-ink-soft)] pointer-events-none" />
              </div>
            </div>
          )}

          {/* Mirror Camera Setting — clear segmented toggle */}
          <div className="flex flex-col">
            <label className="block text-[13.5px] font-semibold text-[var(--rahmah-ink)] mb-2">Tampilan Kamera</label>
            <div className="inline-flex bg-[var(--rahmah-cream)] border border-[var(--rahmah-line)] rounded-[8px] p-1 w-fit">
              <button
                type="button"
                onClick={() => setSettings({ ...settings, mirrorCamera: false })}
                className={`px-4 py-2 rounded-[6px] text-[13px] font-medium transition-colors cursor-pointer ${
                  !settings.mirrorCamera ? "bg-[var(--rahmah-royal)] text-white shadow-sm" : "text-[var(--rahmah-ink-soft)] hover:bg-white"
                }`}
              >
                Normal
              </button>
              <button
                type="button"
                onClick={() => setSettings({ ...settings, mirrorCamera: true })}
                className={`px-4 py-2 rounded-[6px] text-[13px] font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                  settings.mirrorCamera ? "bg-[var(--rahmah-royal)] text-white shadow-sm" : "text-[var(--rahmah-ink-soft)] hover:bg-white"
                }`}
              >
                <FlipHorizontal className="w-3.5 h-3.5" />
                Cermin
              </button>
            </div>
            <p className="text-[12px] text-[var(--rahmah-ink-soft)] mt-2 leading-snug max-w-md">
              "Cermin" membalik tampilan secara horizontal seperti bercermin — nyaman untuk kamera depan/selfie.
              "Normal" menampilkan apa adanya seperti yang dilihat kamera, cocok untuk kamera eksternal/webcam yang mengarah ke tamu.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
