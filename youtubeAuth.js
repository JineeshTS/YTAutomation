const { google } = require('googleapis');
const express = require('express');
const open = require('open');
require('dotenv').config();

const OAuth2 = google.auth.OAuth2;

const oauth2Client = new OAuth2(
  process.env.YOUTUBE_CLIENT_ID,
  process.env.YOUTUBE_CLIENT_SECRET,
  'http://localhost:3000/oauth2callback'
);

// Generate auth URL
const scopes = [
  'https://www.googleapis.com/auth/youtube.upload',
  'https://www.googleapis.com/auth/youtube'
];

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: scopes,
  prompt: 'consent'
});

console.log('\n=== YouTube OAuth Setup ===\n');
console.log('Step 1: Opening browser for Google authentication...');
console.log('If browser doesn\'t open, visit this URL manually:\n');
console.log(authUrl);
console.log('\n');

// Create simple express server to handle callback
const app = express();

app.get('/oauth2callback', async (req, res) => {
  const code = req.query.code;
  
  if (!code) {
    res.send('Error: No code received');
    return;
  }
  
  try {
    const { tokens } = await oauth2Client.getToken(code);
    
    console.log('\n✓ Authentication successful!');
    console.log('\nYour YOUTUBE_REFRESH_TOKEN:');
    console.log(tokens.refresh_token);
    console.log('\nAdd this to your .env file:\n');
    console.log(`YOUTUBE_REFRESH_TOKEN=${tokens.refresh_token}\n`);
    
    res.send(`
      <html>
        <body>
          <h1>Success!</h1>
          <p>Authentication successful. You can close this window.</p>
          <p>Check your terminal for the refresh token.</p>
        </body>
      </html>
    `);
    
    setTimeout(() => {
      process.exit(0);
    }, 2000);
    
  } catch (error) {
    console.error('Error getting tokens:', error.message);
    res.send('Error getting tokens. Check your console.');
  }
});

const server = app.listen(3000, () => {
  console.log('Waiting for authentication...\n');
  open(authUrl);
});
