import React, { useState, useEffect } from "react";
import { Camera, FileCode, Settings } from "lucide-react";
import { AppSettings } from "./types";
import Photobooth from "./components/Photobooth";
import PostCaptureModal from "./components/PostCaptureModal";
import Exporter from "./components/Exporter";
import { SettingsView } from "./components/SettingsView";

export default function App() {
  const [activeTab, setActiveTab] = useState<"terminal" | "settings" | "export">("terminal");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedFrameId, setCapturedFrameId] = useState<string>("royal-gold");
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);

  // Global applet configuration states
  const [settings, setSettings] = useState<AppSettings>(() => {
    // Setiap yayasan/korjen kelas punya Web App URL sendiri — jangan pernah
    // memaksakan URL bawaan di sini. Kosong = Mode Simulasi otomatis aktif,
    // sampai operator menempelkan URL Google Apps Script miliknya sendiri.
    const savedUrl = localStorage.getItem("photobooth_gas_url") || "";

    return {
      googleAppsScriptUrl: savedUrl,
      isSimulatorMode: savedUrl.trim() === "",
      customText: "Wisuda SIT Ar-Rahmah",
      cameraDeviceId: "",
      imageQuality: 0.9,
      customOverlay: null,
      mirrorCamera: true,
    };
  });

  // Effect to persist the database URL automatically whenever it changes
  React.useEffect(() => {
    if (settings.googleAppsScriptUrl) {
      localStorage.setItem("photobooth_gas_url", settings.googleAppsScriptUrl);
      // Auto-disable simulator mode if a valid URL is provided
      if (settings.isSimulatorMode && settings.googleAppsScriptUrl.trim() !== "") {
        setSettings(prev => ({ ...prev, isSimulatorMode: false }));
      }
    } else {
      localStorage.removeItem("photobooth_gas_url");
    }
  }, [settings.googleAppsScriptUrl, settings.isSimulatorMode]);

  useEffect(() => {
    async function getDevices() {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter((d) => d.kind === "videoinput");
        setCameras(videoDevices);
        if (videoDevices.length > 0 && !settings.cameraDeviceId) {
          setSettings((prev) => ({
            ...prev,
            cameraDeviceId: videoDevices[0].deviceId,
          }));
        }
      } catch (err) {
        console.error("Error listing system cameras", err);
      }
    }
    getDevices();

    // Add event listener for when permissions change
    navigator.mediaDevices.addEventListener('devicechange', getDevices);
    return () => navigator.mediaDevices.removeEventListener('devicechange', getDevices);
  }, [settings.cameraDeviceId]);

  const handlePhotoCaptured = (imageBytes: string, frameId: string) => {
    setCapturedImage(imageBytes);
    setCapturedFrameId(frameId);
  };

  const tabs: { id: typeof activeTab; label: string; icon: typeof Camera }[] = [
    { id: "terminal", label: "Kamera", icon: Camera },
    { id: "settings", label: "Pengaturan", icon: Settings },
    { id: "export", label: "Ekspor", icon: FileCode },
  ];

  return (
    <div className="h-screen w-screen overflow-hidden bg-[var(--rahmah-cream)] flex flex-col font-sans select-none text-[var(--rahmah-ink)]">

      {/* HEADER / MASTHEAD SECTION */}
      <header className="h-[68px] bg-[var(--rahmah-cream-flat)] border-b border-[var(--rahmah-gold)]/40 flex items-center px-6 md:px-8 justify-between shrink-0 shadow-[0_1px_0_rgba(212,175,55,0.15)] z-30">
        <div className="flex items-center gap-4">
          <div className="w-9 h-9 rounded-full bg-[var(--rahmah-royal)] border border-[var(--rahmah-gold)] flex items-center justify-center shrink-0">
            <Camera className="w-4 h-4 text-[var(--rahmah-gold)]" />
          </div>
          <div className="corner-flourish px-4 hidden sm:block">
            <h1 className="font-display font-semibold text-[19px] tracking-[-0.01em] text-[var(--rahmah-ink)] leading-none">
              Ar-Rahmah Photobooth
            </h1>
            <p className="text-[10.5px] text-[var(--rahmah-gold-dark)] uppercase tracking-[0.16em] font-semibold mt-1 font-mono-brand">
              Yayasan Ar-Rahmah Sulawesi
            </p>
          </div>
          <div className="sm:hidden">
            <h1 className="font-display font-semibold text-[16px] text-[var(--rahmah-ink)] leading-none">Ar-Rahmah Photobooth</h1>
          </div>
        </div>

        <div className="flex items-center gap-3 md:gap-4">
          <div className="flex bg-[var(--rahmah-gold-soft)]/50 p-1 border border-[var(--rahmah-line)] rounded-full">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 md:px-4 py-1.5 rounded-full font-medium text-[13px] transition-all duration-150 flex items-center gap-2 cursor-pointer ${
                    isActive
                      ? "bg-[var(--rahmah-royal)] text-white shadow-[0_2px_6px_rgba(11,59,102,0.25)]"
                      : "text-[var(--rahmah-ink-soft)] hover:bg-white/60"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="h-7 w-[1px] bg-[var(--rahmah-line)] mx-1"></div>

          <button
            onClick={() => setSettings({ ...settings, isSimulatorMode: !settings.isSimulatorMode })}
            className={`text-[11.5px] font-semibold px-3 py-1.5 rounded-full flex items-center gap-2 transition-colors cursor-pointer font-mono-brand tracking-wide ${
              settings.isSimulatorMode
                ? "bg-[var(--rahmah-cream)] text-[var(--rahmah-ink-soft)] border border-[var(--rahmah-line)]"
                : "bg-[var(--rahmah-royal)] text-white"
            }`}
            title="Toggle Simulation Mode"
          >
            <span className={`w-1.5 h-1.5 rounded-full ${settings.isSimulatorMode ? "bg-[var(--rahmah-ink-soft)]" : "bg-[var(--rahmah-gold)] shadow-[0_0_6px_var(--rahmah-gold)]"}`}></span>
            <span className="hidden sm:inline">{settings.isSimulatorMode ? "SIMULASI" : "CLOUD SYNC"}</span>
          </button>
        </div>
      </header>

      {/* WORKSPACE AREA */}
      <main className="flex-1 flex overflow-hidden w-full relative z-20 bg-[var(--rahmah-cream)]">

        {/* Tab view containers */}
        <div className="flex-1 flex overflow-hidden w-full h-full justify-center">
          {activeTab === "terminal" ? (
            <div className="w-full h-full overflow-y-auto items-start flex flex-col justify-center">
               <Photobooth
                settings={settings}
                setSettings={setSettings}
                onPhotoCaptured={handlePhotoCaptured}
               />
            </div>
          ) : activeTab === "settings" ? (
            <div className="w-full h-full overflow-y-auto">
              <SettingsView settings={settings} setSettings={setSettings} cameras={cameras} />
            </div>
          ) : (
            <div className="w-full h-full overflow-y-auto p-4 md:p-8 flex items-center justify-center flex-col">
              <Exporter />
            </div>
          )}
        </div>

      </main>

      {/* POST-CAPTURE OVERLAY/CONFIRMATION PORTAL */}
      {capturedImage && (
        <PostCaptureModal
          imageBytes={capturedImage}
          frameId={capturedFrameId}
          settings={settings}
          onClose={() => setCapturedImage(null)}
        />
      )}
    </div>
  );
}
