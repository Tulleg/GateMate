import { SignJWT, jwtVerify, errors } from "jose";
import QRCode from "qrcode";
import { QrTicketPayload } from "@/types";

export type TicketVerificationStatus =
  | "VALID"
  | "EXPIRED"
  | "INVALID_SIGNATURE"
  | "MALFORMED"
  | "MISSING_SECRET"
  | "ERROR";

export interface TicketVerificationResult {
  valid: boolean;
  status: TicketVerificationStatus;
  payload?: QrTicketPayload;
  error?: string;
}

function getSecretKey(): Uint8Array {
  const secret = process.env.QR_SIGNING_SECRET || process.env.BETTER_AUTH_SECRET || "gatemate_qr_signing_fallback_secret_key_32bytes";
  if (!process.env.QR_SIGNING_SECRET && process.env.NODE_ENV === "production") {
    console.warn(
      "[Warning] QR_SIGNING_SECRET is missing in production. Falling back to default auth secret key."
    );
  }
  return new TextEncoder().encode(secret);
}

/**
 * Generates an HS256-signed JWT token representing a valid ticket QR payload.
 */
export async function generateSignedTicketJwt(
  payload: QrTicketPayload,
  expiresIn: string = "30d"
): Promise<string> {
  const key = getSecretKey();
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(key);
}

/**
 * Verifies an HS256-signed ticket JWT token with defensive error classification.
 */
export async function verifyTicketJwtDetailed(token: string): Promise<TicketVerificationResult> {
  if (!token || typeof token !== "string" || token.trim().length === 0) {
    return {
      valid: false,
      status: "MALFORMED",
      error: "Token ist leer oder kein gültiger String.",
    };
  }

  try {
    const key = getSecretKey();
    const { payload } = await jwtVerify(token, key);
    return {
      valid: true,
      status: "VALID",
      payload: payload as unknown as QrTicketPayload,
    };
  } catch (err: any) {
    if (err instanceof errors.JWTExpired) {
      return {
        valid: false,
        status: "EXPIRED",
        error: "Ticket-Token ist abgelaufen.",
      };
    }
    if (err instanceof errors.JWSSignatureVerificationFailed) {
      return {
        valid: false,
        status: "INVALID_SIGNATURE",
        error: "Ungültige Ticket-Signatur (Fälschungsverdacht).",
      };
    }
    if (err instanceof errors.JWTInvalid || err instanceof errors.JWSInvalid) {
      return {
        valid: false,
        status: "MALFORMED",
        error: "Fehlerhaftes Token-Format.",
      };
    }
    return {
      valid: false,
      status: "ERROR",
      error: err?.message || "Unbekannter Verifizierungsfehler.",
    };
  }
}

/**
 * Backward-compatible helper returning payload or null.
 */
export async function verifyTicketJwt(token: string): Promise<QrTicketPayload | null> {
  const res = await verifyTicketJwtDetailed(token);
  return res.valid && res.payload ? res.payload : null;
}

// In-memory LRU cache for QR codes (max 500 items)
const MAX_QR_CACHE_SIZE = 500;
const qrDataUrlCache = new Map<string, string>();
const qrSvgCache = new Map<string, string>();

/**
 * Generates high-resolution, camera-optimized QR code Data URL for ticket rendering.
 * Uses Error Correction Level 'M' (15%) for optimal matrix density and mobile decodability.
 */
export async function generateQrCodeDataUrl(
  text: string,
  options?: QRCode.QRCodeToDataURLOptions
): Promise<string> {
  const cacheKey = `${text}_${JSON.stringify(options || {})}`;
  if (qrDataUrlCache.has(cacheKey)) {
    return qrDataUrlCache.get(cacheKey)!;
  }

  const defaultOptions: QRCode.QRCodeToDataURLOptions = {
    errorCorrectionLevel: "M",
    margin: 2,
    width: 360, // Crisp rendering on high-DPI retina screens
    color: {
      dark: "#000000",
      light: "#ffffff",
    },
    ...options,
  };

  const dataUrl = await QRCode.toDataURL(text, defaultOptions);

  if (qrDataUrlCache.size >= MAX_QR_CACHE_SIZE) {
    const firstKey = qrDataUrlCache.keys().next().value;
    if (firstKey) qrDataUrlCache.delete(firstKey);
  }
  qrDataUrlCache.set(cacheKey, dataUrl);

  return dataUrl;
}

/**
 * Generates lightweight, scalable SVG QR vector string for vector ticket rendering.
 */
export async function generateQrCodeSvg(
  text: string,
  options?: QRCode.QRCodeToStringOptions
): Promise<string> {
  const cacheKey = `svg_${text}_${JSON.stringify(options || {})}`;
  if (qrSvgCache.has(cacheKey)) {
    return qrSvgCache.get(cacheKey)!;
  }

  const defaultOptions: QRCode.QRCodeToStringOptions = {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 2,
    color: {
      dark: "#000000",
      light: "#ffffff",
    },
    ...options,
  };

  const svgString = await QRCode.toString(text, defaultOptions);

  if (qrSvgCache.size >= MAX_QR_CACHE_SIZE) {
    const firstKey = qrSvgCache.keys().next().value;
    if (firstKey) qrSvgCache.delete(firstKey);
  }
  qrSvgCache.set(cacheKey, svgString);

  return svgString;
}


