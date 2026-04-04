const castPresets = [
  { actor: "Linnea Beukema", roles: ["PALAMON"] },
  { actor: "Joshie Cheng", roles: ["ARTESIUS", "JAILER", "FOURTH COUNTRYMAN", "SCHOOLMASTER"] },
  { actor: "Charlotte Convis", roles: ["EMILIA"] },
  { actor: "Kailyn Forsythe", roles: ["ARCITE"] },
  { actor: "John Paul Giorgis", roles: ["PIRITHOUS", "BROTHER"] },
  { actor: "Izzy Hernandez", roles: ["FIRST QUEEN", "SECOND COUNTRYMAN", "MESSENGER"] },
  { actor: "Gretta Keffer", roles: ["HIPPOLYTA"] },
  { actor: "Marek Oszwaldowski", roles: ["THESEUS"] },
  { actor: "Faith Peters", roles: ["SECOND QUEEN", "FIRST COUNTRYMAN", "WOMAN", "DOCTOR"] },
  { actor: "Annelise Ricks", roles: ["THIRD QUEEN", "VALERIUS", "WOOER", "THIRD COUNTRYMAN", "SERVANT"] },
  { actor: "Grace Treseler", roles: ["DAUGHTER"] }
];

const storageKey = "cuekeeper-session-v1";

const dom = {
  layout: document.getElementById("layout"),
  setupPanel: document.getElementById("setupPanel"),
  castPresetSelect: document.getElementById("castPresetSelect"),
  applyPresetBtn: document.getElementById("applyPresetBtn"),
  presetSummary: document.getElementById("presetSummary"),
  manualSelectionDetails: document.getElementById("manualSelectionDetails"),
  manualSelectionHint: document.getElementById("manualSelectionHint"),
  characterFilters: document.getElementById("characterFilters"),
  showDirectionsToggle: document.getElementById("showDirectionsToggle"),
  selectedRoleCount: document.getElementById("selectedRoleCount"),
  lineCount: document.getElementById("lineCount"),
  sceneLabel: document.getElementById("sceneLabel"),
  sceneStartBanner: document.getElementById("sceneStartBanner"),
  sceneStartText: document.getElementById("sceneStartText"),
  speakerLabel: document.getElementById("speakerLabel"),
  progressText: document.getElementById("progressText"),
  progressFill: document.getElementById("progressFill"),
  cueSpeaker: document.getElementById("cueSpeaker"),
  cueText: document.getElementById("cueText"),
  stageDirectionBox: document.getElementById("stageDirectionBox"),
  stageDirectionText: document.getElementById("stageDirectionText"),
  lineText: document.getElementById("lineText"),
  typingPracticeToggle: document.getElementById("typingPracticeToggle"),
  typingPracticePanel: document.getElementById("typingPracticePanel"),
  checkerModeSelect: document.getElementById("checkerModeSelect"),
  typingInput: document.getElementById("typingInput"),
  checkTypingBtn: document.getElementById("checkTypingBtn"),
  clearTypingBtn: document.getElementById("clearTypingBtn"),
  typingFeedback: document.getElementById("typingFeedback"),
  accuracyHistoryPanel: document.getElementById("accuracyHistoryPanel"),
  clearHistoryBtn: document.getElementById("clearHistoryBtn"),
  historyAverage: document.getElementById("historyAverage"),
  historyCount: document.getElementById("historyCount"),
  historyList: document.getElementById("historyList"),
  reviewDeckPanel: document.getElementById("reviewDeckPanel"),
  clearReviewDeckBtn: document.getElementById("clearReviewDeckBtn"),
  reviewDeckCount: document.getElementById("reviewDeckCount"),
  reviewDeckMode: document.getElementById("reviewDeckMode"),
  startReviewDeckBtn: document.getElementById("startReviewDeckBtn"),
  returnToMainDeckBtn: document.getElementById("returnToMainDeckBtn"),
  reviewDeckHint: document.getElementById("reviewDeckHint"),
  revealBtn: document.getElementById("revealBtn"),
  nextBtn: document.getElementById("nextBtn"),
  restartBtn: document.getElementById("restartBtn"),
  toggleSetupBtn: document.getElementById("toggleSetupBtn"),
  selectAllBtn: document.getElementById("selectAllBtn"),
  clearBtn: document.getElementById("clearBtn")
};

