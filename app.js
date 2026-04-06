// This file is the main controller for the rehearsal app.
// It connects the script data, the HTML, and the user's actions.
// If you ever need to debug behavior, this is the first file to inspect.

// Cast presets map one actor name to the role labels used by the embedded script data.
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

// This is the localStorage key for the saved session snapshot.
const storageKey = "cuekeeper-session-v1";
// Cap the number of saved scoring records so storage stays lightweight and reliable.
const maxAccuracyHistoryEntries = 200;

// Cache important HTML elements once so the rest of the file can reuse them quickly.
const dom = {
  layout: document.getElementById("layout"),
  themeToggleBtn: document.getElementById("themeToggleBtn"),
  setupPanel: document.getElementById("setupPanel"),
  castPresetSelect: document.getElementById("castPresetSelect"),
  applyPresetBtn: document.getElementById("applyPresetBtn"),
  presetSummary: document.getElementById("presetSummary"),
  manualSelectionDetails: document.getElementById("manualSelectionDetails"),
  manualSelectionHint: document.getElementById("manualSelectionHint"),
  characterFilters: document.getElementById("characterFilters"),
  sceneFilterSelect: document.getElementById("sceneFilterSelect"),
  showDirectionsToggle: document.getElementById("showDirectionsToggle"),
  practiceModeSelect: document.getElementById("practiceModeSelect"),
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
  speakingCard: document.getElementById("speakingCard"),
  speakingPracticePanel: document.getElementById("speakingPracticePanel"),
  typingCard: document.getElementById("typingCard"),
  typingPracticePanel: document.getElementById("typingPracticePanel"),
  checkerModeSelect: document.getElementById("checkerModeSelect"),
  typingInput: document.getElementById("typingInput"),
  checkTypingBtn: document.getElementById("checkTypingBtn"),
  clearTypingBtn: document.getElementById("clearTypingBtn"),
  typingFeedback: document.getElementById("typingFeedback"),
  historyAverage: document.getElementById("historyAverage"),
  historyCount: document.getElementById("historyCount"),
  reviewDeckPanel: document.getElementById("reviewDeckPanel"),
  clearReviewDeckBtn: document.getElementById("clearReviewDeckBtn"),
  reviewDeckCount: document.getElementById("reviewDeckCount"),
  reviewDeckMode: document.getElementById("reviewDeckMode"),
  reviewRangeSelect: document.getElementById("reviewRangeSelect"),
  startReviewDeckBtn: document.getElementById("startReviewDeckBtn"),
  returnToMainDeckBtn: document.getElementById("returnToMainDeckBtn"),
  reviewDeckHint: document.getElementById("reviewDeckHint"),
  markForReviewToggle: document.getElementById("markForReviewToggle"),
  revealBtn: document.getElementById("revealBtn"),
  nextBtn: document.getElementById("nextBtn"),
  restartBtn: document.getElementById("restartBtn"),
  toggleSetupBtn: document.getElementById("toggleSetupBtn"),
  resetSessionBtn: document.getElementById("resetSessionBtn"),
  selectAllBtn: document.getElementById("selectAllBtn"),
  clearBtn: document.getElementById("clearBtn")
};

// Prefer the curated role list from TNK.js when available.
// If that list is missing, derive speakers from the spoken script entries.
const characters = typeof characterDirectory !== "undefined"
  ? [...characterDirectory]
  : getCharacters(scriptEntries);

// Build the act/scene dropdown options once from the script.
const sceneOptions = getSceneOptions(scriptEntries);

// This returns a brand-new copy of the app's default state.
// Resetting the app means replacing the current state with this shape.
function createDefaultState() {
  return {
    selectedCharacters: [],
    selectedPresetActor: "",
    isDarkMode: false,
    sceneFilter: "all",
    showDirections: true,
    practiceMode: "off",
    speakingSelections: {},
    checkerMode: "lenient",
    accuracyHistory: [],
    reviewRange: "under-75",
    markedLineIds: [],
    activeDeckMode: "main",
    isFocusMode: false,
    rehearsalDeck: [],
    currentCardIndex: 0,
    isLineVisible: false,
    lastRecordedCheckKey: ""
  };
}

// appState is the single source of truth for the current session.
const appState = createDefaultState();

// Keep the form controls in sync with the default state before the first render.
dom.showDirectionsToggle.checked = appState.showDirections;
dom.practiceModeSelect.value = appState.practiceMode;
dom.checkerModeSelect.value = appState.checkerMode;
dom.reviewRangeSelect.value = appState.reviewRange;
dom.sceneFilterSelect.value = appState.sceneFilter;

