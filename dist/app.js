const DEFAULT_ITEMS = [
  "宇宙人", "コーラ", "生ハム入りケーキ", "ニンニクマシマシ焼肉のたれ", "iQOS", "黄金のブレーカー像",
  "Yutaka Nishida", "NEXUS弾幕", "一升瓶", "最強のWi-Fi", "大量のミレー", "あふちのインスタアカウント",
  "がるちの画力", "ムッタの身長", "ノマドの海外の友達30人", "ティーバーの脚力", "エラーの歌声", "おじさんず名言集"
];

const DEFAULT_EPISODES = [
  {
    id: "yakiniku-kiss",
    text: "彼氏と家で焼肉パーティーをした。そのあと夜風にあたろうと外に散歩をしに行っていい感じの雰囲気になった。完全にキスをする流れになって、もう少しで唇と唇が重なり合うと言うタイミングで相手にゲップをかけてしまった。",
    image: "./assets/episode-yakiniku.jpg"
  },
  {
    id: "tokushima-ramen",
    text: "とある女の子が、徳島ラーメンに夢中になっていました。その後帰り道の途中、『なんか軽いな』と感じ手元を振り返ると、なんと言うことでしょう！ 持ってきたはずのキャリーケースをラーメン屋さんに置いてきたではありませんか…。",
    image: "./assets/episode-ramen.jpg"
  }
];

const TEAM_COLORS = ["#ff5a2a", "#387b70", "#7559a6"];
const app = document.querySelector("#app");
const setupTemplate = document.querySelector("#setup-template");
const presentationDialog = document.querySelector("#presentation-dialog");
const presentationContent = document.querySelector("#presentation-content");
const editorDialog = document.querySelector("#editor-dialog");
const editorForm = document.querySelector("#editor-form");
const toast = document.querySelector("#toast");

let setup = { teamCount: 2, names: ["チーム A", "チーム B", "チーム C"] };
let state = null;
let toastTimer;

const getCustomData = () => {
  try {
    const saved = JSON.parse(localStorage.getItem("cat-chocolate-custom") || "{}");
    return { items: saved.items || [], episodes: saved.episodes || [] };
  } catch {
    return { items: [], episodes: [] };
  }
};

const shuffle = (list) => {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const escapeHTML = (value) => String(value).replace(/[&<>'"]/g, char => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
})[char]);

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
}

