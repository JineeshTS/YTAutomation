# Google Veo 3 Integration Setup Guide

## 🎬 What You're Building

A complete automated video production system using:
- **Google Veo 3** - Creates stunning cinematic AI videos
- **Claude AI** - Generates scripts and video prompts
- **ElevenLabs** - Creates voiceovers
- **FFmpeg** - Combines video and audio
- **YouTube API** - Automatic uploads

---

## 📋 Prerequisites

You need:
1. Google Cloud account with Veo 3 API access
2. Service Account JSON key file
3. All previous API keys (Claude, ElevenLabs, YouTube, etc.)

---

## STEP 1: Google Cloud Setup

### A. Create/Select Project

1. Go to https://console.cloud.google.com
2. Create new project or select existing "GameofCrores" project
3. Note your **Project ID**

### B. Enable Required APIs

```bash
# Enable Vertex AI API
gcloud services enable aiplatform.googleapis.com

# Enable required services
gcloud services enable compute.googleapis.com
gcloud services enable storage.googleapis.com
```

Or in Console:
1. Go to "APIs & Services" → "Library"
2. Search and enable:
   - Vertex AI API
   - Cloud Storage API

### C. Create Service Account

1. Go to "IAM & Admin" → "Service Accounts"
2. Click "Create Service Account"
3. Name: `veo3-video-generator`
4. Grant roles:
   - Vertex AI User
   - Storage Object Admin (if using Cloud Storage)
5. Click "Done"

### D. Create Service Account Key

1. Click on the service account you just created
2. Go to "Keys" tab
3. Click "Add Key" → "Create new key"
4. Choose "JSON"
5. Download the JSON file
6. **Keep this file secure!**

---

## STEP 2: Upload Files to VPS

### Upload the new Veo 3 scripts:

```bash
# On your VPS
cd /home/gameofcrores

# Create directory for Google credentials
mkdir -p credentials

# Upload the 4 new script files:
# - generateVideoVeo3.js
# - generateContentVeo3.js
# - combineVideoAudio.js
# - createVideoVeo3.js
```

**Upload these 4 files to:** `/home/gameofcrores/src/scripts/`

---

## STEP 3: Upload Service Account Key

```bash
# Upload your service account JSON file to VPS
# Place it in: /home/gameofcrores/credentials/

# Example using SCP (from your computer):
scp service-account-key.json root@147.93.45.84:/home/gameofcrores/credentials/google-cloud-key.json

# Or upload via SFTP/FTP
```

**Important:** Keep this file secure and never commit to GitHub!

---

## STEP 4: Update .env File

```bash
cd /home/gameofcrores
nano .env
```

**Add these new lines:**

```env
# Google Cloud / Veo 3
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_LOCATION=us-central1
GOOGLE_APPLICATION_CREDENTIALS=/home/gameofcrores/credentials/google-cloud-key.json

# Existing keys (keep these)
ANTHROPIC_API_KEY=your_existing_key
ELEVENLABS_API_KEY=your_existing_key
ELEVENLABS_VOICE_ID=your_existing_voice_id
YOUTUBE_CLIENT_ID=your_existing_client_id
YOUTUBE_CLIENT_SECRET=your_existing_client_secret
YOUTUBE_REFRESH_TOKEN=your_existing_refresh_token
TZ=Asia/Kolkata
VIDEO_WIDTH=1080
VIDEO_HEIGHT=1920
VIDEO_FPS=30
```

**Replace `your-project-id` with your actual Google Cloud Project ID**

Save: Ctrl+X, Y, Enter

---

## STEP 5: Install Dependencies

```bash
cd /home/gameofcrores

# Install Google Cloud libraries
npm install @google-cloud/vertexai google-auth-library

# Install video processing (if not already installed)
npm install date-fns

# Verify FFmpeg is installed
ffmpeg -version
```

---

## STEP 6: Update package.json

Add new scripts to `package.json`:

```json
{
  "scripts": {
    "create:veo:animals": "node src/scripts/createVideoVeo3.js animals",
    "create:veo:space": "node src/scripts/createVideoVeo3.js space",
    "create:veo:ocean": "node src/scripts/createVideoVeo3.js ocean",
    "create:veo:science": "node src/scripts/createVideoVeo3.js science",
    "create:veo:history": "node src/scripts/createVideoVeo3.js history"
  }
}
```

---

## STEP 7: Test Veo 3 Integration

### Test 1: Verify Google Cloud Connection

```bash
cd /home/gameofcrores
node -e "
const { VertexAI } = require('@google-cloud/vertexai');
const vertexAI = new VertexAI({
  project: process.env.GOOGLE_CLOUD_PROJECT_ID,
  location: process.env.GOOGLE_CLOUD_LOCATION
});
console.log('✓ Google Cloud connected successfully');
console.log('Project:', process.env.GOOGLE_CLOUD_PROJECT_ID);
console.log('Location:', process.env.GOOGLE_CLOUD_LOCATION);
"
```

