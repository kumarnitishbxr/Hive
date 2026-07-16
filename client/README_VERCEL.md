# Deploying StartupOps Frontend to Vercel

This guide outlines the settings and steps required to deploy the StartupOps React/Vite frontend client on [Vercel](https://vercel.com).

## 1. Create a Project on Vercel

1. Log in to the Vercel dashboard and click **Add New** > **Project**.
2. Import your GitHub/GitLab repository.
3. Configure the following project settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

## 2. Configure Environment Variables

Add the following variables in the **Environment Variables** section of the project configuration:

| Key | Example Value | Description |
|---|---|---|
| `VITE_API_URL` | `https://startupops-api.onrender.com/api` | The base URL to your deployed Render backend API |
| `VITE_SOCKET_URL` | `https://startupops-api.onrender.com` | The base domain URL to your deployed Render backend for WebSocket real-time connections |

## 3. Client-Side Routing Redirects (SPA)

The project includes a `vercel.json` configuration file at the root of the `client` directory:
```json
{
  "cleanUrls": true,
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```
This configuration is automatically picked up by Vercel and guarantees that client-side page transitions (e.g. `/chat`, `/team`) reload correctly without triggering a `404 Not Found` response.
