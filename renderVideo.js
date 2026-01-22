const { bundle } = require('@remotion/bundler');
const { renderMedia, selectComposition } = require('@remotion/renderer');
const path = require('path');
const fs = require('fs');

async function renderVideo(scriptData, audioPath, audioDuration, outputPath) {
  try {
    console.log('Starting video render...');
    
    // Bundle the Remotion project
    const bundleLocation = await bundle({
      entryPoint: path.join(__dirname, '../remotion/Root.tsx'),
      webpackOverride: (config) => config,
    });
    
    console.log('Bundle created');
    
    // Get composition
    const composition = await selectComposition({
      serveUrl: bundleLocation,
      id: 'NewsShort',
    });
    
    console.log('Composition selected');
    
    // Calculate exact duration based on audio
    const durationInFrames = Math.ceil(audioDuration * 30); // 30 fps
    
    // Prepare input props
    const inputProps = {
      title: scriptData.title,
      subtitle: scriptData.subtitle,
      content: scriptData.content,
      audioPath: audioPath,
      audioDuration: audioDuration,
      type: scriptData.type
    };
    
    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Render video
    console.log('Rendering video (this may take 5-10 minutes)...');
    await renderMedia({
      composition: {
        ...composition,
        durationInFrames,
      },
      serveUrl: bundleLocation,
      codec: 'h264',
      outputLocation: outputPath,
      inputProps,
      concurrency: 2, // Adjust based on VPS CPU
      onProgress: ({ renderedFrames, encodedFrames, totalFrames }) => {
        if (renderedFrames % 100 === 0) {
          console.log(`Progress: ${renderedFrames}/${totalFrames} frames rendered`);
        }
      },
    });
    
    console.log(`Video rendered successfully: ${outputPath}`);
    
    return {
      success: true,
      path: outputPath
    };
  } catch (error) {
    console.error('Error rendering video:', error.message);
    throw error;
  }
}

// CLI usage
if (require.main === module) {
  const scriptDataPath = process.argv[2];
  const audioPath = process.argv[3];
  const audioDuration = parseFloat(process.argv[4]);
  const outputPath = process.argv[5];
  
  if (!scriptDataPath || !audioPath || !audioDuration || !outputPath) {
    console.error('Usage: node renderVideo.js <script_json_path> <audio_path> <audio_duration> <output_path>');
    process.exit(1);
  }
  
  const scriptData = JSON.parse(fs.readFileSync(scriptDataPath, 'utf8'));
  
  renderVideo(scriptData, audioPath, audioDuration, outputPath)
    .then(result => {
      console.log('Success:', result);
    })
    .catch(error => {
      console.error('Failed:', error.message);
      process.exit(1);
    });
}

module.exports = { renderVideo };
