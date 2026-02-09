/**
 * Deep Linking Routing Utility for SKiL MATRiX
 * Handles path parsing, state application, and URL synchronization.
 */

export const RoutingSystem = {
    /**
     * Parses the current URL for filters (handles both path /notes/col/br and query ?col=...).
     */
    parseURLFilters() {
        const path = window.location.pathname;
        const searchParams = new URLSearchParams(window.location.search);

        // Try path segments first
        const parts = path.split('/').filter(p => p !== '' && p !== 'notes' && p !== 'pages');

        return {
            college: parts[0] || searchParams.get('college') || null,
            branch: parts[1] || searchParams.get('branch') || null,
            year: parts[2] || searchParams.get('year') || null,
            semester: parts[3] || searchParams.get('sem') || null,
            subject: parts[4] || searchParams.get('subject') || null
        };
    },

    /**
     * Updates the URL based on the current selection state.
     */
    updateURLOnFilterChange(state) {
        let path = '/notes';

        if (state.college) path += `/${state.college.id}`;
        if (state.branch) path += `/${state.branch.id}`;
        if (state.year) path += `/${state.year.replace(/\s+/g, '-').toLowerCase()}`;
        if (state.semester) path += `/${state.semester.replace(/\s+/g, '-').toLowerCase()}`;
        if (state.subject) path += `/${state.subject.id}`;

        if (window.location.pathname !== path) {
            window.history.pushState(state, '', path);
        }
    },

    /**
     * Applies filters to the UI by resolving data and navigating steps.
     */
    applyFiltersToUI(GlobalData, stateApplier) {
        const route = this.parseURLFilters();
        if (!route.college) return null;

        const college = GlobalData.colleges.find(c => c.id === route.college);
        if (college) {
            stateApplier('college', { id: college.id, name: college.name });
            if (route.branch) {
                const branch = GlobalData.branches.find(b => b.id === route.branch);
                if (branch) {
                    stateApplier('branch', { id: branch.id, name: branch.name });
                    if (route.year) {
                        const year = GlobalData.years.find(y => y.toLowerCase().replace(/\s+/g, '-') === route.year);
                        if (year) {
                            stateApplier('year', year);
                            if (route.semester) {
                                const sem = ['Semester 1', 'Semester 2', 'Semester 3', 'Semester 4', 'Semester 5', 'Semester 6', 'Semester 7', 'Semester 8']
                                    .find(s => s.toLowerCase().replace(/\s+/g, '-') === route.semester || s.includes(route.semester));
                                if (sem) {
                                    stateApplier('semester', sem);
                                    if (route.subject) {
                                        const key = `${branch.id}-${year}`;
                                        const subject = (GlobalData.subjects[key] || []).find(s => s.id === route.subject);
                                        if (subject) {
                                            stateApplier('subject', { id: subject.id, name: subject.name });
                                            return "SHOW_NOTES";
                                        }
                                    }
                                    return "SUBJECT_STEP";
                                }
                            }
                            return "SEMESTER_STEP";
                        }
                    }
                    return "YEAR_STEP";
                }
            }
            return "BRANCH_STEP";
        }
        return null;
    },

    /**
     * Generates a canonical /notes path based on state.
     */
    generateCanonicalPath(state) {
        let path = '/notes';
        if (state.college) path += `/${state.college.id}`;
        if (state.branch) path += `/${state.branch.id}`;
        if (state.year) path += `/${state.year.replace(/\s+/g, '-').toLowerCase()}`;
        if (state.semester) path += `/${state.semester.replace(/\s+/g, '-').toLowerCase()}`;
        if (state.subject) path += `/${state.subject.id}`;
        return path;
    },

    /**
     * Generates a full shareable URL, ensuring it always points to the /notes deep link.
     * Handles subfolders (like GitHub Pages) and root domains automatically.
     */
    getShareableURL(state) {
        const origin = window.location.origin;
        // Detect if we are in a subfolder (e.g., /skill_notes/pages/notes.html)
        const pathParts = window.location.pathname.split('/');
        // If the 2nd segment is "pages" or "notes", the 1st segment is the subfolder
        let subfolder = '';
        const pagesIdx = pathParts.indexOf('pages');
        const notesIdx = pathParts.indexOf('notes');

        if (pagesIdx > 1) subfolder = '/' + pathParts.slice(1, pagesIdx).join('/');
        else if (notesIdx > 1) subfolder = '/' + pathParts.slice(1, notesIdx).join('/');

        return origin + subfolder + this.generateCanonicalPath(state);
    },

    /**
     * Copies the current shareable link to the clipboard.
     */
    async copyShareLink(state) {
        const url = this.getShareableURL(state);
        try {
            await navigator.clipboard.writeText(url);
            return true;
        } catch (err) {
            console.error('Failed to copy link:', err);
            // Fallback for non-https/unsupported browsers
            const textArea = document.createElement("textarea");
            textArea.value = url;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand("copy");
            document.body.removeChild(textArea);
            return true;
        }
    }
};

// Aliases for compatibility
RoutingSystem.parseRoute = RoutingSystem.parseURLFilters;
RoutingSystem.updateURL = RoutingSystem.updateURLOnFilterChange;
RoutingSystem.initFromURL = RoutingSystem.applyFiltersToUI;

// Expose globally
if (typeof window !== 'undefined') {
    window.RoutingSystem = RoutingSystem;
}
