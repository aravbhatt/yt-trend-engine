require('dotenv').config();
const express = require('express');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;


/* ------------------ HELPERS ------------------ */

// Clean YouTube titles
function cleanTitle(title) {
  return title
    .replace(/#\w+/g, '')
    .replace(/[^\w\s!?']/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Filter out garbage videos
function isGoodVideo(title) {
  const badWords = [
    'highlights',
    'full game',
    'recap',
    'live',
    'stream',
    'shorts',
    'vs',
    'game'
  ];

  return !badWords.some(word =>
    title.toLowerCase().includes(word)
  );
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
            margin-top: 6px;
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
            <input id="topic" placeholder="reds offense, bengals, cavs playoffs" />
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
                  t + '<div class="copy" onclick="copyText(\\'' + t + '\\')">copy</div>'
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
        q: topic + " sports OR nfl OR mlb OR nba OR college football analysis OR breakdown OR why OR problem",
        maxResults: 10,
        type: 'video',
        videoDuration: 'medium',
        key: process.env.YOUTUBE_API_KEY
      }
    });

    const ideas = r.data.items
      .filter(v => isGoodVideo(v.snippet.title))
      .map(v => {
        const raw = cleanTitle(v.snippet.title);

        let base = raw;

        // Rewrite into usable ideas
        if (/reds/i.test(raw)) {
          base = "The Cincinnati Reds Have a Serious Problem";
        } else if (/bengals/i.test(raw)) {
          base = "The Bengals Might Be in Trouble";
        } else if (/cavaliers|cavs/i.test(raw)) {
          base = "Are the Cavs Actually Contenders?";
        } else if (/ohio state|buckeyes/i.test(raw)) {
          base = "Ohio State Has Questions Heading Into This Season";
        }

        return {
          baseIdea: base,
          titles: [
            base,
            base + " (And It's Getting Worse)",
            "This Is Why This Team Is Struggling",
            "What Nobody Is Saying About This Team",
            "The Real Problem No One Wants to Admit"
          ],
          hook:
            "If you've been watching this team, you can already tell something isn't right… and it's starting to become a real issue."
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