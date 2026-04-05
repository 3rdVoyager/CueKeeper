# CueKeeper

CueKeeper is a browser-based rehearsal tool for actors built around cue-based line practice. This version is tailored to *The Two Noble Kinsmen* and uses an embedded script dataset instead of live importing.

The rehearsal flow is simple:
- choose a role, cast preset, act, or scene
- read the cue
- speak or type the line from memory
- reveal the line only when you want to check yourself

## Current Features

### Rehearsal Deck
- Builds a cue-based practice deck in script order
- Uses the previous spoken line as the cue
- Flags the first spoken line of a scene with a `New Scene` banner
- Optionally shows nearby stage directions as context
- Lets you hide the setup menu for focused practice

### Character Selection
- Cast preset dropdown based on the current class casting
- Manual character selection for any combination of roles
- Full embedded TNK character directory

### Act / Scene Navigation
- Filter the rehearsal deck to the full script, a whole act, or one scene
- Scene dropdown is ordered by script flow: each act followed by its scenes

### Typing Checker
- Optional typing practice mode
- `Lenient` and `Strict` checker modes
- Duplicate-click protection so the same exact check is not saved repeatedly

### Speaking Checker
- Optional self-scored speaking practice mode
- Mark attempts as `Correct`, `Mostly Correct`, `Mostly Incorrect`, or `Incorrect`
- Saves one speaking result per line and lets the user change it if they misclick

### Review / Accuracy Tools
- Tracks session accuracy in the background
- Builds a review deck from saved accuracy ranges
- Lets the user practice lines that fall into ranges like `Below 75%` or `50% to 74%`

### Saved Session
- Saves progress in localStorage so accidental reloads do not wipe the session
- Restores selected roles, filters, deck position, theme, and practice settings
- `Reset Saved Session` clears the session while preserving the current color theme

### Theme
- Light mode and dark mode toggle
- Theme choice is saved with the session

## Project Files
- `index.html`
  The page structure. This is where the sidebar, rehearsal cards, buttons, and form controls live.
- `style.css`
  The visual design. This file controls layout, spacing, colors, dark mode, borders, and responsive behavior.
- `app.js`
  The app logic. This file manages state, deck building, rendering, saving/loading, typing checks, speaking checks, and event listeners.
- `TNK.js`
  The embedded script data and character directory for *The Two Noble Kinsmen*.
- `scripts/TNK - Final Script.pdf`
  The original uploaded script reference used during the demo build and cleanup process.

## How To Open It In VS Code
1. Open the `CueKeeper` folder in VS Code.
2. In the Explorer sidebar, open `index.html`, `style.css`, `app.js`, and `TNK.js`.
3. If you want to compare structure and behavior side by side, use the split editor button in the top right of the editor.
4. Open `index.html` in a browser, or use a VS Code extension like Live Preview or Live Server if you have one installed.

## Helpful Places To Read First
- Start with `index.html` if you want to understand what appears on the page.
- Read `app.js` if you want to understand how the rehearsal deck, checkers, and saved session work.
- Read `style.css` if you want to understand layout, spacing, colors, and dark mode.

The code now includes teaching-style comments throughout `index.html`, `style.css`, and `app.js` to make debugging easier for beginners.

## Keyboard Shortcuts
- `Space`
  Reveal or hide the current line
- `Right Arrow`
  Move to the next cue
- `R`
  Restart the current deck

## Current Limitations
- The embedded TNK script was cleaned from a PDF-based source, so some punctuation and stage directions may still need manual cleanup.
- This version is designed as a demo for one embedded play, not yet as a general-purpose script importer.
- Speaking checks are self-scored, not microphone-based speech recognition.

## Possible Next Steps
- Add first-letter or partial-prompt rehearsal mode
- Add chunked practice for long speeches
- Add stronger per-scene review summaries
- Continue script cleanup for stage directions and punctuation edge cases

## License
This project is licensed under the MIT License. See `LICENSE` for details.
