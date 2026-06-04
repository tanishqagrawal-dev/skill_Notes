const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://begbdglouistmaughmot.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJlZ2JkZ2xvdWlzdG1hdWdobW90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyODMxMDEsImV4cCI6MjA5NDg1OTEwMX0.sKOHb6jifGH4P8ZFrc5tkPPkButNtfx1mJj9o-zC-rs';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const demoUsers = [
  {
    id: 'demo-neo-matrix',
    email: 'neo@matrix.edu',
    name: 'Neo Matrix',
    avatar: 'https://i.pravatar.cc/150?img=11',
    collegename: 'Cybernetics Institute',
    xp: 9500,
    uploads: 42,
    focusminutes: 12500
  },
  {
    id: 'demo-nova-core',
    email: 'nova@core.edu',
    name: 'Nova Core',
    avatar: 'https://i.pravatar.cc/150?img=47',
    collegename: 'Quantum University',
    xp: 8200,
    uploads: 35,
    focusminutes: 9800
  },
  {
    id: 'demo-cipher-ai',
    email: 'cipher@ai.edu',
    name: 'Cipher AI',
    avatar: 'https://i.pravatar.cc/150?img=33',
    collegename: 'Medicaps University', // Included Medicaps to boost it
    xp: 12400,
    uploads: 58,
    focusminutes: 15600
  }
];

async function insertUsers() {
  console.log("Injecting high-tech demo users...");
  const { data, error } = await supabase.from('users').upsert(demoUsers, { onConflict: 'email' });
  
  if (error) {
    console.error("Error inserting users:", error);
  } else {
    console.log("Successfully inserted demo users!");
  }
}

insertUsers();
