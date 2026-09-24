/* Entry for leo/js/vendor/video-kit.js — the only bundled file in the site.
 * The pages have no build step, so the two browser libraries the video page needs
 * are bundled once and committed. Rebuild with:  npm run vendor
 */
export { upload } from '@vercel/blob/client';
export { default as qrcode } from 'qrcode-generator';
