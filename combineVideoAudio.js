const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');

const execPromise = promisify(exec);

/**
 * Combine Veo 3 generated video with ElevenLabs audio
 * Optionally add text overlays
 */
async function combineVideoAudio(videoPath, audioPath, outputPath, options = {}) {
  try {
    console.log('Combining video and audio...');
    console.log('Video:', videoPath);
    console.log('Audio:', audioPath);
    console.log('Output:', outputPath);
    
    // Verify inputs exist
    if (!fs.existsSync(videoPath)) {
      throw new Error(`Video file not found: ${videoPath}`);
    }
    if (!fs.existsSync(audioPath)) {
      throw new Error(`Audio file not found: ${audioPath}`);
    }
    
    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Build FFmpeg command
    let ffmpegCommand = `ffmpeg -y `;
    
    // Input video (no audio)
    ffmpegCommand += `-i "${videoPath}" `;
    
    // Input audio
    ffmpegCommand += `-i "${audioPath}" `;
    
    // Map video from first input, audio from second input
    ffmpegCommand += `-map 0:v:0 -map 1:a:0 `;
    
    // Video codec (copy if possible, re-encode if needed)
    ffmpegCommand += `-c:v libx264 -preset fast -crf 23 `;
    
    // Audio codec
    ffmpegCommand += `-c:a aac -b:a 192k `;
    
    // Ensure video and audio are same length (cut to shortest)
    ffmpegCommand += `-shortest `;
    
    // Output
    ffmpegCommand += `"${outputPath}"`;
    
    console.log('Running FFmpeg...');
    console.log('Command:', ffmpegCommand);
    
    const { stdout, stderr } = await execPromise(ffmpegCommand);
    
    if (stderr) {
      console.log('FFmpeg output:', stderr);
    }
    
    // Verify output exists
    if (!fs.existsSync(outputPath)) {
      throw new Error('Output video was not created');
    }
    
    const stats = fs.statSync(outputPath);
    const fileSizeInMB = stats.size / (1024 * 1024);
    
    console.log(`Video combined successfully: ${fileSizeInMB.toFixed(2)} MB`);
    
    return {
      success: true,
      path: outputPath,
      sizeInMB: fileSizeInMB.toFixed(2)
    };
    
  } catch (error) {
    console.error('Error combining video and audio:', error.message);
    if (error.stderr) {
      console.error('FFmpeg error:', error.stderr);
    }
    throw error;
  }
}

/**
 * Add text overlays to video (optional enhancement)
 */
async function addTextOverlays(videoPath, textOverlays, outputPath) {
  try {
    console.log('Adding text overlays...');
    
    // Build filter_complex for text overlays
    let filterComplex = '';
    
    textOverlays.forEach((overlay, index) => {
      const {
        text,
        startTime = 0,
        duration = 5,
        x = '(w-text_w)/2',
        y = '(h-text_h)/2',
        fontSize = 60,
        fontColor = 'white',
        boxColor = 'black@0.5'
      } = overlay;
      
      const escapedText = text.replace(/'/g, "\\'").replace(/:/g, '\\:');
      
      filterComplex += `drawtext=text='${escapedText}'`;
      filterComplex += `:x=${x}:y=${y}`;
      filterComplex += `:fontsize=${fontSize}`;
      filterComplex += `:fontcolor=${fontColor}`;
      filterComplex += `:box=1:boxcolor=${boxColor}`;
      filterComplex += `:boxborderw=10`;
      filterComplex += `:enable='between(t,${startTime},${startTime + duration})'`;
      
      if (index < textOverlays.length - 1) {
        filterComplex += ',';
      }
    });
    
    const ffmpegCommand = `ffmpeg -y -i "${videoPath}" -vf "${filterComplex}" -c:a copy "${outputPath}"`;
    
    console.log('Running FFmpeg for text overlays...');
    
    const { stdout, stderr } = await execPromise(ffmpegCommand);
    
    if (stderr) {
      console.log('FFmpeg output:', stderr);
    }
    
    console.log('Text overlays added successfully');
    
    return {
      success: true,
      path: outputPath
    };
    
  } catch (error) {
    console.error('Error adding text overlays:', error.message);
    throw error;
  }
}

/**
 * Get video duration
 */
async function getVideoDuration(videoPath) {
  try {
    const command = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${videoPath}"`;
    const { stdout } = await execPromise(command);
    return parseFloat(stdout.trim());
  } catch (error) {
    console.error('Error getting video duration:', error.message);
    return null;
  }
}

// CLI usage
if (require.main === module) {
  const videoPath = process.argv[2];
  const audioPath = process.argv[3];
  const outputPath = process.argv[4];
  
  if (!videoPath || !audioPath || !outputPath) {
    console.error('Usage: node combineVideoAudio.js <video_path> <audio_path> <output_path>');
    process.exit(1);
  }
  
  combineVideoAudio(videoPath, audioPath, outputPath)
    .then(result => {
      console.log('Success:', result);
    })
    .catch(error => {
      console.error('Failed:', error.message);
      process.exit(1);
    });
}

module.exports = { combineVideoAudio, addTextOverlays, getVideoDuration };
