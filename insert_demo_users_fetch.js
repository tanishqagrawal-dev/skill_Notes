const SUPABASE_URL = 'https://begbdglouistmaughmot.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJlZ2JkZ2xvdWlzdG1hdWdobW90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyODMxMDEsImV4cCI6MjA5NDg1OTEwMX0.sKOHb6jifGH4P8ZFrc5tkPPkButNtfx1mJj9o-zC-rs';

const demoUsers = [
  {
    id: 'demo-neo-matrix',
    email: 'alex@student.edu',
    name: 'Alex Sterling',
    avatar: 'assets/demo_neo.png',
    collegename: 'SVVV Indore',
    xp: 9500,
    uploads: 2,
    focusminutes: 220
  },
  {
    id: 'demo-nova-core',
    email: 'maya@student.edu',
    name: 'Maya Lin',
    avatar: 'assets/demo_nova.png',
    collegename: 'IPS Academy',
    xp: 8200,
    uploads: 9,
    focusminutes: 160
  },
  {
    id: 'demo-cipher-ai',
    email: 'julian@student.edu',
    name: 'Julian Vance',
    avatar: 'assets/demo_cipher.png',
    collegename: 'Medicaps University',
    xp: 12400,
    uploads: 58,
    focusminutes: 580
  }
];

async function insertUsers() {
  console.log("Injecting high-tech demo users...");
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/users`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify(demoUsers)
    });
    
    if (!response.ok) {
        const err = await response.text();
        console.error("Error inserting users:", err);
    } else {
        console.log("Successfully inserted demo users!");
    }
  } catch(e) {
      console.error(e);
  }
}

insertUsers();
