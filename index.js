require('dotenv').config();
const express = require('express');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;


/* ------------------ HELPERS ------------------ */

function cleanTitle(title) {
  return title
    .replace(/#\w+/g, '')
    .replace(/[^\w\s!?']/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}


/* ------------------ UI ------------------ */

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
            margin: 0;
          }

          .container {
            max-width: 900px;
            margin: 80px auto;
            padding: 20px;
          }

          h1 {
            font-size: 32px;
            margin-bottom: 30px;
          }

          .search {
            display: flex;
            gap: 10px;
          }

          input {
            flex: 1;
            padding: 16px;
            font-size: 16px;
            border-radius: 8px;
            border: none;
            background: #1a1a1a;
            color: white;
          }

          button {
            padding: 16px 20px;
            font-size: 16px;
            border-radius: 8px;
            border: none;
            cursor: pointer;
            background: #2563eb;
            color: white;
          }

          button:hover {
            background: #1d4ed8;
          }

          .quick {
            margin-top: 20px;
          }

          .quick button {
            background: #2a2a2a;
            font-size: 14px;
            padding: 10px;
            margin-right: 5px;
          }

          .card {
            background: #1a1a1a;
            padding: 20px;
            border-radius: 10px;
            margin-top: 20px;
          }

          .title {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 10px;
          }

          .section {
            margin-top: 12px;
            line-height: 1.6;
          }

          .copy {
            margin-top: 10px;
            font-size: 12px;
            cursor: pointer;
            color: #60a5fa;
          }
        </style>
      </head>

      <body>
        <div class="container">
          <h1>YT Trend Engine</h1>

          <div class="search">
            <input id="topic" placeholder="Search ideas (reds offense, bengals, cavs playoffs)" />
            <button onclick="generate()">Generate</button>
          </div>

          <div class="quick">
            <button onclick="quick('cincinnati bengals analysis OR bengals news OR nfl breakdown')">Bengals</button>
            <button onclick="quick('cleveland cavaliers analysis OR cavs playoffs OR nba breakdown')">Cavs</button>
            <button onclick="quick('cincinnati reds offense OR reds lineup OR mlb analysis')">Reds</button>
            <button onclick="quick('ohio state football analysis OR buckeyes news OR college football breakdown')">Buckeyes</button>
            <button onclick="quick('nfl analysis OR nfl rankings OR nfl takes')">NFL</button>
            <button onclick="quick('mlb analysis OR baseball rankings OR mlb news')">MLB</button>
            <button onclick="quick('nba analysis OR nba takes OR nba rankings')">NBA</button>
          </div>

          <div id="results"></div>
        </div>

        <script>
          async function generate(q) {
            const topic = q || document.getElementById('topic').value;

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
                item.titles.map(t =>
                  t + ' <div class="copy" onclick="copyText(\\'' + t + '\\')">copy</div>'
                ).join('<br>') +
                '</div>' +

                '<div class="section"><strong>Hook:</strong><br>' +
                item.hook +
                '</div>';

              container.appendChild(div);
            });
          }

          function quick(topic) {
            document.getElementById('topic').value = topic;
            generate(topic);
          }

          function copyText(text) {
            navigator.clipboard.writeText(text);
          }

          // Auto load (your niche)
          window.onload = () => generate('cincinnati sports analysis');
        </script>
      </body>
    </html>
  `);
});


/* ------------------ IDEAS ------------------ */

app.get('/ideas', async (req, res) => {
  try {
    const topic = req.query.topic || 'sports';

    const r = await axios.get('https://www.googleapis.com/youtube/v3/search', {
      params: {
        part: 'snippet',
        q: topic + " sports OR nfl OR mlb OR nba OR college football analysis OR breakdown OR why OR problem OR highlights",
        maxResults: 8,
        type: 'video',
        videoDuration: 'medium',
        key: process.env.YOUTUBE_API_KEY
      }
    });

    const ideas = r.data.items.map(v => {
      const base = cleanTitle(v.snippet.title);

      return {
        baseIdea: base,
        titles: [
          base,
          base + " (And It's Worse Than You Think)",
          "Why " + base + " Is a Huge Problem",
          "Everyone Is Wrong About " + base,
          "The Truth About " + base
        ],
        hook: "Fans are already arguing about this, but most people don’t actually understand what’s really going on."
      };
    });

    res.json(ideas);

  } catch (e) {
    console.error(e.response?.data || e.message);
    res.status(500).send("error");
  }
});


/* ------------------ START ------------------ */

app.listen(PORT, () => {
  console.log("running on " + PORT);
});