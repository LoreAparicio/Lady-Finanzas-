export async function GET() {
  try {
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);

    const spreadsheetId = '1O53_uSyezVm2XHolFArt8RklE93kyi0dsoBJRmneMcw';

    const header = {
      alg: 'RS256',
      typ: 'JWT'
    };

    const now = Math.floor(Date.now() / 1000);

    const claim = {
      iss: credentials.client_email,
      scope: 'https://www.googleapis.com/auth/spreadsheets.readonly',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now
    };

    const encode = (obj) =>
      Buffer.from(JSON.stringify(obj))
        .toString('base64url');

    const unsignedToken =
      encode(header) + '.' + encode(claim);

    const crypto = await import('crypto');

    const signer = crypto.createSign('RSA-SHA256');
    signer.update(unsignedToken);
    signer.end();

    const signature = signer
      .sign(credentials.private_key)
      .toString('base64url');

    const jwt = unsignedToken + '.' + signature;

    const tokenResponse = await fetch(
      'https://oauth2.googleapis.com/token',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
          assertion: jwt
        })
      }
    );

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      throw new Error(
        tokenData.error_description ||
        tokenData.error ||
        'No se pudo autenticar con Google'
      );
    }

    const sheetResponse = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?includeGridData=true`,
      {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`
        },
        cache: 'no-store'
      }
    );

    const sheetData = await sheetResponse.json();

    if (!sheetResponse.ok) {
      throw new Error(
        sheetData.error?.message ||
        'No se pudo leer la planilla'
      );
    }

    return Response.json({
      ok: true,
      title: sheetData.properties?.title,
      sheets: sheetData.sheets
    });

  } catch (error) {
    console.error(error);

    return Response.json(
      {
        ok: false,
        error: error.message
      },
      { status: 500 }
    );
  }
}
