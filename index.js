require('dotenv').config();
const express = require('express');
const axios = require('axios');

const app = express();
const PORT = 3000;

// Home route
app.get('/', (req, res) => {
  res.send("🚀 YT Trend Engine Running");
});


// 🔥 GET REAL TRENDING VIDEOS (sorted by views)
app.get('/yt-trends', async (req, res) => {
  try {
    const topic = req.query.topic || 'sports controversy OR worst teams OR rankings';

    // STEP 1: Search videos
    const searchRes = await axios.get(
      'https://www.googleapis.com/youtube/v3/search',
      {
        params: {
          part: 'snippet',
          q: topic,
          maxResults: 10,
          type: 'video',
          key: process.env.YOUTUBE_API_KEY
        }
      }
    );

    const videoIds = searchRes.data.items.map(v => v.id.videoId).join(',');

    // STEP 2: Get stats
    const statsRes = await axios.get(
      'https://www.googleapis.com/youtube/v3/videos',
      {
        params: {
          part: 'snippet,statistics',
          id: videoIds,
          key: process.env.YOUTUBE_API_KEY
        }
      }
    );

    const videos = statsRes.data.items
      .map(v => ({
        title: v.snippet.title,
        channel: v.snippet.channelTitle,
        views: parseInt(v.statistics.viewCount)
      }))
      .sort((a, b) => b.views - a.views);

    res.json(videos);

  } catch (err) {
    console.error(err.response?.data || err.message);
    res.send("❌ Error fetching YouTube data");
  }
});


// 🔥 IDEA GENERATOR (THIS IS YOUR MONEY TOOL)
app.get('/ideas', async (req, res) => {
  try {
    const topic = req.query.topic || 'sports controversy OR worst teams OR rankings';

    const searchRes = await axios.get(
      'https://www.googleapis.com/youtube/v3/search',
      {
        params: {
          part: 'snippet',
          q: topic,
          maxResults: 5,
          type: 'video',
          key: process.env.YOUTUBE_API_KEY
        }
      }
    );

    const ideas = searchRes.data.items.map(v => {
      const base = v.snippet.title;

      return {
        baseIdea: base,

        titles: [
          `The Truth About This: ${base}`,
          `This Is Getting Out of Control…`,
          `Why Fans Are Losing It Over This`,
          `Nobody Is Talking About This Enough…`
        ],

        thumbnails: [
          "THIS IS BAD",
          "WHAT IS THIS?",
          "SERIOUS PROBLEM",
          "FANS ARE MAD"
        ],

        hook:
          "Everyone is talking about this right now, and honestly… it might be worse than people think."
      };
    });

    res.json(ideas);

  } catch (err) {
    console.error(err.response?.data || err.message);
    res.send("❌ Error generating ideas");
  }
});


// 🚀 START SERVER
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});