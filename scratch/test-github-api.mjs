import fetch from 'node-fetch';

async function getFolders() {
    const url = 'https://api.github.com/repos/snehasishroy/leetcode-companywise-interview-questions/contents';
    try {
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'node-fetch-app'
            }
        });
        if (!res.ok) {
            console.log(`Failed to fetch GitHub API: ${res.status} ${res.statusText}`);
            return;
        }
        const data = await res.json();
        const directories = data.filter(item => item.type === 'dir').map(item => item.name);
        console.log("Directories found in repo:", directories);
        console.log("Total directories count:", directories.length);
    } catch(e) {
        console.error("API error:", e);
    }
}

getFolders();
