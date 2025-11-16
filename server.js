require("dotenv").config();
const fs = require("fs");
const path = require("path");
const express = require("express");
const axios = require("axios");
const cron = require("node-cron");

console.log("🔌 Simple Job Search Bot Starting...");

// Validate ENV
const REQUIRED = ["BOT_TOKEN", "CHAT_ID", "RAPIDAPI_KEY"];
for (const v of REQUIRED) {
  if (!process.env[v]) {
    console.error("Missing env:", v);
    process.exit(1);
  }
}

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const PORT = process.env.PORT || 3000;

// ------------------- Seen Jobs -------------------
const SEEN_FILE = path.join(__dirname, "seen.json");
let seen = new Set();

try {
  if (fs.existsSync(SEEN_FILE)) {
    seen = new Set(JSON.parse(fs.readFileSync(SEEN_FILE)));
  }
} catch {}

// Save seen IDs
function saveSeen() {
  fs.writeFileSync(SEEN_FILE, JSON.stringify([...seen], null, 2));
}

// ------------------- Keywords -------------------
const KEYWORDS = [
  "remote", "intern", "internship", "summer",
  "full stack", "backend", "frontend",
  "react", "node", "mern",
  "generative ai", "ai", "ml", "machine learning"
];

// ------------------- Telegram Sender -------------------
async function sendTelegram(message) {
  try {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    await axios.post(url, {
      chat_id: CHAT_ID,
      text: message,
      parse_mode: "HTML"
    });
    console.log("✉️ Sent to Telegram");
  } catch (e) {
    console.log("❌ Telegram Error", e.message);
  }
}

// ------------------- Fetch Jobs (RapidAPI) -------------------
async function fetchJobs() {
  try {
    const res = await axios.get("https://jsearch.p.rapidapi.com/search", {
      params: {
        query: "remote internship full stack backend frontend generative ai",
        num_pages: 1
      },
      headers: {
        "x-rapidapi-key": RAPIDAPI_KEY,
        "x-rapidapi-host": "jsearch.p.rapidapi.com",
      }
    });

    return res.data.data || [];
  } catch (e) {
    console.log("❌ Job API Error:", e.message);
    return [];
  }
}

// ------------------- Keyword Match -------------------
function matches(job) {
  const txt = (job.job_title + job.employer_name + job.job_description).toLowerCase();
  return KEYWORDS.some(k => txt.includes(k));
}

// ------------------- Main Checking Function -------------------
async function checkJobs() {
  console.log("🔍 Checking jobs...");

  const jobs = await fetchJobs();

  for (const job of jobs) {
    if (!job.job_id) continue;

    if (seen.has(job.job_id)) continue;

    if (!matches(job)) continue;

    seen.add(job.job_id);
    saveSeen();

    const msg = `
<b>🔥 New Job Found</b>

<b>${job.job_title}</b>
Company: ${job.employer_name}
Location: ${job.job_country}

🔗 ${job.job_apply_link}
    `;

    await sendTelegram(msg);
  }
}

// ------------------- Express Server -------------------
const app = express();

app.get("/", (req, res) => {
  res.send("Simple Job Bot Running. Use /trigger or /status");
});

app.get("/trigger", async (req, res) => {
  await checkJobs();
  res.send("Manual check complete.");
});

app.get("/status", (req, res) => {
  res.json({
    seen: seen.size,
    last_check: new Date().toISOString()
  });
});

// ------------------- Start Server -------------------
app.listen(PORT, () => {
  console.log("🚀 Server running on port", PORT);

  // Run once at startup
  checkJobs();
});

// Cron every 5 minutes
cron.schedule("*/5 * * * *", checkJobs);
