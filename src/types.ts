import type React from "react";

export interface FrameTemplate {
  id: string;
  name: string;
  description: string;
  color: string;
  getSvgString: (width: number, height: number, customText?: string) => string;
  imageUrl?: string;
}

export interface PhotoCaptureState {
  imageBytes: string | null;  // Base64 Data URL or string
  frameId: string;
  timestamp: string;
}

export interface AppSettings {
  googleAppsScriptUrl: string;
  isSimulatorMode: boolean;
  customText: string;
  cameraDeviceId: string;
  imageQuality: number;
  customOverlay: string | null;
  mirrorCamera: boolean;
}

// Matches the React useState setter signature exactly, so both
// setSettings(newSettings) and setSettings(prev => ({...prev, ...})) work
// everywhere this type is used as a prop.
export type SettingsUpdater = React.Dispatch<React.SetStateAction<AppSettings>>;
