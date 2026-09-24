import crypto from 'crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SPREADSHEET_ID = '1O53_uSyezVm2XHolFArt8RklE93kyi0dsoBJRmneMcw';

function base64url(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

async function getAccessToken(credentials) {
  const now = Math.floor(Date.now() / 1000);

  const header = {
    alg: 'RS256',
    typ: 'JWT'
  };

  const payload = {
    iss: credentials.client_email,
    scope: 'https://www.googleapis.com/auth/spreadsheets.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600
  };

  const unsignedToken =
    base64url(JSON.stringify(header)) +
    '.' +
    base64url(JSON.stringify(payload));

  const signer = crypto.createSign('RSA-SHA256');
  signer.update(unsignedToken);
  signer.end();

  const signature = signer.sign(
    credentials.private_key,
    'base64'
  )
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  const jwt = `${unsignedToken}.${signature}`;

  const response = await fetch(
    'https://oauth2.googleapis.com/token',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt
      }),
      cache: 'no-store'
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error_description ||
      data.error ||
      'No se pudo autenticar con Google'
    );
  }

  return data.access_token;
}

export async function GET() {
  try {
    const rawCredentials =
      process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

    if (!rawCredentials) {
      throw new Error(
        'Falta GOOGLE_SERVICE_ACCOUNT_JSON en Vercel'
      );
    }

    const credentials = JSON.parse(rawCredentials);

    if (!credentials.client_email || !credentials.private_key) {
      throw new Error(
        'La credencial de Google está incompleta'
      );
    }

    const accessToken =
      await getAccessToken(credentials);

    // IMPORTANTE:
    // Sólo pedimos el nombre del archivo y de las pestañas.
    // No descargamos todas las celdas.
    const url =
      `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}` +
      '?fields=properties.title,sheets.properties(sheetId,title,index)';

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      },
      cache: 'no-store'
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data?.error?.message ||
        'Google no permitió leer la planilla'
      );
    }

    return Response.json({
      ok: true,
      title: data.properties?.title || '',
      sheets: (data.sheets || []).map((sheet) => ({
        id: sheet.properties.sheetId,
        title: sheet.properties.title,
        index: sheet.properties.index
      }))
    });

  } catch (error) {
    console.error('SHEET_ERROR:', error);

    return Response.json(
      {
        ok: false,
        error: error.message
      },
      { status: 500 }
    );
  }
}