const characters = typeof characterDirectory !== "undefined"
  ? [...characterDirectory]
  : getCharacters(scriptEntries);

const appState = {
  selectedCharacters: [],
  selectedPresetActor: "",
  showDirections: true,
  typingPracticeEnabled: false,
  checkerMode: "lenient",
  accuracyHistory: [],
  reviewDeckIds: [],
  activeDeckMode: "main",
  isFocusMode: false,
  rehearsalDeck: [],
  currentCardIndex: 0,
  isLineVisible: false
};

dom.showDirectionsToggle.checked = appState.showDirections;
dom.typingPracticeToggle.checked = appState.typingPracticeEnabled;
dom.checkerModeSelect.value = appState.checkerMode;

function getCharacters(entries) {
  return [...new Set(
    entries
      .filter((entry) => entry.type === "line")
      .map((entry) => entry.speaker)
  )];
}

function countLinesForCharacter(character) {
  return scriptEntries.filter(
    (entry) => entry.type === "line" && entry.speaker === character
  ).length;
}

function getPresetByActor(actorName) {
  return castPresets.find((preset) => preset.actor === actorName) ?? null;
}

function getSerializableState() {
  return {
    selectedCharacters: appState.selectedCharacters,
    selectedPresetActor: appState.selectedPresetActor,
    showDirections: appState.showDirections,
    typingPracticeEnabled: appState.typingPracticeEnabled,
    checkerMode: appState.checkerMode,
    accuracyHistory: appState.accuracyHistory,
    reviewDeckIds: appState.reviewDeckIds,
    activeDeckMode: appState.activeDeckMode,
    isFocusMode: appState.isFocusMode,
    currentCardIndex: appState.currentCardIndex,
    isLineVisible: appState.isLineVisible,
    manualSelectionOpen: dom.manualSelectionDetails.open
  };
}

function saveState() {
  localStorage.setItem(storageKey, JSON.stringify(getSerializableState()));
}

function applySavedState(savedState) {
  if (!savedState || typeof savedState !== "object") {
    return;
  }

  if (Array.isArray(savedState.selectedCharacters)) {
    appState.selectedCharacters = savedState.selectedCharacters.filter((character) => characters.includes(character));
  }

  if (typeof savedState.selectedPresetActor === "string" && getPresetByActor(savedState.selectedPresetActor)) {
    appState.selectedPresetActor = savedState.selectedPresetActor;
  }

  if (typeof savedState.showDirections === "boolean") {
    appState.showDirections = savedState.showDirections;
  }

  if (typeof savedState.typingPracticeEnabled === "boolean") {
    appState.typingPracticeEnabled = savedState.typingPracticeEnabled;
  }

  if (savedState.checkerMode === "strict" || savedState.checkerMode === "lenient") {
    appState.checkerMode = savedState.checkerMode;
  }

  if (Array.isArray(savedState.accuracyHistory)) {
    appState.accuracyHistory = savedState.accuracyHistory.filter((entry) => (
      entry &&
      typeof entry.score === "number" &&
      typeof entry.speaker === "string" &&
      typeof entry.scene === "string"
    ));
  }

  if (Array.isArray(savedState.reviewDeckIds)) {
    const validEntryIds = new Set(scriptEntries.map((entry) => entry.id));
    appState.reviewDeckIds = savedState.reviewDeckIds.filter((entryId) => validEntryIds.has(entryId));
  }

  if (savedState.activeDeckMode === "review" || savedState.activeDeckMode === "main") {
    appState.activeDeckMode = savedState.activeDeckMode;
  }

  if (typeof savedState.isFocusMode === "boolean") {
    appState.isFocusMode = savedState.isFocusMode;
  }

  if (typeof savedState.isLineVisible === "boolean") {
    appState.isLineVisible = savedState.isLineVisible;
  }

  if (typeof savedState.manualSelectionOpen === "boolean") {
    dom.manualSelectionDetails.open = savedState.manualSelectionOpen;
  }

  if (Number.isInteger(savedState.currentCardIndex) && savedState.currentCardIndex >= 0) {
    appState.currentCardIndex = savedState.currentCardIndex;
  }
}

