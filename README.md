# CueKeeper

CueKeeper is a browser-based line memorization tool for actors. This version focuses on a cue-driven rehearsal flow: read the cue, say the line aloud, and reveal the text only when you want to check yourself.

## What Works Now
- Choose one or more characters with simple checkboxes
- Practice lines in script order instead of grouped by character
- See the previous spoken line as the cue
- Ignore stage directions as playable dialogue
- Optionally show nearby stage directions as rehearsal context
- Track progress through the current deck
- Use keyboard shortcuts for faster rehearsal

## Project Files
- `index.html`: page structure and button targets
- `style.css`: layout, colors, spacing, and responsive design
- `app.js`: app state, deck building, rendering, and button logic
- `TNK.js`: temporary hand-entered sample data inspired by TNK
- `scripts/TNK - Final Script.pdf`: uploaded class script for future parsing work

## How To Open It In VS Code
1. Open the `CueKeeper` folder in VS Code.
2. In the Explorer sidebar, click `index.html`, `style.css`, `app.js`, and `TNK.js`.
3. Drag tabs side by side if you want to compare structure, styling, and logic at the same time.
4. Open `index.html` in a browser to test the page after changes.

## Rehearsal Controls
- `Space`: reveal or hide the current line
- `Right Arrow`: move to the next cue
- `R`: restart the deck

## Next Steps
- Parse the uploaded PDF into structured entries
- Detect character names automatically
- Merge wrapped dialogue lines into single speeches
- Ignore stage directions more intelligently
- Save rehearsal progress per role or scene

## License
This project is licensed under the MIT License. See `LICENSE` for details.
