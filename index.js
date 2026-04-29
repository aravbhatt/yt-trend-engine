require('dotenv').config();
const express = require('express');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;


// UI
app.get('/', (req, res) => {
  res.send(`
    <html>
      <body style="background:#111;color:white;font-family:sans-serif;padding:40px;">
        <h2>YT Trend Engine</h2>
        <input id="topic" placeholder="topic" />
        <button onclick="go()">Generate</button>
        <div id="out"></div>

        <script>
          async function go() {
            const topic = document.getElementById('topic').value;
            const res = await fetch('/ideas?topic=' + encodeURIComponent(topic));
            const data = await res.json();

            let html = '';
            data.forEach(d => {
              html += '<div style="margin-top:20px;padding:10px;background:#222">';
              html += '<b>' + d.baseIdea + '</b><br><br>';
              html += d.titles.join('<br>') + '<br><br>';
              html += d.hook;
              html += '</div>';
            });

            document.getElementById('out').innerHTML = html;
          }
        </script>
      </body>
    </html>
  `);
});


// IDEAS
app.get('/ideas', async (req, res) => {
  try {
    const topic = req.query.topic || 'sports';

    const r = await axios.get('https://www.googleapis.com/youtube/v3/search', {
      params: {
        part: 'snippet',
        q: topic,
        maxResults: 5,
        type: 'video',
        key: process.env.YOUTUBE_API_KEY
      }
    });

    const ideas = r.data.items.map(v => {
      const base = v.snippet.title;

      return {
        baseIdea: base,
        titles: [
          "The Truth About This: " + base,
          "This Is Getting Out of Control",
          "Why Fans Are Losing It Over This",
          "Nobody Is Talking About This Enough"
        ],
        hook: "This topic is getting attention right now."
      };
    });

    res.json(ideas);

  } catch (e) {
    res.send("error");
  }
});


// START
app.listen(PORT, () => {
  console.log("running on " + PORT);
});