// Extract a unique speaker list from spoken lines only.
function getCharacters(entries) {
  return [...new Set(
    entries
      .filter((entry) => entry.type === "line")
      .map((entry) => entry.speaker)
  )];
}

// Convert the script's scene order into dropdown options:
// ACT 1, then ACT 1 Scene 1, ACT 1 Scene 2, and so on.
function getSceneOptions(entries) {
  const scenes = [...new Set(entries.map((entry) => entry.scene).filter(Boolean))];
  const orderedOptions = [];
  let currentAct = "";

  scenes.forEach((scene) => {
    const act = scene.split(" Scene ")[0];

    if (act && act !== currentAct) {
      orderedOptions.push({
        type: "act",
        value: act,
        label: act
      });
      currentAct = act;
    }

    orderedOptions.push({
      type: "scene",
      value: scene,
      label: `  ${scene}`
    });
  });

  return {
    orderedOptions
  };
}

// Count how many spoken lines belong to one role.
function countLinesForCharacter(character) {
  return scriptEntries.filter(
    (entry) => entry.type === "line" && entry.speaker === character
  ).length;
}

// Find the preset record for one actor.
function getPresetByActor(actorName) {
  return castPresets.find((preset) => preset.actor === actorName) ?? null;
}

// Keep only the newest saved accuracy entries.
function pruneAccuracyHistory(history) {
  if (!Array.isArray(history)) {
    return [];
  }

  return history.slice(-maxAccuracyHistoryEntries);
}

// Validate and normalize one saved accuracy entry from localStorage.
function normalizeAccuracyEntry(entry) {
  if (!entry || typeof entry !== "object" || typeof entry.score !== "number") {
    return null;
  }

  const speaker = typeof entry.speaker === "string" ? entry.speaker : "";
  const scene = typeof entry.scene === "string" ? entry.scene : "";
  const lineId = typeof entry.lineId === "string" ? entry.lineId : "";
  const checkerMode = entry.checkerMode === "strict" || entry.checkerMode === "lenient"
    ? entry.checkerMode
    : "lenient";
  const source = entry.source === "speaking" ? "speaking" : "typing";
  const timestamp = typeof entry.timestamp === "string" && !Number.isNaN(Date.parse(entry.timestamp))
    ? entry.timestamp
    : null;

  if (!speaker || !scene) {
    return null;
  }

  return {
    score: Math.max(0, Math.min(100, Math.round(entry.score))),
    speaker,
    scene,
    lineId,
    checkerMode,
    source,
    timestamp: timestamp ?? new Date(0).toISOString()
  };
}

// Build the exact subset of appState that is safe and useful to save.
function getSerializableState() {
  return {
    selectedCharacters: appState.selectedCharacters,
    selectedPresetActor: appState.selectedPresetActor,
    isDarkMode: appState.isDarkMode,
    sceneFilter: appState.sceneFilter,
    showDirections: appState.showDirections,
    practiceMode: appState.practiceMode,
    speakingSelections: appState.speakingSelections,
    checkerMode: appState.checkerMode,
    accuracyHistory: pruneAccuracyHistory(appState.accuracyHistory),
    reviewRange: appState.reviewRange,
    markedLineIds: appState.markedLineIds,
    activeDeckMode: appState.activeDeckMode,
    isFocusMode: appState.isFocusMode,
    currentCardIndex: appState.currentCardIndex,
    isLineVisible: appState.isLineVisible,
    manualSelectionOpen: dom.manualSelectionDetails.open
  };
}

// Write the current session snapshot to localStorage.
function saveState() {
  localStorage.setItem(storageKey, JSON.stringify(getSerializableState()));
}

