# Deploying CP Leaderboard on Render

Single web service on Render + Google Apps Script for scheduled rating updates.

## Architecture

```text
Render (Web Service)          Google Apps Script
┌─────────────────────┐       ┌──────────────────────┐
│ Express API          │  ←──  │ Time-driven trigger   │
│ + React static files │       │ POST /api/update/trigger
│ + MongoDB connection │       │ every 12 hours        │
└─────────────────────┘       └──────────────────────┘
```

No Render cron job needed — Google Apps Script calls the update endpoint for free.

## Prerequisites

1. **GitHub repo** pushed to `main`
2. **MongoDB Atlas** free M0 cluster at [cloud.mongodb.com](https://cloud.mongodb.com)
   - Create a database user
   - Network access: whitelist `0.0.0.0/0` (Render uses dynamic IPs)
   - Copy connection string: `mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/cp-leaderboard`
3. **Render account** at [render.com](https://render.com)
4. **Google account** for Apps Script (any Gmail works)

## Step 1: Create the Web Service

1. Render Dashboard → **New** → **Web Service**
2. **Connect** your GitHub repo, select `main` branch
3. Configure:

| Setting | Value |
|---------|-------|
| **Name** | `cp-leaderboard` |
| **Runtime** | Node |
| **Build Command** | `pnpm run build:prod` |
| **Start Command** | `pnpm start` |
| **Auto-Deploy** | No |
| **Health Check Path** | `/api/health` |

4. Add environment variables:

| Key | Value | How to generate |
|-----|-------|-----------------|
| `NODE_ENV` | `production` | Literal |
| `MONGODB_URI` | `mongodb+srv://...` | From Atlas dashboard |
| `CRON_SECRET` | Random 64-char hex | `openssl rand -hex 32` |
| `BOOTSTRAP_SECRET` | Random 64-char hex | `openssl rand -hex 32` |

5. Click **Create Web Service**

Wait for the first build to complete. Verify with:
```bash
curl https://cp-leaderboard.onrender.com/api/health
```

## Step 2: Bootstrap Admin Credentials

Run once after first deploy:

```bash
curl -X POST https://cp-leaderboard.onrender.com/api/admin/bootstrap \
  -H "Content-Type: application/json" \
  -H "X-Bootstrap-Secret: YOUR_BOOTSTRAP_SECRET" \
  -d '{"username": "admin", "password": "your-secure-password"}'
```

Requirements: username >= 3 chars, password >= 8 chars, no colons. Only works when no admins exist.

## Step 3: Set Up Google Apps Script Cron

This replaces Render's paid cron job. Google Apps Script runs for free.

### Create the script

1. Go to [script.google.com](https://script.google.com)
2. Click **New project**
3. Name it `CP Leaderboard Updater`
4. Replace the contents of `Code.gs` with:

```javascript
function triggerRatingUpdate() {
  var url = "https://cp-leaderboard.onrender.com/api/update/trigger";
  var secret = "YOUR_CRON_SECRET_HERE";

  var options = {
    method: "post",
    headers: {
      "X-Cron-Secret": secret,
      "Content-Type": "application/json"
    },
    muteHttpExceptions: true
  };

  try {
    var response = UrlFetchApp.fetch(url, options);
    var code = response.getResponseCode();
    var body = response.getContentText();
    Logger.log("Status: " + code + " | Response: " + body);
  } catch (e) {
    Logger.log("Error: " + e.message);
  }
}
```

5. Replace `YOUR_CRON_SECRET_HERE` with the `CRON_SECRET` value from Render
6. Replace the URL if your service has a different name
7. Click **Save**

### Test it

1. Select `triggerRatingUpdate` from the function dropdown
2. Click **Run**
3. First run will ask for permissions — click **Review Permissions** → **Allow**
4. Check **Execution log** — should show `Status: 200`

### Set the schedule

1. Left sidebar → **Triggers** (clock icon)
2. Click **+ Add Trigger**
3. Configure:

| Setting | Value |
|---------|-------|
| **Function** | `triggerRatingUpdate` |
| **Event source** | Time-driven |
| **Type of time-based trigger** | Hour timer |
| **Hour interval** | Every 12 hours |

4. Click **Save**

The script will now POST to your update endpoint every 12 hours. Google Apps Script has a generous free quota (90 min/day execution time) — this uses < 1 second per run.

### Optional: Keep-alive ping

Render free tier sleeps after 15 minutes of inactivity. Add a keep-alive to prevent cold starts:

```javascript
function keepAlive() {
  try {
    var response = UrlFetchApp.fetch(
      "https://cp-leaderboard.onrender.com/api/health",
      { muteHttpExceptions: true }
    );
    Logger.log("Ping: " + response.getResponseCode());
  } catch (e) {
    Logger.log("Ping failed: " + e.message);
  }
}
```

Add a trigger for `keepAlive` → Time-driven → **Every 10 minutes** to keep the service warm.

## Step 4: Deploy Updates

Auto-deploy is off. To deploy new code:

### From Render dashboard
1. Go to your service → **Manual Deploy** → **Deploy latest commit**

### From CLI (optional)
Use the Render API with a deploy hook:
1. Service **Settings** → **Build & Deploy** → copy **Deploy Hook URL**
2. Trigger with:
```bash
curl -X POST "https://api.render.com/deploy/srv-xxxxx?key=xxxxx"
```

You can add this to a GitHub Action on `main` push if you want CI-gated auto-deploy later.

## Step 5: Add Users

Via the web UI at `https://cp-leaderboard.onrender.com/add-user`, or via API:

```bash
curl -X POST https://cp-leaderboard.onrender.com/api/users \
  -H "Content-Type: application/json" \
  -u "admin:your-secure-password" \
  -d '{
    "name": "tourist",
    "handles": {
      "codeforces": "tourist",
      "atcoder": "tourist",
      "leetcode": "tourist",
      "codechef": "tourist"
    }
  }'
```

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | Yes | `development` | Set to `production` |
| `MONGODB_URI` | Yes | — | MongoDB Atlas connection string |
| `CRON_SECRET` | Yes | — | Authenticates the update trigger endpoint |
| `BOOTSTRAP_SECRET` | Yes | — | One-time admin bootstrap |
| `PORT` | No | `3000` | Render sets this automatically |
| `REDIS_URL` | No | — | Optional distributed rate limiting |
| `TRUST_PROXY` | No | `true` in prod | Use `1` for Render's proxy |

## Monitoring

```bash
# Health check
curl https://cp-leaderboard.onrender.com/api/health

# Last update status
curl https://cp-leaderboard.onrender.com/api/update/status

# Leaderboard
curl https://cp-leaderboard.onrender.com/api/leaderboard
```

Google Apps Script logs: [script.google.com](https://script.google.com) → your project → **Executions** (left sidebar)

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Build fails | Ensure `pnpm-lock.yaml` is committed. Render uses `--frozen-lockfile` |
| App crashes on start | Check `MONGODB_URI` is correct. Atlas must allow `0.0.0.0/0` |
| Google Script 401 | `CRON_SECRET` in script doesn't match Render env var |
| Google Script timeout | Render sleeping — add the `keepAlive` ping trigger |
| Update already running | Previous update still in progress. Wait or use `?force=true` |
| Rate limit errors | Set `TRUST_PROXY=1` explicitly in Render env vars |
