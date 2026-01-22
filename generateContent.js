const Anthropic = require('@anthropic-ai/sdk');
const axios = require('axios');
require('dotenv').config();

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Fetch Indian stock market data
async function fetchMarketData() {
  try {
    const apiKey = process.env.ALPHA_VANTAGE_KEY;
    
    // Fetch Nifty 50 data (using proxy symbol)
    const niftyResponse = await axios.get(
      `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=NSEI&apikey=${apiKey}`
    );
    
    // Fetch Sensex data
    const sensexResponse = await axios.get(
      `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=BSE SENSEX&apikey=${apiKey}`
    );
    
    return {
      nifty: niftyResponse.data['Global Quote'],
      sensex: sensexResponse.data['Global Quote']
    };
  } catch (error) {
    console.error('Error fetching market data:', error.message);
    return null;
  }
}

// Fetch news data
async function fetchNewsData(category = 'business') {
  try {
    const apiKey = process.env.NEWS_API_KEY;
    const response = await axios.get(
      `https://newsapi.org/v2/top-headlines?country=in&category=${category}&apiKey=${apiKey}`
    );
    
    return response.data.articles.slice(0, 10); // Top 10 articles
  } catch (error) {
    console.error('Error fetching news:', error.message);
    return [];
  }
}

// Generate content using Claude
async function generateVideoScript(videoType, marketData, newsData) {
  const prompts = {
    market_open: `You are a professional financial news anchor for GameofCrores, an Indian stock market news channel.

Current Market Data:
${JSON.stringify(marketData, null, 2)}

Latest Business News:
${JSON.stringify(newsData.slice(0, 5), null, 2)}

Create a 60-second YouTube Short script for MARKET OPENING PREVIEW.

Requirements:
1. Title: Catchy, under 8 words
2. Subtitle: Brief context, under 12 words
3. Content: Exactly 3 key points, each 15-20 words max
4. Tone: Professional, energetic, optimistic
5. Focus: What to watch for today

Return ONLY a JSON object in this exact format:
{
  "title": "Opening Bell Preview",
  "subtitle": "What to watch today",
  "content": [
    "First key point about market opening",
    "Second key point about important stocks",
    "Third key point about global cues"
  ],
  "voiceover_script": "Full script that will be read aloud, naturally flowing, 50-55 seconds when read"
}`,

    midday: `You are a professional financial news anchor for GameofCrores, an Indian stock market news channel.

Current Market Data:
${JSON.stringify(marketData, null, 2)}

Latest Business News:
${JSON.stringify(newsData.slice(0, 5), null, 2)}

Create a 60-second YouTube Short script for MIDDAY MARKET UPDATE.

Requirements:
1. Title: Catchy, under 8 words
2. Subtitle: Brief context, under 12 words
3. Content: Exactly 3 key points, each 15-20 words max
4. Tone: Professional, informative, balanced
5. Focus: Current market performance

Return ONLY a JSON object in this exact format:
{
  "title": "Midday Market Check",
  "subtitle": "How are markets performing",
  "content": [
    "First key point about Nifty/Sensex movement",
    "Second key point about sectoral performance",
    "Third key point about volume/trends"
  ],
  "voiceover_script": "Full script that will be read aloud, naturally flowing, 50-55 seconds when read"
}`,

    market_close: `You are a professional financial news anchor for GameofCrores, an Indian stock market news channel.

Current Market Data:
${JSON.stringify(marketData, null, 2)}

Latest Business News:
${JSON.stringify(newsData.slice(0, 5), null, 2)}

Create a 60-second YouTube Short script for MARKET CLOSING SUMMARY.

Requirements:
1. Title: Catchy, under 8 words
2. Subtitle: Brief context, under 12 words
3. Content: Exactly 3 key points, each 15-20 words max
4. Tone: Professional, analytical, clear
5. Focus: Day's final performance

Return ONLY a JSON object in this exact format:
{
  "title": "Closing Bell Summary",
  "subtitle": "How markets ended today",
  "content": [
    "First key point about final market close",
    "Second key point about major movers",
    "Third key point about market breadth"
  ],
  "voiceover_script": "Full script that will be read aloud, naturally flowing, 50-55 seconds when read"
}`,

    global: `You are a professional financial news anchor for GameofCrores, an Indian stock market news channel.

Current Market Data:
${JSON.stringify(marketData, null, 2)}

Latest International Business News:
${JSON.stringify(newsData.slice(0, 5), null, 2)}

Create a 60-second YouTube Short script for GLOBAL MARKETS IMPACT.

Requirements:
1. Title: Catchy, under 8 words
2. Subtitle: Brief context, under 12 words
3. Content: Exactly 3 key points, each 15-20 words max
4. Tone: Professional, insightful, global perspective
5. Focus: How global markets affect India

Return ONLY a JSON object in this exact format:
{
  "title": "Global Markets Today",
  "subtitle": "Impact on Indian markets",
  "content": [
    "First key point about US/Asian markets",
    "Second key point about crude oil/dollar",
    "Third key point about FII/DII activity"
  ],
  "voiceover_script": "Full script that will be read aloud, naturally flowing, 50-55 seconds when read"
}`,

    preview: `You are a professional financial news anchor for GameofCrores, an Indian stock market news channel.

Current Market Data:
${JSON.stringify(marketData, null, 2)}

Latest Business News:
${JSON.stringify(newsData.slice(0, 5), null, 2)}

Create a 60-second YouTube Short script for NEXT DAY PREVIEW.

Requirements:
1. Title: Catchy, under 8 words
2. Subtitle: Brief context, under 12 words
3. Content: Exactly 3 key points, each 15-20 words max
4. Tone: Professional, forward-looking, actionable
5. Focus: What to expect tomorrow

Return ONLY a JSON object in this exact format:
{
  "title": "Tomorrow's Market Preview",
  "subtitle": "What to watch for",
  "content": [
    "First key point about key events tomorrow",
    "Second key point about stocks to watch",
    "Third key point about technical levels"
  ],
  "voiceover_script": "Full script that will be read aloud, naturally flowing, 50-55 seconds when read"
}`
  };

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: prompts[videoType]
      }]
    });

    const responseText = message.content[0].text;
    
    // Extract JSON from response (Claude might wrap it in markdown)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in Claude response');
    }
    
    const scriptData = JSON.parse(jsonMatch[0]);
    scriptData.type = videoType;
    
    return scriptData;
  } catch (error) {
    console.error('Error generating script:', error.message);
    throw error;
  }
}

// Main function
async function generateContent(videoType) {
  console.log(`Generating content for: ${videoType}`);
  
  // Fetch data
  const marketData = await fetchMarketData();
  const newsData = await fetchNewsData('business');
  
  if (!marketData || newsData.length === 0) {
    throw new Error('Failed to fetch market or news data');
  }
  
  // Generate script
  const script = await generateVideoScript(videoType, marketData, newsData);
  
  console.log('Script generated successfully');
  return script;
}

// CLI usage
if (require.main === module) {
  const videoType = process.argv[2];
  
  if (!['market_open', 'midday', 'market_close', 'global', 'preview'].includes(videoType)) {
    console.error('Usage: node generateContent.js <market_open|midday|market_close|global|preview>');
    process.exit(1);
  }
  
  generateContent(videoType)
    .then(script => {
      console.log(JSON.stringify(script, null, 2));
    })
    .catch(error => {
      console.error('Failed:', error.message);
      process.exit(1);
    });
}

module.exports = { generateContent };
