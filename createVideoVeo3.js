const { generateContentForVeo3 } = require('./generateContentVeo3');
const { generateVideoWithVeo3 } = require('./generateVideoVeo3');
const { generateAudio } = require('./generateAudio');
const { combineVideoAudio } = require('./combineVideoAudio');
const { uploadToYouTube } = require('./uploadYouTube');
const fs = require('fs');
const path = require('path');
const { format } = require('date-fns');

/**
 * Complete pipeline for creating and uploading videos using Veo 3
 */
async function createVideoWithVeo3(contentType) {
  const timestamp = format(new Date(), 'yyyyMMdd-HHmmss');
  const baseDir = path.join(__dirname, '../../');
  
  const paths = {
    script: path.join(baseDir, 'data', `script-${contentType}-${timestamp}.json`),
    veoVideo: path.join(baseDir, 'data/videos', `veo-${contentType}-${timestamp}.mp4`),
    audio: path.join(baseDir, 'data/audio', `audio-${contentType}-${timestamp}.mp3`),
    finalVideo: path.join(baseDir, 'data/videos', `final-${contentType}-${timestamp}.mp4`),
    log: path.join(baseDir, 'logs', `${contentType}-${timestamp}.log`)
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
    log(`=== Starting Veo 3 video creation for: ${contentType} ===`);
    log(`Pipeline: Content → Veo 3 Video → Audio → Combine → Upload`);
    
    // Step 1: Generate content with Veo 3 prompt
    log('');
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    log('STEP 1/5: Generating content and Veo 3 prompt...');
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const scriptData = await generateContentForVeo3(contentType);
    fs.writeFileSync(paths.script, JSON.stringify(scriptData, null, 2));
    
    log('✓ Content generated');
    log(`  Title: ${scriptData.title}`);
    log(`  Veo Prompt: ${scriptData.veo_prompt.substring(0, 100)}...`);
    log(`  Voiceover length: ${scriptData.voiceover_script.length} characters`);
    
    // Step 2: Generate video with Veo 3
    log('');
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    log('STEP 2/5: Generating cinematic video with Veo 3...');
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    log('⚠️  This may take 3-10 minutes depending on Google queue');
    
    const veoResult = await generateVideoWithVeo3(
      scriptData.veo_prompt,
      paths.veoVideo,
      60 // 60 seconds
    );
    
    log(`✓ Veo 3 video generated (${veoResult.sizeInMB} MB)`);
    log(`  Video saved: ${paths.veoVideo}`);
    
    // Step 3: Generate audio voiceover
    log('');
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    log('STEP 3/5: Generating voiceover with ElevenLabs...');
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const audioResult = await generateAudio(scriptData.voiceover_script, paths.audio);
    
    log(`✓ Audio generated (${audioResult.duration}s)`);
    log(`  Audio saved: ${paths.audio}`);
    
    // Step 4: Combine video and audio
    log('');
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    log('STEP 4/5: Combining Veo video with voiceover...');
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const combineResult = await combineVideoAudio(
      paths.veoVideo,
      paths.audio,
      paths.finalVideo
    );
    
    log(`✓ Video and audio combined (${combineResult.sizeInMB} MB)`);
    log(`  Final video: ${paths.finalVideo}`);
    
    // Step 5: Upload to YouTube
    log('');
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    log('STEP 5/5: Uploading to YouTube...');
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const description = generateDescription(scriptData);
    const tags = generateTags(contentType, scriptData);
    
    const uploadResult = await uploadToYouTube(
      paths.finalVideo,
      scriptData.title,
      description,
      tags
    );
    
    log(`✓ Uploaded to YouTube`);
    log(`  Video ID: ${uploadResult.videoId}`);
    log(`  URL: ${uploadResult.videoUrl}`);
    
    // Success summary
    log('');
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    log('🎉 VIDEO CREATION COMPLETE! 🎉');
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    log(`📺 Watch at: ${uploadResult.videoUrl}`);
    log(`📝 Title: ${scriptData.title}`);
    log(`⏱️  Duration: ~60 seconds`);
    log(`💾 File size: ${combineResult.sizeInMB} MB`);
    log(`📁 Files saved to: ${baseDir}data/`);
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    return {
      success: true,
      videoUrl: uploadResult.videoUrl,
      videoId: uploadResult.videoId,
      title: scriptData.title,
      paths: paths
    };
    
  } catch (error) {
    log('');
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    log('❌ ERROR OCCURRED');
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    log(`Error: ${error.message}`);
    log(error.stack);
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    throw error;
  }
}

function generateDescription(scriptData) {
  return `${scriptData.subtitle}

${scriptData.content_summary || ''}

━━━━━━━━━━━━━━━━━━━━━━━━
✨ Amazing facts delivered daily!
🔔 Subscribe for more fascinating content
💬 Comment what you want to learn next!

#Shorts #DidYouKnow #AmazingFacts #Educational #Learning #Viral #Trending`;
}

function generateTags(contentType, scriptData) {
  const baseTags = ['shorts', 'viral', 'trending', 'facts', 'educational', 'learning', 'amazing', 'didyouknow'];
  
  const contentTags = {
    animals: ['animals', 'wildlife', 'nature', 'animalfacts'],
    space: ['space', 'astronomy', 'cosmos', 'universe', 'planets'],
    ocean: ['ocean', 'marine', 'sea', 'underwater', 'marinelife'],
    science: ['science', 'physics', 'chemistry', 'biology', 'experiment'],
    history: ['history', 'historical', 'past', 'ancient'],
    nature: ['nature', 'earth', 'natural', 'phenomena'],
    human_body: ['human', 'body', 'health', 'anatomy', 'biology'],
    technology: ['technology', 'tech', 'innovation', 'future', 'ai']
  };
  
  return [...baseTags, ...(contentTags[contentType] || [])];
}

// CLI usage
if (require.main === module) {
  const contentType = process.argv[2];
  
  const validTypes = ['animals', 'space', 'ocean', 'science', 'history', 'nature', 'human_body', 'technology', 'general'];
  
  if (!contentType || !validTypes.includes(contentType)) {
    console.error('Usage: node createVideoVeo3.js <content_type>');
    console.error('Valid types:', validTypes.join(', '));
    process.exit(1);
  }
  
  createVideoWithVeo3(contentType)
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

module.exports = { createVideoWithVeo3 };
