const { VertexAI } = require('@google-cloud/vertexai');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

// Initialize Vertex AI with your project
const vertexAI = new VertexAI({
  project: process.env.GOOGLE_CLOUD_PROJECT_ID,
  location: process.env.GOOGLE_CLOUD_LOCATION || 'us-central1',
});

async function generateVideoWithVeo3(prompt, outputPath, duration = 60) {
  try {
    console.log('Generating video with Veo 3...');
    console.log('Prompt:', prompt);
    
    // Initialize Veo 3 model
    const model = vertexAI.preview.getGenerativeModel({
      model: 'veo-3',
    });
    
    // Generate video
    const request = {
      contents: [{
        role: 'user',
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        videoDuration: `${duration}s`,
        aspectRatio: '9:16', // Vertical for YouTube Shorts
        motionIntensity: 'high',
        quality: 'high',
      }
    };
    
    console.log('Sending request to Veo 3...');
    const response = await model.generateContent(request);
    
    // Get video data
    const videoData = response.response.candidates[0].content.parts[0].videoData;
    
    if (!videoData) {
      throw new Error('No video data received from Veo 3');
    }
    
    // Save video
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // If videoData is base64
    if (videoData.mimeType && videoData.data) {
      const buffer = Buffer.from(videoData.data, 'base64');
      fs.writeFileSync(outputPath, buffer);
    }
    // If videoData is a URL
    else if (videoData.url) {
      const videoResponse = await axios.get(videoData.url, {
        responseType: 'arraybuffer'
      });
      fs.writeFileSync(outputPath, videoResponse.data);
    }
    
    console.log(`Video saved to: ${outputPath}`);
    
    // Get video file stats
    const stats = fs.statSync(outputPath);
    const fileSizeInMB = stats.size / (1024 * 1024);
    
    return {
      success: true,
      path: outputPath,
      sizeInMB: fileSizeInMB.toFixed(2),
      duration: duration
    };
    
  } catch (error) {
    console.error('Error generating video with Veo 3:', error.message);
    if (error.response) {
      console.error('Response error:', JSON.stringify(error.response.data, null, 2));
    }
    throw error;
  }
}

// Alternative: If using REST API directly
async function generateVideoWithVeo3REST(prompt, outputPath, duration = 60) {
  try {
    console.log('Generating video with Veo 3 (REST API)...');
    
    const endpoint = `https://${process.env.GOOGLE_CLOUD_LOCATION}-aiplatform.googleapis.com/v1/projects/${process.env.GOOGLE_CLOUD_PROJECT_ID}/locations/${process.env.GOOGLE_CLOUD_LOCATION}/publishers/google/models/veo-3:predict`;
    
    const accessToken = await getAccessToken();
    
    const requestBody = {
      instances: [{
        prompt: prompt,
        parameters: {
          videoDuration: duration,
          aspectRatio: '9:16',
          motionIntensity: 'high',
          quality: 'high'
        }
      }]
    };
    
    const response = await axios.post(endpoint, requestBody, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    const videoUrl = response.data.predictions[0].videoUrl;
    
    // Download video
    const videoResponse = await axios.get(videoUrl, {
      responseType: 'arraybuffer'
    });
    
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    fs.writeFileSync(outputPath, videoResponse.data);
    
    console.log(`Video saved to: ${outputPath}`);
    
    const stats = fs.statSync(outputPath);
    const fileSizeInMB = stats.size / (1024 * 1024);
    
    return {
      success: true,
      path: outputPath,
      sizeInMB: fileSizeInMB.toFixed(2),
      duration: duration
    };
    
  } catch (error) {
    console.error('Error with REST API:', error.message);
    throw error;
  }
}

// Get Google Cloud access token
async function getAccessToken() {
  const { GoogleAuth } = require('google-auth-library');
  const auth = new GoogleAuth({
    keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    scopes: ['https://www.googleapis.com/auth/cloud-platform']
  });
  
  const client = await auth.getClient();
  const accessToken = await client.getAccessToken();
  return accessToken.token;
}

// CLI usage
if (require.main === module) {
  const prompt = process.argv[2];
  const outputPath = process.argv[3];
  const duration = parseInt(process.argv[4]) || 60;
  
  if (!prompt || !outputPath) {
    console.error('Usage: node generateVideoVeo3.js "<prompt>" <output_path> [duration]');
    console.error('Example: node generateVideoVeo3.js "A cat playing piano" output.mp4 60');
    process.exit(1);
  }
  
  generateVideoWithVeo3(prompt, outputPath, duration)
    .then(result => {
      console.log('Success:', result);
    })
    .catch(error => {
      console.error('Failed:', error.message);
      process.exit(1);
    });
}

module.exports = { generateVideoWithVeo3, generateVideoWithVeo3REST };
