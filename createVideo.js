const { generateContent } = require('./generateContent');
const { generateAudio } = require('./generateAudio');
const { renderVideo } = require('./renderVideo');
const { uploadToYouTube } = require('./uploadYouTube');
const fs = require('fs');
const path = require('path');
const { format } = require('date-fns');
const { formatInTimeZone } = require('date-fns-tz');

async function createAndUploadVideo(videoType) {
  const timestamp = format(new Date(), 'yyyyMMdd-HHmmss');
  const baseDir = path.join(__dirname, '../../');
  
  const paths = {
    script: path.join(baseDir, 'data', `script-${videoType}-${timestamp}.json`),
    audio: path.join(baseDir, 'data/audio', `audio-${videoType}-${timestamp}.mp3`),
    video: path.join(baseDir, 'data/videos', `video-${videoType}-${timestamp}.mp4`),
    log: path.join(baseDir, 'logs', `${videoType}-${timestamp}.log`)
  };
  
  // Ensure directories exist
  ['data', 'data/audio', 'data/videos', 'logs'].forEach(dir => {
    const fullPath = path.join(baseDir, dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
  });
  
  const log = (message) => {
    const logMessage = `[${new Date().toISOString()}] ${message}\n`;
    console.log(message);
    fs.appendFileSync(paths.log, logMessage);
  };
  
  try {
    log(`=== Starting video creation for: ${videoType} ===`);
    
    // Step 1: Generate content script
    log('Step 1: Generating content script...');
    const scriptData = await generateContent(videoType);
    fs.writeFileSync(paths.script, JSON.stringify(scriptData, null, 2));
    log('✓ Script generated');
    
    // Step 2: Generate audio
    log('Step 2: Generating audio voiceover...');
    const audioResult = await generateAudio(scriptData.voiceover_script, paths.audio);
    log(`✓ Audio generated (${audioResult.duration}s)`);
    
    // Step 3: Render video
    log('Step 3: Rendering video (this takes 5-10 minutes)...');
    await renderVideo(scriptData, paths.audio, audioResult.duration, paths.video);
    log('✓ Video rendered');
    
    // Step 4: Upload to YouTube
    log('Step 4: Uploading to YouTube...');
    const uploadResult = await uploadToYouTube(
      paths.video,
      scriptData.title,
      generateDescription(scriptData),
      [videoType, 'shorts']
    );
    log(`✓ Uploaded to YouTube: ${uploadResult.videoUrl}`);
    
    // Success summary
    log('=== VIDEO CREATION COMPLETE ===');
    log(`Video URL: ${uploadResult.videoUrl}`);
    log(`Files saved to: ${baseDir}/data/`);
    
    return {
      success: true,
      videoUrl: uploadResult.videoUrl,
      videoId: uploadResult.videoId,
      paths: paths
    };
    
  } catch (error) {
    log(`ERROR: ${error.message}`);
    log(error.stack);
    throw error;
  }
}

function generateDescription(scriptData) {
  const typeDescriptions = {
    market_open: 'Market Opening Preview',
    midday: 'Midday Market Update',
    market_close: 'Market Closing Summary',
    global: 'Global Markets Impact on India',
    preview: 'Tomorrow\'s Market Preview'
  };
  
  const description = `${typeDescriptions[scriptData.type]}

${scriptData.subtitle}

Key Points:
${scriptData.content.map((point, i) => `${i + 1}. ${point}`).join('\n')}

---
Follow GameofCrores for daily market updates!

#StockMarket #India #Nifty #Sensex #MarketUpdate #GameofCrores #Shorts`;
  
  return description;
}

// CLI usage
if (require.main === module) {
  const videoType = process.argv[2];
  
  if (!['market_open', 'midday', 'market_close', 'global', 'preview'].includes(videoType)) {
    console.error('Usage: node createVideo.js <market_open|midday|market_close|global|preview>');
    process.exit(1);
  }
  
  createAndUploadVideo(videoType)
    .then(result => {
      console.log('\n=== SUCCESS ===');
      console.log(JSON.stringify(result, null, 2));
      process.exit(0);
    })
    .catch(error => {
      console.error('\n=== FAILED ===');
      console.error(error.message);
      process.exit(1);
    });
}

module.exports = { createAndUploadVideo };
