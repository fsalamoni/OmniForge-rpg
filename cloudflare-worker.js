/**
 * Cloudflare Worker — OmniForge proxy
 *
 * This worker sits on the protagonistarpg.com.br zone and proxies all
 * requests under the /omniforge path to the GitHub Pages deployment at
 * https://fsalamoni.github.io/OmniForge-rpg/
 *
 * Deploy instructions (see README.md for the full walkthrough):
 *   1. In Cloudflare Dashboard → Workers & Pages → Create Worker
 *   2. Paste this entire file into the editor
 *   3. Save and deploy
 *   4. Add a Worker Route:
 *        Route:   www.protagonistarpg.com.br/omniforge*
 *        Worker:  (select the worker you just created)
 */

const GITHUB_PAGES_ORIGIN = 'https://fsalamoni.github.io';
const PATH_PREFIX = '/omniforge';
const REPO_PATH = '/OmniForge-rpg';

export default {
  async fetch(request) {
    const url = new URL(request.url);

    // Only handle requests under /omniforge
    if (!url.pathname.startsWith('/omniforge')) {
      return new Response('Not found', { status: 404 });
    }

    // Strip /omniforge prefix and replace with /OmniForge-rpg (the GitHub Pages repo path)
    const pathWithoutPrefix = url.pathname.slice(PATH_PREFIX.length) || '/';
    const upstreamPath = REPO_PATH + pathWithoutPrefix;

    // Build the upstream URL on GitHub Pages
    const upstream = new URL(upstreamPath + url.search + url.hash, GITHUB_PAGES_ORIGIN);

    // Forward the request, propagating useful headers
    const upstreamRequest = new Request(upstream.toString(), {
      method: request.method,
      headers: request.headers,
      body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined,
      redirect: 'follow',
    });

    const response = await fetch(upstreamRequest);

    // Return the upstream response with the original status / headers
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  },
};
