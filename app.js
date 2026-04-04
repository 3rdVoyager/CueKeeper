const selectionStorageKey = "cuekeeper-selected-characters";

const dom = {
  characterFilters: document.getElementById("characterFilters"),
  showDirectionsToggle: document.getElementById("showDirectionsToggle"),
  selectedRoleCount: document.getElementById("selectedRoleCount"),
  lineCount: document.getElementById("lineCount"),
  directionCount: document.getElementById("directionCount"),
  sceneLabel: document.getElementById("sceneLabel"),
  speakerLabel: document.getElementById("speakerLabel"),
  progressText: document.getElementById("progressText"),
  progressFill: document.getElementById("progressFill"),
  cueSpeaker: document.getElementById("cueSpeaker"),
  cueText: document.getElementById("cueText"),
  stageDirectionBox: document.getElementById("stageDirectionBox"),
  stageDirectionText: document.getElementById("stageDirectionText"),
  lineText: document.getElementById("lineText"),
  revealBtn: document.getElementById("revealBtn"),
  nextBtn: document.getElementById("nextBtn"),
  restartBtn: document.getElementById("restartBtn"),
  selectAllBtn: document.getElementById("selectAllBtn"),
  clearBtn: document.getElementById("clearBtn")
};

const characters = getCharacters(scriptEntries);
const directionCount = scriptEntries.filter((entry) => entry.type === "direction").length;

const appState = {
  selectedCharacters: loadSelectedCharacters(),
  showDirections: true,
  rehearsalDeck: [],
  currentCardIndex: 0,
  isLineVisible: false
};

dom.showDirectionsToggle.checked = appState.showDirections;

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

function loadSelectedCharacters() {
  const savedSelection = localStorage.getItem(selectionStorageKey);

  if (!savedSelection) {
    return characters.slice(0, 1);
  }

  try {
    const parsedSelection = JSON.parse(savedSelection);
    const validSelection = parsedSelection.filter((character) => characters.includes(character));
    return validSelection.length > 0 ? validSelection : characters.slice(0, 1);
  } catch (error) {
    return characters.slice(0, 1);
  }
}

function persistSelectedCharacters() {
  localStorage.setItem(selectionStorageKey, JSON.stringify(appState.selectedCharacters));
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
      cueSpeaker: cue ? cue.speaker : "Opening cue",
      cueText: cue
        ? cue.text
        : "This is the first spoken line in the current sample, so there is no spoken cue before it.",
      stageDirections: collectNearbyDirections(index)
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
  dom.directionCount.textContent = directionCount.toString();
}

function renderCurrentCard() {
  const currentCard = appState.rehearsalDeck[appState.currentCardIndex];
  const hasCards = Boolean(currentCard);

  if (!hasCards) {
    dom.sceneLabel.textContent = "Warmup deck";
    dom.speakerLabel.textContent = "Choose a character to begin";
    dom.progressText.textContent = "0 of 0";
    dom.progressFill.style.width = "0%";
    dom.cueSpeaker.textContent = "Waiting";
    dom.cueText.textContent = appState.selectedCharacters.length === 0
      ? "Select at least one character to build a rehearsal deck."
      : "No rehearsal cards were found for the current selection.";
    dom.stageDirectionBox.hidden = true;
    dom.lineText.textContent = "Try the line from memory first. Reveal it only when you want to check yourself.";
    dom.lineText.classList.add("is-hidden");
    dom.revealBtn.textContent = "Reveal Line";
    dom.revealBtn.disabled = true;
    dom.nextBtn.disabled = true;
    dom.restartBtn.disabled = true;
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
}

function renderApp() {
  renderCharacterFilters();
  renderStats();
  renderCurrentCard();
}

function resetDeck() {
  appState.rehearsalDeck = buildRehearsalDeck(appState.selectedCharacters);
  appState.currentCardIndex = 0;
  appState.isLineVisible = false;
  persistSelectedCharacters();
  renderApp();
}

function toggleLineVisibility() {
  if (appState.rehearsalDeck.length === 0) {
    return;
  }

  appState.isLineVisible = !appState.isLineVisible;
  renderCurrentCard();
}

function moveToNextCard() {
  if (appState.currentCardIndex >= appState.rehearsalDeck.length - 1) {
    return;
  }

  appState.currentCardIndex += 1;
  appState.isLineVisible = false;
  renderCurrentCard();
}

function restartDeck() {
  appState.currentCardIndex = 0;
  appState.isLineVisible = false;
  renderCurrentCard();
}

dom.revealBtn.addEventListener("click", toggleLineVisibility);
dom.nextBtn.addEventListener("click", moveToNextCard);
dom.restartBtn.addEventListener("click", restartDeck);

dom.selectAllBtn.addEventListener("click", () => {
  appState.selectedCharacters = [...characters];
  resetDeck();
});

dom.clearBtn.addEventListener("click", () => {
  appState.selectedCharacters = [];
  resetDeck();
});

dom.showDirectionsToggle.addEventListener("change", () => {
  appState.showDirections = dom.showDirectionsToggle.checked;
  renderCurrentCard();
});

window.addEventListener("keydown", (event) => {
  const pressedKey = event.key.toLowerCase();

  if (event.target instanceof HTMLInputElement) {
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

resetDeck();
