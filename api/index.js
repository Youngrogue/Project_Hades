import {waitUntil} from '@vercel/functions';
import {createRuntime} from '../lib/runtime.mjs';

// Vercel function for the page, /api/catalogue, /healthz, robots.txt and sitemap.xml. The bundled catalogue is served
// immediately; the Sheet check continues after the response through waitUntil.
let runtime;
export default async function handler(req, res) {
  try {
    runtime ||= createRuntime({root: process.cwd(), runtime: 'vercel'}).catch(error => { runtime = null; throw error; });
    const app = await runtime;
    app.prepare(waitUntil);
    return app.handler(req, res);
  } catch (error) {
    console.error('Start-up failed:', error.message);
    res.writeHead(503, {'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex'});
    res.end('The collection is temporarily unavailable. Please try again shortly.');
  }
}
