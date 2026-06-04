const SUPABASE_URL = 'https://begbdglouistmaughmot.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJlZ2JkZ2xvdWlzdG1hdWdobW90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyODMxMDEsImV4cCI6MjA5NDg1OTEwMX0.sKOHb6jifGH4P8ZFrc5tkPPkButNtfx1mJj9o-zC-rs';

async function createBucket() {
  try {
    const response = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({ id: 'avatars', name: 'avatars', public: true })
    });
    
    if (!response.ok) {
        console.error("Error:", await response.text());
    } else {
        console.log("Bucket created:", await response.json());
    }
  } catch(e) {
      console.error(e);
  }
}

createBucket();
