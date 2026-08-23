/**
 * Deep Linking Routing Utility for SKiL MATRiX
 * Handles path parsing, state application, and URL synchronization.
 */

export const RoutingSystem = {
    /**
     * Parses the current URL for filters (handles hash #/notes/col/br and query ?col=...).
     */
    parseURLFilters() {
        const hash = window.location.hash;
        const searchParams = new URLSearchParams(window.location.search);

        // Try hash segments first (e.g. #/notes/medicaps/cs/2/dbms)
        const parts = hash.split('/').filter(p =>
            p !== '' &&
            p !== '#' &&
            p !== '#notes' &&
            p !== 'notes'
        );

        return {
            college: parts[0] || searchParams.get('college') || null,
            branch: parts[1] || searchParams.get('branch') || null,
            year: parts[2] || searchParams.get('year') || null,
            semester: parts[3] || searchParams.get('sem') || null,
            subject: parts[4] || searchParams.get('subject') || null
        };
    },

    /**
     * Updates the URL based on the current selection state using Hash Routing.
     */
    updateURLOnFilterChange(state) {
        let hash = '#/notes';

        const collegeId = state.college ? (state.college.id || state.college) : null;
        if (collegeId) hash += `/${collegeId}`;

        const branchId = state.branch ? (state.branch.id || state.branch) : null;
        if (branchId) hash += `/${branchId}`;

        const yearVal = state.year ? (state.year.id || state.year) : null;
        if (yearVal) hash += `/${yearVal.replace(/\s+/g, '-').toLowerCase()}`;

        const semVal = state.semester ? (state.semester.id || state.semester) : null;
        if (semVal) hash += `/${semVal.replace(/\s+/g, '-').toLowerCase()}`;

        const subjectId = state.subject ? (state.subject.id || state.subject) : null;
        if (subjectId) hash += `/${subjectId}`;

        if (window.location.hash !== hash) {
            window.history.replaceState(state, '', window.location.pathname + window.location.search + hash);
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
                                        const key = `${branch.id}-${sem}`;
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
     * Generates a canonical #/notes path based on state.
     */
    generateCanonicalPath(state) {
        let hash = '#/notes';

        const collegeId = state.college ? (state.college.id || state.college) : null;
        if (collegeId) hash += `/${collegeId}`;

        const branchId = state.branch ? (state.branch.id || state.branch) : null;
        if (branchId) hash += `/${branchId}`;

        const yearVal = state.year ? (state.year.id || state.year) : null;
        if (yearVal) hash += `/${yearVal.replace(/\s+/g, '-').toLowerCase()}`;

        const semVal = state.semester ? (state.semester.id || state.semester) : null;
        if (semVal) hash += `/${semVal.replace(/\s+/g, '-').toLowerCase()}`;

        const subjectId = state.subject ? (state.subject.id || state.subject) : null;
        if (subjectId) hash += `/${subjectId}`;

        return hash;
    },

    /**
     * Generates a full shareable URL, ensuring it always points to the #/notes deep link.
     */
    getShareableURL(state) {
        const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        const origin = isLocal ? window.location.origin : 'https://skilmatrix.site';
        const canonical = this.generateCanonicalPath(state);

        // Always point to /pages/dashboard (or /dashboard based on clean URLs) so Notes Hub opens correctly
        return origin + '/pages/dashboard' + canonical;
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