function loadSavedState() {
  const rawState = localStorage.getItem(storageKey);

  if (!rawState) {
    return;
  }

  try {
    applySavedState(JSON.parse(rawState));
  } catch (error) {
    localStorage.removeItem(storageKey);
  }
}

function populatePresetSelect() {
  castPresets.forEach((preset) => {
    const option = document.createElement("option");
    option.value = preset.actor;
    option.textContent = preset.actor;
    dom.castPresetSelect.append(option);
  });

  dom.castPresetSelect.value = appState.selectedPresetActor;
}

function findPreviousSpokenLine(startIndex) {
  for (let index = startIndex - 1; index >= 0; index -= 1) {
    const entry = scriptEntries[index];

    if (entry.type === "line") {
      return entry;
    }
  }

  return null;
}

function isFirstSpokenLineInScene(startIndex) {
  const currentEntry = scriptEntries[startIndex];

  for (let index = startIndex - 1; index >= 0; index -= 1) {
    const entry = scriptEntries[index];

    if (entry.scene !== currentEntry.scene) {
      return true;
    }

    if (entry.type === "line") {
      return false;
    }
  }

  return true;
}

function collectNearbyDirections(startIndex) {
  const directions = [];

  for (let index = startIndex - 1; index >= 0; index -= 1) {
    const entry = scriptEntries[index];

    if (entry.type === "line") {
      break;
    }

    if (entry.type === "direction") {
      directions.unshift(entry.text);
    }
  }

  return directions;
}

function buildRehearsalDeck(selectedCharacters) {
  return scriptEntries.flatMap((entry, index) => {
    if (entry.type !== "line" || !selectedCharacters.includes(entry.speaker)) {
      return [];
    }

    const cue = findPreviousSpokenLine(index);

    return [{
      id: entry.id,
      scene: entry.scene,
      speaker: entry.speaker,
      lineText: entry.text,
      isSceneStart: isFirstSpokenLineInScene(index),
      cueSpeaker: cue ? cue.speaker : "Opening cue",
      cueText: cue
        ? cue.text
        : "This is the first spoken line in the current sample, so there is no spoken cue before it.",
      stageDirections: collectNearbyDirections(index)
    }];
  });
}

function buildReviewDeck() {
  return appState.reviewDeckIds.flatMap((entryId) => {
    const match = scriptEntries.findIndex((entry) => entry.id === entryId);

    if (match === -1) {
      return [];
    }

    const entry = scriptEntries[match];
    const cue = findPreviousSpokenLine(match);

    return [{
      id: entry.id,
      scene: entry.scene,
      speaker: entry.speaker,
      lineText: entry.text,
      isSceneStart: isFirstSpokenLineInScene(match),
      cueSpeaker: cue ? cue.speaker : "Opening cue",
      cueText: cue
        ? cue.text
        : "This is the first spoken line in the current sample, so there is no spoken cue before it.",
      stageDirections: collectNearbyDirections(match)
    }];
  });
}

function renderCharacterFilters() {
  dom.characterFilters.innerHTML = "";

  characters.forEach((character) => {
    const option = document.createElement("label");
    option.className = "character-option";
    option.classList.toggle("is-selected", appState.selectedCharacters.includes(character));

    const meta = document.createElement("div");
    meta.className = "character-meta";

    const name = document.createElement("span");
    name.className = "character-name";
    name.textContent = character;

    const count = document.createElement("span");
    count.className = "character-count";
    count.textContent = `${countLinesForCharacter(character)} practice cards`;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = appState.selectedCharacters.includes(character);
    checkbox.value = character;
    checkbox.setAttribute("aria-label", `Practice ${character}`);

    checkbox.addEventListener("change", () => {
      appState.selectedPresetActor = "";
      dom.castPresetSelect.value = "";

      if (checkbox.checked) {
        appState.selectedCharacters = [...appState.selectedCharacters, character];
      } else {
        appState.selectedCharacters = appState.selectedCharacters.filter(
          (selectedCharacter) => selectedCharacter !== character
        );
      }

      resetDeck();
    });

    meta.append(name, count);
    option.append(meta, checkbox);
    dom.characterFilters.append(option);
  });
}

