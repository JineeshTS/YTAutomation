# Quick Troubleshooting Checklist

## 🔴 Video Not Being Created

```bash
# 1. Check if n8n is running
pm2 list

# 2. Check n8n logs
pm2 logs n8n

# 3. Verify workflow is active in n8n UI
# Go to n8n and check the "Active" toggle

# 4. Check system time/timezone
date
# Should show Asia/Kolkata time

# 5. Test manual creation
cd /home/gameofcrores
npm run create:market_open

# 6. Check logs
tail -50 logs/*.log
```

## 🟡 Video Creation Fails

```bash
# 1. Run system test
./test-system.sh

# 2. Check which step fails
npm run test:content  # Test content generation
npm run test:audio    # Test audio generation

# 3. Check API keys
cat .env | grep -v "^#"

# 4. Check disk space
df -h

# 5. Check memory
free -h

# 6. Review detailed logs
tail -100 logs/market_open-*.log | grep ERROR
```

## 🟢 Rendering Issues

```bash
# Video rendering crashes
# Solution: Add swap space
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Video rendering too slow
# Solution 1: Reduce concurrency
# Edit remotion.config.ts: Config.setConcurrency(1);

# Solution 2: Upgrade VPS CPU cores
```

## 🔵 YouTube Upload Fails

```bash
# Re-authenticate
cd /home/gameofcrores
npm run auth:youtube

# Update .env with new refresh token
nano .env
# Paste new YOUTUBE_REFRESH_TOKEN

# Test upload manually
node src/scripts/uploadYouTube.js data/videos/latest.mp4 "Test" "Test description"
```

## 🟣 API Issues

**Claude API fails:**
- Check balance: https://console.anthropic.com
- Verify API key in .env
- Check rate limits

**ElevenLabs fails:**
- Check quota: https://elevenlabs.io
- Verify API key and Voice ID
- Try different voice

**News/Market API fails:**
- Check daily limits (free tiers)
- Wait 24 hours if limit hit
- Consider paid plans

## ⚫ Emergency Stop

```bash
# Stop all video generation immediately
pm2 stop n8n

# Kill any stuck render processes
pkill -f remotion
pkill -f node

# Restart fresh
pm2 restart n8n
```

## 📝 Log Locations

```bash
# Application logs
ls -lt /home/gameofcrores/logs/

# View specific log
tail -100 /home/gameofcrores/logs/market_open-20260121-060000.log

# Search for errors
grep -i error /home/gameofcrores/logs/*.log

# Real-time monitoring
tail -f /home/gameofcrores/logs/*.log
```

## 🔍 Debug Commands

```bash
# Test Claude API
node -e "console.log(process.env.ANTHROPIC_API_KEY)" 
# Should show your key

# Test file permissions
ls -la /home/gameofcrores/src/scripts/

# Test Node.js version
node --version  # Should be v20+

# Test FFmpeg
ffmpeg -version

# Check running processes
ps aux | grep node
```

## 💾 Recovery Commands

```bash
# Clear cache and retry
rm -rf node_modules/.cache
rm -rf data/videos/*.mp4.tmp

# Reinstall dependencies
cd /home/gameofcrores
rm -rf node_modules
npm install

# Reset permissions
sudo chown -R $USER:$USER /home/gameofcrores
chmod +x test-system.sh
```

## 🎯 Quick Health Check

```bash
cd /home/gameofcrores

# Run all checks
./test-system.sh

# If all green, system is healthy
# If any red, fix that specific issue
```

---

Remember: **Check logs first!** 

Most issues show clear error messages in:
`/home/gameofcrores/logs/*.log`
