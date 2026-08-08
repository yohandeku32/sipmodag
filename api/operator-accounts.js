const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbzuktxlcWdkA7NtjbgYmU3Gsg4miqFY5HRYPl3mMjupqo4f2pqp4_uXgNTG5QdRHtAiRg/exec";

const ALLOWED_GET = new Set([
  "getOperatorAccounts",
]);

const ALLOWED_POST = new Set([
  "updateOPDAccountEmail",
  "setOPDAccountPassword",
  "deleteOPDAccount",
]);

function parseBody(req) {
  if (typeof req.body === "string") {
    return JSON.parse(req.body || "{}");
  }

  return req.body || {};
}

async function parseAppsScriptResponse(response) {
  const text = await response.text();

  try {
    return JSON.parse(text);
  } catch {
    console.error(
      "Respons Apps Script bukan JSON:",
      text.slice(0, 800)
    );

    throw new Error(
      "Respons Apps Script tidak valid. Periksa deployment Apps Script production."
    );
  }
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  try {
    if (req.method === "GET") {
      const action = String(req.query.action || "").trim();

      if (!ALLOWED_GET.has(action)) {
        return res.status(400).json({
          success: false,
          message: "Action GET tidak diizinkan.",
        });
      }

      const url = new URL(APPS_SCRIPT_URL);
      url.searchParams.set("action", action);
      url.searchParams.set(
        "token",
        String(req.query.token || "")
      );
      url.searchParams.set("_t", String(Date.now()));

      const response = await fetch(url.toString(), {
        method: "GET",
        redirect: "follow",
        cache: "no-store",
      });

      const data =
        await parseAppsScriptResponse(response);

      return res.status(
        response.ok ? 200 : response.status
      ).json(data);
    }

    if (req.method === "POST") {
      const body = parseBody(req);
      const action = String(body.action || "").trim();

      if (!ALLOWED_POST.has(action)) {
        return res.status(400).json({
          success: false,
          message: "Action POST tidak diizinkan.",
        });
      }

      const response = await fetch(
        APPS_SCRIPT_URL,
        {
          method: "POST",
          redirect: "follow",
          headers: {
            "Content-Type":
              "text/plain;charset=utf-8",
          },
          body: JSON.stringify(body),
        }
      );

      const data =
        await parseAppsScriptResponse(response);

      return res.status(
        response.ok ? 200 : response.status
      ).json(data);
    }

    res.setHeader("Allow", "GET, POST");

    return res.status(405).json({
      success: false,
      message: "Method tidak diizinkan.",
    });

  } catch (error) {
    console.error(
      "SIPMODAG OPERATOR ACCOUNT PROXY ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error?.message ||
        "Layanan pengelolaan akun OPD gagal.",
    });
  }
}
