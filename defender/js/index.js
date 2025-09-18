 // ---------- Leaderboard ----------
    async function loadScores(mode = 'latest') {
      const rowsEl = document.querySelector('.rows');
      const titleEl = document.getElementById('boardTitle');
      titleEl.textContent = mode === 'top' ? 'Leaderboard — Top 3' : 'Leaderboard — Laatste 3';

      rowsEl.innerHTML = `<div class="row"><span class="name">Laden...</span><span class="score">--</span></div>`;

      try {
        const res = await fetch(`/scores.php?sort=${encodeURIComponent(mode)}&limit=3`);
        const json = await res.json();
        rowsEl.innerHTML = '';

        if (!json.ok) throw new Error(json.error || 'Unknown error');
        const data = json.rows || [];
        if (data.length === 0) {
          rowsEl.innerHTML = `<div class="row"><span class="name">Nog geen scores</span><span class="score">0</span></div>`;
          return;
        }

        for (const item of data) {
          const div = document.createElement('div');
          div.className = 'row';
          div.setAttribute('role', 'listitem');
          div.innerHTML = `<span class="name">${escapeHtml(item.name)}</span><span class="score">${item.score}</span>`;
          rowsEl.appendChild(div);
        }
      } catch (e) {
        console.error(e);
        rowsEl.innerHTML = `<div class="row"><span class="name">Error</span><span class="score">:/</span></div>`;
      }
    }

    function escapeHtml(str) {
      return String(str)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
    }

    // init leaderboard
    loadScores('latest');
    document.getElementById('latestBtn').addEventListener('click', () => loadScores('latest'));
    document.getElementById('topBtn').addEventListener('click', () => loadScores('top'));

    // ---------- Naam/Play UX ----------
    const nameInput = document.getElementById('nameInput');
    const playBtn   = document.getElementById('playBtn');
    const nameError = document.getElementById('nameError');

    // Prefill uit localStorage
    const savedName = (localStorage.getItem('player_name') || '').slice(0, 10);
    if (savedName) {
      nameInput.value = savedName;
      playBtn.disabled = false;
    }
    nameInput.focus();

    function validateName() {
      const v = nameInput.value.trim();
      const valid = v.length > 0 && v.length <= 10;
      playBtn.disabled = !valid;
      nameError.style.display = valid ? 'none' : 'block';
      return valid;
    }

    nameInput.addEventListener('input', validateName);

    // Enter start ook het spel
    nameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (validateName()) startGame();
      }
    });

    playBtn.addEventListener('click', () => {
      if (validateName()) startGame();
    });

    function startGame() {
      const name = nameInput.value.trim().slice(0, 10);
      localStorage.setItem('player_name', name);
      window.location.href = 'play.html';
    }