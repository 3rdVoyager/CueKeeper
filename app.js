// Preloaded demo lines
const script = {
  ARCITE: [
    "Dear Palamon, let us leave the city...",
    "How dangerous, if we will keep our honors..."
  ],
  PALAMON: [
    "Your advice is good...",
    "’Tis in our power—Unless we fear that apes can tutor..."
  ],
  EMILIA: [
    "That was a fair boy certain, but a fool...",
    "For when the west wind courts her gently..."
  ]
};

// Track multiple selected characters
let currentCharacters = ["ARCITE"]; // default
let currentIndexes = {}; // tracks line for each character

// Initialize indexes
Object.keys(script).forEach(char => currentIndexes[char] = 0);

const lineDisplay = document.getElementById("lineDisplay");
const characterSelect = document.getElementById("characterSelect");
const nextBtn = document.getElementById("nextBtn");
const restartBtn = document.getElementById("restartBtn");

// Show line based on the first character with remaining lines
function showLine() {
  // find the next character with remaining lines
  let nextChar = null;
  for (const char of currentCharacters) {
    if (currentIndexes[char] < script[char].length) {
      nextChar = char;
      break;
    }
  }

  if (!nextChar) {
    lineDisplay.innerHTML = "End of lines for all selected characters!";
    return;
  }

  // Display cue line with character name
  const line = script[nextChar][currentIndexes[nextChar]];
  lineDisplay.innerHTML = `<strong>${nextChar}:</strong> ${line}`;
}

// Update selected characters
characterSelect.addEventListener("change", () => {
  currentCharacters = Array.from(characterSelect.selectedOptions).map(o => o.value);
  // Reset indexes for selected characters
  currentCharacters.forEach(char => currentIndexes[char] = 0);
  showLine();
});

// Next line button
nextBtn.addEventListener("click", () => {
  // Increment line index for the first character with remaining lines
  for (const char of currentCharacters) {
    if (currentIndexes[char] < script[char].length) {
      currentIndexes[char]++;
      break;
    }
  }
  showLine();
});

// Restart button
restartBtn.addEventListener("click", () => {
  currentCharacters.forEach(char => currentIndexes[char] = 0);
  showLine();
});

// Initial display
showLine();