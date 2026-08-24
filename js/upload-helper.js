let storageConfig = null;
let supabaseClients = [];

// Initialize Dynamic Configuration
async function getStorageConfig() {
    if (storageConfig) return storageConfig;
    
    const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') 
        ? '' 
        : 'https://skil-matrix-server.onrender.com';

    try {
        const res = await fetch(`${API_BASE}/api/storage-config`);
        storageConfig = await res.json();
        
        // Initialize all Supabase clients
        const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
        supabaseClients = storageConfig.databases.map(db => {
            return {
                id: db.id,
                client: createClient(db.url, db.anonKey)
            };
        });
        
        return storageConfig;
    } catch (e) {
        console.error("Failed to load storage config:", e);
        throw e;
    }
}

// Upload to specific Supabase client
async function uploadToSupabase(sbClient, filePath, file) {
    const { data: uploadData, error: uploadError } = await sbClient.storage
        .from('notes')
        .upload(filePath, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = sbClient.storage
        .from('notes')
        .getPublicUrl(filePath);

    return publicUrl;
}

// Upload to Cloudflare R2 via Backend Proxy
async function uploadToR2(filename, file) {
    const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') 
        ? '' 
        : 'https://skil-matrix-server.onrender.com';

    // 1. Get Presigned URL
    const urlRes = await fetch(`${API_BASE}/api/get-r2-upload-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename, contentType: file.type || 'application/pdf', size: file.size })
    });
    const urlData = await urlRes.json();
    if (!urlData.success) throw new Error(urlData.error);

    // 2. Upload file directly to R2
    const uploadRes = await fetch(urlData.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type || 'application/pdf' },
        body: file
    });
    
    if (!uploadRes.ok) throw new Error(`R2 Upload failed with status ${uploadRes.status}`);

    return urlData.publicUrl;
}

window.uploadNoteToFirebase = async function (file, metadata) {
    if (!file) return;

    const maxAllowedSize = 25 * 1024 * 1024; // 25MB
    if (file.size > maxAllowedSize) {
        throw new Error("File size exceeds the 25MB limit. Please upload a smaller file.");
    }

    try {
        const statusEl = document.getElementById('upload-status-text');
        const progressBar = document.getElementById('upload-progress');
        
        if (statusEl) statusEl.innerText = "🔄 Initializing storage systems...";
        if (progressBar) progressBar.style.width = '10%';

        await getStorageConfig();

        const currentUser = window.currentUser || window.authStatus?.data?.currentUser || {};
        const uploaderEmail = currentUser.email || 'guest@example.com';
        
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
        const filePath = `${metadata.college || 'general'}/${fileName}`;

        // ── Duplicate Check (Across ALL Databases) ──────────────────────────
        if (statusEl) statusEl.innerText = "🔍 Checking for duplicates...";
        const titleNorm = (metadata.title || file.name).trim().toLowerCase();
        
        const duplicateQueries = [];
        for (const sb of supabaseClients) {
            duplicateQueries.push(
                sb.client.from('pending_notes').select('id, title').eq('college', metadata.college || 'Unknown').eq('subject', metadata.subject || 'Unknown').ilike('title', titleNorm),
                sb.client.from('approved_notes').select('id, title').eq('college', metadata.college || 'Unknown').eq('subject', metadata.subject || 'Unknown').ilike('title', titleNorm)
            );
        }
        
        const dupeResults = await Promise.all(duplicateQueries);
        for (let i = 0; i < dupeResults.length; i++) {
            const { data } = dupeResults[i];
            if (data && data.length > 0) {
                const where = (i % 2 === 1) ? 'already published' : 'already pending review';
                throw new Error(`❌ Duplicate detected! A note titled "${metadata.title}" is ${where} for this subject. Please use a unique title.`);
            }
        }
        // ───────────────────────────────────────────────────────────────────

        // ── 1. FILE STORAGE K-METHOD (Sequential Fallback) ──────────────────
        if (statusEl) statusEl.innerText = "📤 Uploading note file...";
        if (progressBar) progressBar.style.width = '30%';

        // Build priority list: 1. Primary Supabase -> 2. R2 -> 3. Secondary Supabase
        const storageTargets = [];
        if (supabaseClients.length > 0) storageTargets.push({ type: 'supabase', id: supabaseClients[0].id, client: supabaseClients[0].client });
        if (storageConfig.r2Enabled) storageTargets.push({ type: 'r2', id: 'cloudflare_r2' });
        
        // Add remaining Supabase instances
        for (let i = 1; i < supabaseClients.length; i++) {
            storageTargets.push({ type: 'supabase', id: supabaseClients[i].id, client: supabaseClients[i].client });
        }

        let publicUrl = '';
        let finalStorageProvider = '';
        let fileSuccess = false;

        for (const target of storageTargets) {
            try {
                if (statusEl) statusEl.innerText = `📤 Uploading securely...`;
                if (target.type === 'supabase') {
                    publicUrl = await uploadToSupabase(target.client, filePath, file);
                } else if (target.type === 'r2') {
                    publicUrl = await uploadToR2(filePath, file);
                }
                finalStorageProvider = target.id;
                fileSuccess = true;
                console.log(`✅ Successfully uploaded to ${target.id}`);
                break; // Exit loop on success
            } catch (err) {
                console.warn(`⚠️ Storage ${target.id} failed:`, err.message);
                // Continue to next provider in fallback array
            }
        }

        if (!fileSuccess) {
            throw new Error("All storage systems are offline or full. Please try again later.");
        }

        if (progressBar) progressBar.style.width = '60%';
        if (statusEl) statusEl.innerText = "⏳ Saving note metadata...";

        // ── 2. DATABASE K-METHOD (Sequential Fallback) ──────────────────────
        let dbSuccess = false;
        
        for (const sb of supabaseClients) {
            try {
                if (statusEl) statusEl.innerText = `⏳ Saving note details...`;
                const { error: insertError } = await sb.client
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
                        status: 'pending',
                        storage_provider: finalStorageProvider,
                        storage_key: filePath
                    }]);

                if (insertError) throw insertError;
                
                dbSuccess = true;
                console.log(`✅ Successfully saved metadata to ${sb.id}`);
                
                // Try awarding XP on the SAME database that took the note (or primary)
                if (uploaderEmail && uploaderEmail !== 'guest@example.com') {
                    awardXP(sb.client, uploaderEmail, metadata, currentUser);
                }
                break; // Exit loop on success
            } catch (err) {
                console.warn(`⚠️ Database ${sb.id} failed:`, err.message);
                // Continue to next database
            }
        }

        if (!dbSuccess) {
            throw new Error("All database systems are offline or full.");
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

async function awardXP(supabase, uploaderEmail, metadata, currentUser) {
    try {
        const { data: userCheck } = await supabase.from('users').select('id').eq('email', uploaderEmail).single();
        if (!userCheck) {
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
        } else {
            const { error: rpcError } = await supabase.rpc('increment_user_stats', {
                target_email: uploaderEmail,
                xp_amount: 50,
                uploads_amount: 1
            });
            if (rpcError) console.error("RPC Error (XP):", rpcError);
        }
    } catch(e) {
        console.error("Global XP Sync Error:", e);
    }
}
