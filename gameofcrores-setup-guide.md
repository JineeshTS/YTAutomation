# GameofCrores Automated YouTube Shorts - Complete Setup Guide

## Overview
This guide will help you set up a fully automated system that generates and publishes 5 daily YouTube Shorts videos about Indian stock markets.

**Daily Schedule:**
- 6 AM: Market opening preview
- 11 AM: Mid-day market update
- 3 PM: Market closing summary
- 6 PM: Global markets + impact on India
- 9 PM: Next day preview + top business news

**Tech Stack:**
- n8n (workflow orchestration)
- Claude API (content generation)
- ElevenLabs (text-to-speech)
- Remotion (video rendering)
- YouTube Data API v3 (uploading)
- News/Stock APIs (data sources)

---

## PART 1: VPS Setup & Dependencies

### 1.1 Check Your VPS Specs
First, verify your Hostinger VPS can handle video rendering:

```bash
# Check CPU cores
nproc

# Check RAM
free -h

# Check disk space
df -h
```

**Minimum Requirements:**
- 4 CPU cores
- 8GB RAM
- 50GB free disk space

If you have less, you may need to upgrade or use cloud rendering services.

### 1.2 Update System
```bash
sudo apt update && sudo apt upgrade -y
```

### 1.3 Install Node.js (v20.x)
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node --version  # Should show v20.x
npm --version
```

### 1.4 Install FFmpeg
```bash
sudo apt install -y ffmpeg
ffmpeg -version
```

### 1.5 Install Required System Libraries
```bash
sudo apt install -y \
  libvips-dev \
  libcairo2-dev \
  libpango1.0-dev \
  libjpeg-dev \
  libgif-dev \
  librsvg2-dev \
  python3-pip
```

### 1.6 Install PM2 (Process Manager)
```bash
sudo npm install -g pm2
pm2 startup  # Follow the instructions it gives you
```

---

## PART 2: Project Setup

### 2.1 Create Project Directory
```bash
cd /home
sudo mkdir -p gameofcrores
sudo chown -R $USER:$USER gameofcrores
cd gameofcrores
```

### 2.2 Initialize Node.js Project
```bash
npm init -y
```

### 2.3 Install Dependencies
```bash
npm install \
  @remotion/cli@4.0.82 \
  @remotion/renderer@4.0.82 \
  remotion@4.0.82 \
  react@18.2.0 \
  react-dom@18.2.0 \
  axios \
  dotenv \
  google-auth-library \
  googleapis \
  elevenlabs-node \
  date-fns \
  date-fns-tz
```

### 2.4 Create Project Structure
```bash
mkdir -p src/{remotion,scripts,templates}
mkdir -p data/{videos,audio,thumbnails}
mkdir -p logs
```

Your directory should look like:
```
/home/gameofcrores/
├── src/
│   ├── remotion/         # Video templates
│   ├── scripts/          # Automation scripts
│   └── templates/        # Content templates
├── data/
│   ├── videos/          # Generated videos
│   ├── audio/           # Generated audio
│   └── thumbnails/      # Video thumbnails
├── logs/                # Application logs
├── package.json
└── .env                 # Environment variables
```

---

## PART 3: API Keys & Credentials Setup

### 3.1 Create .env File
```bash
nano .env
```

Add this content (you'll fill in values later):
```env
# Claude API
ANTHROPIC_API_KEY=your_claude_api_key_here

# ElevenLabs API
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
ELEVENLABS_VOICE_ID=your_chosen_voice_id

# YouTube API
YOUTUBE_CLIENT_ID=your_youtube_client_id
YOUTUBE_CLIENT_SECRET=your_youtube_client_secret
YOUTUBE_REFRESH_TOKEN=your_youtube_refresh_token

# News API (Optional - Free tier available)
NEWS_API_KEY=your_newsapi_key

# Alpha Vantage (Free stock data)
ALPHA_VANTAGE_KEY=your_alphavantage_key

# Timezone
TZ=Asia/Kolkata

