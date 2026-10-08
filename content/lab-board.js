/* Labs track: the Tiva LaunchPad. Sources: Module 2 (chip table, development boards), Lab 2 manual (pins, clock, setup notes). */
(function (g) {
  'use strict';
  var Lab = g.Lab;

  Lab.lesson({
    id: 'lab-board', title: 'The Tiva LaunchPad and how to read its pins', minutes: 12, source: 'Module 2 and the Lab 2 manual',
    lede: 'A bare microcontroller is a chip with dozens of tiny pins. A development board turns it into something you can plug into a laptop. This lesson is the map of the board you will use all term.',
    blocks: [
      { h: 'Why a board and not just a chip' },
      { predict: { q: 'A microcontroller chip has all the computing parts on one piece of silicon. Why do labs still use a LaunchPad board instead of the bare chip?',
        opts: ['The chip has no processor, so the board supplies one', 'Wiring a bare chip is hard: it needs a regulator, crystal, USB connection and easy access to the pins, which the board provides', 'The board makes the chip run faster', 'Bare chips cannot be programmed'], ans: 1,
        why: 'Module 2 puts it this way: microcontrollers are "just an IC" and interfacing to the pins is hectic. Development boards add a voltage regulator, capacitors and resistors, LEDs, switches, a timing crystal, USB and easy I/O so you can learn, test and verify. The chip itself already contains the CPU.' } },
      { p: 'Your board is the **Tiva LaunchPad** from Texas Instruments, an ARM Cortex-based board. Its chip is the TM4C123. Next to two smaller microcontrollers from the same module, it looks like this:' },
      { diagram: 'chips' },
      { p: 'Notice the units. The ATtiny has 512 **bytes** of flash. Your TM4C123 has 256 **kibibytes** (that is 256 x 1024 bytes) of flash for the program and 32 kibibytes of RAM for data. A kibibyte is 1024 bytes, which is why the course writes it that way.' },
      { say: 'Flash holds your program and survives power-off. RAM holds variables while the program runs and is lost at power-off. A bigger microcontroller is not always better: you choose by speed, I/O, memory, power, package and tools, as Module 2 lists.' },
      { h: 'The clock' },
      { p: 'The Lab 2 manual states the LaunchPad processor runs at **80 MHz**. That is 80 million clock cycles a second. You will see in the serial lessons why that number matters: the processor is enormously faster than the serial link it talks through.' },
      { h: 'How pins are named' },
      { p: 'Look at the pin table from Lab 2. Each header position has a **pin number** (1 to 40), a **location** such as `J1-2`, and a **GPIO name** such as `PB_5`. The GPIO name is a port letter and a bit number: `PB_5` is port B, bit 5.' },
      { widget: { name: 'pinTable', title: 'MKII and LaunchPad pins' } },
      { ask: { q: 'Using the table: which **pin number** drives the red LED on the LaunchPad itself?', a: ['30'], type: 'num', why: 'Pin 30 (J3-10, PF_1) is the LaunchPad red LED. The manual notes that pin 30 is not connected to anything on the BoosterPack, so code that blinks the red LED from Lab 1 does not conflict with the BoosterPack.' } },
      { ask: { q: 'Which GPIO name is on pin 39?', a: ['PF_3'], type: 'text', why: 'Pin 39 is J4-2, GPIO PF_3. It is the LaunchPad green LED, and on the BoosterPack the same wire goes to the red LED or the LCD backlight, chosen by a jumper.' } },
      { h: 'The "Analog" column' },
      { p: 'That column says what the pin can do as an analog pin. `Read` means it can be used with `analogRead`, `Write` with `analogWrite`, and `Read/write` both. A blank means the pin has no analog function. On this board `analogWrite` is pulse width modulation, not a true analog voltage, and you will build that up in the light-sensor lesson.' },
      { h: 'Things the manual warns about' },
      { list: ['The BoosterPack will not work with a LaunchPad unless resistors **R9 and R10** have been removed. The lab boards are already set up if you would rather use them.', 'When connecting the two boards, line up "up" on both, push straight down and do not twist. Twisting bends the pins.', 'A **Serial Monitor** shows messages from the board, but only after `Serial.begin` has run in your code and you pick the right COM port under Tools.'] },
      { keep: 'Pin numbers (1 to 40) are positions on the headers. GPIO names (like `PF_3`) are what the microcontroller calls its own pins. The table connects the two.' }
    ],
    takeaways: ['The LaunchPad is a TM4C123 with 256 KiB flash and 32 KiB RAM on a board that adds power, USB, LEDs and buttons.', 'The processor runs at 80 MHz.', 'GPIO names are a port letter plus a bit number.', 'Pin 30 is the red LED and pin 39 is shared between the green LED and the BoosterPack backlight.']
  });
})(window);
