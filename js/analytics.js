import { db, doc, onSnapshot, increment, updateDoc, serverTimestamp } from './firebase-config.js?v=6.0';

const ANALYTICS_DOC = 'analytics/global';

export function initGlobalAnalytics() {
    const ref = doc(db, ANALYTICS_DOC);

    window.globalAnalyticsData = window.globalAnalyticsData || {};

    // Fetch Supabase Admin Config
    const SUPABASE_URL = 'https://begbdglouistmaughmot.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJlZ2JkZ2xvdWlzdG1hdWdobW90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyODMxMDEsImV4cCI6MjA5NDg1OTEwMX0.sKOHb6jifGH4P8ZFrc5tkPPkButNtfx1mJj9o-zC-rs';
    
    fetch(`${SUPABASE_URL}/rest/v1/dashboard_stats?id=eq.1`, {
        method: 'GET',
        cache: 'no-store',
        headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Cache-Control': 'no-cache'
        }
    }).then(res => res.json()).then(data => {
        if (data && data.length > 0) {
            const config = data[0];
            window.globalAnalyticsData.adminTotalStudents = config.students;
            window.globalAnalyticsData.adminTotalViews = config.views;
            window.globalAnalyticsData.adminTotalDownloads = config.downloads;
            window.globalAnalyticsData.adminTotalResources = config.resources;
            
            // Update Dashboard UI dynamically if already rendered
            const elStudents = document.getElementById('display-students');
            const elViews = document.getElementById('total-views-count');
            const elDownloads = document.getElementById('display-downloads');
            const elResources = document.getElementById('total-resources-count');
            
            if (elStudents && config.students) elStudents.innerText = config.students;
            if (elViews && config.views) elViews.innerText = config.views;
            if (elDownloads && config.downloads) elDownloads.innerText = config.downloads;
            if (elResources && config.resources) elResources.innerText = config.resources;
        }
    }).catch(err => console.warn("Could not fetch Supabase analytics config", err));

    onSnapshot(ref, (snap) => {
        if (!snap.exists()) return;
        const d = snap.data();
        
        // Merge Firebase data, but DO NOT overwrite admin overrides from Supabase
        window.globalAnalyticsData = { 
            ...d, 
            ...window.globalAnalyticsData 
        };

        // Update UI everywhere for raw stats
        const viewsEl = document.getElementById("views");
        const downloadsEl = document.getElementById("downloads");

        if (viewsEl) viewsEl.innerText = d.totalViews || 0;
        if (downloadsEl) downloadsEl.innerText = d.totalDownloads || 0;
    });

    // Page View Increment
    incrementViews();
}

export async function incrementViews() {
    const ref = doc(db, ANALYTICS_DOC);
    try {
        await updateDoc(ref, {
            totalViews: increment(1),
            updatedAt: serverTimestamp()
        });
    } catch (e) {
        console.warn("View tracking failed:", e);
    }
}

export async function incrementDownloads() {
    const ref = doc(db, ANALYTICS_DOC);
    try {
        await updateDoc(ref, {
            totalDownloads: increment(1),
            updatedAt: serverTimestamp()
        });
    } catch (e) {
        console.warn("Download tracking failed:", e);
    }
}
