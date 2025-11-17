require("dotenv").config();
const axios = require("axios");

async function testLinkedInJobFetch() {
    console.log("🔍 Testing LinkedIn job fetch...");
    
    // Check if RAPIDAPI_KEY is available
    if (!process.env.RAPIDAPI_KEY) {
        console.error("❌ RAPIDAPI_KEY not found in .env file");
        return;
    }
    
    console.log("✅ RAPIDAPI_KEY found:", process.env.RAPIDAPI_KEY.substring(0, 10) + "...");
    
    try {
        const query = "Internship Remote Full Stack Backend Frontend Generative AI";
        const location = "Worldwide";
        
        // Using RapidAPI LinkedIn Jobs API
        const url = "https://linkedin-jobs-search.p.rapidapi.com/";
        
        const options = {
            method: 'GET',
            url: url,
            params: {
                keywords: query,
                location: location,
                dateSincePosted: 'past24Hours',
                sort: 'mostRecent'
            },
            headers: {
                'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
                'X-RapidAPI-Host': 'linkedin-jobs-search.p.rapidapi.com'
            }
        };
        
        console.log("🌐 Making request to RapidAPI LinkedIn Jobs...");
        console.log("URL:", url);
        console.log("Params:", options.params);
        
        const response = await axios.request(options);
        const data = response.data;
        
        console.log("📊 Response status:", response.status);
        console.log("📋 Response keys:", Object.keys(data));
        
        if (data.error) {
            console.error("❌ RapidAPI Error:", data.error);
            return;
        }
        
        // RapidAPI response structure might be different
        let jobs = data;
        if (Array.isArray(data)) {
            jobs = data;
        } else if (data.data && Array.isArray(data.data)) {
            jobs = data.data;
        } else if (data.jobs && Array.isArray(data.jobs)) {
            jobs = data.jobs;
        } else {
            console.log("⚠️ Unexpected response structure");
            console.log("Full response:", JSON.stringify(data, null, 2));
            return;
        }
        
        console.log(`✅ Found ${jobs.length} jobs`);
        
        // Show first 3 jobs as sample
        jobs.slice(0, 3).forEach((job, index) => {
            console.log(`\n📝 Job ${index + 1}:`);
            console.log("  Title:", job.title || job.jobTitle || "N/A");
            console.log("  Company:", job.company || job.companyName || job.company_name || "N/A");
            console.log("  Location:", job.location || "N/A");
            console.log("  Link:", job.url || job.link || job.jobUrl || "N/A");
            console.log("  Description preview:", (job.description || job.jobDescription || "").substring(0, 100) + "...");
        });
        
        // Test keyword matching
        const KEYWORDS = [
            "remote", "intern", "internship", "summer", "full stack", "full-stack",
            "backend", "back end", "frontend", "front end", "react", "node", "mern",
            "generative ai", "gen ai", "ai", "machine learning", "ml engineer"
        ];
        
        let matchingJobs = 0;
        jobs.forEach(job => {
            const text = ((job.title || job.jobTitle || "") + " " + 
                         (job.company || job.companyName || job.company_name || "") + " " + 
                         (job.location || "") + " " + 
                         (job.description || job.jobDescription || "")).toLowerCase();
            const matches = KEYWORDS.some(keyword => text.includes(keyword.toLowerCase()));
            if (matches) matchingJobs++;
        });
        
        console.log(`\n🎯 Jobs matching keywords: ${matchingJobs}/${jobs.length}`);
        
    } catch (error) {
        console.error("❌ Error fetching jobs:", error.message);
        if (error.response) {
            console.error("Response status:", error.response.status);
            console.error("Response data:", error.response.data);
        }
    }
}

// Run the test
testLinkedInJobFetch();