function renderStats() {
  dom.selectedRoleCount.textContent = appState.selectedCharacters.length.toString();
  dom.lineCount.textContent = appState.rehearsalDeck.length.toString();
}

function renderPresetSummary() {
  const selectedPreset = getPresetByActor(appState.selectedPresetActor);

  if (!selectedPreset) {
    dom.presetSummary.textContent = "Manual mode: choose any characters below.";
    return;
  }

  dom.presetSummary.textContent = `${selectedPreset.actor}: ${selectedPreset.roles.join(", ")}`;
}

function renderManualSelectionHint() {
  dom.manualSelectionHint.textContent = dom.manualSelectionDetails.open
    ? "Hide the full role list"
    : "Show the full role list";
}

function renderFocusMode() {
  dom.layout.classList.toggle("is-focused", appState.isFocusMode);
  dom.toggleSetupBtn.textContent = appState.isFocusMode
    ? "Show Character Selection Menu"
    : "Hide Character Selection Menu";
}

function normalizeForComparison(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9'\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function canonicalizeToken(token) {
  let normalized = token.toLowerCase();

  if (!normalized) {
    return "";
  }

  normalized = normalized
    .replace(/^wi'$/g, "we")
    .replace(/^i'$/g, "in")
    .replace(/^o'$/g, "of")
    .replace(/^e'en$/g, "even")
    .replace(/^ne'er$/g, "never")
    .replace(/^ha'$/g, "have")
    .replace(/^tis$/g, "tis")
    .replace(/^'tis$/g, "tis")
    .replace(/^'twas$/g, "twas")
    .replace(/^they$/g, "thee");

  if (normalized.endsWith("'d")) {
    normalized = normalized.slice(0, -2);
  }

  if (normalized.endsWith("'st")) {
    normalized = normalized.slice(0, -3);
  }

  if (normalized.endsWith("'")) {
    normalized = normalized.slice(0, -1);
  }

  return normalized;
}

function tokenizeForComparison(text) {
  return normalizeForComparison(text)
    .split(" ")
    .map(canonicalizeToken)
    .filter(Boolean);
}

function levenshteinDistance(left, right) {
  const rows = left.length + 1;
  const cols = right.length + 1;
  const matrix = Array.from({ length: rows }, () => Array(cols).fill(0));

  for (let row = 0; row < rows; row += 1) {
    matrix[row][0] = row;
  }

  for (let col = 0; col < cols; col += 1) {
    matrix[0][col] = col;
  }

  for (let row = 1; row < rows; row += 1) {
    for (let col = 1; col < cols; col += 1) {
      const cost = left[row - 1] === right[col - 1] ? 0 : 1;
      matrix[row][col] = Math.min(
        matrix[row - 1][col] + 1,
        matrix[row][col - 1] + 1,
        matrix[row - 1][col - 1] + cost
      );
    }
  }

  return matrix[left.length][right.length];
}

function tokensRoughlyMatch(left, right) {
  if (!left || !right) {
    return false;
  }

  if (left === right) {
    return true;
  }

  if (left.length >= 4 && right.length >= 4 && (left.startsWith(right) || right.startsWith(left))) {
    return true;
  }

  const distance = levenshteinDistance(left, right);
  return distance <= 1;
}

function getLcsLength(leftTokens, rightTokens) {
  const rows = leftTokens.length + 1;
  const cols = rightTokens.length + 1;
  const matrix = Array.from({ length: rows }, () => Array(cols).fill(0));

  for (let row = 1; row < rows; row += 1) {
    for (let col = 1; col < cols; col += 1) {
      if (tokensRoughlyMatch(leftTokens[row - 1], rightTokens[col - 1])) {
        matrix[row][col] = matrix[row - 1][col - 1] + 1;
      } else {
        matrix[row][col] = Math.max(matrix[row - 1][col], matrix[row][col - 1]);
      }
    }
  }

  return matrix[leftTokens.length][rightTokens.length];
}

function renderTypingPractice() {
  const currentCard = appState.rehearsalDeck[appState.currentCardIndex];
  const hasCards = Boolean(currentCard);

  dom.typingPracticeToggle.checked = appState.typingPracticeEnabled;
  dom.checkerModeSelect.value = appState.checkerMode;
  dom.typingPracticePanel.hidden = !appState.typingPracticeEnabled;
  dom.typingInput.disabled = !appState.typingPracticeEnabled || !hasCards;
  dom.checkTypingBtn.disabled = !appState.typingPracticeEnabled || !hasCards;
  dom.clearTypingBtn.disabled = !appState.typingPracticeEnabled;
  dom.checkerModeSelect.disabled = !appState.typingPracticeEnabled;

  if (!appState.typingPracticeEnabled) {
    dom.typingFeedback.textContent = "Turn this on when you want to type your line and check it.";
    return;
  }

  if (!hasCards) {
    dom.typingFeedback.textContent = "Choose a character to start typing practice.";
    return;
  }

  if (!dom.typingInput.value.trim()) {
    dom.typingFeedback.textContent = "Type the line from memory, then click Check My Line.";
  }
}

function renderAccuracyHistory() {
  const history = appState.accuracyHistory;
  const hasHistory = history.length > 0;
  dom.accuracyHistoryPanel.hidden = !appState.typingPracticeEnabled;
  dom.historyList.innerHTML = "";

  if (!appState.typingPracticeEnabled) {
    return;
  }

  if (!hasHistory) {
    dom.historyAverage.textContent = "Average: --";
    dom.historyCount.textContent = "Checks: 0";
    const emptyItem = document.createElement("li");
    emptyItem.className = "history-item history-empty";
    emptyItem.textContent = "No typing checks yet this session.";
    dom.historyList.append(emptyItem);
    return;
  }

  const average = Math.round(
    history.reduce((total, entry) => total + entry.score, 0) / history.length
  );

  dom.historyAverage.textContent = `Average: ${average}%`;
  dom.historyCount.textContent = `Checks: ${history.length}`;

  history
    .slice(-5)
    .reverse()
    .forEach((entry) => {
      const item = document.createElement("li");
      item.className = "history-item";
      item.textContent = `${entry.score}% - ${entry.speaker} (${entry.scene})`;
      dom.historyList.append(item);
    });
}

function renderReviewDeckPanel() {
  const reviewCount = appState.reviewDeckIds.length;
  dom.reviewDeckPanel.hidden = !appState.typingPracticeEnabled;
  dom.reviewDeckCount.textContent = `Lines waiting: ${reviewCount}`;
  dom.reviewDeckMode.textContent = appState.activeDeckMode === "review"
    ? "Mode: Missed lines review"
    : "Mode: Main deck";
  dom.startReviewDeckBtn.disabled = reviewCount === 0 || appState.activeDeckMode === "review";
  dom.returnToMainDeckBtn.hidden = appState.activeDeckMode !== "review";
  dom.reviewDeckHint.textContent = reviewCount === 0
    ? "Low-scoring typed lines will be added here for extra review."
    : "Lines that score below the review threshold are saved here for extra practice.";
}

function renderCurrentCard() {
  const currentCard = appState.rehearsalDeck[appState.currentCardIndex];
  const hasCards = Boolean(currentCard);

  if (!hasCards) {
    dom.sceneLabel.textContent = "Rehearsal deck";
    dom.speakerLabel.textContent = "Choose a character to begin";
    dom.progressText.textContent = "0 of 0";
    dom.progressFill.style.width = "0%";
    dom.cueSpeaker.textContent = "Waiting";
    dom.cueText.textContent = appState.selectedCharacters.length === 0
      ? "Select at least one character to build a rehearsal deck."
      : "No rehearsal cards were found for the current selection.";
    dom.sceneStartBanner.hidden = true;
    dom.stageDirectionBox.hidden = true;
    dom.lineText.textContent = "Try the line from memory first. Reveal it only when you want to check yourself.";
    dom.lineText.classList.add("is-hidden");
    dom.revealBtn.textContent = "Reveal Line";
    dom.revealBtn.disabled = true;
    dom.nextBtn.disabled = true;
    dom.restartBtn.disabled = true;
    renderTypingPractice();
    return;
  }

  const progressNumber = appState.currentCardIndex + 1;
  const progressPercent = (progressNumber / appState.rehearsalDeck.length) * 100;
  const shouldShowDirections = appState.showDirections && currentCard.stageDirections.length > 0;

  dom.sceneLabel.textContent = currentCard.scene;
  dom.speakerLabel.textContent = currentCard.speaker;
  dom.progressText.textContent = `${progressNumber} of ${appState.rehearsalDeck.length}`;
  dom.progressFill.style.width = `${progressPercent}%`;
  dom.cueSpeaker.textContent = currentCard.cueSpeaker;
  dom.cueText.textContent = currentCard.cueText;
  dom.sceneStartBanner.hidden = !currentCard.isSceneStart;
  dom.sceneStartText.textContent = currentCard.isSceneStart
    ? `This is the first spoken line in ${currentCard.scene}.`
    : "";
  dom.stageDirectionBox.hidden = !shouldShowDirections;
  dom.stageDirectionText.textContent = currentCard.stageDirections.join(" ");

  if (appState.isLineVisible) {
    dom.lineText.textContent = currentCard.lineText;
    dom.lineText.classList.remove("is-hidden");
    dom.revealBtn.textContent = "Hide Line";
  } else {
    dom.lineText.textContent = "Speak the line from memory. Reveal it after you try.";
    dom.lineText.classList.add("is-hidden");
    dom.revealBtn.textContent = "Reveal Line";
  }

  dom.revealBtn.disabled = false;
  dom.nextBtn.disabled = appState.currentCardIndex >= appState.rehearsalDeck.length - 1;
  dom.restartBtn.disabled = false;
  renderTypingPractice();
}

function renderApp() {
  renderFocusMode();
  renderCharacterFilters();
  renderPresetSummary();
  renderStats();
  renderCurrentCard();
  renderAccuracyHistory();
  renderReviewDeckPanel();
}

function resetDeck() {
  appState.rehearsalDeck = appState.activeDeckMode === "review"
    ? buildReviewDeck()
    : buildRehearsalDeck(appState.selectedCharacters);
  appState.currentCardIndex = 0;
  appState.isLineVisible = false;
  dom.typingInput.value = "";
  renderApp();
  saveState();
}

function rebuildDeckFromState() {
  appState.rehearsalDeck = appState.activeDeckMode === "review"
    ? buildReviewDeck()
    : buildRehearsalDeck(appState.selectedCharacters);

  if (appState.rehearsalDeck.length === 0) {
    appState.currentCardIndex = 0;
    appState.isLineVisible = false;
  } else if (appState.currentCardIndex > appState.rehearsalDeck.length - 1) {
    appState.currentCardIndex = appState.rehearsalDeck.length - 1;
  }

  renderApp();
  saveState();
}

function applyPreset(actorName) {
  const preset = getPresetByActor(actorName);

  if (!preset) {
    return;
  }

  appState.selectedPresetActor = preset.actor;
  appState.selectedCharacters = preset.roles.filter((role) => characters.includes(role));
  dom.castPresetSelect.value = preset.actor;
  resetDeck();
}

function toggleLineVisibility() {
  if (appState.rehearsalDeck.length === 0) {
    return;
  }

  appState.isLineVisible = !appState.isLineVisible;
  renderCurrentCard();
  saveState();
}

function moveToNextCard() {
  if (appState.currentCardIndex >= appState.rehearsalDeck.length - 1) {
    return;
  }

  appState.currentCardIndex += 1;
  appState.isLineVisible = false;
  dom.typingInput.value = "";
  renderCurrentCard();
  saveState();
}

function restartDeck() {
  appState.currentCardIndex = 0;
  appState.isLineVisible = false;
  dom.typingInput.value = "";
  renderCurrentCard();
  saveState();
}

function recordAccuracy(score, currentCard) {
  appState.accuracyHistory.push({
    score,
    speaker: currentCard.speaker,
    scene: currentCard.scene
  });

  if (score < 75 && !appState.reviewDeckIds.includes(currentCard.id)) {
    appState.reviewDeckIds.push(currentCard.id);
  }

  renderAccuracyHistory();
  renderReviewDeckPanel();
  saveState();
}

function checkTypedLine() {
  const currentCard = appState.rehearsalDeck[appState.currentCardIndex];

  if (!appState.typingPracticeEnabled || !currentCard) {
    return;
  }

  const typed = normalizeForComparison(dom.typingInput.value);
  const expected = normalizeForComparison(currentCard.lineText);
  const typedTokens = tokenizeForComparison(dom.typingInput.value);
  const expectedTokens = tokenizeForComparison(currentCard.lineText);

  if (!typed) {
    dom.typingFeedback.textContent = "Type something first, then check your line.";
    return;
  }

  if (typed === expected) {
    dom.typingFeedback.textContent = "Perfect match. Nice work.";
    recordAccuracy(100, currentCard);
    return;
  }

  if (appState.checkerMode === "strict") {
    const typedWords = typed.split(" ").filter(Boolean);
    const expectedWords = expected.split(" ").filter(Boolean);
    let matchingWords = 0;

    for (let index = 0; index < Math.min(typedWords.length, expectedWords.length); index += 1) {
      if (typedWords[index] !== expectedWords[index]) {
        break;
      }

      matchingWords += 1;
    }

    const strictAccuracy = expectedWords.length === 0
      ? 0
      : Math.round((matchingWords / expectedWords.length) * 100);

    if (matchingWords === 0) {
      dom.typingFeedback.textContent = `Strict mode: about ${strictAccuracy}% matched. Try the opening again.`;
      recordAccuracy(strictAccuracy, currentCard);
      return;
    }

    dom.typingFeedback.textContent = `Strict mode: about ${strictAccuracy}% matched. You were solid through about word ${matchingWords}.`;
    recordAccuracy(strictAccuracy, currentCard);
    return;
  }

  const typedWords = typedTokens;
  const expectedWords = expectedTokens;
  let matchingWords = 0;
  let mismatchIndex = -1;
  const compareLength = Math.min(typedWords.length, expectedWords.length);

  for (let index = 0; index < compareLength; index += 1) {
    if (tokensRoughlyMatch(typedWords[index], expectedWords[index])) {
      matchingWords += 1;
      continue;
    }

    mismatchIndex = index;
    break;
  }

  const sequenceMatches = getLcsLength(typedWords, expectedWords);
  const exactnessScore = expectedWords.length === 0 ? 0 : matchingWords / expectedWords.length;
  const sequenceScore = expectedWords.length === 0 ? 0 : sequenceMatches / expectedWords.length;
  const lengthPenalty = Math.min(1, typedWords.length / Math.max(expectedWords.length, 1));
  const accuracy = Math.round(((exactnessScore * 0.45) + (sequenceScore * 0.55)) * lengthPenalty * 100);
  const progressWordCount = mismatchIndex >= 0 ? matchingWords : compareLength;

  if (progressWordCount === 0) {
    dom.typingFeedback.textContent = `Close: about ${accuracy}% matched. Try the opening again.`;
    recordAccuracy(accuracy, currentCard);
    return;
  }

  dom.typingFeedback.textContent = `Close: about ${accuracy}% matched. You were solid through about word ${progressWordCount}.`;
  recordAccuracy(accuracy, currentCard);
}

dom.revealBtn.addEventListener("click", toggleLineVisibility);
dom.nextBtn.addEventListener("click", moveToNextCard);
dom.restartBtn.addEventListener("click", restartDeck);
dom.toggleSetupBtn.addEventListener("click", () => {
  appState.isFocusMode = !appState.isFocusMode;
  renderFocusMode();
  saveState();
});
dom.typingPracticeToggle.addEventListener("change", () => {
  appState.typingPracticeEnabled = dom.typingPracticeToggle.checked;
  if (!appState.typingPracticeEnabled) {
    dom.typingInput.value = "";
  }
  renderTypingPractice();
  renderAccuracyHistory();
  renderReviewDeckPanel();
  saveState();
});
dom.checkerModeSelect.addEventListener("change", () => {
  appState.checkerMode = dom.checkerModeSelect.value;
  renderTypingPractice();
  saveState();
});
dom.checkTypingBtn.addEventListener("click", checkTypedLine);
dom.clearTypingBtn.addEventListener("click", () => {
  dom.typingInput.value = "";
  renderTypingPractice();
});
dom.clearHistoryBtn.addEventListener("click", () => {
  appState.accuracyHistory = [];
  renderAccuracyHistory();
  saveState();
});
dom.startReviewDeckBtn.addEventListener("click", () => {
  if (appState.reviewDeckIds.length === 0) {
    return;
  }

  appState.activeDeckMode = "review";
  resetDeck();
});
dom.returnToMainDeckBtn.addEventListener("click", () => {
  appState.activeDeckMode = "main";
  resetDeck();
});
dom.clearReviewDeckBtn.addEventListener("click", () => {
  appState.reviewDeckIds = [];
  if (appState.activeDeckMode === "review") {
    appState.activeDeckMode = "main";
    resetDeck();
    return;
  }

  renderReviewDeckPanel();
  saveState();
});

dom.applyPresetBtn.addEventListener("click", () => {
  if (!dom.castPresetSelect.value) {
    appState.selectedPresetActor = "";
    appState.activeDeckMode = "main";
    resetDeck();
    return;
  }

  applyPreset(dom.castPresetSelect.value);
});

dom.castPresetSelect.addEventListener("change", () => {
  appState.selectedPresetActor = dom.castPresetSelect.value;
  renderPresetSummary();
  saveState();
});

dom.manualSelectionDetails.addEventListener("toggle", () => {
  renderManualSelectionHint();
  saveState();
});

dom.selectAllBtn.addEventListener("click", () => {
  appState.selectedPresetActor = "";
  dom.castPresetSelect.value = "";
  appState.selectedCharacters = [...characters];
  appState.activeDeckMode = "main";
  resetDeck();
});

dom.clearBtn.addEventListener("click", () => {
  appState.selectedPresetActor = "";
  dom.castPresetSelect.value = "";
  appState.selectedCharacters = [];
  appState.activeDeckMode = "main";
  resetDeck();
});

dom.showDirectionsToggle.addEventListener("change", () => {
  appState.showDirections = dom.showDirectionsToggle.checked;
  renderCurrentCard();
  saveState();
});

window.addEventListener("keydown", (event) => {
  const pressedKey = event.key.toLowerCase();

  if (
    event.target instanceof HTMLInputElement ||
    event.target instanceof HTMLTextAreaElement ||
    event.target instanceof HTMLSelectElement
  ) {
    return;
  }

  if (event.code === "Space") {
    event.preventDefault();
    toggleLineVisibility();
  }

  if (event.key === "ArrowRight") {
    event.preventDefault();
    moveToNextCard();
  }

  if (pressedKey === "r") {
    restartDeck();
  }
});

populatePresetSelect();
loadSavedState();
dom.showDirectionsToggle.checked = appState.showDirections;
dom.typingPracticeToggle.checked = appState.typingPracticeEnabled;
dom.checkerModeSelect.value = appState.checkerMode;
dom.castPresetSelect.value = appState.selectedPresetActor;
renderManualSelectionHint();
rebuildDeckFromState();
