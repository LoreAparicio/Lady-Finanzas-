export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SPREADSHEET_ID = '1O53_uSyezVm2XHolFArt8RklE93kyi0dsoBJRmneMcw';

export async function GET() {
  try {
    const url =
      `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv`;

    const response = await fetch(url, {
      cache: 'no-store'
    });

    if (!response.ok) {
      return Response.json(
        {
          ok: false,
          error: `Google Sheets respondió ${response.status}`
        },
        { status: 500 }
      );
    }

    const csv = await response.text();

    return Response.json({
      ok: true,
      spreadsheetId: SPREADSHEET_ID,
      data: csv
    });

  } catch (error) {
    return Response.json(
      {
        ok: false,
        error: error?.message || 'No se pudo leer la planilla'
      },
      { status: 500 }
    );
  }
}
