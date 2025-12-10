# Deployment Guide - Wahat Alrajaa Tour

This guide explains how to build and deploy the Wahat Alrajaa Tour management system.

## Prerequisites

- Node.js (v18 or higher)
- npm (v9 or higher)

## 1. Build for Production

To create a production-ready build, run the following command in the `client` directory:

```bash
cd client
npm run build
```

This will create a `dist` folder containing the compiled assets (HTML, CSS, JS).

## 2. Preview the Build

To test the production build locally before deploying:

```bash
npm run preview
```

This will start a local server (usually at `http://localhost:4173`) serving the `dist` folder.

## 3. Deployment Options

Since this is a **Static Single Page Application (SPA)** built with Vite, you can deploy it to any static hosting provider.

### Option A: Vercel (Recommended)

1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` in the `client` directory.
3. Follow the prompts (accept defaults).
4. **Output Directory**: Ensure it is set to `dist`.

### Option B: Netlify

1. Drag and drop the `dist` folder to the Netlify dashboard.
2. OR connect your GitHub repository and set:
   - **Build Command**: `npm run build`
   - **Publish Directory**: `dist`

### Option C: Apache/Nginx (Traditional Server)

1. Upload the contents of the `dist` folder to your server's public root (e.g., `/var/www/html`).
2. **Important**: Configure your server to redirect all 404s to `index.html` to support client-side routing.

**Nginx Example:**
```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

## 4. Environment Variables

Currently, the application uses `localStorage` for data persistence, so no backend database is required.
If you connect a real backend later, create a `.env` file in the root:

```env
VITE_API_URL=https://api.yourdomain.com
```

## 5. Troubleshooting

- **White Screen on Refresh**: Ensure your server redirects 404s to `index.html`.
- **Images not loading**: Check that assets are in the `public` folder and referenced correctly (e.g., `/logo.png`).
