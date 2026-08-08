const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbzSq9P2_oE8MfME8HhIXMfK5lp10Kf48q0aCZUlDVwgOkFhHg4vsrtOyb3oeqirjlKbHw/exec";

const ALLOWED_ACTIONS = new Set([
  "registerOPD",
  "loginOPD"
]);

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({
      success: false,
      message: "Method tidak diizinkan."
    });
  }

  try {
    const body =
      typeof req.body === "string"
        ? JSON.parse(req.body || "{}")
        : (req.body || {});

    const action = String(body.action || "").trim();

    if (!ALLOWED_ACTIONS.has(action)) {
      return res.status(400).json({
        success: false,
        message: "Action autentikasi OPD tidak valid."
      });
    }

    const response = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      redirect: "follow",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify(body)
    });

    const text = await response.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      console.error(
        "Respons Apps Script bukan JSON:",
        text.slice(0, 800)
      );

      return res.status(502).json({
        success: false,
        message:
          "Respons Apps Script tidak valid. Periksa deployment Apps Script production."
      });
    }

    return res.status(response.ok ? 200 : response.status).json(data);

  } catch (error) {
    console.error("SIPMODAG OPD AUTH PROXY ERROR:", error);

    return res.status(500).json({
      success: false,
      message:
        error?.message ||
        "Koneksi ke layanan akun OPD gagal."
    });
  }
}
