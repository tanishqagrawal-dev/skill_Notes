const EMAIL_CONFIG = {
  PUBLIC_KEY: "TFlGH0NvNrebJlGuw",
  SERVICE_ID: "service_m8e5uq7",
  TEMPLATE_ID: "template_h8nzrqd"
};

// Initialize EmailJS immediately (Reliability pattern from welcome.html)
(function () {
  if (typeof emailjs !== "undefined") {
    emailjs.init(EMAIL_CONFIG.PUBLIC_KEY);
  }
})();

// --- Utilities ---
function isSameWeek(date1, date2) {
  const getMon = d => {
    const dt = new Date(d);
    const day = dt.getDay();
    const diff = dt.getDate() - day + (day === 0 ? -6 : 1);
    dt.setDate(diff);
    dt.setHours(0,0,0,0);
    return dt.getTime();
  };
  return getMon(date1) === getMon(date2);
}

function generateSubjectsHTML(subjects) {
  let html = "";
  subjects.forEach(sub => {
    let color = "#ffffff";
    let bg = "#16263f";
    if (sub.attendance < 50) {
      color = "#ff6b6b";
      bg = "#2a1b2b";
    } else if (sub.attendance < 75) {
      color = "#ffd166";
      bg = "#2a261b";
    } else {
      color = "#4af6c3";
      bg = "#1b2a23";
    }
    html += `
      <div style="margin-bottom:8px; padding:10px; border-radius:10px; background:${bg}; color:${color}; font-size:13px;">
        📘 ${sub.name} — <b>${sub.attendance}%</b>
      </div>
    `;
  });
  return html;
}

function generateAISuggestion(subjects) {
  const low = subjects.filter(s => s.attendance < 50);
  if (low.length > 0) {
    return `Focus on ${low.map(s => s.name).join(", ")} immediately.`;
  }
  return "Great job! Maintain your consistency.";
}

// --- Main System ---
export function sendWeeklyMailIfEligible() {
  console.log("🔍 Checking Weekly Mail Eligibility...");
  
  let user = null;
  let subjects = null;

  try {
    let authUser = localStorage.getItem("auth_user_full");
    let guestUser = localStorage.getItem("guest_session");

    if (!authUser && guestUser) {
        console.log("🛡️ Guest user detected. Weekly mail disabled.");
        return;
    }

    let storedUser = JSON.parse(authUser || guestUser);
    if (!storedUser) return;

    // Construct the same dynamic key used in attendance-pro.js
    const userId = storedUser.email || storedUser.uid || storedUser.id || 'guest';
    const safeId = userId.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const storageKey = `atpro_data_v2_${safeId}`;
    
    const atproData = JSON.parse(localStorage.getItem(storageKey));
    
    if (storedUser && atproData && atproData.subjects) {
      user = {
        name: storedUser.name || "Scholar",
        email: storedUser.email || ""
      };
      
      let att = 0, miss = 0;
      atproData.subjects.forEach(s => {
        att += Math.max(0, s.attended || 0);
        miss += Math.max(0, s.missed || 0);
      });
      const total = att + miss;
      let percent = total === 0 ? 0 : (att / total) * 100;
      
      user.totalAttendance = percent.toFixed(1);
      user.attended = att;
      user.missed = miss;
      user.target = atproData.target || 75;
      
      subjects = atproData.subjects.map(s => {
        const sAtt = Math.max(0, s.attended || 0);
        const sMiss = Math.max(0, s.missed || 0);
        const sTotal = sAtt + sMiss;
        const sPercent = sTotal === 0 ? 0 : (sAtt / sTotal) * 100;
        const dashboardPercent = Math.round(parseFloat(sPercent.toFixed(1)));
        return {
          name: s.name,
          attendance: dashboardPercent
        };
      });
    }
  } catch (e) {
    console.error("Error parsing local storage data for weekly mail", e);
  }

  if (!user || !subjects || subjects.length === 0) {
    console.log("❌ No valid data for weekly mail packet.");
    return;
  }

  const today = new Date();
  const userEmail = user.email || "guest";
  const lastSentKey = `weekly_mail_sent_${userEmail.replace(/[^a-zA-Z0-9]/g, '_')}`;
  const lastSent = localStorage.getItem(lastSentKey);

  if (lastSent && isSameWeek(new Date(lastSent), today)) {
    console.log(`⏳ Weekly mail already sent to ${userEmail} this week. Quota preserved.`);
    return;
  }

  // --- CHECK USER SETTING ---
  const isEnabled = localStorage.getItem('setting_notifications_weekly_attendance') === 'true';
  if (!isEnabled) {
    console.log(`❌ Weekly attendance mail is disabled in user settings for ${userEmail}. Skipping.`);
    return;
  }

  // --- TRIGGERING PACKET (Style: Welcome HTML) ---
  console.log(`📨 Attempting to send Weekly Attendance Packet to ${userEmail}...`);

  if (typeof emailjs === "undefined") {
    console.error("❌ EmailJS library missing. Critical failure.");
    return;
  }

  const subjectsHTML = generateSubjectsHTML(subjects);
  const aiSuggestion = generateAISuggestion(subjects);

  const templateParams = {
    user_name: user.name,
    email: user.email,
    user_email: user.email,
    attendance: user.totalAttendance,
    attended: user.attended,
    missed: user.missed,
    target: user.target,
    subjects: subjectsHTML,
    ai_suggestion: aiSuggestion
  };

  emailjs.send(
    EMAIL_CONFIG.SERVICE_ID,
    EMAIL_CONFIG.TEMPLATE_ID,
    templateParams,
    EMAIL_CONFIG.PUBLIC_KEY
  ).then(
    function(response) {
      console.log("✅ Weekly Packet Sent Successfully:", response.status, response.text);
      localStorage.setItem(lastSentKey, new Date().toISOString());
    },
    function(error) {
      console.error("❌ Weekly Packet Error:", error);
    }
  );
}

// Make it globally accessible so AttendancePro can trigger it on save
window.sendWeeklyMailIfEligible = sendWeeklyMailIfEligible;
