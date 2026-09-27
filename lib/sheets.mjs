import { GoogleAuth } from 'google-auth-library';
import { catalogueFromSheet } from './catalogue.mjs';

// Read-only reader for the private catalogue Sheet (service account with the spreadsheets.readonly scope).
// A bad or missing key surfaces as a failed refresh, so the bundled catalogue stays live.
// The parse error would quote part of the key, so it is replaced with a generic message.
function serviceAccount(json) {
  if (!json) return undefined;
  try { return JSON.parse(json); } catch { throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON'); }
}

export function createSheetReader(sheetId, env = process.env) {
  if (!/^[\w-]+$/.test(sheetId)) throw new Error('GOOGLE_SHEET_ID must be a spreadsheet ID');
  let auth;
  return async () => {
    auth ||= new GoogleAuth({credentials: serviceAccount(env.GOOGLE_SERVICE_ACCOUNT_JSON), scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']});
    const client = await auth.getClient();
    const params = new URLSearchParams({valueRenderOption: 'UNFORMATTED_VALUE'});
    // Resources A:T includes the optional "Suggested by" column (T); Additional placements A:E includes the optional
    // "Sort order" column (E). Columns are matched by header name, so absent optional columns are simply empty.
    for (const range of ["'Resources'!A:T", "'Categories'!A:F", "'Additional placements'!A:E"]) params.append('ranges', range);
    const response = await client.request({url: `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values:batchGet?${params}`, timeout: 20000, retryConfig: {retry: 2}});
    return catalogueFromSheet(response.data.valueRanges || []);
  };
}
