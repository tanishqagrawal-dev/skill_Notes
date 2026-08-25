const url = 'https://begbdglouistmaughmot.supabase.co/rest/v1/approved_notes?title=ilike.Communication%25&select=*';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJlZ2JkZ2xvdWlzdG1hdWdobW90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyODMxMDEsImV4cCI6MjA5NDg1OTEwMX0.sKOHb6jifGH4P8ZFrc5tkPPkButNtfx1mJj9o-zC-rs';

fetch(url, {
    headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`
    }
})
.then(res => res.json())
.then(data => {
    console.log("Supabase note record:", JSON.stringify(data, null, 2));
})
.catch(err => console.error("Error fetching note:", err));
