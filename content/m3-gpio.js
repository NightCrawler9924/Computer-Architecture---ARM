/* Handout 03 Part 5: GPIO, memory-mapped port registers, switches and LEDs. */
(function (g) {
  'use strict';
  var Lab = g.Lab;
  var P = Lab.gpioPresets;
  function preset(id) { return P.filter(function (p) { return p.id === id; })[0].code; }

  Lab.lesson({
    id: 'm3-gpio', title: 'GPIO: reading switches and driving LEDs', minutes: 30, source: 'Handout 03 Part 5',
    lede: 'A pin on the chip is just a bit in a memory-mapped register. Reading a switch is a load. Lighting an LED is a store.',
    blocks: [
      { predict: { q: 'How does an ARM program turn on an LED connected to a pin?', opts: ['It stores a value to a special address that the port listens to', 'It uses a dedicated LED instruction', 'It branches to the pin\'s address', 'It sets a flag in the CPSR'], ans: 0, why: 'There is no LED instruction. Port registers sit in the address map like memory. A normal STR to the right address changes the pin. That is called memory-mapped I/O.' } },
      { h: 'What a GPIO pin is' },
      { p: 'A **GPIO** (general purpose input output) pin is a pin you control from software. Each pin is either an **input** (software reads the voltage on it) or an **output** (software drives the voltage). Pins are grouped into **ports** of up to 8 or 32 bits. On the Tiva board the ports are named A to F, and many of their pins can also do other jobs such as serial or analog.' },
      { h: 'Switches and LEDs: logic levels' },
      { table: { head: ['Wiring', 'Pressed or on', 'Released or off'], rows: [['Switch, **negative logic** (pull-up)', 'pin reads 0 (0 V)', 'pin reads 1 (3.3 V)'], ['Switch, **positive logic** (pull-down)', 'pin reads 1 (3.3 V)', 'pin reads 0 (0 V)'], ['LED, **active high**', 'output 1 lights it', 'output 0 turns it off'], ['LED, **active low**', 'output 0 lights it', 'output 1 turns it off']] } },
      { keep: 'Always check the schematic before writing code. "Pressed" is not always 1 and "on" is not always 1. The code is the same either way, only the meaning of the bit changes.' },
      { h: 'The four port registers' },
      { p: 'The handout uses a port with four memory-mapped registers. Writing to an address is the only way to reach them.' },
      { table: { head: ['Register', 'Address', 'What it does'], rows: [['`IOFPIN`', '`0xE0028000`', 'Read: the level on every pin. Write: sets output pins.'], ['`IOFSET`', '`0xE0028004`', 'Write 1s to drive those pins high. 0s change nothing.'], ['`IOFDIR`', '`0xE0028008`', 'One bit per pin. 1 = output, 0 = input.'], ['`IOFCLR`', '`0xE002800C`', 'Write 1s to drive those pins low. 0s change nothing.']] } },
      { warn: 'These addresses are the course\'s teaching model of a port. The Tiva board\'s actual chip (TM4C123) lays its GPIO registers out differently, as the note at the end of this page explains. Use the course addresses for Handout 03 and Quiz questions.' },
      { h: 'Step 1: set the direction' },
      { p: 'Before a pin can drive an LED, it must be an output. Write a 1 to its bit in `IOFDIR`.' },
      { code: 'IOFDIR EQU 0xE0028008\n  LDR R0, =IOFDIR   ; pointer to the DIR register\n  MOV R1, #0x03     ; bits 0 and 1 are outputs\n  STR R1, [R0]      ; configure the port', run: false },
      { slide: 'The handout writes `MOV R1, 0x03` here and in several later examples. A constant needs the `#`: `MOV R1, #0x03`. Without it the assembler reads `0x03` as a register or a label and rejects the line.' },
      { h: 'Step 2: turn LEDs on and off' },
      { p: 'Write to `IOFSET` to turn pins on and to `IOFCLR` to turn pins off. Only the bits you write as 1 are affected. Every other pin is left alone.' },
      { widget: { name: 'gpioSim', title: 'Try it: the handout\'s set and clear example', opts: { code: preset('leds') } } },
      { p: 'Run it, then change the masks. `0x30` is `0011 0000`, so pins 4 and 5. `0x07` is `0000 0111`, so pins 0, 1 and 2.' },
      { h: 'Why two registers?' },
      { say: 'With a single data register, changing one pin means reading the whole port, changing one bit, and writing the whole port back. That is three steps, and any other code that changes the port in between gets overwritten. Separate SET and CLR registers change only the pins whose bits are 1, in a single store.' },
      { code: '; one data register: read, modify, write\n  LDR R1, [R0]\n  ORR R1, R1, #0x08\n  STR R1, [R0]\n\n; SET register: one store, other pins untouched\n  MOV R1, #0x08\n  STR R1, [R4]', run: false },
      { h: 'Step 3: read a switch with a bit mask' },
      { p: 'Read the whole port into a register, then isolate one pin with `TST`. `TST` does an AND and sets the flags, but throws the result away. If the pin is 0, the AND gives 0, so Z = 1.' },
      { widget: { name: 'gpioSim', title: 'Try it: read a switch on pin 6', opts: { code: preset('switch') } } },
      { p: 'Press the switch on pin 6 (the wiring is negative logic by default), run again and watch R2. Then change the wiring to positive logic and compare.' },
      { predict: { q: 'A switch is wired with **positive logic** on pin 6. After `TST R1, #0x40`, which branch goes to the "pressed" code?', opts: ['BNE', 'BEQ', 'BCS', 'BMI'], ans: 0, why: 'Pressed means the pin reads 1, so the AND with 0x40 is non-zero and Z = 0. BNE branches when Z = 0. With negative logic it would be BEQ.' } },
      { slide: 'The slide on switch interfacing says "pin 6 (+ logic)" and then writes `BEQ Pressed`. With positive logic a pressed switch gives a **non-zero** AND, so Z is 0 and the branch must be `BNE`. `BEQ` is correct for negative logic.' },
      { h: 'Toggling a pin' },
      { p: 'To toggle pin 3, read the port, test bit 3, and write the **opposite** action: if the pin is currently set, clear it, and if it is clear, set it.' },
      { widget: { name: 'gpioSim', title: 'Compare the slide\'s version with the corrected one', opts: { code: preset('toggle-slide') } } },
      { slide: 'The handout\'s toggle uses `STREQ R7, [R6]` (the CLR register) when the pin tested clear, and `STRNE R7, [R5]` (the SET register) when it tested set. That clears a pin that is already clear and sets a pin that is already set, so nothing ever toggles. Swap the registers: `STREQ` goes to SET, `STRNE` goes to CLR. The slide also writes `LDR R7, 0x08`, which should be `MOV R7, #0x08`.' },
      { p: 'Load **Toggle pin 3, corrected** from the examples list, then run it twice. Pin 3 changes each time. The port keeps its state between runs, like real hardware does.' },
      { h: 'Exercises' },
      { reveal: { q: 'Write the instructions that make pins 2 and 5 outputs and drive pin 2 high and pin 5 low.', rows: 6, answer: '<pre><code>  LDR R0, =IOFDIR\n  MOV R1, #0x24      ; pins 2 and 5\n  STR R1, [R0]       ; both outputs\n  LDR R0, =IOFSET\n  MOV R1, #0x04      ; pin 2\n  STR R1, [R0]       ; pin 2 high\n  LDR R0, =IOFCLR\n  MOV R1, #0x20      ; pin 5\n  STR R1, [R0]       ; pin 5 low</code></pre>The mask for pin n is `1 << n`. Pin 2 is 0x04 and pin 5 is 0x20, which add to 0x24.' } },
      { reveal: { q: 'A switch on pin 1 uses negative logic. Write the test that branches to `pressed`.', rows: 4, answer: '<pre><code>  LDR R0, =IOFPIN\n  LDR R1, [R0]\n  TST R1, #0x02      ; mask for pin 1\n  BEQ pressed        ; AND = 0 means the pin is low, which is pressed</code></pre>' } },
      { h: 'Note: the real TM4C123 chip' },
      { p: 'The course port above is a teaching model. On the TM4C123 chip in the Tiva LaunchPad, a port has **no separate SET and CLR registers**. Instead, a single data register (`GPIODATA`) uses bits 9 to 2 of the **address** as a pin mask, so writing to the address for one pin changes only that pin. A port also needs its clock switched on first (the `RCGCGPIO` register) and each pin enabled as digital (`GPIODEN`). Port F starts at `0x40025000`, with `GPIODIR` at offset `0x400` and `GPIODEN` at offset `0x51C`. Check the Tiva datasheet and the lab manual for the exact sequence before you program the real board.' },
      { quiz: { id: 'm3-gpio', title: 'Check yourself', qs: [
        { kind: 'mcq', q: 'Which value in IOFDIR makes pins 0 and 1 outputs and the rest inputs?', opts: ['0x03', '0xFC', '0x01', '0x30'], ans: 0, why: '1 means output. Pins 0 and 1 are bits 0 and 1, which is 0b11 = 0x03.' },
        { kind: 'mcq', q: 'You write 0x00 to IOFSET. What happens?', opts: ['Nothing changes', 'All pins go low', 'All pins go high', 'All pins become inputs'], ans: 0, why: 'Only bits written as 1 have an effect on SET and CLR.' },
        { kind: 'mcq', q: 'What does TST R1, #0x08 do?', opts: ['ANDs R1 with 8, sets the flags, discards the result', 'Stores 8 into R1', 'Adds 8 to R1', 'Clears bit 3 of R1'], ans: 0, why: 'TST is AND without storing the result. R1 is unchanged.' },
        { kind: 'mcq', q: 'Negative-logic switch on pin 4, not pressed. After TST R1, #0x10, Z is...', opts: ['0', '1', 'Unchanged', 'Undefined'], ans: 0, why: 'Not pressed with a pull-up means the pin reads 1. The AND with 0x10 is non-zero, so Z = 0.' },
        { kind: 'input', q: 'Mask to affect pins 4 and 5 only (hex)', type: 'hex', a: ['0x30'], why: 'Bit 4 is 0x10 and bit 5 is 0x20. Together 0x30.' } ] } }
    ],
    takeaways: ['A pin is a bit in a memory-mapped register. LDR reads it and STR drives it.', 'Set IOFDIR first: 1 means output, 0 means input.', 'SET and CLR change only the bits written as 1, in one store.', 'TST isolates a bit. After it, Z = 1 means the bit was 0.', 'Positive logic: pressed = 1, test with BNE. Negative logic: pressed = 0, test with BEQ.']
  });
})(window);