// Restore a saved session while validating every field.
function applySavedState(savedState) {
  const defaultState = createDefaultState();
  Object.assign(appState, defaultState);
  dom.manualSelectionDetails.open = false;

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

  if (
    savedState.sceneFilter === "all" ||
    sceneOptions.orderedOptions.some((item) => item.value === savedState.sceneFilter)
  ) {
    appState.sceneFilter = savedState.sceneFilter;
  }

  if (typeof savedState.isDarkMode === "boolean") {
    appState.isDarkMode = savedState.isDarkMode;
  }

  if (
    savedState.practiceMode === "off" ||
    savedState.practiceMode === "speaking" ||
    savedState.practiceMode === "typing"
  ) {
    appState.practiceMode = savedState.practiceMode;
  } else if (typeof savedState.speakingPracticeEnabled === "boolean" || typeof savedState.typingPracticeEnabled === "boolean") {
    appState.practiceMode = savedState.typingPracticeEnabled
      ? "typing"
      : savedState.speakingPracticeEnabled
        ? "speaking"
        : "off";
  }

  if (savedState.speakingSelections && typeof savedState.speakingSelections === "object") {
    const validScores = new Set(["0", "25", "50", "75", "100"]);
    const validEntryIds = new Set(activeScriptEntries.map((entry) => entry.id));
    appState.speakingSelections = Object.fromEntries(
      Object.entries(savedState.speakingSelections).filter(([entryId, score]) => (
        validEntryIds.has(entryId) && validScores.has(String(score))
      ))
    );
  }

  if (savedState.checkerMode === "strict" || savedState.checkerMode === "lenient") {
    appState.checkerMode = savedState.checkerMode;
  }

  if (
    savedState.reviewRange === "under-75" ||
    savedState.reviewRange === "under-50" ||
    savedState.reviewRange === "under-25" ||
    savedState.reviewRange === "marked" ||
    savedState.reviewRange === "below-75" ||
    savedState.reviewRange === "below-50"
  ) {
    appState.reviewRange = savedState.reviewRange === "below-75"
      ? "under-75"
      : savedState.reviewRange === "below-50"
        ? "under-50"
        : savedState.reviewRange;
  }

  if (Array.isArray(savedState.markedLineIds)) {
    const validEntryIds = new Set(scriptEntries.map((entry) => entry.id));
    appState.markedLineIds = savedState.markedLineIds.filter((entryId) => validEntryIds.has(entryId));
  }

  if (Array.isArray(savedState.accuracyHistory)) {
    appState.accuracyHistory = pruneAccuracyHistory(
      savedState.accuracyHistory
        .map(normalizeAccuracyEntry)
        .filter(Boolean)
    );
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

// Read the saved session from localStorage and apply it if it is valid JSON.
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

// Clear temporary UI fields that should not carry across cards.
function clearTransientUi() {
  dom.typingInput.value = "";
}

// For review mode, keep the lowest score recorded for each line.
function getReviewableScoresByLine() {
  const reviewable = new Map();

  appState.accuracyHistory.forEach((entry) => {
    if (!entry.lineId) {
      return;
    }

    const existing = reviewable.get(entry.lineId);

    if (!existing || entry.score < existing.score) {
      reviewable.set(entry.lineId, entry);
    }
  });

  return reviewable;
}

// Decide whether one numeric score belongs in the selected review range.
function scoreMatchesRange(score, range) {
  if (range === "under-25") {
    return score < 25;
  }

  if (range === "under-50") {
    return score < 50;
  }

  return score < 75;
}

// Switch accordion icons between + and - based on whether each details block is open.
function renderAccordionIcons() {
  document.querySelectorAll("details").forEach((detailsElement) => {
    const icon = detailsElement.querySelector(":scope > summary .accordion-icon");

    if (!icon) {
      return;
    }

    icon.textContent = detailsElement.open ? "-" : "+";
  });
}

// Apply the current theme to the page and update the theme toggle label.
function renderTheme() {
  document.body.classList.toggle("theme-dark", appState.isDarkMode);
  dom.themeToggleBtn.textContent = appState.isDarkMode ? "Light Mode" : "Dark Mode";
}

// Start over from a fresh session while preserving the user's theme preference.
function resetSession() {
  const preservedDarkMode = appState.isDarkMode;
  Object.assign(appState, createDefaultState());
  appState.isDarkMode = preservedDarkMode;
  dom.castPresetSelect.value = "";
  dom.showDirectionsToggle.checked = appState.showDirections;
  dom.practiceModeSelect.value = appState.practiceMode;
  dom.checkerModeSelect.value = appState.checkerMode;
  dom.reviewRangeSelect.value = appState.reviewRange;
  dom.sceneFilterSelect.value = appState.sceneFilter;
  dom.manualSelectionDetails.open = false;
  clearTransientUi();
  localStorage.removeItem(storageKey);
  renderAccordionIcons();
  rebuildDeckFromState();
}

// Fill the cast preset dropdown from the castPresets array.
function populatePresetSelect() {
  castPresets.forEach((preset) => {
    const option = document.createElement("option");
    option.value = preset.actor;
    option.textContent = preset.actor;
    dom.castPresetSelect.append(option);
  });

  dom.castPresetSelect.value = appState.selectedPresetActor;
}

// Fill the act/scene dropdown from sceneOptions.
function populateSceneFilterSelect() {
  sceneOptions.orderedOptions.forEach((item) => {
    const option = document.createElement("option");
    option.value = item.value;
    option.textContent = item.label;
    dom.sceneFilterSelect.append(option);
  });

  dom.sceneFilterSelect.value = appState.sceneFilter;
}

// Return true only if an entry belongs in the current act/scene selection.
function entryMatchesSceneFilter(entry) {
  if (appState.sceneFilter === "all") {
    return true;
  }

  if (entry.scene === appState.sceneFilter) {
    return true;
  }

  return entry.scene.startsWith(`${appState.sceneFilter} `);
}

// Find the spoken cue immediately before the current line.
function findPreviousSpokenLine(startIndex) {
  for (let index = startIndex - 1; index >= 0; index -= 1) {
    const entry = scriptEntries[index];

    if (entry.type === "line") {
      return entry;
    }
  }

  return null;
}

// Check whether this line is the first spoken line in its scene.
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

// Gather stage directions that appear right before a spoken line.
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

// Turn the selected characters into a rehearsal deck of cue cards.
function buildRehearsalDeck(selectedCharacters) {
  return scriptEntries.flatMap((entry, index) => {
    if (
      entry.type !== "line" ||
      !selectedCharacters.includes(entry.speaker) ||
      !entryMatchesSceneFilter(entry)
    ) {
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

// Build a smaller deck from saved accuracy results instead of all selected lines.
function buildReviewDeck() {
  const reviewableIds = appState.reviewRange === "marked"
    ? [...appState.markedLineIds]
    : [...getReviewableScoresByLine().values()]
      .filter((entry) => scoreMatchesRange(entry.score, appState.reviewRange))
      .map((entry) => entry.lineId);

  return reviewableIds.flatMap((entryId) => {
    const match = scriptEntries.findIndex((entry) => entry.id === entryId);

    if (match === -1) {
      return [];
    }

    const entry = scriptEntries[match];

    if (!entryMatchesSceneFilter(entry)) {
      return [];
    }

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

// Rebuild the manual role checklist every render so the selected styles stay accurate.
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
      // Choosing manual roles cancels the preset, because the selection is now custom.
      appState.selectedPresetActor = "";
      dom.castPresetSelect.value = "";

      if (checkbox.checked) {
        // Add this role to the selected list.
        appState.selectedCharacters = [...appState.selectedCharacters, character];
      } else {
        // Remove this role from the selected list.
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

// Show a short summary of the currently selected cast preset.
function renderPresetSummary() {
  const selectedPreset = getPresetByActor(appState.selectedPresetActor);

  if (!selectedPreset) {
    dom.presetSummary.hidden = true;
    dom.presetSummary.textContent = "";
    return;
  }

  dom.presetSummary.hidden = false;
  dom.presetSummary.textContent = `Roles: ${selectedPreset.roles.join(", ")}`;
}

// Update the helper text under the manual-selection accordion.
function renderManualSelectionHint() {
  dom.manualSelectionHint.textContent = dom.manualSelectionDetails.open
    ? "Hide the full role list"
    : "Show the full role list";
}

// Hide or show the sidebar when focus mode is toggled.
function renderFocusMode() {
  dom.layout.classList.toggle("is-focused", appState.isFocusMode);
  dom.toggleSetupBtn.textContent = appState.isFocusMode
    ? "Show Menu"
    : "Hide Menu";
}

// Lowercase and strip punctuation so typing checks can compare text more fairly.
function normalizeForComparison(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9'\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Normalize old-style contractions and similar spellings into a friendlier comparison form.
function canonicalizeToken(token) {
  let normalized = token.toLowerCase();

  if (!normalized) {
    return "";
  }

  normalized = normalized
    .replace(/^wi'$/g, "we")
    .replace(/^i'$/g, "in")
    .replace(/^o'$/g, "of")
    .replace(/^an'$/g, "and")
    .replace(/^ol'$/g, "old")
    .replace(/^ev'ry$/g, "every")
    .replace(/^evry$/g, "every")
    .replace(/^ne?e?r$/g, "never")
    .replace(/^e'en$/g, "even")
    .replace(/^ne'er$/g, "never")
    .replace(/^ha'$/g, "have")
    .replace(/^'cause$/g, "because")
    .replace(/^cause$/g, "because")
    .replace(/^'em$/g, "them")
    .replace(/^gonna$/g, "going")
    .replace(/^wanna$/g, "want")
    .replace(/^gotta$/g, "got")
    .replace(/^kinda$/g, "kind")
    .replace(/^outta$/g, "out")
    .replace(/^tis$/g, "tis")
    .replace(/^'tis$/g, "tis")
    .replace(/^'twas$/g, "twas")
    .replace(/^i'm$/g, "im")
    .replace(/^you're$/g, "youre")
    .replace(/^we're$/g, "were")
    .replace(/^they're$/g, "theyre")
    .replace(/^can't$/g, "cant")
    .replace(/^won't$/g, "wont")
    .replace(/^don't$/g, "dont")
    .replace(/^didn't$/g, "didnt")
    .replace(/^doesn't$/g, "doesnt")
    .replace(/^isn't$/g, "isnt")
    .replace(/^wasn't$/g, "wasnt")
    .replace(/^weren't$/g, "werent")
    .replace(/^wouldn't$/g, "wouldnt")
    .replace(/^shouldn't$/g, "shouldnt")
    .replace(/^couldn't$/g, "couldnt")
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

function getProgressFeedback(score, progressWordCount, modeLabel = "Close") {
  if (score >= 97) {
    return `${modeLabel}: almost exact.`;
  }

  if (score >= 88) {
    return `${modeLabel}: very close overall.`;
  }

  if (score >= 72 && progressWordCount >= 6) {
    return `${modeLabel}: strong start, then a small drift later.`;
  }

  if (score >= 55 && progressWordCount >= 3) {
    return `${modeLabel}: solid opening, but the middle needs another pass.`;
  }

  if (progressWordCount >= 1) {
    return `${modeLabel}: you had the opening, but it went off track pretty early.`;
  }

  return `${modeLabel}: try the opening again.`;
}

// Split one line into normalized word-like tokens for scoring.
function tokenizeForComparison(text) {
  return normalizeForComparison(text)
    .split(" ")
    .map(canonicalizeToken)
    .filter(Boolean);
}

// Standard edit-distance helper used for fuzzy word matching.
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

// Allow small spelling differences or obvious partial forms to count as "close enough."
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

// Longest common subsequence gives partial credit when words appear in the right general order.
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

// Show or hide the typing practice UI and keep its controls in sync with state.
function renderTypingPractice() {
  const currentCard = appState.rehearsalDeck[appState.currentCardIndex];
  const hasCards = Boolean(currentCard);
  const typingEnabled = appState.practiceMode === "typing";

  dom.practiceModeSelect.value = appState.practiceMode;
  dom.typingCard.hidden = !typingEnabled;
  dom.checkerModeSelect.value = appState.checkerMode;
  dom.typingPracticePanel.hidden = !typingEnabled;
  dom.typingInput.disabled = !typingEnabled || !hasCards;
  dom.checkTypingBtn.disabled = !typingEnabled || !hasCards;
  dom.clearTypingBtn.disabled = !typingEnabled;
  dom.checkerModeSelect.disabled = !typingEnabled;

  if (!typingEnabled) {
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

// Show or hide the speaking practice UI and highlight the chosen speaking score button.
function renderSpeakingPractice() {
  const currentCard = appState.rehearsalDeck[appState.currentCardIndex];
  const hasCards = Boolean(currentCard);
  const selectedScore = currentCard ? String(appState.speakingSelections[currentCard.id] ?? "") : "";
  const speakingEnabled = appState.practiceMode === "speaking";

  dom.practiceModeSelect.value = appState.practiceMode;
  dom.speakingCard.hidden = !speakingEnabled;
  dom.speakingPracticePanel.hidden = !speakingEnabled;

  dom.speakingPracticePanel.querySelectorAll("button[data-speaking-score]").forEach((button) => {
    button.disabled = !speakingEnabled || !hasCards;
    button.classList.toggle("is-selected", button.dataset.speakingScore === selectedScore);
  });
}

// Update the visible session summary stats derived from the saved accuracy history.
function renderAccuracyHistory() {
  const history = appState.accuracyHistory;
  const hasHistory = history.length > 0;
  const analyticsEnabled = appState.practiceMode !== "off";

  if (!analyticsEnabled) {
    dom.historyAverage.textContent = "Session Accuracy: --";
    dom.historyCount.textContent = "Checks: 0";
    return;
  }

  if (!hasHistory) {
    dom.historyAverage.textContent = "Session Accuracy: --";
    dom.historyCount.textContent = "Checks: 0";
    return;
  }

  const average = Math.round(
    history.reduce((total, entry) => total + entry.score, 0) / history.length
  );

  dom.historyAverage.textContent = `Session Accuracy: ${average}%`;
  dom.historyCount.textContent = `Checks: ${history.length}`;
}

// Update the review tools area, including how many lines match the chosen score range.
function renderReviewDeckPanel() {
  const analyticsEnabled = appState.practiceMode !== "off";
  const reviewCount = buildReviewDeck().length;
  dom.reviewDeckPanel.hidden = !analyticsEnabled;
  dom.reviewRangeSelect.value = appState.reviewRange;
  dom.reviewDeckCount.textContent = `Matching Lines: ${reviewCount}`;
  dom.reviewDeckMode.textContent = appState.activeDeckMode === "review"
    ? "Mode: Accuracy review"
    : "Mode: Main deck";
  dom.startReviewDeckBtn.disabled = reviewCount === 0 || appState.activeDeckMode === "review";
  dom.returnToMainDeckBtn.hidden = appState.activeDeckMode !== "review";
  dom.reviewDeckHint.textContent = reviewCount === 0
    ? appState.reviewRange === "marked"
      ? "No lines are marked for review yet."
      : "No saved lines match this range yet."
    : appState.reviewRange === "marked"
      ? "Use your marked lines set to build a focused manual review deck."
      : "Use the selected range to build a focused review deck from saved checks.";
}

// Render the currently active rehearsal card, or the empty-state message if there is no deck yet.
function renderCurrentCard() {
  const currentCard = appState.rehearsalDeck[appState.currentCardIndex];
  const hasCards = Boolean(currentCard);

  if (!hasCards) {
    // Empty state: either no roles are selected yet, or the current filters produced no cards.
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
    dom.markForReviewToggle.checked = false;
    dom.markForReviewToggle.disabled = true;
    dom.lineText.textContent = "Try the line from memory first. Reveal it only when you want to check yourself.";
    dom.lineText.classList.add("is-hidden");
    dom.revealBtn.textContent = "Reveal Line";
    dom.revealBtn.disabled = true;
    dom.nextBtn.disabled = true;
    dom.restartBtn.disabled = true;
    renderSpeakingPractice();
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
  dom.markForReviewToggle.disabled = false;
  dom.markForReviewToggle.checked = appState.markedLineIds.includes(currentCard.id);

  if (appState.isLineVisible) {
    // Revealed state: show the exact script line.
    dom.lineText.textContent = currentCard.lineText;
    dom.lineText.classList.remove("is-hidden");
    dom.revealBtn.textContent = "Hide Line";
  } else {
    // Hidden state: encourage recall before showing the answer.
    dom.lineText.textContent = "Speak or type the line from memory. Reveal it after you try.";
    dom.lineText.classList.add("is-hidden");
    dom.revealBtn.textContent = "Reveal Line";
  }

  dom.revealBtn.disabled = false;
  dom.nextBtn.disabled = appState.currentCardIndex >= appState.rehearsalDeck.length - 1;
  dom.restartBtn.disabled = false;
  renderSpeakingPractice();
  renderTypingPractice();
}

// Render the whole interface from current state.
function renderApp() {
  renderTheme();
  renderFocusMode();
  renderCharacterFilters();
  renderPresetSummary();
  renderCurrentCard();
  renderSpeakingPractice();
  renderAccuracyHistory();
  renderReviewDeckPanel();
}

// Rebuild the current deck from state and jump back to the first card.
function resetDeck() {
  appState.rehearsalDeck = appState.activeDeckMode === "review"
    ? buildReviewDeck()
    : buildRehearsalDeck(appState.selectedCharacters);
  appState.currentCardIndex = 0;
  appState.isLineVisible = false;
  appState.lastRecordedCheckKey = "";
  clearTransientUi();
  renderApp();
  saveState();
}

// Rebuild the deck after loading saved state while trying to preserve the saved card index.
function rebuildDeckFromState() {
  appState.rehearsalDeck = appState.activeDeckMode === "review"
    ? buildReviewDeck()
    : buildRehearsalDeck(appState.selectedCharacters);

  if (appState.rehearsalDeck.length === 0) {
    appState.currentCardIndex = 0;
    appState.isLineVisible = false;
    appState.lastRecordedCheckKey = "";
  } else if (appState.currentCardIndex > appState.rehearsalDeck.length - 1) {
    appState.currentCardIndex = appState.rehearsalDeck.length - 1;
  }

  renderApp();
  saveState();
}

// Apply one preset actor by replacing the selected character list with that actor's roles.
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

// Toggle whether the answer line is hidden or visible.
function toggleLineVisibility() {
  if (appState.rehearsalDeck.length === 0) {
    return;
  }

  appState.isLineVisible = !appState.isLineVisible;
  renderCurrentCard();
  saveState();
}

// Advance to the next cue card and clear temporary input from the previous one.
function moveToNextCard() {
  if (appState.currentCardIndex >= appState.rehearsalDeck.length - 1) {
    return;
  }

  appState.currentCardIndex += 1;
  appState.isLineVisible = false;
  appState.lastRecordedCheckKey = "";
  clearTransientUi();
  renderCurrentCard();
  saveState();
}

// Jump back to the start of the current deck.
function restartDeck() {
  appState.currentCardIndex = 0;
  appState.isLineVisible = false;
  appState.lastRecordedCheckKey = "";
  clearTransientUi();
  renderCurrentCard();
  saveState();
}

// Save one accuracy result from typing or speaking.
// Returning false means this exact attempt was already saved and should not be duplicated.
function recordAccuracy(score, currentCard, attemptKey, source = "typing") {
  const checkKey = JSON.stringify({
    lineId: currentCard.id,
    source,
    checkerMode: source === "typing" ? appState.checkerMode : "manual-speaking",
    attemptKey
  });

  if (appState.lastRecordedCheckKey === checkKey) {
    return false;
  }

  const nextEntry = {
    score,
    speaker: currentCard.speaker,
    scene: currentCard.scene,
    lineId: currentCard.id,
    checkerMode: source === "typing" ? appState.checkerMode : "lenient",
    source,
    timestamp: new Date().toISOString()
  };
  const existingIndex = appState.accuracyHistory.findIndex((entry) => (
    entry.source === source && entry.lineId === currentCard.id
  ));

  if (existingIndex === -1) {
    appState.accuracyHistory.push(nextEntry);
  } else {
    appState.accuracyHistory[existingIndex] = nextEntry;
  }

  appState.accuracyHistory = pruneAccuracyHistory(appState.accuracyHistory);
  appState.lastRecordedCheckKey = checkKey;

  renderAccuracyHistory();
  renderReviewDeckPanel();
  saveState();
  return true;
}

// Speaking practice keeps one saved score per line and updates it if the user changes their mind.
function upsertSpeakingAccuracy(score, currentCard) {
  const existingIndex = appState.accuracyHistory.findIndex((entry) => (
    entry.source === "speaking" && entry.lineId === currentCard.id
  ));

  const nextEntry = {
    score,
    speaker: currentCard.speaker,
    scene: currentCard.scene,
    lineId: currentCard.id,
    checkerMode: "lenient",
    source: "speaking",
    timestamp: new Date().toISOString()
  };

  if (existingIndex === -1) {
    appState.accuracyHistory.push(nextEntry);
  } else {
    appState.accuracyHistory[existingIndex] = nextEntry;
  }

  appState.accuracyHistory = pruneAccuracyHistory(appState.accuracyHistory);
  renderAccuracyHistory();
  renderReviewDeckPanel();
  saveState();
}

// Score the typed answer against the current script line.
// Strict mode rewards exact order from the start; lenient mode gives partial credit.
function checkTypedLine() {
  const currentCard = appState.rehearsalDeck[appState.currentCardIndex];

  if (appState.practiceMode !== "typing" || !currentCard) {
    return;
  }

  const typedTokens = tokenizeForComparison(dom.typingInput.value);
  const expectedTokens = tokenizeForComparison(currentCard.lineText);
  const typed = typedTokens.join(" ");
  const expected = expectedTokens.join(" ");

  if (!typed) {
    dom.typingFeedback.textContent = "Type something first, then check your line.";
    return;
  }

  if (typed === expected) {
    // Fast path: a perfect normalized match always scores 100%.
    dom.typingFeedback.textContent = "Perfect match. Nice work.";
    if (!recordAccuracy(100, currentCard, typed, "typing")) {
      dom.typingFeedback.textContent = "That exact check is already in your history. Change the line before checking again.";
    }
    return;
  }

  if (appState.checkerMode === "strict") {
    // Strict mode only counts matching words from the opening sequence.
    const typedWords = typedTokens;
    const expectedWords = expectedTokens;
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

    dom.typingFeedback.textContent = getProgressFeedback(strictAccuracy, matchingWords, "Strict mode");
    if (!recordAccuracy(strictAccuracy, currentCard, typed, "typing")) {
      dom.typingFeedback.textContent = "That exact check is already in your history. Change the line before checking again.";
    }
    return;
  }

  // Lenient mode combines opening accuracy, sequence overlap, and length penalty.
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

  dom.typingFeedback.textContent = getProgressFeedback(accuracy, progressWordCount, "Close");
  if (!recordAccuracy(accuracy, currentCard, typed, "typing")) {
    dom.typingFeedback.textContent = "That exact check is already in your history. Change the line before checking again.";
  }
}

// Save the user's speaking self-score for the current line.
function recordSpeakingAttempt(score) {
  const currentCard = appState.rehearsalDeck[appState.currentCardIndex];

  if (appState.practiceMode !== "speaking" || !currentCard) {
    return;
  }

  appState.speakingSelections[currentCard.id] = score;
  upsertSpeakingAccuracy(score, currentCard);
  renderSpeakingPractice();
}

dom.revealBtn.addEventListener("click", toggleLineVisibility);
dom.nextBtn.addEventListener("click", moveToNextCard);
dom.restartBtn.addEventListener("click", restartDeck);
dom.toggleSetupBtn.addEventListener("click", () => {
  appState.isFocusMode = !appState.isFocusMode;
  renderFocusMode();
  saveState();
});
dom.themeToggleBtn.addEventListener("click", () => {
  appState.isDarkMode = !appState.isDarkMode;
  renderTheme();
  saveState();
});
dom.practiceModeSelect.addEventListener("change", () => {
  appState.practiceMode = dom.practiceModeSelect.value;
  appState.lastRecordedCheckKey = "";
  if (appState.practiceMode !== "typing") {
    dom.typingInput.value = "";
  }
  renderSpeakingPractice();
  renderTypingPractice();
  renderAccuracyHistory();
  renderReviewDeckPanel();
  saveState();
});
dom.sceneFilterSelect.addEventListener("change", () => {
  appState.sceneFilter = dom.sceneFilterSelect.value;
  appState.activeDeckMode = "main";
  resetDeck();
});
dom.reviewRangeSelect.addEventListener("change", () => {
  appState.reviewRange = dom.reviewRangeSelect.value;

  if (appState.activeDeckMode === "review") {
    resetDeck();
    return;
  }

  renderReviewDeckPanel();
  saveState();
});
dom.speakingPracticePanel.querySelectorAll("button[data-speaking-score]").forEach((button) => {
  button.addEventListener("click", () => {
    recordSpeakingAttempt(Number(button.dataset.speakingScore));
  });
});
dom.checkerModeSelect.addEventListener("change", () => {
  appState.checkerMode = dom.checkerModeSelect.value;
  appState.lastRecordedCheckKey = "";
  renderTypingPractice();
  saveState();
});
dom.checkTypingBtn.addEventListener("click", checkTypedLine);
dom.typingInput.addEventListener("input", () => {
  appState.lastRecordedCheckKey = "";
});
dom.clearTypingBtn.addEventListener("click", () => {
  dom.typingInput.value = "";
  appState.lastRecordedCheckKey = "";
  renderTypingPractice();
});
dom.markForReviewToggle.addEventListener("change", () => {
  const currentCard = appState.rehearsalDeck[appState.currentCardIndex];

  if (!currentCard) {
    return;
  }

  if (dom.markForReviewToggle.checked) {
    if (!appState.markedLineIds.includes(currentCard.id)) {
      appState.markedLineIds = [...appState.markedLineIds, currentCard.id];
    }
  } else {
    appState.markedLineIds = appState.markedLineIds.filter((entryId) => entryId !== currentCard.id);
  }

  renderReviewDeckPanel();
  saveState();
});
dom.startReviewDeckBtn.addEventListener("click", () => {
  if (buildReviewDeck().length === 0) {
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
  appState.accuracyHistory = [];
  appState.speakingSelections = {};
  appState.markedLineIds = [];
  appState.lastRecordedCheckKey = "";
  if (appState.activeDeckMode === "review") {
    appState.activeDeckMode = "main";
    resetDeck();
    return;
  }

  renderReviewDeckPanel();
  saveState();
});
dom.resetSessionBtn.addEventListener("click", resetSession);

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
  renderAccordionIcons();
  saveState();
});

document.querySelectorAll("details").forEach((detailsElement) => {
  if (detailsElement === dom.manualSelectionDetails) {
    return;
  }

  detailsElement.addEventListener("toggle", renderAccordionIcons);
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
populateSceneFilterSelect();
loadSavedState();
dom.showDirectionsToggle.checked = appState.showDirections;
dom.practiceModeSelect.value = appState.practiceMode;
dom.checkerModeSelect.value = appState.checkerMode;
dom.reviewRangeSelect.value = appState.reviewRange;
dom.sceneFilterSelect.value = appState.sceneFilter;
dom.castPresetSelect.value = appState.selectedPresetActor;
renderManualSelectionHint();
renderAccordionIcons();
rebuildDeckFromState();
