import { NextResponse } from "next/server";
import crypto from "crypto";

// Server-side hashed verification - PIN is never exposed in client code or plain commits
const VALID_PIN_HASH =
  process.env.ADMIN_PIN_HASH ||
  "07aa2015d482734372d4a9a1c07c8290198526b9ce1fd2e2dcff4d05f6792a29";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const pin = typeof body?.pin === "string" ? body.pin.trim() : "";

    if (!pin) {
      return NextResponse.json({ ok: false, message: "PIN is required" }, { status: 400 });
    }

    const inputHash = crypto.createHash("sha256").update(pin).digest("hex");

    if (inputHash === VALID_PIN_HASH || (process.env.ADMIN_PIN && pin === process.env.ADMIN_PIN)) {
      // Create session token with timestamp
      const token = crypto
        .createHash("sha256")
        .update(`admin_session_${Date.now()}_${Math.random()}`)
        .digest("hex");

      return NextResponse.json({ ok: true, token });
    }

    return NextResponse.json({ ok: false, message: "Invalid PIN" }, { status: 401 });
  } catch (error: any) {
    return NextResponse.json({ ok: false, message: "Server verification error" }, { status: 500 });
  }
}