# Video Settings
VIDEO_WIDTH=1080
VIDEO_HEIGHT=1920
VIDEO_FPS=30
```

Save and exit (Ctrl+X, Y, Enter)

### 3.2 Get API Keys

#### A. Claude API Key
1. Go to https://console.anthropic.com
2. Create account / Login
3. Go to API Keys section
4. Create new key
5. Copy and paste into .env

**Cost estimate:** ~$5-10/month for 5 videos daily

#### B. ElevenLabs API Key
1. Go to https://elevenlabs.io
2. Sign up (free tier: 10,000 characters/month - enough for testing)
3. Go to Profile Settings → API Keys
4. Copy your API key
5. Browse voices at https://elevenlabs.io/voice-library
6. Choose a professional English voice, copy the Voice ID
7. Paste both into .env

**Cost estimate:** Free tier for testing, ~$22/month for 30,000 chars (enough for 150 videos)

#### C. YouTube API Setup (Most Complex)

**Step 1: Create Google Cloud Project**
1. Go to https://console.cloud.google.com
2. Create new project "GameofCrores"
3. Enable YouTube Data API v3:
   - Go to APIs & Services → Library
   - Search "YouTube Data API v3"
   - Click Enable

**Step 2: Create OAuth Credentials**
1. Go to APIs & Services → Credentials
2. Click "Create Credentials" → "OAuth client ID"
3. If prompted, configure OAuth consent screen:
   - User Type: External
   - App name: GameofCrores
   - User support email: your email
   - Developer contact: your email
   - Add scope: `https://www.googleapis.com/auth/youtube.upload`
   - Add test user: your Gmail account
   - Save
4. Back to Create OAuth client ID:
   - Application type: Web application
   - Name: GameofCrores Upload
   - Authorized redirect URIs: `http://localhost:3000/oauth2callback`
   - Create
5. Download JSON (keep this safe!)
6. Copy Client ID and Client Secret to .env

