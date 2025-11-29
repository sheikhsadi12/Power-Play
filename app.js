/* =========================================
   CORE LOGIC & STATE (VERSION 2.2) - FIXED
   - Robust Initialization Logic for App opening.
   - Correct Player Cleanup on popstate (Back button/Swipe back).
   - backFromPlayer() function for UI back button.
========================================= */
document.addEventListener('DOMContentLoaded', () => {

  // --- Configuration ---
  const STRUCTURE = {
    Physics:   { papers: 2, chapters: 10 },
    Chemistry: { papers: 2, chapters: 5 },
    Math:      { papers: 2, chapters: 10 },
    Biology:   { papers: 2, chapters: 12 },
    English:   { papers: 2, chapters: 0 },
    ICT:       { papers: 1, chapters: 0 },
    Bangla:    { papers: 2, chapters: 0 }
  };
  const PASSWORD = '###@@@website'; // আপনার পাসওয়ার্ড
  
  window.STRUCTURE = STRUCTURE;

  // --- STATE Variables ---
  let currentSubject = null;
  let currentPaper = null;
  let currentChapter = null; 
  window.currentSubject = null; 
  window.currentPaper = null;
  window.currentChapter = null;
  
  let items = []; // Current active playlist
  let master = []; // Full master list for search/reset
  let currentIndex = -1;

  // Track current app page to decide transitions in popstate handler
  let currentAppPage = null; // 'home' | 'papers' | 'chapters' | 'player' | null
  window.currentAppPage = currentAppPage;

  // --- DOM Elements ---
  const gateEl = document.getElementById('gate');
  const pwdEl = document.getElementById('pwd');
  const unlockBtn = document.getElementById('unlockBtn');
  const errEl = document.getElementById('err');

  const homePage = document.getElementById('homePage');
  const paperPage = document.getElementById('paperPage');
  const chapterPage = document.getElementById('chapterPage');
  const playerPage = document.getElementById('playerPage');
  const subjectsGrid = document.getElementById('subjectsGrid');

  const papersGrid = document.getElementById('papersGrid');
  const chaptersGrid = document.getElementById('chaptersGrid');
  const paperTitleMain = document.getElementById('paperTitleMain');
  const chapterTitleMain = document.getElementById('chapterTitleMain');

  const playlistEl = document.getElementById('playlist');
  const totalCountEl = document.getElementById('totalCount');
  const subTitleSmall = document.getElementById('subTitleSmall');
  
  const ytPlayer = document.getElementById('yt-player');
  const videoTitle = document.getElementById('videoTitle');
  const videoMeta = document.getElementById('videoMeta');

  const searchInput = document.getElementById('searchInput');
  const shuffleBtn = document.getElementById('shuffleBtn');
  const clearBtn = document.getElementById('clearBtn');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const themeBtn = document.getElementById('themeBtn');

  // --- Utility Functions ---

  function hideAll() {
    homePage.classList.add('hidden');
    paperPage.classList.add('hidden');
    chapterPage.classList.add('hidden');
    playerPage.classList.add('hidden');
  }
  window.hideAll = hideAll; 

  function handleLoadError(e) {
    console.error(e);
    alert('Error: Subject file not found or invalid.');
    history.back(); 
  }
  
  function stopVideo() {
    ytPlayer.src = "";
  }
  window.stopVideo = stopVideo; 

// --- CORE FIX: PLAYER STATE CLEANUP ---
function cleanPlayerState() {
    // 1. Video iframe source is cleared to stop playback
    window.stopVideo(); 
    
    // 2. Reset playlist data and UI
    items = [];
    master = [];
    currentIndex = -1;
    
    playlistEl.innerHTML = '';
    totalCountEl.textContent = '0';
    videoTitle.textContent = 'Select a video to play';
    videoMeta.textContent = '—';
    searchInput.value = ''; 

    // 3. Reset current navigation context
    window.currentSubject = null; 
    window.currentPaper = null;
    window.currentChapter = null;
}
window.cleanPlayerState = cleanPlayerState; 

// ✅ FIX: Dedicated Back Button Function for Player Page (সফট ব্যাক বাটন)
window.backFromPlayer = function() {
    // Stop playback first, then navigate back. Do not prematurely clear playlist/master
    window.stopVideo(); 
    history.back(); 
};

  // --- AUTH ---
  unlockBtn.addEventListener('click', () => {
    if ((pwdEl.value || '').trim() === PASSWORD) {
      gateEl.style.display = 'none'; // গেট লুকানো
      window.goHome(true); // Home পেজে যাওয়া
    } else {
      errEl.style.display = 'block';
    }
  });

  // --- THEME ---
  themeBtn.addEventListener('click', () => {
    document.body.classList.toggle('light');
    const icon = themeBtn.querySelector('.material-icons');
    icon.textContent = document.body.classList.contains('light') ? 'light_mode' : 'dark_mode';
  });

  // --- DATA LOADING (Same logic as before) ---
  async function loadSubjectFile(subject) {
    const paths = [`subjects/${subject.toLowerCase()}.html`, `${subject.toLowerCase()}.html`];
    let html = null;
    for (const p of paths) {
      try {
        const res = await fetch(p, {cache: "no-store"});
        if (res.ok) { html = await res.text(); break; }
      } catch(e){}
    }
    if (!html) throw new Error('File not found');
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    const script = tmp.querySelector('script');
    if (script) eval(script.textContent); 
    else {
      const pre = tmp.querySelector('pre, code');
      if(pre) window.VIDEOS = JSON.parse(pre.textContent);
    }
  }

  function loadVideosFor(sub, paper, chapter) {
    items = []; master = []; currentIndex = -1;
    if (!window.VIDEOS || !window.VIDEOS[paper]) return;

    const data = window.VIDEOS[paper];
    if (Array.isArray(data)) {
      items = [...data];
    } else if (chapter && Array.isArray(data[chapter])) {
      items = [...data[chapter]];
    } else {
      Object.values(data).forEach(arr => { if(Array.isArray(arr)) items.push(...arr); });
    }
    master = [...items];
  }

  // --- NAVIGATION FUNCTIONS ---

  window.openSubject = function(sub) {
    currentSubject = sub;
    window.currentSubject = sub;
    hideAll();
    paperPage.classList.remove('hidden');
    
    paperTitleMain.innerText = sub;
    papersGrid.innerHTML = '';
    
    const total = STRUCTURE[sub] ? STRUCTURE[sub].papers : 1;
    for (let i = 1; i <= total; i++) {
      const p = `Paper ${i}`;
      const div = document.createElement('div');
      div.className = 'card paper-card';
      div.setAttribute('data-paper', p);
      div.innerHTML = `📄<br><br>${sub}<br>${p}`;
      papersGrid.appendChild(div);
    }
    currentAppPage = 'papers';
    history.pushState({page:'papers', subject:sub}, '', `#${encodeURIComponent(sub)}`);
  };

  window.openPaper = function(paper) {
    currentPaper = paper;
    window.currentPaper = paper;
    const chCount = STRUCTURE[currentSubject] ? STRUCTURE[currentSubject].chapters : 0;

    if (chCount === 0) {
      currentChapter = null; 
      window.currentChapter = null;
      loadSubjectFile(currentSubject)
        .then(() => {
          loadVideosFor(currentSubject, currentPaper, null);
          window.openPlayerPage();
        })
        .catch(handleLoadError);
    } else {
      hideAll();
      chapterPage.classList.remove('hidden');
      chapterTitleMain.innerText = `${currentSubject} — ${paper}`;
      chaptersGrid.innerHTML = '';
      for (let i = 1; i <= chCount; i++) {
        const ch = `Chapter ${i}`;
        const div = document.createElement('div');
        div.className = 'card chapter-card';
        div.setAttribute('data-chapter', ch);
        div.innerHTML = `📝<br><br>${ch}`;
        chaptersGrid.appendChild(div);
      }
      currentAppPage = 'chapters';
      history.pushState({page:'chapters', subject:currentSubject, paper:paper}, '', `#${encodeURIComponent(currentSubject)}-${encodeURIComponent(paper)}`);
    }
  };
  
  window.openChapter = function(chapter) {
    currentChapter = chapter;
    window.currentChapter = chapter;
    
    loadSubjectFile(currentSubject)
      .then(() => {
        loadVideosFor(currentSubject, currentPaper, currentChapter);
        window.openPlayerPage();
      })
      .catch(handleLoadError);
  };
  
  window.openPlayerPage = function() {
    hideAll();
    playerPage.classList.remove('hidden');
    
    const subText = currentChapter ? `(${currentChapter})` : '';
    subTitleSmall.innerText = `— ${currentPaper} ${subText}`;

    renderPlaylist(items);
    
    if (items.length > 0) {
      playIndex(0);
    } else {
      videoTitle.textContent = 'No videos found here.';
      videoMeta.textContent = '—';
      ytPlayer.src = '';
    }
    
    currentAppPage = 'player';
    history.pushState({page:'player', subject:currentSubject, paper:currentPaper, chapter:currentChapter}, '', '#player');
  };
  
  window.goHome = function(replace = false) {
    stopVideo();
    hideAll();
    homePage.classList.remove('hidden');
    currentSubject = null;
    currentPaper = null;
    currentChapter = null;
    window.currentSubject = null; 
    window.currentPaper = null;
    window.currentChapter = null;
    
    const state = {page:'home'};
    const url = '#home';
    
    currentAppPage = 'home';
    if (replace) {
      history.replaceState(state, '', url); 
    } else {
      history.pushState(state, '', url); 
    }
  };

  // --- EVENT DELEGATION (Card Clicks) ---

  subjectsGrid.addEventListener('click', (e) => {
    const card = e.target.closest('.card');
    if (card && card.dataset.subject) {
      window.openSubject(card.dataset.subject);
    }
  });

  papersGrid.addEventListener('click', (e) => {
    const card = e.target.closest('.card');
    if (card && card.dataset.paper) {
      window.openPaper(card.dataset.paper);
    }
  });

  chaptersGrid.addEventListener('click', (e) => {
    const card = e.target.closest('.card');
    if (card && card.dataset.chapter) {
      window.openChapter(card.dataset.chapter);
    }
  });


  // --- PLAYER LOGIC ---
  function renderPlaylist(list) {
    playlistEl.innerHTML = '';
    totalCountEl.textContent = list.length;
    
    list.forEach((v, i) => {
      const item = document.createElement('div');
      item.className = 'item';
      item.tabIndex = 0;
      
      const thumbUrl = `https://i.ytimg.com/vi/${v.id}/mqdefault.jpg`;
      
      item.innerHTML = `
        <div class="thumb">
           <img src="${thumbUrl}" style="width:100%;height:100%;object-fit:cover" loading="lazy" alt="">
        </div>
        <div class="meta">
           <div class="t">${v.title || 'Untitled'}</div>
           <div class="s">${v.subtitle || 'Lesson'}</div>
        </div>
      `;
      
      item.addEventListener('click', () => playIndex(i));
      item.addEventListener('keydown', e => { if(e.key==='Enter') playIndex(i); });
      playlistEl.appendChild(item);
    });
  }

  function playIndex(i) {
    if (i < 0 || i >= items.length) return;
    currentIndex = i;
    
    // Highlight
    const nodes = playlistEl.querySelectorAll('.item');
    nodes.forEach(n => n.classList.remove('active'));
    if (nodes[i]) {
      nodes[i].classList.add('active');
      nodes[i].scrollIntoView({behavior: 'smooth', block: 'nearest'});
    }

    // Load Video
    const v = items[i];
    const baseUrl = `https://www.youtube.com/embed/${v.id}`;
    const params = "?autoplay=1&rel=0&modestbranding=1&iv_load_policy=3&fs=1";
    ytPlayer.src = baseUrl + params;
    
    videoTitle.textContent = v.title || 'Untitled Video';
    videoMeta.textContent = v.subtitle || '';
  }

  // --- PLAYER CONTROLS ---
  prevBtn.addEventListener('click', () => {
    if(currentIndex > 0) playIndex(currentIndex - 1);
  });
  
  nextBtn.addEventListener('click', () => {
    if(currentIndex < items.length - 1) playIndex(currentIndex + 1);
  });

  searchInput.addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    if (!q) { items = [...master]; } 
    else {
      items = master.filter(x => (x.title + ' ' + x.subtitle).toLowerCase().includes(q));
    }
    renderPlaylist(items);
  });

  shuffleBtn.addEventListener('click', () => {
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }
    renderPlaylist(items);
  });

  clearBtn.addEventListener('click', () => {
    items = [...master];
    searchInput.value = '';
    renderPlaylist(items);
  });
  
  // Register Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/Power-Play/service-worker.js').catch(console.log);
  }

  // --- PRO NAVIGATION SYSTEM (Popstate Handler) ---

  let lastBack = 0;
  function handleAppExit() {
    const now = Date.now();
    if (now - lastBack < 1500) {
      try{ window.close(); } catch(e){}
      return;
    }
    lastBack = now;
    alert('Press back again to exit the app'); 
  }

  // Main Popstate handler (Handles hardware back)
  window.addEventListener('popstate', (ev) => {
    // 1. Fullscreen check 
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(()=>{});
      history.pushState(history.state || {page:'player'}, '');
      return;
    }
    
    // Determine previous and new pages
    const prevPage = currentAppPage;
    const state = ev.state || (history.state ? history.state : {page:'home'});
    const newPage = state.page || 'home';

    // If we are leaving the player page (prev was player, new is not), clean/stop player
    if (prevPage === 'player' && newPage !== 'player') {
      // Stop playback and clear player-specific UI/state
      stopVideo();
      cleanPlayerState();
    }

    // Update currentAppPage to the new page early so nested logic can rely on it
    currentAppPage = newPage;
    window.currentAppPage = currentAppPage;

    // Hide everything first
    window.hideAll(); 

    // Handle pages based on new state
    if (!state || !state.page) {
        // Fallback to home if state is corrupted
        homePage.classList.remove('hidden'); 
        return;
    }

    // PLAYER PAGE 
    if (newPage === 'player') {
      if (state.subject && state.paper) {
          window.currentSubject = state.subject;
          window.currentPaper = state.paper;
          window.currentChapter = state.chapter;
          
          loadSubjectFile(state.subject)
            .then(() => {
                loadVideosFor(state.subject, state.paper, state.chapter);
                playerPage.classList.remove('hidden');
                renderPlaylist(items); 
                // Only autoplay if there are items. Play index 0 is expected when navigating TO player.
                if (items.length > 0) playIndex(0); 
                const subText = window.currentChapter ? `(${window.currentChapter})` : '';
                subTitleSmall.innerText = `— ${window.currentPaper} ${subText}`;
            })
            .catch(()=>{ playerPage.classList.remove('hidden'); }); 
      } else {
        // If no subject/paper in state, just show player (fallback)
        playerPage.classList.remove('hidden');
      }
      return;
    }
    
    // CHAPTERS PAGE 
    if (newPage === 'chapters') {
      window.currentSubject = state.subject;
      window.currentPaper = state.paper;
      chapterPage.classList.remove('hidden');
      document.getElementById('chapterTitleMain').innerText = `${state.subject} — ${state.paper}`;
      return;
    }

    // PAPERS PAGE 
    if (newPage === 'papers') {
      window.currentSubject = state.subject;
      paperPage.classList.remove('hidden');
      document.getElementById('paperTitleMain').innerText = state.subject;
      return;
    }

    // HOME PAGE
    if (newPage === 'home') {
      
      if (!homePage.classList.contains('hidden')) {
        handleAppExit(); // Double back to exit
      } else {
        homePage.classList.remove('hidden'); 
      }
      return;
    }
  });


  // 🚨 FIX: Initialize base state (Runs once when app loads) 🚨
  // Only proceed if the gate is confirmed to be hidden (meaning unlocked).
  if (gateEl.style.display === 'none') {
      if (!history.state) {
          // First load after successful unlock
          history.replaceState({page:'home'}, '', '#home');
          currentAppPage = 'home';
          homePage.classList.remove('hidden');
      } else {
          // Refresh or deep-link to a specific page
          currentAppPage = (history.state && history.state.page) ? history.state.page : 'home';
          window.dispatchEvent(new PopStateEvent('popstate', { state: history.state }));
      }
  } else {
      // If gate is visible, we wait for the user to enter the password.
      // The unlockBtn click listener handles showing the home page.
  }


  // Swipe-right to go back (mobile PWA)
  (function addSwipeBack(){
    const playerArea = document.querySelector('.player-wrap');
    if (!playerArea) return;
    let startX = 0, startY = 0, tracking = false;
    playerArea.addEventListener('touchstart', (e) => {
      if (e.touches.length !== 1) return; tracking = true; startX = e.touches[0].clientX; startY = e.touches[0].clientY;
    }, {passive:true});
    playerArea.addEventListener('touchmove', (e) => {
      if (!tracking) return; const dx = e.touches[0].clientX - startX; const dy = e.touches[0].clientY - startY;
      if (dx > 80 && Math.abs(dy) < 60) {
        tracking = false;
        window.backFromPlayer(); 
      }
    }, {passive:true});
    playerArea.addEventListener('touchend', () => { tracking = false; });
  })();
});
