
// Admin Support Module
// Query Management & Reply System

window.AdminSupport = {
    state: {
        queries: [],
        filter: 'all', // all, pending, replied
        activeQuery: null
    },

    unsubscribe: null,

    // Initialize Listener
    init: function () {
        if (!window.firebaseServices) return;
        const { db, collection, query, orderBy, onSnapshot } = window.firebaseServices;

        const q = query(collection(db, "support_queries"), orderBy("createdAt", "desc"));

        this.unsubscribe = onSnapshot(q, (snapshot) => {
            const queries = [];
            snapshot.forEach((doc) => {
                queries.push({ id: doc.id, ...doc.data() });
            });
            this.state.queries = queries;
            this.renderInbox(); // Auto-refresh if viewing inbox
        }, (error) => {
            console.error("Support Inbox access denied/error:", error);
            const container = document.getElementById('admin-view-content');
            if (container && document.getElementById('admin-reply-msg') === null) {
                container.innerHTML = `
                    <div class="glass-card" style="padding: 2rem; border: 1px solid #ff4757;">
                        <h3 style="color: #ff4757; margin-bottom: 1rem;">⚠️ Access Error</h3>
                        <p style="color: white; margin-bottom: 1rem;">Could not load support tickets.</p>
                        <code style="display:block; background:rgba(0,0,0,0.3); padding:1rem; color:#a29bfe; border-radius:8px;">${error.message}</code>
                        <div style="margin-top:1rem; font-size:0.9rem; color:var(--text-dim);">
                            <strong>Tip:</strong> Ensure you have deployed the updated <code>firestore.rules</code> that include permissions for <code>support_queries</code>.
                        </div>
                    </div>
                 `;
            }
        });
    },

    // UI: Main Inbox
    renderInbox: function () {
        const container = document.getElementById('admin-view-content');
        if (!container) return; // Only run if admin view is active

        const filtered = this.state.queries.filter(q => {
            if (this.state.filter === 'all') return true;
            return q.status === this.state.filter;
        });

        const html = `
            <div class="glass-card" style="padding: 2rem;">
                <!-- Header -->
                <div style="display:flex; justify-content:space-between; margin-bottom: 2rem; align-items:center;">
                    <h2 class="font-heading">📨 Support Inbox</h2>
                    <div class="btn-group">
                        <button class="btn btn-sm ${this.state.filter === 'all' ? 'btn-primary' : 'btn-ghost'}" onclick="AdminSupport.setFilter('all')">All</button>
                        <button class="btn btn-sm ${this.state.filter === 'pending' ? 'btn-primary' : 'btn-ghost'}" onclick="AdminSupport.setFilter('pending')">Pending</button>
                         <button class="btn btn-sm ${this.state.filter === 'replied' ? 'btn-primary' : 'btn-ghost'}" onclick="AdminSupport.setFilter('replied')">Replied</button>
                    </div>
                </div>

                <!-- List -->
                <div class="table-container custom-scroll" style="max-height: 600px; overflow-y: auto;">
                    <table class="admin-table" style="width:100%;">
                        <thead>
                            <tr>
                                <th style="text-align:left;">User</th>
                                <th style="text-align:left;">Subject</th>
                                <th style="text-align:center;">Status</th>
                                <th style="text-align:right;">Date</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            ${filtered.map(q => `
                                <tr onclick="AdminSupport.openQuery('${q.id}')" style="cursor:pointer; transition: background 0.2s;" onmouseenter="this.style.background='rgba(255,255,255,0.05)'" onmouseleave="this.style.background='transparent'">
                                    <td>
                                        <div style="font-weight:600; color:white;">${q.name}</div>
                                        <div style="font-size:0.8rem; color:var(--text-dim);">${q.email}</div>
                                    </td>
                                    <td>
                                        <span style="color:var(--primary); font-size:0.9rem;">${q.subject}</span>
                                        <div style="font-size:0.85rem; color:var(--text-dim); max-width: 300px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
                                            ${q.message}
                                        </div>
                                    </td>
                                    <td style="text-align:center;">
                                        ${this.getStatusBadge(q.status)}
                                    </td>
                                    <td style="text-align:right; font-size:0.85rem; color:var(--text-dim);">
                                        ${q.createdAt ? new Date(q.createdAt.seconds * 1000).toLocaleDateString() : 'Just now'}
                                    </td>
                                    <td style="text-align:right;">👉</td>
                                </tr>
                            `).join('')}
                            ${filtered.length === 0 ? '<tr><td colspan="5" style="text-align:center; padding:3rem; color:var(--text-dim);">No queries found.</td></tr>' : ''}
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        // Inject into Admin Console
        // Note: AdminConsole.switchView('support') calls this.
        return html;
    },

    // UI: Detail View
    renderDetail: function (queryId) {
        const q = this.state.queries.find(x => x.id === queryId);
        if (!q) return `<div style="padding:2rem;">Query not found.</div>`;

        return `
            <div class="glass-card fade-in" style="padding: 2rem;">
                <button onclick="AdminSupport.switchView('inbox')" class="btn-icon" style="margin-bottom:1rem;">⬅ Back to Inbox</button>
                
                <div style="display:flex; justify-content:space-between; margin-bottom:2rem; border-bottom:1px solid var(--border-glass); padding-bottom:1.5rem;">
                    <div>
                        <h2 class="font-heading" style="margin-bottom:0.5rem;">${q.subject}</h2>
                        <div style="color:var(--text-dim);">
                            From: <strong style="color:white;">${q.name}</strong> &lt;${q.email}&gt;
                        </div>
                    </div>
                    <div>
                        ${this.getStatusBadge(q.status)}
                    </div>
                </div>

                <div style="background:rgba(0,0,0,0.3); padding:1.5rem; border-radius:8px; margin-bottom:2rem; border:1px solid var(--border-glass);">
                    <p style="white-space: pre-wrap; color:var(--text-main); line-height:1.6;">${q.message}</p>
                </div>

                <!-- Admin Reply Section -->
                <div style="background:rgba(123, 97, 255, 0.05); padding:1.5rem; border-radius:12px; border:1px solid rgba(123, 97, 255, 0.2);">
                    <h3 class="font-heading" style="font-size:1.1rem; margin-bottom:1rem;">👩‍💻 Admin Reply</h3>
                    
                    ${q.status === 'replied' ? `
                        <div style="color:#2ecc71; margin-bottom:1rem;">
                            ✅ Already replied on ${q.repliedAt ? new Date(q.repliedAt.seconds * 1000).toLocaleString() : 'recently'}.
                        </div>
                        <div style="padding:1rem; background:rgba(0,0,0,0.2); border-radius:6px; color:var(--text-dim); font-style:italic;">
                            "${q.replyMessage || '(No content stored)'}"
                        </div>
                    ` : `
                        <textarea id="admin-reply-msg" class="admin-input" style="min-height:150px; margin-bottom:1rem;" placeholder="Write your professional response here..."></textarea>
                        
                        <div style="display:flex; gap:1rem; align-items:center;">
                            <button onclick="AdminSupport.sendReply('${q.id}', '${q.email}', '${q.name}')" class="btn btn-primary" style="padding:0.8rem 1.5rem;">
                                🚀 Send Reply & Close Ticket
                            </button>
                            <span style="font-size:0.85rem; color:var(--text-dim);">
                                (This triggers a real email to the user)
                            </span>
                        </div>
                    `}
                </div>
            </div>
        `;
    },

    // Logic: Actions
    setFilter: function (f) {
        this.state.filter = f;
        this.refreshView();
    },

    openQuery: function (id) {
        const container = document.getElementById('admin-view-content');
        if (container) container.innerHTML = this.renderDetail(id);
    },

    switchView: function (mode) {
        const container = document.getElementById('admin-view-content');
        if (container) {
            if (mode === 'inbox') container.innerHTML = this.renderInbox();
        }
    },

    refreshView: function () {
        // Simple re-render of inbox
        const container = document.getElementById('admin-view-content');
        // Only refresh if we are currently looking at the list (heuristic)
        if (container && !document.getElementById('admin-reply-msg')) {
            container.innerHTML = this.renderInbox();
        }
    },

    sendReply: async function (queryId, userEmail, userName) {
        const msg = document.getElementById('admin-reply-msg').value;
        if (!msg.trim()) return alert("Please write a reply.");

        if (!confirm("Send this email to the user?")) return;

        const btn = document.querySelector('button[onclick*="sendReply"]');
        btn.disabled = true;
        btn.innerText = "Sending...";

        try {
            // 1. Send Email via EmailJS
            const config = window.EmailConfig;
            if (config && config.PUBLIC_KEY !== "YOUR_PUBLIC_KEY_HERE") {
                await emailjs.send(
                    config.SERVICE_ID,
                    config.TEMPLATE_ADMIN_REPLY,
                    {
                        to_name: userName,
                        to_email: userEmail,
                        admin_message: msg,
                        // Add any other template vars needed
                    }
                );
                console.log("📨 Admin reply sent via EmailJS");
            } else {
                console.warn("Simulating EmailJS send (Key missing)");
            }

            // 2. Update Firestore
            const { db, doc, updateDoc, serverTimestamp } = window.firebaseServices;
            const ref = doc(db, "support_queries", queryId);

            await updateDoc(ref, {
                status: 'replied',
                replyMessage: msg,
                repliedAt: serverTimestamp(),
                repliedBy: window.currentUser.id
            });

            alert("Reply sent successfully!");
            this.openQuery(queryId); // Refresh detail view

        } catch (e) {
            console.error(e);
            alert("Error sending reply: " + e.message);
            btn.disabled = false;
            btn.innerText = "Try Again";
        }
    },

    getStatusBadge: function (status) {
        const colors = {
            'pending': '#f1c40f', // yellow
            'replied': '#2ecc71', // green
            'closed': '#95a5a6'   // gray
        };
        const c = colors[status] || '#fff';
        return `
            <span style="background:${c}20; color:${c}; padding:0.25rem 0.6rem; border-radius:4px; font-size:0.75rem; font-weight:700; border:1px solid ${c}50; text-transform:uppercase;">
                ${status}
            </span>
        `;
    }
};

// Auto-init if loaded
// if(window.firebaseServices) window.AdminSupport.init();
