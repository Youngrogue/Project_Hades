import fs from 'node:fs/promises';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {pageHtml} from './page.mjs';
import {siteEnvironment} from './environment.mjs';
// A read-only site: every route is GET/HEAD. `site` comes from lib/environment.mjs.
export function createHandler({root,store,site=siteEnvironment()}){
const {origin,correctionUrl,siteName}=site;
const assets=new Map([['/styles.css','text/css'],['/app.mjs','text/javascript'],['/shared.mjs','text/javascript'],['/theme.js','text/javascript'],['/taxonomy-icons.mjs','text/javascript'],['/favicon.svg','image/svg+xml'],['/favicon.ico','image/x-icon'],['/apple-touch-icon.png','image/png'],
 ['/icons/icon-192.png','image/png'],['/icons/icon-512.png','image/png'],['/icons/favicon-16.png','image/png'],['/icons/favicon-32.png','image/png'],['/icons/favicon-48.png','image/png'],
 ['/brand/hades-mark.svg','image/svg+xml'],['/brand/hades-logo-light.svg','image/svg+xml'],['/brand/hades-logo-dark.svg','image/svg+xml'],['/brand/hades-wordmark-light.svg','image/svg+xml'],['/brand/hades-wordmark-dark.svg','image/svg+xml'],['/brand/LICENSE.txt','text/plain'],['/brand/Gelasio-OFL.txt','text/plain'],
 ['/fonts/overpass-latin-wght.woff2','font/woff2'],['/fonts/overpass-mono-latin-wght.woff2','font/woff2'],['/fonts/LICENSE.txt','text/plain']]);
// Coherent releases: scripts, styles and brand/icon files are mutable, so browsers must revalidate them on every
// load (no-cache + a content-hash ETag answers 304 when unchanged). That covers the whole module graph, including
// modules imported by relative URL, which a query-string version on the entry script alone would not reach.
// Fonts keep long immutable caching (their files never change in place). `release` is a hash of every public asset,
// appended to top-level URLs and icon links so favicon caches, which ignore revalidation in some browsers, also update.
const hashOf=buffer=>createHash('sha256').update(buffer).digest('hex');
const release=hashOf([...assets.keys()].sort().map(p=>{try{return hashOf(readFileSync(path.join(root,'public',p.slice(1))));}catch{return '';}}).join()).slice(0,10);
return async(req,res)=>{
 try{
  const url=new URL(req.url,'http://localhost');
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');
  res.setHeader('Content-Security-Policy',"default-src 'self'; img-src 'self' https: data:; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{'Allow':'GET, HEAD'});return res.end();}
  // Only the canonical production host is indexable; prelaunch and Preview deployments never are, whichever
  // catalogue (Sheet or bundled fallback) is being served.
  const host=String(req.headers.host||'');
  const indexable=site.indexable(host);
  if(!indexable)res.setHeader('X-Robots-Tag','noindex, nofollow');
  function send(status,type,body,cache='no-store'){
    res.writeHead(status,{'Content-Type':/^(text\/|application\/(json|xml))|svg/.test(type)?type+'; charset=utf-8':type,'Cache-Control':cache});res.end(req.method==='HEAD'?'':body);
  }
  if(assets.has(url.pathname)){
   const body=await fs.readFile(path.join(root,'public',url.pathname.slice(1)));
   if(url.pathname.startsWith('/fonts/'))return send(200,assets.get(url.pathname),body,'public, max-age=31536000, immutable');
   const etag=`"${hashOf(body).slice(0,24)}"`;
   res.setHeader('ETag',etag);
   if(req.headers['if-none-match']===etag){res.writeHead(304,{'Cache-Control':'no-cache'});return res.end();}
   return send(200,assets.get(url.pathname),body,'no-cache');
  }
  // Public health check: availability and which catalogue is live, never error messages (those stay in the server log).
  if(url.pathname==='/healthz')return send(200,'application/json',JSON.stringify({available:true,source:store.status.source,lastSheetSuccess:store.status.lastSuccess,sheetOk:!store.status.error}));
  if(url.pathname==='/robots.txt')return send(200,'text/plain',indexable?`User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`:'User-agent: *\nDisallow: /\n');
  if(url.pathname==='/sitemap.xml'&&indexable)return send(200,'application/xml',`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${origin.replaceAll('&','&amp;')}/</loc></url></urlset>`);
  if(!['/','/api/catalogue'].includes(url.pathname))return send(404,'text/plain','Page not found');
  const data=store.getPublic();
  if(url.pathname==='/api/catalogue')return send(200,'application/json',JSON.stringify(data));
  const state={category:url.searchParams.get('category')||'',subcategory:url.searchParams.get('subcategory')||'',q:url.searchParams.get('q')||''};
  return send(200,'text/html',pageHtml(data,{siteName,origin,correctionUrl,indexable,state,release,collectAnalytics:site.collectAnalytics(host)}));
 }catch(error){console.error('Request failed:',error.message);res.writeHead(500);res.end('Unable to load the collection. Please try again.');}
};
}
