import { db, doc, onSnapshot, increment, updateDoc, serverTimestamp } from './firebase-config.js?v=6.0';

const ANALYTICS_DOC = 'analytics/global';

export function initGlobalAnalytics() {
    const ref = doc(db, ANALYTICS_DOC);

    window.globalAnalyticsData = window.globalAnalyticsData || {};

    // Fetch Supabase Admin Config and Subscribe
    (async () => {
        try {
            const { supabase } = await import('./supabase-config.js');
            const loadStats = async () => {
                const { data, error } = await supabase.from('dashboard_stats').select('*').eq('id', 1).single();
                if (data) {
                    window.globalAnalyticsData.adminTotalStudents = data.students;
                    window.globalAnalyticsData.adminTotalViews = data.views;
                    window.globalAnalyticsData.adminTotalDownloads = data.downloads;
                    window.globalAnalyticsData.adminTotalResources = data.resources;
                    
                    // Update Dashboard UI dynamically if already rendered
                    const elStudents = document.getElementById('display-students');
                    const elViews = document.getElementById('total-views-count');
                    const elDownloads = document.getElementById('display-downloads');
                    const elResources = document.getElementById('total-resources-count');
                    
                    if (elStudents && data.students) elStudents.innerText = data.students;
                    if (elViews && data.views) elViews.innerText = data.views;
                    if (elDownloads && data.downloads) elDownloads.innerText = data.downloads;
                    if (elResources && data.resources) elResources.innerText = data.resources;
                }
            };
            
            loadStats();

            // Realtime Subscription
            supabase.channel('dashboard_stats_changes')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'dashboard_stats' }, payload => {
                    loadStats();
                })
                .subscribe();
                
        } catch(err) {
            console.warn("Could not setup Supabase analytics config", err);
        }
    })();

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
