/**
 * Deep Linking Routing Utility for SKiL MATRiX
 * Handles path parsing, state application, and URL synchronization.
 */

export const RoutingSystem = {
    // Current route structure: /notes/college/branch/year/semester/subject

    /**
     * Parses the current URL path into a filter state object.
     */
    parseRoute() {
        const path = window.location.pathname;
        const parts = path.split('/').filter(p => p !== '' && p !== 'notes');

        return {
            college: parts[0] || null,
            branch: parts[1] || null,
            year: parts[2] || null,
            semester: parts[3] || null,
            subject: parts[4] || null
        };
    },

    /**
     * Updates the URL based on the current selection state.
     * @param {Object} state - The selection state from note-hub.js
     */
    updateURL(state) {
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
     * Reconstructs the UI state from the URL on initial load.
     * @param {Function} stateApplier - Callback to update note-hub.js state
     */
    initFromURL(GlobalData, stateApplier, navigateToStep) {
        const route = this.parseRoute();
        console.log("Initializing from route:", route);

        if (!route.college) return;

        // 1. Resolve College
        const college = GlobalData.colleges.find(c => c.id === route.college);
        if (college) {
            stateApplier('college', { id: college.id, name: college.name });

            // 2. Resolve Branch
            if (route.branch) {
                const branch = GlobalData.branches.find(b => b.id === route.branch);
                if (branch) {
                    stateApplier('branch', { id: branch.id, name: branch.name });

                    // 3. Resolve Year
                    if (route.year) {
                        const year = GlobalData.years.find(y => y.toLowerCase().replace(/\s+/g, '-') === route.year);
                        if (year) {
                            stateApplier('year', year);

                            // 4. Resolve Semester
                            if (route.semester) {
                                // Match semester ignoring case/format
                                const sem = ['Semester 1', 'Semester 2', 'Semester 3', 'Semester 4', 'Semester 5', 'Semester 6', 'Semester 7', 'Semester 8']
                                    .find(s => s.toLowerCase().replace(/\s+/g, '-') === route.semester);

                                if (sem) {
                                    stateApplier('semester', sem);

                                    // 5. Resolve Subject
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
    }
};
