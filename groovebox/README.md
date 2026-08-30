# Groovebox modular build

This build preserves the current working Groovebox while separating the monolithic HTML into focused files.

## Primary edit targets
- `groovebox.html` — page structure only
- `groovebox.css` — all styling
- `js/audio-engine.js` — Web Audio setup/master routing
- `js/drum-machine.js` — kick/snare/hats/perc voices
- `js/synth.js` — Synth 1/Synth 2 voice + patch state
- `js/arp.js` — arpeggiator
- `js/transport.js` — play/stop/scheduler timing
- `js/sequencer.js` — patterns + piano-roll editing
- `js/sampler.js` — sample slots/playback
- `js/mixer-engine.js` — channel buses/EQ/pan routing
- `js/mixer.js` — mixer interface
- `js/midi.js` — external MIDI + learn
- `js/project-save.js` — save/open/autosave
- `js/visualizer.js` — audio-reactive visuals

## Supporting files
- `js/state.js` and `js/score-state.js` hold shared pattern/MIDI state.
- `js/controls.js` binds synth controls and keyboard UI.
- `js/audio-settings.js` handles audio device controls.
- `js/recorder.js` keeps the existing audio/timeline recorder.
- `js/legacy-compat.js` contains older fallback patches kept in their original order for compatibility. New features should **not** be added there. As pieces are verified, compatibility code can be retired.
- `js/master-vu.js` drives the master meter.

The script load order in `groovebox.html` intentionally mirrors the former monolithic execution order.
