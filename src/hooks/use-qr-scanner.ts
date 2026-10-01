"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Html5Qrcode, CameraDevice } from "html5-qrcode";

export interface UseQrScannerOptions {
  containerId?: string;
  onScanSuccess: (decodedText: string) => void;
  onScanError?: (errorMessage: string) => void;
  fps?: number;
  qrbox?: { width: number; height: number } | ((width: number, height: number) => { width: number; height: number });
  debounceMs?: number;
  initialFacingMode?: "environment" | "user";
}

export interface UseQrScannerResult {
  scanning: boolean;
  cameraInitializing: boolean;
  cameraError: string | null;
  facingMode: "environment" | "user";
  hasCameraPermission: boolean | null;
  availableCameras: CameraDevice[];
  activeCameraId: string | null;
  startScanner: (overrideModeOrCameraId?: "environment" | "user" | string) => Promise<void>;
  stopScanner: () => Promise<void>;
  toggleFacingMode: () => Promise<void>;
  switchCamera: (cameraId: string) => Promise<void>;
  clearError: () => void;
}

export function useQrScanner({
  containerId = "qr-reader",
  onScanSuccess,
  onScanError,
  fps = 10,
  qrbox = { width: 250, height: 250 },
  debounceMs = 2500,
  initialFacingMode = "environment",
}: UseQrScannerOptions): UseQrScannerResult {
  const [scanning, setScanning] = useState(false);
  const [cameraInitializing, setCameraInitializing] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">(initialFacingMode);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [availableCameras, setAvailableCameras] = useState<CameraDevice[]>([]);
  const [activeCameraId, setActiveCameraId] = useState<string | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lastScannedTokenRef = useRef<{ token: string; timestamp: number } | null>(null);

  const clearError = useCallback(() => {
    setCameraError(null);
  }, []);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch (err) {
        console.error("[useQrScanner] Error stopping scanner:", err);
      }
      scannerRef.current = null;
    }
    setScanning(false);
    setCameraInitializing(false);
    setActiveCameraId(null);
  }, []);

  const startScanner = useCallback(
    async (overrideModeOrCameraId?: "environment" | "user" | string) => {
      setCameraError(null);
      setCameraInitializing(true);
      setScanning(true);

      // Check HTTPS / Secure Context requirement for cameras
      if (
        typeof window !== "undefined" &&
        !window.isSecureContext &&
        window.location.hostname !== "localhost" &&
        window.location.hostname !== "127.0.0.1"
      ) {
        setCameraError("Kamerazugriff erfordert eine sichere Verbindung (HTTPS). Bitte nutze HTTPS oder den manuellen Lookup.");
        setCameraInitializing(false);
        setScanning(false);
        return;
      }

      // Give DOM time to render container element if unhidden
      await new Promise((resolve) => setTimeout(resolve, 150));

      const targetElement = document.getElementById(containerId);
      if (!targetElement) {
        setCameraError(`Scanner-Container Element #${containerId} wurde im DOM nicht gefunden.`);
        setCameraInitializing(false);
        setScanning(false);
        return;
      }

      try {
        // Stop any previous active scanner instance cleanly
        if (scannerRef.current) {
          if (scannerRef.current.isScanning) {
            await scannerRef.current.stop();
          }
          scannerRef.current.clear();
          scannerRef.current = null;
        }

        // Fetch camera devices list if available
        try {
          const devices = await Html5Qrcode.getCameras();
          setAvailableCameras(devices || []);
        } catch {
          // Camera list query error ignored
        }

        const html5QrCode = new Html5Qrcode(containerId);
        scannerRef.current = html5QrCode;

        let cameraConfig: string | { facingMode: "environment" | "user" };
        if (overrideModeOrCameraId === "environment" || overrideModeOrCameraId === "user") {
          cameraConfig = { facingMode: overrideModeOrCameraId };
          setFacingMode(overrideModeOrCameraId);
        } else if (typeof overrideModeOrCameraId === "string" && overrideModeOrCameraId.length > 0) {
          cameraConfig = overrideModeOrCameraId;
          setActiveCameraId(overrideModeOrCameraId);
        } else {
          cameraConfig = { facingMode };
        }

        await html5QrCode.start(
          cameraConfig,
          {
            fps,
            qrbox,
            aspectRatio: 1.0,
          },
          (decodedText) => {
            const now = Date.now();
            if (
              lastScannedTokenRef.current &&
              lastScannedTokenRef.current.token === decodedText &&
              now - lastScannedTokenRef.current.timestamp < debounceMs
            ) {
              // Ignore duplicate scan within debounce window
              return;
            }

            lastScannedTokenRef.current = { token: decodedText, timestamp: now };
            onScanSuccess(decodedText);
          },
          (errorMessage) => {
            if (onScanError) {
              onScanError(errorMessage);
            }
          }
        );

        setHasCameraPermission(true);
        setCameraInitializing(false);
      } catch (err: unknown) {
        console.error("[useQrScanner] Start error:", err);
        setCameraInitializing(false);
        setScanning(false);

        let errorMsg = "Kamerazugriff konnte nicht gestartet werden.";
        const errObj = err as { name?: string; message?: string };
        const errStr = String(err);

        if (
          errObj?.name === "NotAllowedError" ||
          errStr.includes("Permission denied") ||
          errStr.includes("NotAllowedError")
        ) {
          setHasCameraPermission(false);
          errorMsg =
            "Kameraberechtigung wurde verweigert. Bitte erlaube den Kamerazugriff in deinen Browser-Einstellungen und versuche es erneut.";
        } else if (errObj?.name === "NotFoundError" || errStr.includes("NotFoundError")) {
          errorMsg = "Keine geeignete Kamera auf diesem Gerät gefunden.";
        } else if (errObj?.name === "NotReadableError" || errStr.includes("NotReadableError")) {
          errorMsg = "Kamera wird möglicherweise von einer anderen Anwendung oder einem anderen Tab blockiert.";
        } else if (errObj?.name === "OverconstrainedError" || errStr.includes("OverconstrainedError")) {
          errorMsg = "Die angeforderte Kamera-Konfiguration wird vom Gerät nicht unterstützt.";
        } else if (typeof errObj?.message === "string") {
          errorMsg = errObj.message;
        }

        setCameraError(errorMsg);
      }
    },
    [containerId, facingMode, fps, qrbox, debounceMs, onScanSuccess, onScanError]
  );

  const toggleFacingMode = useCallback(async () => {
    const newMode = facingMode === "environment" ? "user" : "environment";
    setFacingMode(newMode);
    if (scanning) {
      await startScanner(newMode);
    }
  }, [facingMode, scanning, startScanner]);

  const switchCamera = useCallback(
    async (cameraId: string) => {
      setActiveCameraId(cameraId);
      if (scanning) {
        await startScanner(cameraId);
      }
    },
    [scanning, startScanner]
  );

  // Secure Lifecycle Cleanup: Ensure camera stream is stopped when component unmounts
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        if (scannerRef.current.isScanning) {
          scannerRef.current.stop().catch(() => {}).finally(() => {
            scannerRef.current?.clear();
            scannerRef.current = null;
          });
        } else {
          scannerRef.current.clear();
          scannerRef.current = null;
        }
      }
    };
  }, []);

  return {
    scanning,
    cameraInitializing,
    cameraError,
    facingMode,
    hasCameraPermission,
    availableCameras,
    activeCameraId,
    startScanner,
    stopScanner,
    toggleFacingMode,
    switchCamera,
    clearError,
  };
}
