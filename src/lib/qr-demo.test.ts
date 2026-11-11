import { describe, expect, it } from "vitest";
import { demoQrPayload, readDemoQr } from "./qr-demo";

describe("isolated demo QR", () => {
  it("accepts the three fictional delegates", () => {
    for (let i = 0; i < 3; i++) expect(readDemoQr(demoQrPayload(i), []).ok).toBe(true);
  });
  it("rejects a second reading in the same session", () => {
    expect(readDemoQr(demoQrPayload(0), [demoQrPayload(0)]).ok).toBe(false);
  });
  it("rejects real URLs and unknown tokens", () => {
    expect(readDemoQr("https://example.com/staff/scan?token=real", []).ok).toBe(false);
    expect(readDemoQr("MCNUN:DEMO:DELEGATE:04", []).ok).toBe(false);
  });
});