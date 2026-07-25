// Dynamic Supabase instance for upload helper
let supabaseInstance = null;
const SUPABASE_URL = 'https://begbdglouistmaughmot.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJlZ2JkZ2xvdWlzdG1hdWdobW90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyODMxMDEsImV4cCI6MjA5NDg1OTEwMX0.sKOHb6jifGH4P8ZFrc5tkPPkButNtfx1mJj9o-zC-rs';

async function getSupabase() {
    if (supabaseInstance) return supabaseInstance;
    const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
    supabaseInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    return supabaseInstance;
}

window.uploadNoteToFirebase = async function (file, metadata) {
    if (!file) return;

    try {
        const statusEl = document.getElementById('upload-status-text');
        const progressBar = document.getElementById('upload-progress');
        
        if (statusEl) statusEl.innerText = "📤 Uploading note file...";
        if (progressBar) progressBar.style.width = '30%';

        const currentUser = window.currentUser || window.authStatus?.data?.currentUser || {};
        const uploaderEmail = currentUser.email || 'guest@example.com';
        
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
        const filePath = `${metadata.college || 'general'}/${fileName}`;

        const supabase = await getSupabase();

        // ── Duplicate Check ─────────────────────────────────────────────────
        const titleNorm = (metadata.title || file.name).trim().toLowerCase();
        const [{ data: pendingDupe }, { data: approvedDupe }] = await Promise.all([
            supabase.from('pending_notes').select('id, title')
                .eq('college', metadata.college || 'Unknown')
                .eq('subject', metadata.subject || 'Unknown')
                .ilike('title', titleNorm),
            supabase.from('approved_notes').select('id, title')
                .eq('college', metadata.college || 'Unknown')
                .eq('subject', metadata.subject || 'Unknown')
                .ilike('title', titleNorm)
        ]);

        if ((pendingDupe && pendingDupe.length > 0) || (approvedDupe && approvedDupe.length > 0)) {
            const where = (approvedDupe && approvedDupe.length > 0) ? 'already published' : 'already pending review';
            throw new Error(`❌ Duplicate detected! A note titled "${metadata.title}" is ${where} for this subject. Please use a unique title.`);
        }
        // ───────────────────────────────────────────────────────────────────

        // 1. Upload to Supabase Storage (Bucket: 'notes')
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('notes')
            .upload(filePath, file, { upsert: true });

        if (uploadError) throw uploadError;

        if (progressBar) progressBar.style.width = '60%';
        if (statusEl) statusEl.innerText = "⏳ Finalizing upload details...";

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('notes')
            .getPublicUrl(filePath);

        // 2. Insert into pending_notes table
        const { error: insertError } = await supabase
            .from('pending_notes')
            .insert([{
                college: metadata.college || 'Unknown',
                stream: metadata.stream || 'Unknown',
                branch: metadata.branch || 'Unknown',
                semester: metadata.semester || 'Unknown',
                subject: metadata.subject || 'Unknown',
                title: metadata.title || file.name,
                file_url: publicUrl,
                uploader_email: uploaderEmail,
                uploader_name: metadata.uploader_name || uploaderEmail.split('@')[0],
                type: metadata.type || 'notes',
                status: 'pending'
            }]);

        if (insertError) throw insertError;

        // 3. Award XP globally via Supabase
        if (uploaderEmail && uploaderEmail !== 'guest@example.com') {
            try {
                // Check if user exists in Supabase
                const { data: userCheck } = await supabase.from('users').select('id').eq('email', uploaderEmail).single();
                
                if (!userCheck) {
                    // Create user and award initial points
                    await supabase.from('users').insert([{
                        id: currentUser.id || currentUser.uid || Math.random().toString(36).substr(2, 9),
                        email: uploaderEmail,
                        name: metadata.uploader_name || currentUser.name || uploaderEmail.split('@')[0],
                        avatar: currentUser.photo || currentUser.avatar || null,
                        collegename: metadata.college || currentUser.collegeName || 'Unknown',
                        xp: 50,
                        uploads: 1,
                        focusminutes: 0
                    }]);
                    console.log("🌟 Initialized global user and awarded 50 XP!");
                } else {
                    // Increment existing user's stats
                    const { error: rpcError } = await supabase.rpc('increment_user_stats', {
                        target_email: uploaderEmail,
                        xp_amount: 50,
                        uploads_amount: 1
                    });
                    if (rpcError) console.error("RPC Error:", rpcError);
                    else console.log("🌟 Awarded 50 XP globally via Supabase!");
                }
            } catch(e) {
                console.error("Global XP Sync Error:", e);
            }
        }

        if (progressBar) progressBar.style.width = '100%';
        if (statusEl) statusEl.innerText = "✅ Upload complete!";
        
        if (window.showToast) window.showToast("✅ Note uploaded and pending approval!");

        return { success: true, url: publicUrl };

    } catch (err) {
        console.error("Upload Error:", err);
        const statusEl = document.getElementById('upload-status-text');
        if (statusEl) statusEl.innerText = "❌ Upload failed!";
        throw err;
    }
};
