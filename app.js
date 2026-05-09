(() => {
  const DATA_URL = 'https://unitedstates.github.io/congress-legislators/legislators-current.json';
  const PHOTO_SOURCES = [
    (id) => `https://unitedstates.github.io/images/congress/450x550/${id}.jpg`,
    (id) => `https://unitedstates.github.io/images/congress/225x275/${id}.jpg`,
    (id) => `https://theunitedstates.io/images/congress/450x550/${id}.jpg`,
  ];
  const PARTY_KEYS = { d: 'Democrat', r: 'Republican' };
  const STORAGE_KEY = 'gtp-us-best-streak';

  const $ = (id) => document.getElementById(id);

  const state = {
    pool: [],
    seen: new Set(),
    current: null,
    answered: false,
    correct: 0,
    total: 0,
    streak: 0,
    best: Number(localStorage.getItem(STORAGE_KEY) || 0),
  };

  function partyDisplay(p) {
    if (p === 'Democrat') return 'a Democrat';
    return 'a Republican';
  }

  function setStatus(text) {
    $('status').textContent = text || '';
  }

  async function loadLegislators() {
    setStatus('Loading current legislators…');
    const res = await fetch(DATA_URL, { cache: 'force-cache' });
    if (!res.ok) throw new Error(`Data fetch failed (${res.status})`);
    const all = await res.json();
    state.pool = all
      .map((p) => {
        const term = p.terms[p.terms.length - 1];
        if (!term || !p.id || !p.id.bioguide) return null;
        let party = term.party;
        if (party === 'Independent') party = 'Democrat';
        if (!['Democrat', 'Republican'].includes(party)) return null;
        return {
          bioguide: p.id.bioguide,
          full: (p.name && (p.name.official_full || `${p.name.first} ${p.name.last}`)) || p.id.bioguide,
          party,
          state: term.state,
          type: term.type,
        };
      })
      .filter(Boolean);
    if (!state.pool.length) throw new Error('No legislators found');
    setStatus(`${state.pool.length} legislators loaded.`);
  }

  function pickRandom() {
    if (state.seen.size >= state.pool.length) state.seen.clear();
    let pick;
    let attempts = 0;
    do {
      pick = state.pool[Math.floor(Math.random() * state.pool.length)];
      attempts++;
    } while (state.seen.has(pick.bioguide) && attempts < 50);
    state.seen.add(pick.bioguide);
    return pick;
  }

  function loadPhoto(bioguide) {
    return new Promise((resolve) => {
      let i = 0;
      const tryNext = () => {
        if (i >= PHOTO_SOURCES.length) {
          resolve(null);
          return;
        }
        const url = PHOTO_SOURCES[i++](bioguide);
        const test = new Image();
        test.onload = () => resolve(url);
        test.onerror = tryNext;
        test.src = url;
      };
      tryNext();
    });
  }

  async function nextRound() {
    state.answered = false;
    state.current = pickRandom();

    $('meta').classList.add('hidden');
    $('result').classList.add('hidden');
    $('choices').classList.remove('hidden');
    document.querySelectorAll('.party-btn').forEach((b) => {
      b.disabled = false;
      b.classList.remove('correct', 'wrong');
    });

    const img = $('photo');
    const loading = $('photo-loading');
    img.classList.add('loading');
    loading.classList.remove('hidden');
    img.removeAttribute('src');
    setStatus('');

    const url = await loadPhoto(state.current.bioguide);
    if (!url) {
      // Skip if no photo is available for this member.
      setStatus('No photo available — skipping…');
      nextRound();
      return;
    }
    img.src = url;
    img.onload = () => {
      img.classList.remove('loading');
      loading.classList.add('hidden');
    };
  }

  function updateScore() {
    $('correct').textContent = state.correct;
    $('total').textContent = state.total;
    $('streak').textContent = state.streak;
    $('best').textContent = state.best;
    $('accuracy').textContent = state.total
      ? `${Math.round((state.correct / state.total) * 100)}%`
      : '—';
  }

  function guess(party) {
    if (state.answered || !state.current) return;
    state.answered = true;
    const isCorrect = state.current.party === party;
    state.total += 1;
    if (isCorrect) {
      state.correct += 1;
      state.streak += 1;
      if (state.streak > state.best) {
        state.best = state.streak;
        localStorage.setItem(STORAGE_KEY, String(state.best));
      }
    } else {
      state.streak = 0;
    }
    updateScore();

    document.querySelectorAll('.party-btn').forEach((b) => {
      b.disabled = true;
      if (b.dataset.party === state.current.party) b.classList.add('correct');
      else if (b.dataset.party === party) b.classList.add('wrong');
    });

    $('name').textContent = state.current.full;
    const role = state.current.type === 'sen'
      ? `Senator, ${state.current.state}`
      : `Representative, ${state.current.state}`;
    $('role').textContent = `${role} · ${state.current.party}`;
    $('meta').classList.remove('hidden');

    const text = $('result-text');
    text.textContent = isCorrect
      ? `Correct! They're ${partyDisplay(state.current.party)}.`
      : `Nope — they're ${partyDisplay(state.current.party)}.`;
    text.className = isCorrect ? 'correct' : 'wrong';
    $('result').classList.remove('hidden');
    $('next-btn').focus();
  }

  document.querySelectorAll('.party-btn').forEach((btn) => {
    btn.addEventListener('click', () => guess(btn.dataset.party));
  });

  $('next-btn').addEventListener('click', nextRound);

  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    const key = e.key.toLowerCase();
    if (!state.answered && PARTY_KEYS[key]) {
      e.preventDefault();
      guess(PARTY_KEYS[key]);
    } else if (state.answered && (key === ' ' || key === 'enter' || key === 'n')) {
      e.preventDefault();
      nextRound();
    }
  });

  (async () => {
    try {
      updateScore();
      await loadLegislators();
      await nextRound();
    } catch (err) {
      const main = document.querySelector('main');
      const div = document.createElement('div');
      div.className = 'error';
      div.textContent = `Failed to load data: ${err.message}. Check your connection and refresh.`;
      main.appendChild(div);
    }
  })();
})();
