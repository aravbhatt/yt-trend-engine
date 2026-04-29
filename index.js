require('dotenv').config();
const express = require('express');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;


// ---------- UI ----------
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>YT Trend Engine</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            background: #0f0f0f;
            color: #e5e5e5;
            padding: 40px;
            max-width: 800px;
            margin: auto;
          }

          h1 {
            font-size: 24px;
            margin-bottom: 20px;
          }

          input {
            padding: 10px;
            width: 300px;
            font-size: 14px;
            border-radius: 6px;
            border: none;
            outline: none;
          }

          button {
            padding: 10px 16px;
            font-size: 14px;
            margin-left: 10px;
            border-radius: 6px;
            border: none;
            cursor: pointer;
            background: #2a2a2a;
            color: white;
          }

          button:hover {
            background: #3a3a3a;
          }

          .card {
            background: #1a1a1a;
            padding: 16px;
            border-radius: 8px;
            margin-top: 20px;
          }

          .title {
            font-weight: bold;
            margin-bottom: 10px;
          }

          .section {
            margin-top: 10px;
            font-size: 14px;
            line-height: 1.5;
          }
        </style>
      </head>

      <body>
        <h1>YT Trend Engine</h1>

        <input id="topic" placeholder="e.g. most hated teams" />
        <button onclick="generate()">Generate</button>

        <div id="results"></div>

        <script>
          async function generate() {
            const topic = document.getElementById('topic').value;

            const res = await fetch('/ideas?topic=' + encodeURIComponent(topic));
            const data = await res.json();

            const container = document.getElementById('results');
            container.innerHTML = '';

            data.forEach(item => {
              const div = document.createElement('div');
              div.className = 'card';

              div.innerHTML =
                '<div class="title">' + item.baseIdea + '</div>' +

                '<div class="section"><strong>Titles:</strong><br>' +
                item.titles.join('<br>') +
                '</div>' +

                '<div class="section"><strong>Thumbnails:</strong><br>' +
                item.thumbnails.join(', ') +
                '</div>' +

                '<div class="section"><strong>Hook:</strong><br>' +
                item.hook +
                '</div>';

              container.appendChild(div);
            });
          }
        </script>
      </body>
    </html>
  `);
});


// ---------- YT TRENDS ----------
app.get('/yt-trends', async (req, res) => {
  try {
    const topic = req.query.topic || 'sports controversy OR worst teams OR rankings';

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
    res.send("Error fetching YouTube data");
  }
});


// ---------- IDEA GENERATOR ----------
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
          "The Truth About This: " + base,
          "This Is Getting Out of Control",
          "Why Fans Are Losing It Over This",
          "Nobody Is Talking About This Enough"
        ],

        thumbnails: [
          "THIS IS BAD",
          "WHAT IS THIS",
          "SERIOUS PROBLEM",
          "FANS ARE MAD"
        ],

        hook:
          "Everyone is talking about this right now, and it may be worse than it looks."
      };
    });

    res.json(ideas);

  } catch (err) {
    console.error(err.response?.data || err.message);
    res.send("Error generating ideas");
  }
});


// ---------- START SERVER ----------
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});