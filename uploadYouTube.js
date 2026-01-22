const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const OAuth2 = google.auth.OAuth2;

async function uploadToYouTube(videoPath, title, description, tags = []) {
  try {
    console.log('Initializing YouTube upload...');
    
    // Create OAuth2 client
    const oauth2Client = new OAuth2(
      process.env.YOUTUBE_CLIENT_ID,
      process.env.YOUTUBE_CLIENT_SECRET,
      'http://localhost:3000/oauth2callback'
    );
    
    // Set credentials
    oauth2Client.setCredentials({
      refresh_token: process.env.YOUTUBE_REFRESH_TOKEN
    });
    
    const youtube = google.youtube({
      version: 'v3',
      auth: oauth2Client
    });
    
    // Prepare video metadata
    const videoMetadata = {
      snippet: {
        title: title,
        description: description,
        tags: [...tags, 'GameofCrores', 'Stock Market', 'India', 'Market Update', 'Nifty', 'Sensex'],
        categoryId: '25', // News & Politics
        defaultLanguage: 'en',
        defaultAudioLanguage: 'en'
      },
      status: {
        privacyStatus: 'public', // or 'private' or 'unlisted'
        selfDeclaredMadeForKids: false
      }
    };
    
    console.log('Uploading video to YouTube...');
    
    const response = await youtube.videos.insert({
      part: 'snippet,status',
      requestBody: videoMetadata,
      media: {
        body: fs.createReadStream(videoPath)
      }
    });
    
    const videoId = response.data.id;
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    
    console.log(`Video uploaded successfully!`);
    console.log(`Video ID: ${videoId}`);
    console.log(`Video URL: ${videoUrl}`);
    
    return {
      success: true,
      videoId: videoId,
      videoUrl: videoUrl
    };
  } catch (error) {
    console.error('Error uploading to YouTube:', error.message);
    if (error.response) {
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
    throw error;
  }
}

// CLI usage
if (require.main === module) {
  const videoPath = process.argv[2];
  const title = process.argv[3];
  const description = process.argv[4];
  
  if (!videoPath || !title) {
    console.error('Usage: node uploadYouTube.js <video_path> "<title>" "<description>"');
    process.exit(1);
  }
  
  uploadToYouTube(videoPath, title, description)
    .then(result => {
      console.log('Success:', result);
    })
    .catch(error => {
      console.error('Failed:', error.message);
      process.exit(1);
    });
}

module.exports = { uploadToYouTube };
