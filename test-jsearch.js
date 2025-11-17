require("dotenv").config();
const axios = require("axios");

async function testJSearchAPI() {
    console.log("🔍 Testing JSearch API (RapidAPI)...");
    
    // Check if RAPIDAPI_KEY is available
    if (!process.env.RAPIDAPI_KEY) {
        console.error("❌ RAPIDAPI_KEY not found in .env file");
        return;
    }
    
    console.log("✅ RAPIDAPI_KEY found:", process.env.RAPIDAPI_KEY.substring(0, 10) + "...");
    
    try {
        console.log("🌐 Making request to JSearch API...");
        
        const response = await axios.get("https://jsearch.p.rapidapi.com/search", {
            params: {
                query: "remote internship full stack backend frontend generative ai",
                num_pages: 1
            },
            headers: {
                "x-rapidapi-key": process.env.RAPIDAPI_KEY,
                "x-rapidapi-host": "jsearch.p.rapidapi.com",
            }
        });
        
        const data = response.data;
        
        console.log("📊 Response status:", response.status);
        console.log("📋 Response keys:", Object.keys(data));
        
        if (data.status === "OK" && data.data) {
            console.log(`✅ Found ${data.data.length} jobs`);
            
            // Show first 3 jobs as sample
            data.data.slice(0, 3).forEach((job, index) => {
                console.log(`\n📝 Job ${index + 1}:`);
                console.log("  ID:", job.job_id || "N/A");
                console.log("  Title:", job.job_title || "N/A");
                console.log("  Company:", job.employer_name || "N/A");
                console.log("  Location:", job.job_country || "N/A");
                console.log("  Apply Link:", job.job_apply_link || "N/A");
                console.log("  Description preview:", (job.job_description || "").substring(0, 150) + "...");
            });
            
            // Test keyword matching
            const KEYWORDS = [
                "intern", "internship", "remote", "full stack", "backend", "frontend", 
                "react", "node", "ai", "machine learning", "generative ai"
            ];
            
            let matchingJobs = 0;
            data.data.forEach(job => {
                const text = (job.job_title + " " + job.employer_name + " " + job.job_description).toLowerCase();
                const matches = KEYWORDS.some(keyword => text.includes(keyword.toLowerCase()));
                if (matches) {
                    matchingJobs++;
                    console.log(`🎯 Match found: "${job.job_title}" at ${job.employer_name}`);
                }
            });
            
            console.log(`\n🎯 Jobs matching keywords: ${matchingJobs}/${data.data.length}`);
            
        } else {
            console.log("⚠️ Unexpected response structure");
            console.log("Full response:", JSON.stringify(data, null, 2));
        }
        
    } catch (error) {
        console.error("❌ Error fetching jobs:", error.message);
        if (error.response) {
            console.error("Response status:", error.response.status);
            console.error("Response data:", error.response.data);
        }
    }
}

// Run the test
testJSearchAPI();