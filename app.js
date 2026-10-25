(() => {
  'use strict';
  const STORAGE_KEY = 'home-poker-cash-v1';
  const LANGUAGE_KEY = 'home-poker-language';
  const $ = id => document.getElementById(id);
  const screens = ['setup', 'players', 'game', 'cashout', 'settlement'];
  const en = {
    'Домашний покер':'Home Poker', 'Установить':'Install', 'Кэш':'Cash',
    'Игроки, стек':'Players & stack', 'Игроки':'Players', 'Бай-ин, ₽':'Buy-in, ₽', 'Стек':'Stack',
    'Калькулятор':'Chip calculator', 'Добавить':'Add', 'Дополнительно':'Advanced settings',
    'Раунды и таймер':'Rounds & timer', 'Раундов':'Rounds', 'Длительность, мин':'Duration, min',
    'Дедлайн ребаев':'Rebuy deadline', 'До конца раунда':'Until round ends', 'Рост блайндов':'Blind growth',
    'Малый блайнд':'Small blind', 'Большой блайнд':'Big blind', 'Рост за раунд':'Growth per round', 'Без роста':'No increase',
    'Начать':'Continue', 'Кто играет?':'Who is playing?',
    'Каждому участнику будет выдан одинаковый стек по номиналу.':'Each player receives the same chip value.',
    'Запустить игру':'Start game', 'Назад к настройкам':'Back to setup',
    'Текущие блайнды':'Current blinds', 'Завершить':'Finish',
    'Участники и ребаи':'Players & rebuys', 'Завершить игру':'Finish game',
    'Добавить треки':'Add tracks', 'Предыдущий':'Previous', 'Громкость':'Volume',
    'Подсчёт результатов':'Cash-out', 'Сложите номиналы оставшихся фишек каждого игрока.':'Add up the value of each player’s remaining chips.',
    'В банке':'In the pot', 'По номиналу':'Chip value',
    'Рассчитать переводы':'Calculate transfers', 'Вернуться к игре':'Back to game',
    'Кто кому переводит':'Who pays whom', 'Минимальный список переводов для закрытия расчётов.':'The shortest list of transfers to settle up.',
    'Новая игра':'New game', 'Номинал':'Denomination', 'Всего в наборе':'In the set',
    'Одному':'Per player', 'Раздать':'Deal', 'Количество':'Quantity',
    'Стек собран':'Exact stack', 'Ближайший вариант':'Closest match',
    'Раунд':'Round', 'до следующего раунда':'until next round', 'время игры завершено':'Game time is up',
    'Игра без таймера':'Game without timer', 'таймер отключён':'Timer is off', 'Без блайндов':'No blinds',
    'Пауза':'Pause', 'Продолжить':'Resume', 'Ребай':'Rebuy',
    'Музыка не добавлена':'No music added', 'Добавьте MP3 или M4A':'Add MP3 or M4A',
    'Добавьте MP3 или M4A — треки сохранятся на телефоне.':'Add MP3 or M4A — tracks are saved on this device.',
    'Не удалось открыть хранилище музыки.':'Could not open music storage.',
    'Сохраняем музыку…':'Saving music…', 'Не удалось сохранить треки. Проверьте свободное место.':'Could not save tracks. Check available space.',
    'Добавьте доступные фишки, чтобы получить расклад.':'Add your chips to get a distribution.',
    'Из этого набора нельзя собрать заданный стек.':'This set cannot make the requested stack.',
    'Проверьте количество игроков, стек, стоимость входа и параметры раундов.':'Check player count, stack, buy-in, and round settings.',
    'Дедлайн ребаев прошёл.':'The rebuy deadline has passed.', 'Ребаи доступны всю игру.':'Rebuys are available throughout the game.',
    'Все игроки вышли в ноль — переводов нет.':'Everyone broke even — no transfers needed.',
    'Завершить игру и перейти к расчёту?':'Finish the game and go to cash-out?',
    'На iPhone нажмите «Поделиться», затем «На экран Домой». После первой загрузки приложение будет работать без интернета.':'On iPhone, tap Share, then Add to Home Screen. After the first load, the app works offline.',
    'Прогресс настройки':'Setup progress', 'Язык интерфейса':'Interface language', 'Добавить игрока':'Add player', 'Убрать игрока':'Remove player',
    'Удалить номинал':'Remove denomination', 'Фоновая музыка':'Background music', 'Воспроизвести':'Play',
    'Следующий трек':'Next track', 'Показать плейлист':'Show playlist', 'Скрыть плейлист':'Hide playlist',
    'Удалить трек':'Remove track'
  };
  let language = localStorage.getItem(LANGUAGE_KEY) === 'en' ? 'en' : 'ru';
  const tr = text => language === 'en' ? (en[text] || text) : text;
  const phrase = (ru, english) => language === 'en' ? english : ru;
  const staticTexts = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (en[node.textContent.trim()]) staticTexts.push({ node, original: node.textContent });
  }
  const staticLabels = [...document.querySelectorAll('[aria-label]')].map(element => ({ element, original: element.getAttribute('aria-label') }));
  function applyLanguage() {
    if (state.screen === 'cashout') document.querySelectorAll('.cashout-input').forEach(input => { state.players[Number(input.dataset.player)].cashout = Number(input.value) || 0; });
    document.documentElement.lang = language;
    document.title = tr('Домашний покер');
    $('language-switch').value = language;
    staticTexts.forEach(({ node, original }) => { if (node.isConnected) node.textContent = original.replace(original.trim(), tr(original.trim())); });
    staticLabels.forEach(({ element, original }) => { if (element.isConnected) element.setAttribute('aria-label', tr(original)); });
    state.players.forEach((player, index) => {
      if (player.name === `Игрок ${index + 1}` || player.name === `Player ${index + 1}`) player.name = phrase(`Игрок ${index + 1}`, `Player ${index + 1}`);
    });
    renderInventory();
    if (state.screen === 'players') renderPlayerInputs();
    if (state.screen === 'game') renderGame();
    if (state.screen === 'cashout') renderCashout();
    if (state.screen === 'settlement') renderTransfers();
    renderMusicPlayer();
    $('setup-error').textContent = '';
    $('cashout-error').textContent = '';
    saveState();
  }
  const defaults = {
    screen: 'setup',
    setup: { players: 4, stack: 1000, buyIn: 1000, roundsEnabled: true, rounds: 6, minutes: 20, rebuyEnabled: true, rebuyRound: 3, blindsEnabled: true, smallBlind: 10, bigBlind: 20, growth: 2 },
    inventory: [{ denomination: 500, count: 8 }, { denomination: 100, count: 20 }, { denomination: 25, count: 40 }, { denomination: 5, count: 40 }],
    players: [],
    game: { round: 1, remaining: 0, running: false, endAt: null, finished: false },
    transfers: []
  };
  let state = loadState();
  let timerId = null;
  let installPrompt = null;
  let audioContext = null;
  let musicTracks = [];
  let currentTrackIndex = 0;
  let currentTrackUrl = null;
  const musicAudio = new Audio();
  musicAudio.preload = 'metadata';
  musicAudio.volume = 0.55;
  const icons = {
    play: '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z" /></svg>',
    pause: '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="14" y="3" width="5" height="18" rx="1" /><rect x="5" y="3" width="5" height="18" rx="1" /></svg>',
    caretUp: '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m18 15-6-6-6 6" /></svg>',
    caretDown: '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6" /></svg>',
    trash: '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 11v6" /><path d="M14 11v6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /><path d="M3 6h18" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>',
    plus: '<svg class="button-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>'
  };

  function openMusicDb() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('home-poker-music-v1', 1);
      request.onupgradeneeded = () => request.result.createObjectStore('tracks', { keyPath: 'id' });
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function musicStore(mode, operation) {
    const db = await openMusicDb();
    try {
      return await new Promise((resolve, reject) => {
        const transaction = db.transaction('tracks', mode);
        const request = operation(transaction.objectStore('tracks'));
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } finally { db.close(); }
  }

  async function loadMusicLibrary() {
    try {
      musicTracks = (await musicStore('readonly', store => store.getAll())).sort((a, b) => a.addedAt - b.addedAt);
      currentTrackIndex = Math.min(currentTrackIndex, Math.max(0, musicTracks.length - 1));
      renderMusicPlayer();
    } catch (_) { $('music-status').textContent = tr('Не удалось открыть хранилище музыки.'); }
  }

  function setMusicTrack(index, autoplay = false) {
    if (!musicTracks.length) return;
    currentTrackIndex = (index + musicTracks.length) % musicTracks.length;
    if (currentTrackUrl) URL.revokeObjectURL(currentTrackUrl);
    currentTrackUrl = URL.createObjectURL(musicTracks[currentTrackIndex].blob);
    musicAudio.src = currentTrackUrl;
    updateMediaSession();
    renderMusicPlayer();
    if (autoplay) musicAudio.play().catch(() => {});
  }

  function toggleMusic() {
    if (!musicTracks.length) { $('music-files').click(); return; }
    if (!musicAudio.src) setMusicTrack(currentTrackIndex);
    if (musicAudio.paused) musicAudio.play().catch(() => {}); else musicAudio.pause();
  }

  function changeMusicTrack(direction) {
    if (!musicTracks.length) return;
    const wasPlaying = !musicAudio.paused;
    setMusicTrack(currentTrackIndex + direction, wasPlaying);
  }

  function updateMediaSession() {
    if (!('mediaSession' in navigator) || !musicTracks.length || !('MediaMetadata' in window)) return;
    navigator.mediaSession.metadata = new MediaMetadata({ title: musicTracks[currentTrackIndex].name, artist: tr('Домашний покер') });
  }

  function renderMusicPlayer() {
    const hasTracks = musicTracks.length > 0;
    $('music-player').classList.toggle('empty', !hasTracks);
    $('music-status').textContent = hasTracks ? phrase(`${musicTracks.length} ${musicTracks.length === 1 ? 'трек сохранён' : 'треков сохранено'} офлайн`, `${musicTracks.length} ${musicTracks.length === 1 ? 'track' : 'tracks'} saved offline`) : tr('Добавьте MP3 или M4A — треки сохранятся на телефоне.');
    $('music-next').disabled = !hasTracks;
    $('music-previous').disabled = !hasTracks;
    if (!hasTracks) { $('music-track-name').textContent = tr('Музыка не добавлена'); $('music-library').innerHTML = ''; return; }
    $('music-track-name').textContent = musicTracks[currentTrackIndex].name;
    $('music-toggle').innerHTML = musicAudio.paused ? icons.play : icons.pause;
    $('music-toggle').setAttribute('aria-label', tr(musicAudio.paused ? 'Воспроизвести' : 'Пауза'));
    $('music-library').innerHTML = musicTracks.map((track, index) => `<div class="music-row"><button class="music-select ds-btn ds-btn-ghost" type="button" data-index="${index}" aria-pressed="${index === currentTrackIndex}">${escapeHtml(track.name)}</button><button class="music-remove ds-btn ds-btn-ghost ds-btn-sm" type="button" data-remove="${track.id}" aria-label="${tr('Удалить трек')}">${icons.trash}</button></div>`).join('');
    document.querySelectorAll('.music-select').forEach(button => button.addEventListener('click', () => setMusicTrack(Number(button.dataset.index), true)));
    document.querySelectorAll('.music-remove').forEach(button => button.addEventListener('click', () => removeMusicTrack(button.dataset.remove)));
  }

  function toggleMusicDetails() {
    const details = $('music-details');
    const willExpand = details.hidden;
    details.hidden = !willExpand;
    $('music-expand').innerHTML = willExpand ? icons.caretDown : icons.caretUp;
    $('music-expand').setAttribute('aria-expanded', String(willExpand));
    $('music-expand').setAttribute('aria-label', tr(willExpand ? 'Скрыть плейлист' : 'Показать плейлист'));
  }

  async function importMusic(files) {
    const audioFiles = [...files].filter(file => file.type.startsWith('audio/') || /\.(mp3|m4a)$/i.test(file.name));
    if (!audioFiles.length) return;
    $('music-status').textContent = tr('Сохраняем музыку…');
    try {
      for (const file of audioFiles) {
        const track = { id: `${Date.now()}-${crypto.randomUUID ? crypto.randomUUID() : Math.random()}`, name: file.name.replace(/\.[^.]+$/, ''), type: file.type, blob: file, addedAt: Date.now() };
        await musicStore('readwrite', store => store.put(track));
      }
      await loadMusicLibrary();
      if (!musicAudio.src) setMusicTrack(0);
    } catch (_) { $('music-status').textContent = tr('Не удалось сохранить треки. Проверьте свободное место.'); }
    $('music-files').value = '';
  }

  async function removeMusicTrack(id) {
    const removingCurrent = musicTracks[currentTrackIndex]?.id === id;
    await musicStore('readwrite', store => store.delete(id));
    musicTracks = musicTracks.filter(track => track.id !== id);
    if (removingCurrent) { musicAudio.pause(); musicAudio.removeAttribute('src'); if (currentTrackUrl) URL.revokeObjectURL(currentTrackUrl); currentTrackUrl = null; }
    currentTrackIndex = Math.min(currentTrackIndex, Math.max(0, musicTracks.length - 1));
    if (removingCurrent && musicTracks.length) setMusicTrack(currentTrackIndex); else renderMusicPlayer();
  }

  function prepareAudio() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    if (!audioContext) audioContext = new AudioContext();
    if (audioContext.state === 'suspended') audioContext.resume().catch(() => {});
  }

  function playRoundEndSignal() {
    prepareAudio();
    if (!audioContext || audioContext.state !== 'running') return;
    const musicVolume = !musicAudio.paused ? musicAudio.volume : null;
    if (musicVolume !== null) musicAudio.volume = Math.min(musicVolume, 0.15);
    const start = audioContext.currentTime;
    [0, 0.24, 0.48].forEach((delay, index) => {
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = index === 2 ? 880 : 660;
      gain.gain.setValueAtTime(0.0001, start + delay);
      gain.gain.exponentialRampToValueAtTime(0.28, start + delay + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + delay + 0.18);
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.start(start + delay);
      oscillator.stop(start + delay + 0.2);
    });
    if (musicVolume !== null) setTimeout(() => { musicAudio.volume = musicVolume; }, 850);
  }

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (!saved || !saved.setup || !Array.isArray(saved.inventory)) return structuredClone(defaults);
      return { ...structuredClone(defaults), ...saved, setup: { ...defaults.setup, ...saved.setup }, game: { ...defaults.game, ...saved.game } };
    } catch (_) { return structuredClone(defaults); }
  }
  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }
  const number = value => new Intl.NumberFormat(language === 'en' ? 'en-US' : 'ru-RU', { maximumFractionDigits: 2 }).format(value);
  const money = value => number(value) + ' ₽';
  const inputNumber = id => Number($(id).value) || 0;
  function updatePlayerCountButtons() {
    const count = inputNumber('players-count');
    $('decrement-players').disabled = count <= 2;
    $('increment-players').disabled = count >= 12;
  }

  function showScreen(name) {
    state.screen = name;
    screens.forEach(screen => $('screen-' + screen).classList.toggle('active', screen === name));
    const progress = screens.indexOf(name) + 1;
    $('setup-progress').setAttribute('aria-valuenow', String(progress));
    $('setup-progress').querySelectorAll('.progress-step').forEach((step, index) => step.classList.toggle('active', index < progress));
    window.scrollTo({ top: 0, behavior: 'smooth' });
    saveState();
  }

  function fillSetup() {
    const s = state.setup;
    $('players-count').value = s.players; $('start-stack').value = s.stack; $('buy-in').value = s.buyIn;
    $('rounds-enabled').checked = s.roundsEnabled; $('round-count').value = s.rounds; $('round-minutes').value = s.minutes;
    $('rebuy-enabled').checked = s.rebuyEnabled; $('rebuy-round').value = s.rebuyRound;
    $('blinds-enabled').checked = s.blindsEnabled; $('small-blind').value = s.smallBlind; $('big-blind').value = s.bigBlind; $('blind-growth').value = String(s.growth);
    toggleSettings(); renderInventory(); updatePlayerCountButtons();
  }
  function readSetup() {
    state.setup = {
      players: Math.floor(inputNumber('players-count')), stack: inputNumber('start-stack'), buyIn: inputNumber('buy-in'),
      roundsEnabled: $('rounds-enabled').checked, rounds: Math.floor(inputNumber('round-count')), minutes: inputNumber('round-minutes'),
      rebuyEnabled: $('rebuy-enabled').checked, rebuyRound: Math.floor(inputNumber('rebuy-round')),
      blindsEnabled: $('blinds-enabled').checked, smallBlind: inputNumber('small-blind'), bigBlind: inputNumber('big-blind'), growth: Number($('blind-growth').value)
    };
    saveState(); renderChipPlan(); updatePlayerCountButtons();
  }
  function toggleSettings() {
    $('round-settings').hidden = !$('rounds-enabled').checked;
    $('rebuy-settings').hidden = !$('rebuy-enabled').checked;
    $('blind-settings').hidden = !$('blinds-enabled').checked;
    document.querySelectorAll('.switch-input').forEach(input => input.nextElementSibling.classList.toggle('on', input.checked));
  }

  function renderInventory() {
    $('chip-list').innerHTML = '';
    state.inventory.forEach((chip, index) => {
      const row = document.createElement('div'); row.className = 'chip-row';
      row.innerHTML = `<label class="field ds-field"><span class="ds-label">${tr('Номинал')}</span><input class="chip-denomination ds-input" type="number" inputmode="numeric" min="1" value="${chip.denomination}"></label><label class="field ds-field"><span class="ds-label">${tr('Всего в наборе')}</span><input class="chip-count ds-input" type="number" inputmode="numeric" min="0" value="${chip.count}"></label><button class="remove-button ds-btn ds-btn-ghost ds-btn-sm" type="button" aria-label="${tr('Удалить номинал')}">${icons.trash}</button>`;
      row.querySelector('.chip-denomination').addEventListener('input', event => { state.inventory[index].denomination = Number(event.target.value) || 0; saveState(); renderChipPlan(); });
      row.querySelector('.chip-count').addEventListener('input', event => { state.inventory[index].count = Math.floor(Number(event.target.value) || 0); saveState(); renderChipPlan(); });
      row.querySelector('button').addEventListener('click', () => { state.inventory.splice(index, 1); saveState(); renderInventory(); });
      $('chip-list').appendChild(row);
    });
    renderChipPlan();
  }
  function desirability(denomination, count, bigBlind) {
    if (denomination <= bigBlind) return Math.min(count, 10) * 8 - Math.max(0, count - 12) * 3;
    if (denomination <= bigBlind * 5) return Math.min(count, 6) * 4 - Math.max(0, count - 8) * 2;
    return Math.min(count, 4) - Math.max(0, count - 6);
  }
  function renderChipPlan() {
    const players = Math.max(1, inputNumber('players-count') || state.setup.players);
    const target = Math.max(0, inputNumber('start-stack') || state.setup.stack);
    const bigBlind = Math.max(1, inputNumber('big-blind') || state.setup.bigBlind);
    const denominations = state.inventory.map(chip => ({ denomination: chip.denomination, total: chip.count, perPlayer: Math.floor(chip.count / players) })).filter(chip => chip.denomination > 0 && chip.perPlayer > 0).sort((a, b) => a.denomination - b.denomination);
    if (!target || !denominations.length) { $('chip-result').textContent = tr('Добавьте доступные фишки, чтобы получить расклад.'); return; }
    let dp = new Array(target + 1).fill(null); dp[0] = { picks: [], score: 0 };
    denominations.forEach((chip, index) => {
      const next = new Array(target + 1).fill(null);
      for (let sum = 0; sum <= target; sum++) if (dp[sum]) {
        for (let count = 0; count <= chip.perPlayer && sum + count * chip.denomination <= target; count++) {
          const at = sum + count * chip.denomination;
          const score = dp[sum].score + desirability(chip.denomination, count, bigBlind);
          if (!next[at] || score > next[at].score) { const picks = dp[sum].picks.slice(); picks[index] = count; next[at] = { picks, score }; }
        }
      }
      dp = next;
    });
    let best = target; while (best > 0 && !dp[best]) best--;
    if (!best) { $('chip-result').textContent = tr('Из этого набора нельзя собрать заданный стек.'); return; }
    const used = denominations.map((chip, index) => ({ ...chip, each: dp[best].picks[index] || 0 })).filter(chip => chip.each > 0);
    const eachCount = used.reduce((sum, chip) => sum + chip.each, 0);
    const totalCount = eachCount * players;
    const leftovers = state.inventory.reduce((sum, chip) => sum + chip.count, 0) - totalCount;
    const chipUnit = count => language === 'en' ? (count === 1 ? 'chip' : 'chips') : 'шт.';
    const rows = used.map(chip => `<tr><td>${number(chip.denomination)}</td><td>${chip.each} ${chipUnit(chip.each)}</td><td>${chip.each * players} ${chipUnit(chip.each * players)}</td></tr>`).join('');
    const remaining = phrase(`В наборе останется ${leftovers} фишек.`, `${leftovers} chips remain in the set.`);
    const extra = best === target ? phrase(' Мелкие номиналы добавлены для оплаты блайндов.', ' Small chips were included for paying blinds.') : phrase(` По номиналу не хватает ${number(target - best)}.`, ` The stack is short by ${number(target - best)} in chip value.`);
    $('chip-result').innerHTML = `<div class="calculation-header"><strong>${phrase(`Расклад на ${players} игроков`, `Distribution for ${players} players`)}</strong><span class="ds-badge ${best === target ? 'ds-badge-safe' : 'ds-badge-warn'}">${tr(best === target ? 'Стек собран' : 'Ближайший вариант')}</span></div><table class="chip-table ds-table"><thead><tr><th>${tr('Номинал')}</th><th>${tr('Одному')}</th><th>${tr('Раздать')}</th></tr></thead><tbody>${rows}</tbody><tfoot><tr><td>${tr('Количество')}</td><td>${eachCount} ${chipUnit(eachCount)}</td><td>${totalCount} ${chipUnit(totalCount)}</td></tr></tfoot></table><strong>${phrase(`Стек игрока по номиналу: ${number(best)}`, `Player stack by chip value: ${number(best)}`)}</strong><br><span class="ds-supporting">${remaining}${extra}</span>`;
  }

  function preparePlayers() {
    readSetup();
    const s = state.setup;
    $('setup-error').textContent = '';
    if (s.players < 2 || s.players > 12 || s.stack <= 0 || s.buyIn <= 0 || (s.roundsEnabled && (s.rounds < 1 || s.minutes <= 0))) { $('setup-error').textContent = tr('Проверьте количество игроков, стек, стоимость входа и параметры раундов.'); return; }
    const old = state.players;
    state.players = Array.from({ length: s.players }, (_, index) => old[index] || { name: phrase(`Игрок ${index + 1}`, `Player ${index + 1}`), rebuys: 0, cashout: s.stack });
    renderPlayerInputs(); showScreen('players');
  }
  function renderPlayerInputs() {
    $('player-list').innerHTML = '';
    state.players.forEach((player, index) => {
      const row = document.createElement('label'); row.className = 'player-row';
      row.innerHTML = `<span class="player-number ds-avatar">${index + 1}</span><input class="ds-input" type="text" maxlength="30" value="${escapeHtml(player.name)}" aria-label="${phrase(`Имя игрока ${index + 1}`, `Player ${index + 1} name`)}">`;
      row.querySelector('input').addEventListener('input', event => { state.players[index].name = event.target.value; saveState(); });
      $('player-list').appendChild(row);
    });
  }
  function escapeHtml(text) { const div = document.createElement('div'); div.textContent = text; return div.innerHTML; }

  function startGame() {
    prepareAudio();
    if (musicTracks.length) {
      if (!musicAudio.src) setMusicTrack(currentTrackIndex);
      musicAudio.play().catch(() => {});
    }
    state.players.forEach((player, index) => { player.name = player.name.trim() || phrase(`Игрок ${index + 1}`, `Player ${index + 1}`); player.rebuys = 0; player.cashout = state.setup.stack; });
    state.game = { round: 1, remaining: state.setup.roundsEnabled ? state.setup.minutes * 60 : 0, running: state.setup.roundsEnabled, endAt: state.setup.roundsEnabled ? Date.now() + state.setup.minutes * 60000 : null, finished: false };
    saveState(); renderGame(); showScreen('game'); startTimerLoop();
  }
  function syncTimer() {
    if (!state.game.running || !state.setup.roundsEnabled || !state.game.endAt) return;
    const duration = state.setup.minutes * 60000;
    let roundEnded = false;
    while (Date.now() >= state.game.endAt && !state.game.finished) {
      roundEnded = true;
      if (state.game.round < state.setup.rounds) { state.game.round++; state.game.endAt += duration; }
      else { state.game.finished = true; state.game.running = false; state.game.remaining = 0; state.game.endAt = null; saveState(); break; }
    }
    if (roundEnded) playRoundEndSignal();
    if (state.game.endAt) state.game.remaining = Math.max(0, Math.ceil((state.game.endAt - Date.now()) / 1000));
  }
  function startTimerLoop() {
    clearInterval(timerId); syncTimer(); renderGame();
    if (state.game.running) timerId = setInterval(() => { syncTimer(); renderGame(); }, 1000);
  }
  function currentBlinds() {
    if (!state.setup.blindsEnabled) return null;
    const factor = Math.pow(state.setup.growth, state.game.round - 1);
    return [Math.round(state.setup.smallBlind * factor), Math.round(state.setup.bigBlind * factor)];
  }
  function renderGame() {
    const g = state.game, s = state.setup;
    if (s.roundsEnabled) {
      $('round-label').textContent = phrase(`Раунд ${g.round} из ${s.rounds}`, `Round ${g.round} of ${s.rounds}`);
      const minutes = Math.floor(g.remaining / 60), seconds = Math.floor(g.remaining % 60);
      $('game-title').textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
      $('timer-caption').textContent = tr(g.finished ? 'время игры завершено' : 'до следующего раунда');
    } else { $('round-label').textContent = tr('Игра без таймера'); $('game-title').textContent = '∞'; $('timer-caption').textContent = tr('таймер отключён'); }
    const blinds = currentBlinds(); $('blind-value').textContent = blinds ? `${number(blinds[0])} / ${number(blinds[1])}` : tr('Без блайндов');
    $('pause-game').textContent = tr(g.running ? 'Пауза' : 'Продолжить'); $('pause-game').hidden = !s.roundsEnabled || g.finished;
    $('finish-game').hidden = !g.finished;
    const rebuyAllowed = !g.finished && (!s.rebuyEnabled || g.round <= s.rebuyRound);
    $('game-roster').innerHTML = state.players.map((player, index) => `<div class="roster-row"><div><strong>${escapeHtml(player.name)}</strong><small class="ds-supporting">${phrase(`Входов: ${player.rebuys + 1}`, `Entries: ${player.rebuys + 1}`)} · ${money((player.rebuys + 1) * s.buyIn)}</small></div><button class="rebuy-button ds-btn ds-btn-secondary" data-player="${index}" type="button" ${rebuyAllowed ? '' : 'disabled'}>${icons.plus}${tr('Ребай')}</button></div>`).join('');
    document.querySelectorAll('.rebuy-button').forEach(button => button.addEventListener('click', () => { const index = Number(button.dataset.player); state.players[index].rebuys++; state.players[index].cashout += s.stack; saveState(); renderGame(); }));
    $('rebuy-note').textContent = s.rebuyEnabled ? (rebuyAllowed ? phrase(`Ребаи доступны до конца раунда ${s.rebuyRound}.`, `Rebuys are available through round ${s.rebuyRound}.`) : tr('Дедлайн ребаев прошёл.')) : tr('Ребаи доступны всю игру.');
  }
  function togglePause() {
    prepareAudio();
    syncTimer();
    if (state.game.running) { state.game.running = false; state.game.endAt = null; clearInterval(timerId); }
    else { state.game.running = true; state.game.endAt = Date.now() + state.game.remaining * 1000; startTimerLoop(); }
    saveState(); renderGame();
  }

  function renderCashout() {
    const issued = state.players.reduce((sum, player) => sum + (player.rebuys + 1) * state.setup.stack, 0);
    const pot = state.players.reduce((sum, player) => sum + (player.rebuys + 1) * state.setup.buyIn, 0);
    $('pot-value').textContent = money(pot); $('issued-value').textContent = number(issued);
    $('cashout-list').innerHTML = state.players.map((player, index) => `<label class="cashout-row"><span><strong>${escapeHtml(player.name)}</strong><small class="ds-supporting">${phrase(`Внёс ${money((player.rebuys + 1) * state.setup.buyIn)} · сумма номиналов справа`, `Paid ${money((player.rebuys + 1) * state.setup.buyIn)} · enter remaining chip value`)}</small></span><input class="cashout-input ds-input" data-player="${index}" type="number" inputmode="numeric" min="0" value="${player.cashout}" aria-label="${phrase(`Сумма номиналов у ${escapeHtml(player.name)}`, `Remaining chip value for ${escapeHtml(player.name)}`)}"></label>`).join('');
  }
  function openCashout() {
    syncTimer(); state.game.running = false; state.game.endAt = null; clearInterval(timerId); saveState();
    renderCashout();
    $('cashout-error').textContent = ''; showScreen('cashout');
  }
  function calculateTransfers() {
    const inputs = [...document.querySelectorAll('.cashout-input')];
    inputs.forEach(input => { state.players[Number(input.dataset.player)].cashout = Number(input.value) || 0; });
    const issued = state.players.reduce((sum, player) => sum + (player.rebuys + 1) * state.setup.stack, 0);
    const actual = state.players.reduce((sum, player) => sum + player.cashout, 0);
    if (Math.abs(actual - issued) > 0.001) { $('cashout-error').textContent = phrase(`Сумма номиналов должна быть ${number(issued)}. Сейчас указано ${number(actual)}.`, `The remaining chip value must total ${number(issued)}. Current total: ${number(actual)}.`); return; }
    const balances = state.players.map(player => ({ name: player.name, cents: Math.round((player.cashout * state.setup.buyIn / state.setup.stack - (player.rebuys + 1) * state.setup.buyIn) * 100) }));
    const debtors = balances.filter(item => item.cents < 0).map(item => ({ ...item, cents: -item.cents }));
    const creditors = balances.filter(item => item.cents > 0).map(item => ({ ...item }));
    let debtor = 0, creditor = 0; state.transfers = [];
    while (debtor < debtors.length && creditor < creditors.length) {
      const cents = Math.min(debtors[debtor].cents, creditors[creditor].cents);
      state.transfers.push({ from: debtors[debtor].name, to: creditors[creditor].name, amount: cents / 100 });
      debtors[debtor].cents -= cents; creditors[creditor].cents -= cents;
      if (!debtors[debtor].cents) debtor++; if (!creditors[creditor].cents) creditor++;
    }
    renderTransfers(); saveState(); showScreen('settlement');
  }
  function renderTransfers() {
    $('transfers').innerHTML = state.transfers.length ? state.transfers.map(transfer => `<div class="transfer-row"><strong>${escapeHtml(transfer.from)}</strong><span class="arrow ds-muted">→</span><strong>${escapeHtml(transfer.to)}</strong><span class="amount ds-badge ds-badge-primary">${money(transfer.amount)}</span></div>`).join('') : `<div class="empty-result ds-supporting">${tr('Все игроки вышли в ноль — переводов нет.')}</div>`;
  }
  function newGame() {
    musicAudio.pause();
    state.screen = 'setup'; state.players = []; state.game = structuredClone(defaults.game); state.transfers = []; saveState(); fillSetup(); showScreen('setup');
  }

  $('add-chip').addEventListener('click', () => { state.inventory.push({ denomination: 25, count: 20 }); saveState(); renderInventory(); });
  function changePlayerCount(delta) {
    $('players-count').value = Math.min(12, Math.max(2, Math.floor(inputNumber('players-count')) + delta));
    readSetup();
  }
  $('decrement-players').addEventListener('click', () => changePlayerCount(-1));
  $('increment-players').addEventListener('click', () => changePlayerCount(1));
  ['players-count','start-stack','buy-in','round-count','round-minutes','rebuy-round','small-blind','big-blind','blind-growth'].forEach(id => $(id).addEventListener('input', readSetup));
  ['rounds-enabled','rebuy-enabled','blinds-enabled'].forEach(id => $(id).addEventListener('change', () => { toggleSettings(); readSetup(); }));
  $('continue').addEventListener('click', preparePlayers); $('start-game').addEventListener('click', startGame); $('pause-game').addEventListener('click', togglePause);
  $('add-music').addEventListener('click', () => $('music-files').click());
  $('music-files').addEventListener('change', event => importMusic(event.target.files));
  $('music-toggle').addEventListener('click', toggleMusic);
  $('music-previous').addEventListener('click', () => changeMusicTrack(-1));
  $('music-next').addEventListener('click', () => changeMusicTrack(1));
  $('music-expand').addEventListener('click', toggleMusicDetails);
  musicAudio.addEventListener('play', renderMusicPlayer); musicAudio.addEventListener('pause', renderMusicPlayer); musicAudio.addEventListener('ended', () => changeMusicTrack(1));
  if ('mediaSession' in navigator) {
    [['play', () => musicAudio.play()], ['pause', () => musicAudio.pause()], ['previoustrack', () => changeMusicTrack(-1)], ['nexttrack', () => changeMusicTrack(1)]].forEach(([action, handler]) => {
      try { navigator.mediaSession.setActionHandler(action, handler); } catch (_) {}
    });
  }
  $('finish-early').addEventListener('click', () => { if (confirm(tr('Завершить игру и перейти к расчёту?'))) openCashout(); });
  $('finish-game').addEventListener('click', openCashout); $('calculate-transfers').addEventListener('click', calculateTransfers); $('new-game').addEventListener('click', newGame);
  document.querySelectorAll('.back-button').forEach(button => button.addEventListener('click', () => { if (button.dataset.target === 'game') { renderGame(); startTimerLoop(); } showScreen(button.dataset.target); }));
  document.addEventListener('visibilitychange', () => { if (document.hidden) saveState(); else if (state.screen === 'game') startTimerLoop(); });
  window.addEventListener('beforeinstallprompt', event => { event.preventDefault(); installPrompt = event; $('install-app').hidden = false; });
  $('install-app').addEventListener('click', async () => {
    if (!installPrompt) { alert(tr('На iPhone нажмите «Поделиться», затем «На экран Домой». После первой загрузки приложение будет работать без интернета.')); return; }
    installPrompt.prompt(); await installPrompt.userChoice; installPrompt = null; $('install-app').hidden = true;
  });
  window.addEventListener('appinstalled', () => { $('install-app').hidden = true; });
  if ('serviceWorker' in navigator) {
    let refreshingForUpdate = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshingForUpdate) return;
      refreshingForUpdate = true;
      window.location.reload();
    });
    window.addEventListener('load', async () => {
      const registration = await navigator.serviceWorker.register('./sw.js');
      registration.update();
    });
  }

  const isAppleMobile = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  if (isAppleMobile && !isStandalone) $('install-app').hidden = false;

  $('language-switch').addEventListener('change', event => {
    language = event.target.value === 'en' ? 'en' : 'ru';
    localStorage.setItem(LANGUAGE_KEY, language);
    applyLanguage();
  });
  fillSetup();
  loadMusicLibrary();
  if (!screens.includes(state.screen)) state.screen = 'setup';
  if (state.screen === 'players') renderPlayerInputs();
  if (state.screen === 'game') { syncTimer(); renderGame(); startTimerLoop(); }
  if (state.screen === 'cashout') openCashout();
  if (state.screen === 'settlement') renderTransfers();
  showScreen(state.screen);
  applyLanguage();
})();
