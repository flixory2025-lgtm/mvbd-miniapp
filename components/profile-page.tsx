<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover, user-scalable=no">
  <title>MVBD Profile — Liquid Glass</title>
  <!-- Tailwind CSS via CDN for rapid styling + custom glass layers -->
  <script src="https://cdn.tailwindcss.com"></script>
  <!-- Custom config to extend Tailwind with blur/backdrop effects & iOS safe area -->
  <style>
    /* iOS 26.4 inspired Liquid Glass — deep dark base, vibrant frosted glow */
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
      -webkit-tap-highlight-color: transparent;
    }

    body {
      background: #05050A;  /* ultra dark background */
      font-family: -apple-system, 'SF Pro Text', 'SF Pro Display', 'Helvetica Neue', system-ui, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    /* custom liquid glass card effect — deep blur with subtle inner border and vibrant backdrops */
    .glass-card {
      background: rgba(20, 22, 32, 0.6);
      backdrop-filter: blur(24px) saturate(180%);
      -webkit-backdrop-filter: blur(24px) saturate(180%);
      border-radius: 2rem;
      border: 0.5px solid rgba(255, 255, 255, 0.2);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0.5px rgba(255, 255, 255, 0.08);
      transition: all 0.2s ease;
    }

    /* extra smooth entries */
    .glass-card:hover {
      background: rgba(28, 30, 44, 0.7);
      border-color: rgba(255, 255, 255, 0.25);
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
    }

    /* inner fields liquid-frost */
    .frost-input {
      background: rgba(255, 255, 255, 0.08);
      backdrop-filter: blur(12px);
      border-radius: 1.25rem;
      border: 0.5px solid rgba(255, 255, 255, 0.1);
      transition: all 0.2s;
    }
    .frost-input:focus-within {
      background: rgba(255, 255, 255, 0.15);
      border-color: rgba(110, 231, 183, 0.5);
      box-shadow: 0 0 0 2px rgba(110, 231, 183, 0.2);
    }

    /* custom glossy button */
    .gloss-button {
      background: linear-gradient(135deg, rgba(52, 211, 153, 0.95) 0%, rgba(16, 185, 129, 1) 100%);
      backdrop-filter: blur(8px);
      border: none;
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2);
      border-radius: 2rem;
      font-weight: 600;
      letter-spacing: -0.3px;
    }
    .gloss-button:active {
      transform: scale(0.97);
      transition: transform 0.1s;
    }

    /* icon buttons liquid glass + haptic style */
    .link-btn {
      background: rgba(30, 32, 44, 0.65);
      backdrop-filter: blur(20px);
      border-radius: 1.5rem;
      border: 0.5px solid rgba(255, 255, 255, 0.12);
      transition: all 0.2s cubic-bezier(0.2, 0.9, 0.4, 1.1);
    }
    .link-btn:active {
      transform: scale(0.97);
      background: rgba(50, 55, 75, 0.8);
    }

    /* profile avatar ring with floating effect */
    .avatar-ring {
      background: linear-gradient(135deg, #34d399, #059669);
      padding: 3px;
      border-radius: 9999px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
    }

    /* custom scroll & safe area */
    .safe-bottom {
      padding-bottom: env(safe-area-inset-bottom, 1rem);
    }

    /* custom icon background gradient presets with vibrant iOS glow */
    .icon-bg-manager { background: linear-gradient(145deg, #22c55e, #15803d); }
    .icon-bg-fb { background: linear-gradient(145deg, #1877f2, #0e5bc2); }
    .icon-bg-telegram { background: linear-gradient(145deg, #2aabee, #1c92d2, #0088cc); }

    /* special glass badge for edit state */
    input, input:focus {
      outline: none;
    }
    .text-glow {
      text-shadow: 0 2px 5px rgba(0,0,0,0.2);
    }
  </style>
</head>
<body class="bg-[#030307]">

<div class="min-h-screen pb-8 safe-bottom" style="background: radial-gradient(circle at 10% 20%, #0B0B14, #020205);">
  
  <!-- Header with Liquid glass effect + Logo blurred backing -->
  <div class="sticky top-0 z-40 backdrop-blur-2xl bg-black/40 border-b border-white/10 shadow-sm">
    <div class="px-4 py-4 flex items-center justify-center">
      <div class="relative">
        <div class="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-sky-500/20 blur-2xl rounded-full"></div>
        <img src="/mvbd-logo.png" alt="MVBD Logo" class="w-24 h-24 object-contain drop-shadow-xl relative z-10" 
             onerror="this.src='https://placehold.co/96x96/1a2a3a/34d399?text=MVBD'">
      </div>
    </div>
  </div>

  <div class="px-5 py-6 space-y-6 max-w-2xl mx-auto">
    
    <!-- Profile Card : Liquid Glass (heavy blur, rounded-3xl) -->
    <div class="glass-card p-6 transition-all duration-300">
      <!-- profile avatar section -->
      <div class="flex flex-col items-center mb-6">
        <div class="avatar-ring mb-4">
          <div class="w-24 h-24 rounded-full overflow-hidden bg-slate-800 flex items-center justify-center">
            <img src="/mvbd-logo.png" alt="Profile Avatar" class="w-full h-full object-cover"
                 onerror="this.src='https://placehold.co/96x96/2d3e4f/ffffff?text=👤'">
          </div>
        </div>
        <h2 class="text-white text-2xl font-semibold tracking-tight drop-shadow-md" id="profileNameDisplay">
          <!-- dynamic name -->
        </h2>
      </div>

      <!-- Profile fields : liquid glass inner sections -->
      <div class="space-y-4" id="profileFieldsContainer">
        <!-- fields will be injected via js to keep interactive consistency -->
      </div>

      <!-- edit/save button with liquid glass styling -->
      <div class="mt-6">
        <button id="editSaveBtn" class="gloss-button w-full py-3.5 text-white text-lg font-semibold tracking-wide active:scale-98 transition-all shadow-lg">
          Edit Profile
        </button>
      </div>
    </div>

    <!-- Contact Us Section (liquid glass style group) -->
    <div class="glass-card p-6">
      <div class="mb-4">
        <h3 class="text-white text-2xl font-semibold tracking-tight">Contact Us</h3>
        <p class="text-slate-300 text-sm mt-1 opacity-80">Get in touch with us</p>
      </div>
      <div class="space-y-3" id="socialLinksContainer">
        <!-- social links will be populated dynamically by js with glassmorphic style -->
      </div>
    </div>
  </div>
</div>

<script>
  // -------------------------- DATA & STATE (mirroring original profile)
  let profile = {
    name: "",
    age: "",
    email: "",
    phone: ""
  };
  let isEditing = false;

  // social links exact from original code (icons + links)
  const socialLinksData = [
    {
      id: "manager",
      title: "Manager",
      subtitle: "01945715199",
      iconType: "phone",
      iconBgClass: "icon-bg-manager",
      link: "tel:01945715199",
    },
    {
      id: "fb-page1",
      title: "Facebook Page 1",
      subtitle: "Visit our page",
      iconType: "facebook",
      iconBgClass: "icon-bg-fb",
      link: "https://www.facebook.com/share/14V2B4K8zkC/",
    },
    {
      id: "fb-page2",
      title: "Facebook Page 2",
      subtitle: "Visit our page",
      iconType: "facebook",
      iconBgClass: "icon-bg-fb",
      link: "https://www.facebook.com/share/1AWJvyVYZt/",
    },
    {
      id: "private-group",
      title: "Private Request Group",
      subtitle: "Join our private group",
      iconType: "facebook",
      iconBgClass: "icon-bg-fb",
      link: "https://www.facebook.com/groups/963258709145001/?ref=share&mibextid=NSMWBT",
    },
    {
      id: "public-group",
      title: "Public Request Group",
      subtitle: "Join our public group",
      iconType: "facebook",
      iconBgClass: "icon-bg-fb",
      link: "https://www.facebook.com/groups/733950559669339/?ref=share&mibextid=NSMWBT",
    },
    {
      id: "telegram",
      title: "Telegram Channels",
      subtitle: "Join all our channels",
      iconType: "telegram",
      iconBgClass: "icon-bg-telegram",
      link: "https://t.me/addlist/KsvYsf4YPzliZjY1",
    }
  ];

  // Helper: get SVG for each icon type
  function getIconSvg(iconType) {
    if (iconType === "phone") {
      return `<svg viewBox="0 0 24 24" class="w-6 h-6 fill-white" stroke="none"><path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24 11.36 11.36 0 003.58.57 1 1 0 011 .99V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 01.99 1 11.36 11.36 0 00.57 3.58 1 1 0 01-.25 1.01l-2.2 2.2z"/></svg>`;
    }
    if (iconType === "facebook") {
      return `<svg viewBox="0 0 24 24" class="w-6 h-6 fill-white"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>`;
    }
    if (iconType === "telegram") {
      return `<svg viewBox="0 0 24 24" class="w-6 h-6 fill-white"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>`;
    }
    return `<svg class="w-6 h-6 fill-white" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg>`;
  }

  // render profile fields (edit vs view) using liquid glass UI
  function renderProfileFields() {
    const container = document.getElementById("profileFieldsContainer");
    if (!container) return;

    const fieldsData = [
      { label: "নাম", key: "name", icon: "User", placeholder: "আপনার নাম লিখুন" },
      { label: "বয়স", key: "age", icon: "Calendar", placeholder: "আপনার বয়স লিখুন" },
      { label: "Email", key: "email", icon: "Mail", placeholder: "আপনার email লিখুন", type: "email" },
      { label: "Phone Number", key: "phone", icon: "Phone", placeholder: "আপনার নম্বর লিখুন", type: "tel" }
    ];

    const iconMap = {
      User: `<svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>`,
      Calendar: `<svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>`,
      Mail: `<svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>`,
      Phone: `<svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>`
    };

    let fieldsHtml = "";
    for (let field of fieldsData) {
      const value = profile[field.key] || "";
      const inputType = field.type || "text";
      if (isEditing) {
        fieldsHtml += `
          <div class="frost-input p-4 flex items-center gap-3 transition-all">
            <div class="flex-shrink-0">${iconMap[field.icon]}</div>
            <div class="flex-1">
              <label class="text-slate-300 text-xs uppercase tracking-wide font-medium">${field.label}</label>
              <input type="${inputType}" id="input-${field.key}" value="${escapeHtml(value)}" 
                class="w-full bg-transparent text-white text-base mt-0.5 outline-none placeholder:text-slate-500" 
                placeholder="${field.placeholder}">
            </div>
          </div>
        `;
      } else {
        fieldsHtml += `
          <div class="frost-input p-4 flex items-center gap-3">
            <div class="flex-shrink-0">${iconMap[field.icon]}</div>
            <div class="flex-1">
              <label class="text-slate-300 text-xs uppercase tracking-wide font-medium">${field.label}</label>
              <p class="text-white text-base font-medium mt-0.5 break-all">${value ? escapeHtml(value) : '<span class="text-slate-400 font-normal">সেট করা হয়নি</span>'}</p>
            </div>
          </div>
        `;
      }
    }
    container.innerHTML = fieldsHtml;

    // if editing, attach listeners to update profile object on the fly
    if (isEditing) {
      const nameInput = document.getElementById("input-name");
      const ageInput = document.getElementById("input-age");
      const emailInput = document.getElementById("input-email");
      const phoneInput = document.getElementById("input-phone");
      if (nameInput) nameInput.addEventListener("input", (e) => { profile.name = e.target.value; updateDisplayName(); });
      if (ageInput) ageInput.addEventListener("input", (e) => { profile.age = e.target.value; });
      if (emailInput) emailInput.addEventListener("input", (e) => { profile.email = e.target.value; });
      if (phoneInput) phoneInput.addEventListener("input", (e) => { profile.phone = e.target.value; });
    }
  }

  function updateDisplayName() {
    const nameEl = document.getElementById("profileNameDisplay");
    if (nameEl) nameEl.innerText = profile.name || "আপনার নাম";
  }

  function escapeHtml(str) {
    if (!str) return "";
    return str.replace(/[&<>]/g, function(m) {
      if (m === '&') return '&amp;';
      if (m === '<') return '&lt;';
      if (m === '>') return '&gt;';
      return m;
    });
  }

  // render social links with liquid glass interactions
  function renderSocialLinks() {
    const container = document.getElementById("socialLinksContainer");
    if (!container) return;
    let linksHtml = "";
    for (let item of socialLinksData) {
      const iconSvg = getIconSvg(item.iconType);
      linksHtml += `
        <button class="link-btn w-full flex items-center gap-4 p-4 transition-all cursor-pointer group">
          <div class="w-12 h-12 rounded-full ${item.iconBgClass} flex items-center justify-center flex-shrink-0 shadow-md group-active:scale-95 transition">
            ${iconSvg}
          </div>
          <div class="text-left flex-1">
            <p class="text-white font-semibold text-[1rem] tracking-wide">${item.title}</p>
            <p class="text-slate-300 text-sm opacity-80">${item.subtitle}</p>
          </div>
          <div class="opacity-40 group-hover:opacity-100 transition">
            <svg class="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
          </div>
        </button>
      `;
    }
    container.innerHTML = linksHtml;
    // attach event listeners for each button (open link)
    const btns = container.querySelectorAll(".link-btn");
    btns.forEach((btn, idx) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const link = socialLinksData[idx].link;
        if (link) window.open(link, "_blank");
      });
    });
  }

  // load from localStorage & update UI fully
  function loadProfileFromStorage() {
    const saved = localStorage.getItem("mvbd_profile");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        profile = { name: parsed.name || "", age: parsed.age || "", email: parsed.email || "", phone: parsed.phone || "" };
      } catch(e) { console.warn(e); }
    } else {
      profile = { name: "", age: "", email: "", phone: "" };
    }
    updateDisplayName();
    renderProfileFields();   // fresh render based on isEditing flag
  }

  function saveProfileToStorage() {
    localStorage.setItem("mvbd_profile", JSON.stringify(profile));
  }

  function handleEditSave() {
    const btn = document.getElementById("editSaveBtn");
    if (isEditing) {
      // save mode: capture latest from inputs (if editing active)
      // Since renderProfileFields binds live inputs to profile object, profile is already in sync
      saveProfileToStorage();
      isEditing = false;
      btn.innerText = "Edit Profile";
      renderProfileFields();   // switch to view mode
    } else {
      isEditing = true;
      btn.innerText = "Save";
      renderProfileFields();   // switch to edit mode with inputs
    }
  }

  // emergency sync to ensure any additional direct changes (legacy)
  function syncProfileFromDOM() {
    if (isEditing) {
      const nameInp = document.getElementById("input-name");
      if(nameInp) profile.name = nameInp.value;
      const ageInp = document.getElementById("input-age");
      if(ageInp) profile.age = ageInp.value;
      const emailInp = document.getElementById("input-email");
      if(emailInp) profile.email = emailInp.value;
      const phoneInp = document.getElementById("input-phone");
      if(phoneInp) profile.phone = phoneInp.value;
      updateDisplayName();
    }
  }

  // event binding for edit/save button
  function bindMainButton() {
    const btn = document.getElementById("editSaveBtn");
    if (btn) {
      btn.removeEventListener("click", handleEditSave);
      btn.addEventListener("click", () => {
        if (isEditing) {
          syncProfileFromDOM();  // final sync before save
          saveProfileToStorage();
          isEditing = false;
          btn.innerText = "Edit Profile";
          renderProfileFields();
        } else {
          isEditing = true;
          btn.innerText = "Save";
          renderProfileFields();
        }
        updateDisplayName();
      });
    }
  }

  // initial render and reactive functions
  function init() {
    loadProfileFromStorage();
    renderSocialLinks();
    bindMainButton();
    // additional reset display name after any changes
    updateDisplayName();
  }

  // re-run when needed (call on load)
  init();

  // save before page unload to ensure input fields if any late changes (extra safe)
  window.addEventListener("beforeunload", () => {
    if (isEditing) {
      syncProfileFromDOM();
      localStorage.setItem("mvbd_profile", JSON.stringify(profile));
    }
  });
</script>

<!-- ensure no layout shift, perfect liquid glass appearance on all devices -->
</body>
</html>
