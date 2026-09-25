import { SignJWT, jwtVerify } from "jose";
import QRCode from "qrcode";
import { QrTicketPayload } from "@/types";

const SECRET_KEY = new TextEncoder().encode(
  process.env.QR_SIGNING_SECRET || "default-32-byte-secret-key-change-me"
);

export async function generateSignedTicketJwt(payload: QrTicketPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET_KEY);
}

export async function verifyTicketJwt(token: string): Promise<QrTicketPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
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
