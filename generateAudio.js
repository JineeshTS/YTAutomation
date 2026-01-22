const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function generateAudio(text, outputPath) {
  const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
  const VOICE_ID = process.env.ELEVENLABS_VOICE_ID;
  
  if (!ELEVENLABS_API_KEY || !VOICE_ID) {
    throw new Error('ElevenLabs API key or Voice ID not configured');
  }
  
  try {
    console.log('Generating audio with ElevenLabs...');
    
    const response = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
      {
        text: text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.5,
          use_speaker_boost: true
        }
      },
      {
        headers: {
          'Accept': 'audio/mpeg',
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json'
        },
        responseType: 'arraybuffer'
      }
    );
    
    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Save audio file
    fs.writeFileSync(outputPath, response.data);
    console.log(`Audio saved to: ${outputPath}`);
    
    // Get audio duration (approximate based on file size and bitrate)
    const stats = fs.statSync(outputPath);
    const fileSizeInBytes = stats.size;
    const bitrate = 128000; // 128 kbps MP3
    const durationInSeconds = (fileSizeInBytes * 8) / bitrate;
    
    return {
      success: true,
      path: outputPath,
      duration: Math.ceil(durationInSeconds)
    };
  } catch (error) {
    console.error('Error generating audio:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    throw error;
  }
}

// CLI usage
if (require.main === module) {
  const text = process.argv[2];
  const outputPath = process.argv[3];
  
  if (!text || !outputPath) {
    console.error('Usage: node generateAudio.js "<text>" <output_path>');
    process.exit(1);
  }
  
  generateAudio(text, outputPath)
    .then(result => {
      console.log('Success:', result);
    })
    .catch(error => {
      console.error('Failed:', error.message);
      process.exit(1);
    });
}

module.exports = { generateAudio };
