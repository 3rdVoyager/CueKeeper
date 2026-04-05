# CueKeeper Changelog

All notable changes to this project will be documented in this file.

## [0.3.0] - 2026-04-05
### Added
- Cast preset system based on the current class casting
- Collapsible sidebar sections for character selection, act/scene navigation, session settings, and review tools
- Act and scene filter dropdown that can limit practice to the full script, one act, or one scene
- Typing checker with `Lenient` and `Strict` modes
- Speaking checker with self-scored attempt buttons
- Accuracy-based review deck that can rebuild practice cards from selected score ranges
- Session persistence through localStorage for selected roles, filters, practice settings, deck progress, and theme
- Dark mode toggle with saved theme preference
- Focus mode to hide the setup menu during rehearsal
- Beginner-friendly code comments across `index.html`, `style.css`, and `app.js`

### Changed
- Reorganized the sidebar into clearer top-level sections
- Moved act/scene filtering into its own navigation section instead of keeping it under session settings
- Replaced the older visible accuracy-history list with a simpler session summary plus review-range controls
- Updated the review flow so saved scoring data powers review decks in the background
- Improved dark mode to use cleaner neutral card backgrounds and simpler effects
- Updated `README.md` to reflect the current app structure and feature set

### Fixed
- Prevented repeated typing checks from flooding saved history with duplicate entries
- Allowed speaking self-scores to be changed after a misclick while still keeping one saved result per line
- Preserved the selected color theme when using `Reset Saved Session`
- Fixed dark-mode styling issues for dropdowns, keyboard shortcut keys, line/speaking/typing cards, and the `New Scene` banner
- Fixed pointer-event overlap that made part of the `Next Cue` button unclickable
- Fixed scene-filter dropdown ordering so acts and scenes appear in script order
- Fixed stage-direction extraction issues in the embedded TNK script where directions were merged into spoken lines

## [0.2.0] - 2026-04-03
### Added
- Cue-based rehearsal interface with hidden-line practice flow
- Character checkboxes with select-all and clear actions
- Progress display and keyboard shortcuts
- Full embedded TNK script data extracted from the uploaded PDF
- Full character directory for the demo
- Optional stage-direction context box
- Updated README with project-file explanations for VS Code users

## [0.1.0] - 2026-04-03
### Added
- Basic test of features
- Preloaded first few lines from TNK script
- Multi-character selection support
- Display current line with character name
- Next Line and Restart buttons
- Basic HTML/CSS layout with clear line display
