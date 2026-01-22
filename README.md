# GameofCrores - Automated YouTube Shorts

Automated video generation system for daily Indian stock market updates.

## 🚀 Quick Start

1. **Setup VPS**
   ```bash
   cd /home/gameofcrores
   npm install
   ./test-system.sh
   ```

2. **Configure APIs**
   - Edit `.env` file with your API keys
   - Run `npm run auth:youtube` for YouTube auth

3. **Test First Video**
   ```bash
   npm run create:market_open
   ```

4. **Import n8n Workflow**
   - Import `n8n-workflow.json` to your n8n instance
   - Activate workflow

## 📁 Key Files

- `src/scripts/createVideo.js` - Main orchestrator
- `src/remotion/NewsShort.tsx` - Video template
- `.env` - API keys (keep secret!)
- `n8n-workflow.json` - Automation workflow

## 🔧 Daily Commands

```bash
# Check status
./test-system.sh

# View logs
tail -f logs/*.log

# Manually create video
npm run create:market_open
```

## 📊 Daily Schedule

- 6 AM: Market Opening Preview
- 11 AM: Midday Update
- 3 PM: Market Closing Summary
- 6 PM: Global Markets Impact
- 9 PM: Tomorrow's Preview

## 💰 Monthly Costs

- VPS: ~$15-20
- APIs: ~$35-50
- **Total: ~$50-70/month**

## 📖 Full Documentation

See `gameofcrores-setup-guide.md` for complete instructions.

## 🆘 Common Issues

**Video rendering slow?**
- Upgrade VPS or reduce concurrency in remotion.config.ts

**YouTube upload fails?**
- Re-run `npm run auth:youtube`

**Out of memory?**
- Add swap space (see troubleshooting guide)

**Wrong timezone?**
- Check n8n workflow settings use Asia/Kolkata

## 📞 Support

Check logs first: `tail -100 logs/*.log`

Then review troubleshooting section in main guide.
