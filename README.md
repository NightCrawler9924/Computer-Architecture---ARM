# Datapath

Learn how computers actually run code. Datapath is an interactive course in microcomputer engineering: number
representation, memory and buses, the ARM processor and assembly, flags, and the Tiva LaunchPad labs. It has a
simulator, hands-on tools and practice questions, and it is designed to work well on a phone.

It follows the content of **ENGR 359 Microcomputer Engineering**.

**Live site:** https://nightcrawler9924.github.io/Computer-Architecture---ARM/

This is an unofficial student project. It is not affiliated with or endorsed by the university or the course staff.

## What you can do

- **Learn in order.** The Course tab covers number representation, memory and buses, the ARM processor, flags and
  conditional execution, loads and stores, and control flow. The Labs tab covers the Tiva LaunchPad and Lab 2.
  Every lesson asks you to predict before it explains, then works an example, then fades the support.
- **Run assembly.** The simulator assembles ARM code, steps forwards and back, sets breakpoints, and shows
  registers, flags and memory after every instruction, with a plain-language explanation of each flag.
- **Experiment.** Interactive tools for adding and subtracting 32-bit values column by column, the barrel shifter,
  condition codes, endianness, load and store addressing modes, the three buses, DRAM refresh, the
  fetch-decode-execute cycle, and instruction encoding.
- **Practise.** Fifteen generated question types with fresh numbers every time. Every answer is computed by the
  engine, so the explanation is always right.
- **Look things up.** A one-page cheat sheet, the condition-code table, an instruction list, errors found in the
  course slides, and a glossary.
- **Use it anywhere.** No account, no tracking, no network calls after the first load. Progress is stored in your
  own browser. It works offline and can be added to a phone home screen.

## Topics

| Course | Labs |
| --- | --- |
| Embedded systems, buses and memory (SRAM, DRAM, hierarchy) | The Tiva LaunchPad and how to read its pins |
| Hex, two's complement, endianness, alignment | Lab 2: the MKII BoosterPack |
| Fetch, decode, execute and the PC | Lab 2: the LCD clock |
| ARM architecture, registers, the CPSR, instruction encoding | Lab 2: serial communication and baud rate |
| Data processing, the N, Z, C and V flags, subtraction | Lab 2: light sensor, `map`, `constrain` and PWM |
| Shifts, multiplication, bit manipulation, 64-bit arithmetic | Lab 2: demo preparation |
| Conditional execution, loads and stores, branches and loops | |
| Homework 1 with an answer checker | |

Interrupts, GPIO, timers, ADC and later labs are planned.

## Run it

There is no build step and there are no dependencies.

- **GitHub Pages:** serve the repository root.
- **Locally:** open `index.html`, or run a small server that sends no-cache headers:

```bash
python serve.py          # then open http://localhost:8359
```

## Project layout

```
index.html              entry point; loads everything with deferred scripts
sw.js, manifest.webmanifest, icon.svg   offline support and home-screen install
css/
  tokens.css            design tokens: semantic colours, type, spacing, light and dark
  site.css              layout and base components
  widgets.css           styles for the interactive tools
js/
  engine/               bits.js (hex, flags, shifter, conditions) and arm.js (assembler, encoder, CPU)
  core/                 router, lesson renderer, question component, shared helpers
  widgets/              the simulator and each interactive tool
  pages/                practice, reference, syllabus and about pages
content/
  manifest.js           the course map: units, tracks and the tool list
  *.js                  one file per lesson
tests/
  engine-tests.html     220 automated checks for the engine (open through a web server)
```

## Adding a lesson

1. Create `content/<name>.js`:

   ```js
   Lab.lesson({
     id: 'my-topic', title: 'My topic', minutes: 10, lede: 'One-sentence summary.',
     blocks: [
       { p: 'Text with `code` and **bold**.' },
       { predict: { q: 'A question?', opts: ['A', 'B'], ans: 0, why: 'Why A is right.' } },
       { widget: { name: 'hexLab', opts: { a: 0x7FFFFFFF, b: 1, op: 'ADD' } } }
     ],
     takeaways: ['What to remember.']
   });
   ```

2. Add `<script defer src="content/<name>.js"></script>` to `index.html`.
3. Add the lesson id to a unit in `content/manifest.js`. Use `track: 'labs'` for lab material.

The available block types are listed at the top of `js/core/render.js`.

## How the numbers are checked

Every result, flag value and carry shown on the site is computed by the 32-bit ARM engine in `js/engine`. Nothing is
typed in by hand. `tests/engine-tests.html` runs 220 checks against it. The expected values came from an independent
Python calculation or from worked examples printed in the course slides, for example `ASR` of `0xA0000030` by 2 giving
`0xE800000C`, and `RBIT` of `0x12345678` giving `0x1E6A2C48`. Machine-code encodings were checked against the standard
ARM data-processing, branch and load/store formats.

The engine models the 32-bit ARM instruction set as the course teaches it: 16 registers, N, Z, C and V, conditional
execution of every instruction, the barrel shifter, load and store with pre, post and auto indexing, multiply, and
branches. It does not model Thumb-2 (which a Cortex-M4 actually executes), exceptions, caches or cycle timing.

## Design

- One typeface (system UI) plus a monospace face for code and numbers, so there is nothing to download.
- Semantic tokens in `css/tokens.css`. Light and dark are tuned separately, not inverted, and the theme switch can
  follow the device.
- One accent colour for action and selection. N, Z, C and V have fixed hues and are always labelled with their letter.
- One radius family, borders and tone for depth instead of shadows, and short colour-only transitions.
- Reduced-motion support, visible focus rings, keyboard-operable controls, and touch targets of at least 44px on touch
  devices. Text colours meet 4.5:1 contrast in both themes.

## Sources

Lesson content follows the ENGR 359 lecture modules (Module 2: embedded systems and computer organisation; Module 3:
ARM processors and assembly), Handout 03 on the ARM instruction set, Homework 1, and the Lab 2 manual. Facts that go
beyond those documents were checked against external references and are noted where they appear, for example the
load/store-multiple stack modes against the ARM documentation, and the Arduino Mega and Due processors against
manufacturer and SparkFun board comparisons.

## License

MIT. See [LICENSE](LICENSE).
