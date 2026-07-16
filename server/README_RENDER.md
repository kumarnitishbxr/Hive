# Deploying StartupOps Backend to Render

This guide outlines the settings and parameters required to deploy the StartupOps backend API service on [Render](https://render.com).

## 1. Create a Web Service

1. Connect your GitHub/GitLab repository to Render.
2. Select your repository and choose **Web Service**.
3. Configure the following service settings:
   - **Name**: `startupops-api` (or any custom name)
   - **Runtime**: `Node`
   - **Region**: Select the region closest to your users / database
   - **Branch**: `main` (or your active release branch)
   - **Root Directory**: `server`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`

## 2. Environment Variables

Add the following environment variables in the Render dashboard under **Environment**:

| Key | Example Value | Description |
|---|---|---|
| `NODE_ENV` | `production` | Enables production optimizations |
| `PORT` | `10000` | (Optional) Render sets this automatically |
| `MONGODB_URI` | `mongodb+srv://...` | Connection URI to MongoDB Atlas database |
| `REDIS_URL` | `rediss://red-xxxxxxxx@...` | Render Redis Internal/External Connection URI (TLS starts with `rediss://`) |
| `JWT_SECRET` | `generate-a-secure-random-string-here` | Secret key to sign access JWTs |
| `JWT_REFRESH_SECRET` | `generate-another-secure-random-string-here` | Secret key to sign refresh JWTs |
| `JWT_EXPIRY` | `24h` | Expiration limit for access tokens |
| `CORS_ORIGINS` | `https://your-app.vercel.app` | Comma-separated client URLs allowed to access the API |
| `CLIENT_URL` | `https://your-app.vercel.app` | Base domain URL of the client dashboard |
| `GEMINI_API` | `AIzaSy...` | Google Gemini API Key for core AI features |
| `OPENAI_API_KEY` | `sk-...` | OpenAI API Key (if using GPT models) |
| `QDRANT_URL` | `https://...` | Connection URL for vector search index |
| `QDRANT_API_KEY` | `...` | API Key for secure Qdrant access |
| `CLOUDINARY_URL` | `cloudinary://...` | CDN storage configuration URL |
| `SMTP_HOST` | `smtp.sendgrid.net` | Email service SMTP server hostname |
| `SMTP_PORT` | `587` | Email service SMTP server port |
| `SMTP_USER` | `apikey` | Email service account/API username |
| `SMTP_PASS` | `...` | Email service password or API key |
| `SMTP_FROM` | `"StartupOps <no-reply@startupops.app>"` | Sender email address display |

## 3. Database & Cache Connection Handling

- **MongoDB**: Connects using `mongoose`. Ensure that database IP whitelisting in MongoDB Atlas allows access from Render (use `0.0.0.0/32` or similar configurations).
- **Redis & WebSockets**:
  - The Redis configuration checks if the `REDIS_URL` uses TLS (`rediss://`) and automatically bypasses self-signed certificate validation (`rejectUnauthorized: false`), ensuring seamless integration with Render Redis or Upstash.