function renderSetup() {
  state = null;
  app.replaceChildren(setupTemplate.content.cloneNode(true));
  renderTeamFields();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderTeamFields() {
  document.querySelectorAll("[data-action='set-team-count']").forEach(button => {
    button.classList.toggle("active", Number(button.dataset.count) === setup.teamCount);
  });
  const container = document.querySelector("#team-name-fields");
  if (!container) return;
  container.innerHTML = Array.from({ length: setup.teamCount }, (_, index) => `
    <label>
      <span>TEAM ${String(index + 1).padStart(2, "0")} NAME</span>
      <input data-team-name="${index}" maxlength="18" value="${escapeHTML(setup.names[index])}" aria-label="チーム${index + 1}の名前">
    </label>
  `).join("");
}

function startGame() {
  document.querySelectorAll("[data-team-name]").forEach(input => {
    const index = Number(input.dataset.teamName);
    setup.names[index] = input.value.trim() || `チーム ${String.fromCharCode(65 + index)}`;
  });

  const custom = getCustomData();
  const allItems = [...DEFAULT_ITEMS, ...custom.items];
  const deck = shuffle(allItems.map((name, index) => ({ id: `item-${index}-${name}`, name })));
  const teams = Array.from({ length: setup.teamCount }, (_, index) => ({
    name: setup.names[index], color: TEAM_COLORS[index], hand: deck.splice(0, 5), selected: [], score: 0
  }));
  const customEpisodes = custom.episodes.map((text, index) => ({ id: `custom-${index}`, text, image: null }));
  state = {
    round: 1,
    deck,
    teams,
    episodes: [...DEFAULT_EPISODES, ...customEpisodes],
    episodeHistory: [],
    episode: null,
    required: 0,
    winnerIndex: null
  };
  drawEpisode();
}

function drawEpisode() {
  if (!state) return;
  let candidates = state.episodes.filter(ep => !state.episodeHistory.includes(ep.id));
  if (!candidates.length) {
    state.episodeHistory = [];
    candidates = [...state.episodes];
  }
  state.episode = candidates[Math.floor(Math.random() * candidates.length)];
  state.episodeHistory.push(state.episode.id);
  state.required = Math.floor(Math.random() * 3) + 1;
  state.winnerIndex = null;
  state.teams.forEach(team => { team.selected = []; });
  renderGame();
}

function renderGame() {
  const episodeStyle = state.episode.image
    ? `style="background-image:url('${state.episode.image}')"`
    : `style="background-image:radial-gradient(circle at 70% 30%, #7d4433, #171312 70%)"`;
  app.innerHTML = `
    <div class="game-shell page-enter">
      <div class="game-status">
        <div class="status-left">
          <span class="round-label">ROUND <b>${String(state.round).padStart(2, "0")}</b></span>
          <span class="status-pill">山札 <strong>${state.deck.length}枚</strong></span>
          <span class="status-pill">エピソード <strong>${state.episodeHistory.length}/${state.episodes.length}</strong></span>
        </div>
        <div class="status-actions">
          <button class="small-button" data-action="reset-score">スコアをリセット</button>
          <button class="small-button" data-action="home">ゲームを終了</button>
        </div>
      </div>

      <section class="episode-wrap">
        <article class="episode-card" ${episodeStyle}>
          <div class="episode-content">
            <span class="episode-kicker">PINCH EPISODE</span>
            <h1>${escapeHTML(state.episode.text)}</h1>
            <div class="episode-actions">
              <button class="button light" data-action="read-episode">▶ 読み上げる</button>
              <button class="button dark-ghost" data-action="redraw-episode">↻ 引き直す</button>
            </div>
          </div>
          <div class="mission-badge" aria-label="使うアイテムは${state.required}枚">
            <span>USE<b>${state.required}</b><small>ITEM${state.required > 1 ? "S" : ""}</small></span>
          </div>
        </article>
      </section>

      <section class="teams-section">
        <div class="section-heading">
          <h2>チームの手札</h2>
          <p>各チーム ${state.required}枚 選択して発表</p>
        </div>
        <div class="teams-grid" style="--team-count:${state.teams.length}">
          ${state.teams.map(renderTeam).join("")}
        </div>
      </section>

      <div class="round-footer">
        <p>${roundFooterText()}</p>
        <button class="button primary" data-action="finish-round" ${canFinishRound() ? "" : "disabled"}>ラウンド終了・手札を補充 →</button>
      </div>
    </div>
  `;
}

function renderTeam(team, teamIndex) {
  const selectedCount = team.selected.length;
  const ready = selectedCount === state.required;
  return `
    <article class="team-panel ${state.winnerIndex === teamIndex ? "winner" : ""}" style="--team-color:${team.color}">
      <header class="team-head">
        <div class="team-identity"><span class="team-index">${teamIndex + 1}</span><h3>${escapeHTML(team.name)}</h3></div>
        <span class="score"><b>${team.score}</b> PT</span>
      </header>
      <div class="hand">
        ${team.hand.map((card, cardIndex) => {
          const isSelected = team.selected.includes(card.id);
          return `<button class="item-card ${isSelected ? "selected" : ""}" data-action="toggle-card" data-team="${teamIndex}" data-card="${cardIndex}" aria-pressed="${isSelected}">
            <span class="card-no">ITEM ${String(cardIndex + 1).padStart(2, "0")}</span>
            <strong>${escapeHTML(card.name)}</strong>
            <span class="select-mark">${isSelected ? "✓" : "+"}</span>
          </button>`;
        }).join("")}
      </div>
      <footer class="team-footer">
        <div class="selection-state"><span>${selectedCount} / ${state.required} 枚選択</span>${ready ? "<strong>READY</strong>" : ""}</div>
        <div class="team-actions">
          <button class="present-button" data-action="present" data-team="${teamIndex}" ${ready ? "" : "disabled"}>選んだカードを大きく表示</button>
          <button class="winner-button ${state.winnerIndex === teamIndex ? "active" : ""}" data-action="choose-winner" data-team="${teamIndex}" title="このチームを勝者にする" aria-label="${escapeHTML(team.name)}を勝者にする">★</button>
        </div>
      </footer>
    </article>
  `;
}

function roundFooterText() {
  const readyCount = state.teams.filter(team => team.selected.length === state.required).length;
  if (readyCount < state.teams.length) return `<strong>${readyCount}/${state.teams.length}チーム</strong> がカード選択済み`;
  if (state.winnerIndex === null) return `全チーム発表可能。<strong>審査員の勝者を★で選択</strong>`;
  return `<strong>${escapeHTML(state.teams[state.winnerIndex].name)}</strong> がこのラウンドの勝者`;
}

function canFinishRound() {
  return state.teams.every(team => team.selected.length === state.required) && state.winnerIndex !== null;
}

function toggleCard(teamIndex, cardIndex) {
  const team = state.teams[teamIndex];
  const card = team.hand[cardIndex];
  if (team.selected.includes(card.id)) {
    team.selected = team.selected.filter(id => id !== card.id);
  } else if (team.selected.length < state.required) {
    team.selected.push(card.id);
  } else {
    showToast(`使えるアイテムは${state.required}枚です`);
    return;
  }
  renderGame();
}

function presentTeam(teamIndex) {
  const team = state.teams[teamIndex];
  const cards = team.hand.filter(card => team.selected.includes(card.id));
  presentationContent.innerHTML = `
    <section class="presentation-shell" style="--team-color:${team.color};--used-count:${cards.length}">
      <div class="presentation-meta"><i></i><span>ROUND ${String(state.round).padStart(2, "0")} · ${escapeHTML(team.name)}</span></div>
      <h2 class="presentation-title">この${cards.length}枚で、<br>ピンチを切り抜けろ。</h2>
      <div class="presentation-cards">
        ${cards.map((card, index) => `<article class="presentation-card" style="--i:${index}"><span>SELECTED ITEM 0${index + 1}</span><strong>${escapeHTML(card.name)}</strong><b>${index + 1}</b></article>`).join("")}
      </div>
    </section>
  `;
  presentationDialog.showModal();
}

function chooseWinner(teamIndex) {
  state.winnerIndex = teamIndex;
  renderGame();
  showToast(`${state.teams[teamIndex].name}を勝者に選びました`);
}

function drawFromDeck(count) {
  const drawn = [];
  for (let i = 0; i < count; i += 1) {
    if (!state.deck.length) {
      const custom = getCustomData();
      state.deck = shuffle([...DEFAULT_ITEMS, ...custom.items].map((name, index) => ({ id: `reshuffle-${state.round}-${index}-${Math.random()}`, name })));
    }
    drawn.push(state.deck.shift());
  }
  return drawn;
}

function finishRound() {
  if (!canFinishRound()) return;
  state.teams[state.winnerIndex].score += 1;
  const returnedCards = [];
  state.teams.forEach(team => {
    const used = team.hand.filter(card => team.selected.includes(card.id));
    returnedCards.push(...used);
    team.hand = team.hand.filter(card => !team.selected.includes(card.id));
    team.selected = [];
  });
  state.deck = shuffle([...state.deck, ...returnedCards]);
  state.teams.forEach(team => { team.hand.push(...drawFromDeck(5 - team.hand.length)); });
  state.round += 1;
  showToast(`${returnedCards.length}枚を山札に戻し、手札を補充しました`);
  drawEpisode();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function readEpisode() {
  if (!("speechSynthesis" in window)) {
    showToast("このブラウザは読み上げに対応していません");
    return;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(state.episode.text);
  utterance.lang = "ja-JP";
  utterance.rate = .92;
  window.speechSynthesis.speak(utterance);
  showToast("エピソードを読み上げます");
}

function openEditor() {
  const custom = getCustomData();
  document.querySelector("#custom-items").value = custom.items.join("\n");
  document.querySelector("#custom-episodes").value = custom.episodes.join("\n\n");
  editorDialog.showModal();
}

editorForm.addEventListener("submit", event => {
  event.preventDefault();
  const items = document.querySelector("#custom-items").value.split("\n").map(value => value.trim()).filter(Boolean);
  const episodes = document.querySelector("#custom-episodes").value.split(/\n\s*\n/).map(value => value.trim()).filter(Boolean);
  localStorage.setItem("cat-chocolate-custom", JSON.stringify({ items, episodes }));
  editorDialog.close();
  showToast(`アイテム${items.length}枚・エピソード${episodes.length}枚を保存しました`);
});

document.addEventListener("input", event => {
  if (event.target.matches("[data-team-name]")) setup.names[Number(event.target.dataset.teamName)] = event.target.value;
});

document.addEventListener("click", event => {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  const action = button.dataset.action;
  if (action === "set-team-count") { setup.teamCount = Number(button.dataset.count); renderTeamFields(); }
  if (action === "start-game") startGame();
  if (action === "home") {
    if (!state || window.confirm("現在のゲームを終了して、セットアップに戻りますか？")) renderSetup();
  }
  if (action === "open-editor") openEditor();
  if (action === "toggle-card") toggleCard(Number(button.dataset.team), Number(button.dataset.card));
  if (action === "present") presentTeam(Number(button.dataset.team));
  if (action === "close-presentation") presentationDialog.close();
  if (action === "choose-winner") chooseWinner(Number(button.dataset.team));
  if (action === "finish-round") finishRound();
  if (action === "read-episode") readEpisode();
  if (action === "redraw-episode") { drawEpisode(); showToast("エピソードと必要枚数を引き直しました"); }
  if (action === "reset-score" && window.confirm("全チームのスコアを0に戻しますか？")) {
    state.teams.forEach(team => { team.score = 0; });
    renderGame();
  }
  if (action === "reset-custom" && window.confirm("追加したカードをすべて消去しますか？")) {
    localStorage.removeItem("cat-chocolate-custom");
    document.querySelector("#custom-items").value = "";
    document.querySelector("#custom-episodes").value = "";
    showToast("追加カードを消去しました");
  }
});

presentationDialog.addEventListener("click", event => {
  if (event.target === presentationDialog) presentationDialog.close();
});

renderSetup();
