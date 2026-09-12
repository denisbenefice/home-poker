(() => {
  'use strict';
  const STORAGE_KEY = 'home-poker-cash-v1';
  const $ = id => document.getElementById(id);
  const screens = ['setup', 'players', 'game', 'cashout', 'settlement'];
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

  function prepareAudio() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    if (!audioContext) audioContext = new AudioContext();
    if (audioContext.state === 'suspended') audioContext.resume().catch(() => {});
  }

  function playRoundEndSignal() {
    prepareAudio();
    if (!audioContext || audioContext.state !== 'running') return;
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
    $('save-status').textContent = 'Игра сохранена на этом устройстве';
  }
  const number = value => new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 }).format(value);
  const money = value => number(value) + ' ₽';
  const inputNumber = id => Number($(id).value) || 0;

  function showScreen(name) {
    state.screen = name;
    screens.forEach((screen, index) => {
      $('screen-' + screen).classList.toggle('active', screen === name);
      if (index < 4) document.querySelectorAll('.step')[index].classList.toggle('active', index <= Math.min(screens.indexOf(name), 3));
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
    saveState();
  }

  function fillSetup() {
    const s = state.setup;
    $('players-count').value = s.players; $('start-stack').value = s.stack; $('buy-in').value = s.buyIn;
    $('rounds-enabled').checked = s.roundsEnabled; $('round-count').value = s.rounds; $('round-minutes').value = s.minutes;
    $('rebuy-enabled').checked = s.rebuyEnabled; $('rebuy-round').value = s.rebuyRound;
    $('blinds-enabled').checked = s.blindsEnabled; $('small-blind').value = s.smallBlind; $('big-blind').value = s.bigBlind; $('blind-growth').value = String(s.growth);
    toggleSettings(); renderInventory();
  }
  function readSetup() {
    state.setup = {
      players: Math.floor(inputNumber('players-count')), stack: inputNumber('start-stack'), buyIn: inputNumber('buy-in'),
      roundsEnabled: $('rounds-enabled').checked, rounds: Math.floor(inputNumber('round-count')), minutes: inputNumber('round-minutes'),
      rebuyEnabled: $('rebuy-enabled').checked, rebuyRound: Math.floor(inputNumber('rebuy-round')),
      blindsEnabled: $('blinds-enabled').checked, smallBlind: inputNumber('small-blind'), bigBlind: inputNumber('big-blind'), growth: Number($('blind-growth').value)
    };
    saveState(); renderChipPlan();
  }
  function toggleSettings() {
    $('round-settings').hidden = !$('rounds-enabled').checked;
    $('rebuy-settings').hidden = !$('rebuy-enabled').checked;
    $('blind-settings').hidden = !$('blinds-enabled').checked;
  }

  function renderInventory() {
    $('chip-list').innerHTML = '';
    state.inventory.forEach((chip, index) => {
      const row = document.createElement('div'); row.className = 'chip-row';
      row.innerHTML = `<label class="field">Номинал<input class="chip-denomination" type="number" inputmode="numeric" min="1" value="${chip.denomination}"></label><label class="field">Всего в наборе<input class="chip-count" type="number" inputmode="numeric" min="0" value="${chip.count}"></label><button class="remove-button" type="button" aria-label="Удалить номинал">×</button>`;
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
    if (!target || !denominations.length) { $('chip-result').textContent = 'Добавьте доступные фишки, чтобы получить расклад.'; return; }
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
    if (!best) { $('chip-result').textContent = 'Из этого набора нельзя собрать заданный стек.'; return; }
    const used = denominations.map((chip, index) => ({ ...chip, each: dp[best].picks[index] || 0 })).filter(chip => chip.each > 0);
    const eachCount = used.reduce((sum, chip) => sum + chip.each, 0);
    const totalCount = eachCount * players;
    const leftovers = state.inventory.reduce((sum, chip) => sum + chip.count, 0) - totalCount;
    const rows = used.map(chip => `<tr><td>${number(chip.denomination)}</td><td>${chip.each} шт.</td><td>${chip.each * players} шт.</td></tr>`).join('');
    $('chip-result').innerHTML = `<div class="calculation-header"><strong>Расклад на ${players} игроков</strong><span class="success">${best === target ? 'Стек собран' : 'Ближайший вариант'}</span></div><table class="chip-table"><thead><tr><th>Номинал</th><th>Одному</th><th>Раздать</th></tr></thead><tbody>${rows}</tbody><tfoot><tr><td>Количество</td><td>${eachCount} шт.</td><td>${totalCount} шт.</td></tr></tfoot></table><strong>Стек игрока по номиналу: ${number(best)}</strong><br><span class="hint">В наборе останется ${leftovers} фишек.${best === target ? ' Мелкие номиналы добавлены для оплаты блайндов.' : ` По номиналу не хватает ${number(target - best)}.`}</span>`;
  }

  function preparePlayers() {
    readSetup();
    const s = state.setup;
    $('setup-error').textContent = '';
    if (s.players < 2 || s.players > 12 || s.stack <= 0 || s.buyIn <= 0 || (s.roundsEnabled && (s.rounds < 1 || s.minutes <= 0))) { $('setup-error').textContent = 'Проверьте количество игроков, стек, стоимость входа и параметры раундов.'; return; }
    const old = state.players;
    state.players = Array.from({ length: s.players }, (_, index) => old[index] || { name: `Игрок ${index + 1}`, rebuys: 0, cashout: s.stack });
    renderPlayerInputs(); showScreen('players');
  }
  function renderPlayerInputs() {
    $('player-list').innerHTML = '';
    state.players.forEach((player, index) => {
      const row = document.createElement('label'); row.className = 'player-row';
      row.innerHTML = `<span class="player-number">${index + 1}</span><input type="text" maxlength="30" value="${escapeHtml(player.name)}" aria-label="Имя игрока ${index + 1}">`;
      row.querySelector('input').addEventListener('input', event => { state.players[index].name = event.target.value; saveState(); });
      $('player-list').appendChild(row);
    });
  }
  function escapeHtml(text) { const div = document.createElement('div'); div.textContent = text; return div.innerHTML; }

  function startGame() {
    prepareAudio();
    state.players.forEach((player, index) => { player.name = player.name.trim() || `Игрок ${index + 1}`; player.rebuys = 0; player.cashout = state.setup.stack; });
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
      $('round-label').textContent = `Раунд ${g.round} из ${s.rounds}`;
      const minutes = Math.floor(g.remaining / 60), seconds = Math.floor(g.remaining % 60);
      $('game-title').textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
      $('timer-caption').textContent = g.finished ? 'время игры завершено' : 'до следующего раунда';
    } else { $('round-label').textContent = 'Игра без таймера'; $('game-title').textContent = '∞'; $('timer-caption').textContent = 'таймер отключён'; }
    const blinds = currentBlinds(); $('blind-value').textContent = blinds ? `${number(blinds[0])} / ${number(blinds[1])}` : 'Без блайндов';
    $('pause-game').textContent = g.running ? 'Пауза' : 'Продолжить'; $('pause-game').hidden = !s.roundsEnabled || g.finished;
    $('finish-game').hidden = !g.finished;
    const rebuyAllowed = !g.finished && (!s.rebuyEnabled || g.round <= s.rebuyRound);
    $('game-roster').innerHTML = state.players.map((player, index) => `<div class="roster-row"><div><strong>${escapeHtml(player.name)}</strong><small>Входов: ${player.rebuys + 1} · ${money((player.rebuys + 1) * s.buyIn)}</small></div><button class="rebuy-button" data-player="${index}" type="button" ${rebuyAllowed ? '' : 'disabled'}>+ Ребай</button></div>`).join('');
    document.querySelectorAll('.rebuy-button').forEach(button => button.addEventListener('click', () => { const index = Number(button.dataset.player); state.players[index].rebuys++; state.players[index].cashout += s.stack; saveState(); renderGame(); }));
    $('rebuy-note').textContent = s.rebuyEnabled ? (rebuyAllowed ? `Ребаи доступны до конца раунда ${s.rebuyRound}.` : 'Дедлайн ребаев прошёл.') : 'Ребаи доступны всю игру.';
  }
  function togglePause() {
    prepareAudio();
    syncTimer();
    if (state.game.running) { state.game.running = false; state.game.endAt = null; clearInterval(timerId); }
    else { state.game.running = true; state.game.endAt = Date.now() + state.game.remaining * 1000; startTimerLoop(); }
    saveState(); renderGame();
  }

  function openCashout() {
    syncTimer(); state.game.running = false; state.game.endAt = null; clearInterval(timerId); saveState();
    const issued = state.players.reduce((sum, player) => sum + (player.rebuys + 1) * state.setup.stack, 0);
    const pot = state.players.reduce((sum, player) => sum + (player.rebuys + 1) * state.setup.buyIn, 0);
    $('pot-value').textContent = money(pot); $('issued-value').textContent = number(issued);
    $('cashout-list').innerHTML = state.players.map((player, index) => `<label class="cashout-row"><span><strong>${escapeHtml(player.name)}</strong><small>Внёс ${money((player.rebuys + 1) * state.setup.buyIn)} · сумма номиналов справа</small></span><input class="cashout-input" data-player="${index}" type="number" inputmode="numeric" min="0" value="${player.cashout}" aria-label="Сумма номиналов у ${escapeHtml(player.name)}"></label>`).join('');
    $('cashout-error').textContent = ''; showScreen('cashout');
  }
  function calculateTransfers() {
    const inputs = [...document.querySelectorAll('.cashout-input')];
    inputs.forEach(input => { state.players[Number(input.dataset.player)].cashout = Number(input.value) || 0; });
    const issued = state.players.reduce((sum, player) => sum + (player.rebuys + 1) * state.setup.stack, 0);
    const actual = state.players.reduce((sum, player) => sum + player.cashout, 0);
    if (Math.abs(actual - issued) > 0.001) { $('cashout-error').textContent = `Сумма номиналов должна быть ${number(issued)}. Сейчас указано ${number(actual)}.`; return; }
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
    $('transfers').innerHTML = state.transfers.length ? state.transfers.map(transfer => `<div class="transfer-row"><strong>${escapeHtml(transfer.from)}</strong><span class="arrow">→</span><strong>${escapeHtml(transfer.to)}</strong><span class="amount">${money(transfer.amount)}</span></div>`).join('') : '<div class="empty-result">Все игроки вышли в ноль — переводов нет.</div>';
  }
  function newGame() {
    state.screen = 'setup'; state.players = []; state.game = structuredClone(defaults.game); state.transfers = []; saveState(); fillSetup(); showScreen('setup');
  }

  $('add-chip').addEventListener('click', () => { state.inventory.push({ denomination: 25, count: 20 }); saveState(); renderInventory(); });
  ['players-count','start-stack','buy-in','round-count','round-minutes','rebuy-round','small-blind','big-blind','blind-growth'].forEach(id => $(id).addEventListener('input', readSetup));
  ['rounds-enabled','rebuy-enabled','blinds-enabled'].forEach(id => $(id).addEventListener('change', () => { toggleSettings(); readSetup(); }));
  $('continue').addEventListener('click', preparePlayers); $('start-game').addEventListener('click', startGame); $('pause-game').addEventListener('click', togglePause);
  $('finish-early').addEventListener('click', () => { if (confirm('Завершить игру и перейти к расчёту?')) openCashout(); });
  $('finish-game').addEventListener('click', openCashout); $('calculate-transfers').addEventListener('click', calculateTransfers); $('new-game').addEventListener('click', newGame);
  document.querySelectorAll('.back-button').forEach(button => button.addEventListener('click', () => { if (button.dataset.target === 'game') { renderGame(); startTimerLoop(); } showScreen(button.dataset.target); }));
  document.addEventListener('visibilitychange', () => { if (document.hidden) saveState(); else if (state.screen === 'game') startTimerLoop(); });
  window.addEventListener('beforeinstallprompt', event => { event.preventDefault(); installPrompt = event; $('install-app').hidden = false; });
  $('install-app').addEventListener('click', async () => {
    if (!installPrompt) { alert('На iPhone нажмите «Поделиться», затем «На экран Домой». После первой загрузки приложение будет работать без интернета.'); return; }
    installPrompt.prompt(); await installPrompt.userChoice; installPrompt = null; $('install-app').hidden = true;
  });
  window.addEventListener('appinstalled', () => { $('install-app').hidden = true; });
  if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js'));

  const isAppleMobile = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  if (isAppleMobile && !isStandalone) $('install-app').hidden = false;

  fillSetup();
  if (!screens.includes(state.screen)) state.screen = 'setup';
  if (state.screen === 'players') renderPlayerInputs();
  if (state.screen === 'game') { syncTimer(); renderGame(); startTimerLoop(); }
  if (state.screen === 'cashout') openCashout();
  if (state.screen === 'settlement') renderTransfers();
  showScreen(state.screen);
})();
