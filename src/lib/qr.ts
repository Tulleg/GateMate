import { SignJWT, jwtVerify } from "jose";
import QRCode from "qrcode";
import { QrTicketPayload } from "@/types";

function getSecretKey(): Uint8Array {
  const secret = process.env.QR_SIGNING_SECRET;
  if (!secret) {
    throw new Error(
      "CRITICAL CONFIGURATION ERROR: QR_SIGNING_SECRET environment variable is missing. " +
      "Please define QR_SIGNING_SECRET in your environment variables."
    );
  }
  return new TextEncoder().encode(secret);
}

export async function generateSignedTicketJwt(payload: QrTicketPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecretKey());
}

export async function verifyTicketJwt(token: string): Promise<QrTicketPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload as unknown as QrTicketPayload;
  } catch (error) {
    console.error("JWT verification failed:", error);
    return null;
  }
}

export async function generateQrCodeDataUrl(text: string): Promise<string> {
  return QRCode.toDataURL(text, {
    errorCorrectionLevel: "H",
    margin: 2,
    color: {
      dark: "#000000",
      light: "#ffffff",
    },
  });
}
