require("dotenv").config();
const axios = require("axios");

async function testSimpleSearch() {
    console.log("🔍 Testing with simpler search queries...");
    
    const queries = [
        "software engineer intern",
        "remote internship",
        "full stack developer",
        "javascript developer",
        "react developer"
    ];
    
    for (const query of queries) {
        console.log(`\n🔎 Testing query: "${query}"`);
        
        try {
            const response = await axios.get("https://jsearch.p.rapidapi.com/search", {
                params: {
                    query: query,
                    num_pages: 1
                },
                headers: {
                    "x-rapidapi-key": process.env.RAPIDAPI_KEY,
                    "x-rapidapi-host": "jsearch.p.rapidapi.com",
                }
            });
            
            const data = response.data;
            
            if (data.status === "OK" && data.data) {
                console.log(`  ✅ Found ${data.data.length} jobs`);
                
                if (data.data.length > 0) {
                    // Show first job as sample
                    const job = data.data[0];
                    console.log(`  📝 Sample job: "${job.job_title}" at ${job.employer_name}`);
                    console.log(`  📍 Location: ${job.job_country}`);
                }
            } else {
                console.log("  ⚠️ No jobs found or unexpected response");
            }
            
        } catch (error) {
            console.error(`  ❌ Error for query "${query}":`, error.message);
        }
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
}

// Run the test
testSimpleSearch();