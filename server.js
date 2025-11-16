// server.js
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const express = require("express");
const axios = require("axios");
const cron = require("node-cron");

console.log("🔌 Job Alert Bot initializing...");

// ------------------- Validate env -------------------
const REQUIRED = ["BOT_TOKEN", "CHAT_ID", "RAPIDAPI_KEY"];
for (const v of REQUIRED) {
  if (!process.env[v]) {
    console.error(`❌ Missing env var: ${v}. Please set it in .env and restart.`);
    process.exit(1);
  }
}

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const PORT = parseInt(process.env.PORT || "3000", 10);

// ------------------- Persistence for seen jobs -------------------
const SEEN_FILE = path.join(__dirname, "seen.json");
let seenJobs = new Set();

function loadSeen() {
  try {
    if (fs.existsSync(SEEN_FILE)) {
      const raw = fs.readFileSync(SEEN_FILE, "utf8");
      const arr = JSON.parse(raw || "[]");
      seenJobs = new Set(arr);
      console.log(`📦 Loaded ${seenJobs.size} seen job(s)`);
    } else {
      seenJobs = new Set();
    }
  } catch {
    seenJobs = new Set();
  }
}

function saveSeen() {
  try {
    fs.writeFileSync(SEEN_FILE, JSON.stringify([...seenJobs], null, 2), "utf8");
  } catch (err) {
    console.error("❌ Failed to save seen jobs:", err);
  }
}

loadSeen();

// ------------------- Keywords -------------------
const KEYWORDS = [
  "remote", "work from home", "wfh",
  "intern", "internship", "summer",
  "full stack", "full-stack", "backend", "frontend",
  "react", "node", "mern",
  "generative ai", "gen ai", "ai", "openai", "gpt",
  "machine learning", "ml engineer"
].map(k => k.toLowerCase());

// ------------------- Telegram Sender -------------------
async function sendTelegramMessage(text) {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  try {
    await axios.post(url, {
      chat_id: CHAT_ID,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: false
    });
    console.log("✉️ Telegram notification sent.");
  } catch (err) {
    console.error("❌ Telegram error:", err.response?.data || err.message);
  }
}

// ------------------- Fetch Jobs (RapidAPI JSearch) -------------------
async function fetchJobs() {
  const url = "https://jsearch.p.rapidapi.com/search";

  const params = {
    query:
      "remote internship software engineer full stack backend frontend generative ai",
    num_pages: 1
  };

  try {
    const { data } = await axios.get(url, {
      params,
      headers: {
        "x-rapidapi-key": RAPIDAPI_KEY,
        "x-rapidapi-host": "jsearch.p.rapidapi.com"
      },
      timeout: 15000
    });

    if (!data.data) return [];

    return data.data.map(job => ({
      id: job.job_id,
      title: job.job_title || "",
      company: job.employer_name || "",
      link: job.job_apply_link || job.job_google_link,
      location: job.job_country || "",
      description: job.job_description || ""
    }));
  } catch (err) {
    console.error("❌ RapidAPI error:", err.response?.data || err.message);
    return [];
  }
}

// ------------------- Matching logic -------------------
function matchesKeywords(job) {
  const text = `${job.title} ${job.company} ${job.location} ${job.description}`.toLowerCase();
  return KEYWORDS.some(k => text.includes(k));
}

// ------------------- Main job checker -------------------
async function checkJobs() {
  console.log("🔍 Checking jobs at", new Date().toISOString());

  const jobs = await fetchJobs();
  console.log(`ℹ️ Found ${jobs.length} jobs from API`);

  let sent = 0;

  for (const job of jobs) {
    if (!job.id || seenJobs.has(job.id)) continue;

    if (!matchesKeywords(job)) continue;

    // mark as seen
    seenJobs.add(job.id);
    sent++;

    let message = `
<b>🔥 New Relevant Internship / Job</b>

<b>${job.title}</b>
Company: ${job.company}
Location: ${job.location}

🔗 ${job.link}
`;

    await sendTelegramMessage(message);
    await new Promise(r => setTimeout(r, 300)); // safety delay
  }

  saveSeen();
  console.log(`✅ Notifications sent: ${sent}`);
  return sent;
}

// ------------------- Express server -------------------
const app = express();

app.get("/", (req, res) =>
  res.send("Job Alert Bot is running. Use /status or /trigger")
);

app.get("/status", (req, res) =>
  res.json({
    ok: true,
    total_seen: seenJobs.size,
    last_check: new Date().toISOString()
  })
);

app.get("/trigger", async (req, res) => {
  const count = await checkJobs();
  res.json({ ok: true, sent: count });
});

// ------------------- Start -------------------
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log("⏳ Running initial check...");
  checkJobs();
});

// cron: every 5 minutes
cron.schedule("*/5 * * * *", () => checkJobs());