**Step 3: Get Refresh Token** (We'll do this after scripts are ready)

#### D. News API (Free)
1. Go to https://newsapi.org
2. Sign up for free tier
3. Copy API key to .env

**Free tier:** 100 requests/day (more than enough)

#### E. Alpha Vantage (Free Stock Data)
1. Go to https://www.alphavantage.co/support/#api-key
2. Get free API key
3. Copy to .env

**Free tier:** 25 requests/day (perfect for 5 videos)

---

## PART 4: Video Generation Code

I'll now create all the necessary code files.

---

## PART 5: File Upload & Setup

### 5.1 Upload All Files to VPS

You need to upload these files to your Hostinger VPS:

**Method 1: Using SCP (from your local machine)**
```bash
# Upload package.json
scp package.json user@your-vps-ip:/home/gameofcrores/

# Upload all source files
scp -r src user@your-vps-ip:/home/gameofcrores/

# Upload config files
scp remotion.config.ts user@your-vps-ip:/home/gameofcrores/
scp .env user@your-vps-ip:/home/gameofcrores/
```

**Method 2: Using SFTP (FileZilla, WinSCP, etc.)**
1. Connect to your VPS via SFTP
2. Navigate to `/home/gameofcrores/`
3. Upload all files maintaining the directory structure

**Method 3: Clone from GitHub (Recommended)**
1. Create a private GitHub repo
2. Upload all files to the repo
3. On VPS, clone: `git clone https://github.com/yourusername/gameofcrores.git`

### 5.2 Install Dependencies

SSH into your VPS and run:

```bash
cd /home/gameofcrores
npm install
```

This will take 5-10 minutes.

### 5.3 Set Up YouTube Authentication

This is the trickiest part. Follow carefully:

```bash
cd /home/gameofcrores
npm run auth:youtube
```

**Important Notes:**
- This opens a browser window for Google login
- If on headless server, you'll need to:
  1. Copy the URL from terminal
  2. Open it on your local machine
  3. Complete authentication
  4. Copy the refresh token back

**Alternative Method (Easier for VPS):**
1. Run the auth script on your local machine first
2. Get the refresh token
3. Add it to .env on VPS

Once you have the refresh token, verify .env contains:
```env
YOUTUBE_REFRESH_TOKEN=your_actual_refresh_token_here
```

---

## PART 6: Testing Everything

### 6.1 Run System Tests

```bash
cd /home/gameofcrores
chmod +x test-system.sh
./test-system.sh
```

This will verify:
- ✓ Node.js installed
- ✓ FFmpeg installed
- ✓ All API keys configured
- ✓ Dependencies installed
- ✓ Directory structure correct
- ✓ Disk space sufficient
- ✓ RAM adequate

Fix any issues before proceeding.

### 6.2 Test Content Generation

Test if Claude API works:

```bash
npm run test:content
```

**Expected output:**
```json
{
  "title": "Market Opening Preview",
  "subtitle": "What to watch today",
  "content": [
    "Point 1",
    "Point 2",
    "Point 3"
  ],
  "voiceover_script": "Full script...",
  "type": "market_open"
}
```

### 6.3 Test Audio Generation

Test if ElevenLabs works:

```bash
npm run test:audio
```

Check if `data/audio/test.mp3` was created.

### 6.4 Create First Test Video

**WARNING:** This will take 10-15 minutes and consume:
- ~$0.10 in Claude API credits
- ~300 characters from ElevenLabs
- CPU will spike to 100%

```bash
npm run create:market_open
```

**What happens:**
1. Fetches market data and news
2. Generates script with Claude (~30 seconds)
3. Generates audio with ElevenLabs (~20 seconds)
4. Renders video with Remotion (~10 minutes)
5. Uploads to YouTube (~2 minutes)

**Monitor progress:**
```bash
# In another terminal
tail -f logs/*.log
```

**Success looks like:**
```
=== VIDEO CREATION COMPLETE ===
Video URL: https://www.youtube.com/watch?v=xxxxx
Files saved to: /home/gameofcrores/data/
```

**Go check your YouTube channel!**

### 6.5 Verify Video Quality

Check your uploaded video:
1. Video is 60 seconds (or close)
2. Audio syncs with visuals
3. Text is readable
4. Professional appearance
5. Title and description are good

If issues:
- **Audio too fast/slow:** Adjust voiceover_script length in generateContent.js
- **Video too long/short:** Adjust duration calculations in renderVideo.js
- **Low quality:** Check your VPS can handle rendering (see troubleshooting)

---

## PART 7: Setting Up n8n Automation

### 7.1 Import Workflow to n8n

1. Open your n8n instance (usually at `http://your-vps-ip:5678`)
2. Click "Workflows" in sidebar
3. Click "+ Add workflow"
4. Click the "..." menu (top right)
5. Select "Import from File"
6. Upload `n8n-workflow.json`

### 7.2 Verify Workflow Settings

The workflow has 5 scheduled triggers:
- 6 AM: Market Opening Preview
- 11 AM: Midday Update
- 3 PM: Market Closing Summary
- 6 PM: Global Markets Impact
- 9 PM: Tomorrow's Preview

**Check timezone:**
- Click "Settings" in workflow
- Verify timezone is set to "Asia/Kolkata"

### 7.3 Test Workflow Manually

Before activating:

1. Click on "Schedule - Market Open (6 AM)" node
2. Click "Execute Node" at bottom
3. Watch the execution flow
4. Check logs: `tail -f /home/gameofcrores/logs/*.log`

If successful, you'll see video uploaded to YouTube.

### 7.4 Activate Workflow

Once manual test succeeds:

1. Click "Active" toggle (top right) to turn it ON
2. Workflow will now run automatically at scheduled times

**Verify it's active:**
```bash
# Check n8n executions
# Or just wait for next scheduled time and check YouTube
```

---

## PART 8: Monitoring & Maintenance

### 8.1 Check Logs Daily

```bash
# View latest logs
cd /home/gameofcrores/logs
ls -lt | head -10

# Check specific log
tail -100 market_open-20260121-060000.log
```

### 8.2 Monitor Disk Space

Videos accumulate quickly (each is ~50-100MB):

```bash
# Check disk usage
du -sh /home/gameofcrores/data/videos/

# Clean old videos (keep last 30 days)
find /home/gameofcrores/data/videos/ -name "*.mp4" -mtime +30 -delete
```

**Set up auto-cleanup (cron):**
```bash
crontab -e
```

Add:
```cron
# Clean old videos daily at 2 AM
0 2 * * * find /home/gameofcrores/data/videos/ -name "*.mp4" -mtime +30 -delete
0 2 * * * find /home/gameofcrores/data/audio/ -name "*.mp3" -mtime +30 -delete
```

### 8.3 Monitor API Usage

**Claude API:**
- Check usage at https://console.anthropic.com
- ~150 requests/month = ~$15-30/month

**ElevenLabs:**
- Check at https://elevenlabs.io
- ~7,500 chars/month for 150 videos
- Free tier or $22/month plan

**YouTube API:**
- Quota is 10,000 units/day
- Each upload = 1,600 units
- 5 videos/day = 8,000 units (safe)

### 8.4 Backup Strategy

```bash
# Backup config and logs weekly
tar -czf backup-$(date +%Y%m%d).tar.gz \
  .env \
  logs/ \
  data/script*.json

# Store backups
mv backup-*.tar.gz ~/backups/
```

---

## PART 9: Troubleshooting

### 9.1 Video Rendering Too Slow

**Problem:** Rendering takes 20+ minutes

**Solutions:**
1. Check CPU usage: `htop`
2. If VPS is too slow, use cloud rendering:
   - Option A: Creatomate API (~$0.10/video)
   - Option B: Upgrade VPS to 8+ CPU cores

**Quick fix:** Reduce video quality in remotion.config.ts:
```javascript
Config.setConcurrency(1); // Lower from 2
```

### 9.2 Out of Memory During Render

**Problem:** Video rendering crashes with "Out of memory"

**Solutions:**
```bash
# Check available RAM
free -h

# If <4GB available, add swap:
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Make permanent:
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### 9.3 YouTube Upload Fails

**Problem:** "Invalid credentials" or "Token expired"

**Solution:**
```bash
# Re-generate refresh token
cd /home/gameofcrores
npm run auth:youtube

# Update .env with new token
nano .env
```

### 9.4 Audio/Video Out of Sync

**Problem:** Voice doesn't match visuals

**Cause:** Audio duration calculation is off

**Solution:** Edit `src/scripts/generateAudio.js`:
```javascript
// Line ~40, try this instead:
const durationInSeconds = (fileSizeInBytes * 8) / bitrate + 1; // Add 1 second buffer
```

### 9.5 Market Data API Fails

**Problem:** "Failed to fetch market data"

**Solutions:**
1. Check Alpha Vantage limits (25/day on free tier)
2. If limit hit, wait 24 hours or upgrade
3. Alternative: Use Yahoo Finance API (requires different code)

### 9.6 News API Returns No Data

**Problem:** No news articles fetched

**Solutions:**
1. Check NewsAPI limits (100/day on free tier)
2. Verify API key is correct
3. Try different category: `business` vs `general`

### 9.7 n8n Workflow Not Triggering

**Problem:** Videos not being created automatically

**Debug steps:**
```bash
# Check n8n is running
pm2 list

# Check n8n logs
pm2 logs n8n

# Verify workflow is active in n8n UI

# Check system time is correct
date
# Should show Asia/Kolkata timezone
```

### 9.8 Video Quality Issues

**Problem:** Text is blurry or colors are off

**Solutions:**
- Increase video resolution in .env:
  ```env
  VIDEO_WIDTH=1080
  VIDEO_HEIGHT=1920
  ```
- Adjust font sizes in NewsShort.tsx
- Test render quality: `npm run create:market_open`

---

## PART 10: Optimization & Scaling

### 10.1 Speed Up Video Rendering

**Option 1: Parallel Processing**
Modify renderVideo.js to use more CPU cores:
```javascript
concurrency: 4, // Increase if you have 8+ cores
```

**Option 2: GPU Acceleration**
If VPS has GPU, enable hardware acceleration in remotion.config.ts

**Option 3: Pre-render Templates**
Cache bundled Remotion project (advanced)

### 10.2 Reduce API Costs

**Claude API:**
- Use shorter prompts
- Cache market data between videos
- Use sonnet-3.5 instead of opus-3 (cheaper)

**ElevenLabs:**
- Use shorter scripts (aim for 45-50 seconds)
- Switch to cheaper voice model
- Consider alternative TTS (Google Cloud TTS)

### 10.3 Add More Videos

Want 10 videos/day instead of 5?

1. Create new video types in generateContent.js
2. Add new scheduled triggers in n8n
3. Adjust YouTube API quota usage

### 10.4 Multi-Language Support

Add Hindi videos:

1. Modify generateContent.js prompts to output Hindi
2. Get Hindi voice from ElevenLabs
3. Update ELEVENLABS_VOICE_ID in .env
4. Create separate workflow for Hindi videos

---

## PART 11: Going Live - Final Checklist

Before fully activating automation:

### Pre-Launch Checklist

- [ ] All API keys working and verified
- [ ] Test video successfully created and uploaded
- [ ] Video quality meets your standards
- [ ] YouTube channel properly branded
- [ ] n8n workflow imported and tested
- [ ] Logs directory set up and monitored
- [ ] Disk cleanup cron job configured
- [ ] Backup strategy in place
- [ ] All scheduled times correct for Asia/Kolkata
- [ ] Emergency stop procedure understood

### Launch Day

1. **6 AM:** Monitor first video (market_open)
2. Check logs immediately after: `tail -f logs/*.log`
3. Verify YouTube upload successful
4. Watch video to ensure quality
5. If successful, let automated continue

### First Week

- Check YouTube uploads daily
- Monitor logs for errors
- Track API usage/costs
- Note any quality issues
- Adjust timings if needed

### Ongoing

- Weekly log review
- Monthly API cost check
- Quarterly content refresh (update prompts)
- As-needed VPS upgrades

---

## PART 12: Quick Reference Commands

### Daily Operations

```bash
# Check system status
cd /home/gameofcrores && ./test-system.sh

# View latest logs
tail -f logs/*.log

# Manually create video
npm run create:market_open

# Check disk usage
du -sh data/videos/

# Restart n8n
pm2 restart n8n
```

### Emergency Commands

```bash
# Stop all video generation
pm2 stop n8n

# Kill stuck render process
pkill -f remotion

# Clear all cached data
rm -rf data/videos/* data/audio/*

# Reset and restart
pm2 restart n8n
```

### Useful npm Scripts

```bash
npm run auth:youtube        # Re-authenticate YouTube
npm run create:market_open  # Test market open video
npm run create:midday       # Test midday video
npm run create:market_close # Test market close video
npm run create:global       # Test global video
npm run create:preview      # Test preview video
npm run test:content        # Test content generation only
npm run test:audio          # Test audio generation only
```

---

## PART 13: Support & Resources

### Documentation

- **Remotion:** https://www.remotion.dev/docs
- **n8n:** https://docs.n8n.io
- **Claude API:** https://docs.anthropic.com
- **ElevenLabs:** https://elevenlabs.io/docs
- **YouTube API:** https://developers.google.com/youtube/v3

### Common Issues Forum

Google: "Remotion video rendering slow"
Google: "YouTube API quota exceeded"
Google: "n8n workflow not triggering"

### Getting Help

If stuck:
1. Check logs first: `tail -100 logs/*.log`
2. Run test script: `./test-system.sh`
3. Test each component individually
4. Check API status pages
5. Review error messages carefully

---

## APPENDIX A: File Structure Reference

```
/home/gameofcrores/
├── src/
│   ├── remotion/
│   │   ├── Root.tsx              # Remotion entry point
│   │   └── NewsShort.tsx         # Video template
│   └── scripts/
│       ├── generateContent.js    # Content generator
│       ├── generateAudio.js      # Audio generator
│       ├── renderVideo.js        # Video renderer
│       ├── uploadYouTube.js      # YouTube uploader
│       ├── createVideo.js        # Main orchestrator
│       └── youtubeAuth.js        # Auth helper
├── data/
│   ├── videos/                   # Generated videos
│   ├── audio/                    # Generated audio
│   └── script-*.json             # Generated scripts
├── logs/                         # Application logs
├── remotion.config.ts            # Remotion configuration
├── package.json                  # Dependencies
├── .env                          # API keys (KEEP SECRET!)
├── test-system.sh                # System test script
└── n8n-workflow.json             # n8n workflow import
```

---

## APPENDIX B: Cost Breakdown

### Monthly Costs (5 videos/day, 30 days = 150 videos)

**Infrastructure:**
- Hostinger VPS (8GB RAM, 4 CPU): $12-20/month
- n8n hosting (included in VPS): $0

**APIs:**
- Claude API: ~$15-30/month (150 requests)
- ElevenLabs: $22/month (30K characters)
- News API: Free (100 requests/day)
- Alpha Vantage: Free (25 requests/day)
- YouTube API: Free (quota sufficient)

**Total: ~$49-72/month**

**Per video cost: ~$0.33-0.48**

### Scaling Costs

**10 videos/day:**
- Infrastructure: +$10/month (need better VPS)
- APIs: Double (~$90-120/month)
- **Total: ~$100-130/month**

**Alternative: Cloud Rendering**
- Keep cheap VPS ($5/month)
- Use Creatomate for rendering ($0.10/video)
- **10 videos/day = ~$35/month total**

---

## APPENDIX C: Advanced Customization

### Change Video Style

Edit `src/remotion/NewsShort.tsx`:
- Adjust colors in `colorSchemes`
- Change fonts
- Modify animations
- Add logo/watermark

### Change Content Generation

Edit `src/scripts/generateContent.js`:
- Modify prompts for different tone
- Add more data sources
- Change content structure
- Adjust video timing

### Add Custom Data Sources

1. Find API (e.g., Coinbase for crypto)
2. Add to generateContent.js
3. Include in prompts
4. Test generation

### Create Custom Video Types

1. Define new type in generateContent.js
2. Add new schedule trigger in n8n
3. Update color scheme in NewsShort.tsx
4. Test and deploy

---

## CONGRATULATIONS!

You now have a fully automated YouTube Shorts generation system!

**Your videos will automatically:**
- ✅ Generate daily at scheduled times
- ✅ Fetch real market data and news
- ✅ Create professional scripts with AI
- ✅ Generate natural voiceovers
- ✅ Render high-quality videos
- ✅ Upload to YouTube with metadata

**Next steps:**
1. Monitor first week of automation
2. Optimize based on performance
3. Grow your audience
4. Scale to more videos/languages

**Good luck with GameofCrores! 🚀**