### Test 2: Generate Content

```bash
node src/scripts/generateContentVeo3.js animals
```

Should output a JSON with title, veo_prompt, and voiceover_script.

### Test 3: Create Complete Video (3-10 minutes)

```bash
npm run create:veo:animals
```

**This will:**
1. Generate script (30s)
2. Generate video with Veo 3 (3-10 minutes - SLOW!)
3. Generate voiceover (20s)
4. Combine video + audio (30s)
5. Upload to YouTube (2 min)

**Watch the progress in real-time!**

---

## STEP 8: Update Cron Jobs

Replace your old cron jobs with Veo 3 versions:

```bash
crontab -e
```

**Replace with:**

```bash
# Veo 3 Video Generation - 5 videos daily
# Each video takes 3-10 minutes to generate

# 6:00 AM - Animals
0 6 * * * cd /home/gameofcrores && npm run create:veo:animals >> /home/gameofcrores/logs/cron-veo-animals.log 2>&1

# 11:00 AM - Space
0 11 * * * cd /home/gameofcrores && npm run create:veo:space >> /home/gameofcrores/logs/cron-veo-space.log 2>&1

# 3:00 PM - Ocean
0 15 * * * cd /home/gameofcrores && npm run create:veo:ocean >> /home/gameofcrores/logs/cron-veo-ocean.log 2>&1

# 6:00 PM - Science
0 18 * * * cd /home/gameofcrores && npm run create:veo:science >> /home/gameofcrores/logs/cron-veo-science.log 2>&1

# 9:00 PM - History
0 21 * * * cd /home/gameofcrores && npm run create:veo:history >> /home/gameofcrores/logs/cron-veo-history.log 2>&1

# Cleanup (keep)
0 2 * * * find /home/gameofcrores/data/videos/ -name "*.mp4" -mtime +30 -delete
0 2 * * * find /home/gameofcrores/data/audio/ -name "*.mp3" -mtime +30 -delete
```

Save and exit.

---

## 📊 Cost Estimate

### Per Video:
- Veo 3: **Free** (if in Beta/Preview) or ~$0.10-0.50/video
- Claude API: ~₹5
- ElevenLabs: ~₹12
- YouTube API: Free
- **Total: ₹17-20 per video** (assuming Veo 3 free during preview)

### Monthly (150 videos):
- **₹2,550-3,000/month**

If Veo 3 becomes paid (~$0.30/video = ₹25):
- **₹6,300/month total**

**Still WAY cheaper than Runway (₹60,000/month)!**

---

## 🎯 Video Quality Comparison

| Method | Quality | Cost/Video | Time |
|--------|---------|------------|------|
| **Veo 3** | ⭐⭐⭐⭐⭐ | ₹17-45 | 3-10 min |
| Runway Gen-3 | ⭐⭐⭐⭐⭐ | ₹400-650 | 2-5 min |
| Luma AI | ⭐⭐⭐⭐ | ₹150-250 | 2-4 min |
| Remotion | ⭐⭐ | ₹2 | 3 min |

**Veo 3 = Best quality at reasonable cost!**

---

## 🔍 Troubleshooting

### Error: "Veo-3 model not found"

**Solution:** Veo 3 might not be available in your region yet.

Try:
1. Change location in .env to `us-central1` or `europe-west4`
2. Request access to Veo 3 preview program
3. Check Google Cloud Console for model availability

### Error: "Permission denied"

**Solution:** Service account needs proper roles.

```bash
# Grant roles
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:veo3-video-generator@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/aiplatform.user"
```

### Error: "Quota exceeded"

**Solution:** Veo 3 has usage quotas.

1. Check quota in Google Cloud Console
2. Request quota increase
3. Spread video generation throughout day

### Videos taking too long (>10 minutes)

**Normal!** Veo 3 can take 3-10 minutes per video depending on:
- Google's queue length
- Video complexity
- Time of day

**Tip:** Schedule videos with 15-minute gaps to avoid overlaps.

---

## 📋 Daily Monitoring

```bash
# Check if videos are being created
ls -lt /home/gameofcrores/data/videos/ | grep veo | head -5

# View Veo 3 logs
tail -50 /home/gameofcrores/logs/cron-veo-*.log

# Check for errors
grep -i error /home/gameofcrores/logs/cron-veo-*.log
```

---

## ✅ Success Checklist

- [ ] Google Cloud project created
- [ ] Vertex AI API enabled
- [ ] Service account created with correct roles
- [ ] Service account JSON key downloaded
- [ ] JSON key uploaded to VPS
- [ ] .env file updated with Google credentials
- [ ] Dependencies installed
- [ ] Test video created successfully
- [ ] Cron jobs updated
- [ ] First automated video published

---

## 🎉 You're Done!

Your system now creates **cinematic AI-generated videos** automatically!

Tomorrow morning at 6 AM, Veo 3 will generate your first automated video while you sleep!

**Watch your channel grow with stunning, professional content! 🚀**
