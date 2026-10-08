/* Labs track: Lab 2, the MKII BoosterPack, clock display and serial communications.
   Source: the Lab 2 manual. Where this site adds its own reasoning, the text says so. */
(function (g) {
  'use strict';
  var Lab = g.Lab;

  /* ---------- 1. the BoosterPack ---------- */
  Lab.lesson({
    id: 'lab2-hardware', title: 'Lab 2: meet the MKII BoosterPack', minutes: 10, source: 'Lab 2 manual',
    lede: 'The MKII plugs on top of your LaunchPad and adds an LCD, a light sensor, a joystick, buttons, a buzzer and more. Know what is on it and which pin each part uses before you write a line of code.',
    blocks: [
      { h: 'What is on the board' },
      { p: 'The manual labels thirteen parts on a photo of the board. Here they are, with the pins each one uses (read from the pin table).' },
      { table: { head: ['Label', 'Part', 'Pins it uses'], rows: [
        ['A', 'Red LED / LCD backlight selection jumper', '39 (the shared pin)'], ['B', 'OPT3001 light sensor', '8 (interrupt), 9 and 10 (I2C)'], ['C', 'TMP006 temperature sensor', '11 (data ready), 9 and 10 (I2C)'],
        ['D', '3-axis accelerometer', '23, 24, 25 (X, Y, Z)'], ['E', 'Buttons S1 and S2', '33 (Button 1), 32 (Button 2)'], ['F', 'RGB LED', '37 blue, 38 green, 39 red'],
        ['G', 'Buzzer', '40'], ['H, K', 'GPIO headers J2 and J4, J1 and J3', 'carry all the signals'], ['J', 'LCD display', '7 clock, 15 data, 13 chip select, 17 reset, 31 register select, 39 backlight'],
        ['L', 'Microphone', '6'], ['M', 'Power indicator LEDs', 'none'], ['N', '2-axis joystick with pushbutton', '2 (X), 26 (Y), 5 (select)'] ] } },
      { widget: { name: 'pinTable', title: 'Click a part to see its pins' } },
      { warn: 'Pin 39 is wired to the **jumper (part A)**. It selects between the red LED and the LCD backlight. For the dimming screen in this lab the jumper must sit in the position marked **LCD BACKLT**. To use both the LED and the backlight, wire one of them to an unused pin with a jumper wire.' },
      { predict: { q: 'The LaunchPad red LED is on pin 30. Part of Lab 1 blinks it. Will the BoosterPack interfere with that code?', opts: ['Yes, the BoosterPack uses pin 30 for the LCD', 'No, pin 30 is not connected to anything on the BoosterPack', 'Only if the jumper is set to LCD BACKLT', 'Only if the light sensor is read'], ans: 1,
        why: 'The manual says pin 30 controls the red LED on the LaunchPad and is not connected to anything on the BoosterPack, so there should be no conflicts with the Lab 1 code. (Pin 39 is the shared one.)' } },
      { h: 'Check yourself' },
      { ask: { q: 'Which pin number does the buzzer use?', a: ['40'], type: 'num', why: 'Pin 40 (J4-1, PF_2) is the LaunchPad blue LED and the BoosterPack buzzer.' } },
      { ask: { q: 'Which pin is the joystick X-axis on?', a: ['2'], type: 'num', why: 'Pin 2 (J1-2, PB_5). The Y-axis is pin 26.' } },
      { ask: { q: 'Which pin carries the I2C clock (SCL) to the light and temperature sensors?', a: ['9'], type: 'num', why: 'Pin 9 (J1-9, PA_6) is I2C SCL and pin 10 (J1-10, PA_7) is I2C SDA, shared by the light and temperature sensors.' } },
      { ask: { q: 'Pin 39 serves three things between the two boards. Name the BoosterPack device that is switched on it by the jumper besides the LCD backlight.', a: ['red led', 'redled', 'red'], type: 'text', why: 'The jumper selects between the **red LED** and the LCD backlight. (On the LaunchPad itself the same wire is the green LED, which is why the green LED glows too when the backlight is on.)' } },
      { h: 'Before you connect them' },
      { list: ['Remove resistors R9 and R10 on your own LaunchPad first (the lab boards are already done), or the BoosterPack will not work.', 'Line the boards up so "up" matches, then push straight down.', 'Detach by pulling straight up. Do not rock or twist.'] }
    ],
    takeaways: ['The MKII adds the LCD, light sensor, temperature sensor, accelerometer, joystick, buttons, RGB LED, buzzer and microphone.', 'Pin 39 is shared by the red LED and the LCD backlight through a jumper.', 'Pin 30 is the LaunchPad red LED and does not touch the BoosterPack.']
  });

  /* ---------- 2. the clock ---------- */
  Lab.lesson({
    id: 'lab2-clock', title: 'Lab 2: the clock and the LCD', minutes: 18, source: 'Lab 2 manual (pre-lab and Part 1)',
    lede: 'Turn a once-a-second tick into a clock: count seconds, roll them into minutes and hours, format the time as text, and draw it on the LCD.',
    blocks: [
      { h: 'The pre-lab idea' },
      { p: 'Your Lab 1 code already does something every second, inside an `if (currentMillis > nextMillis)` block. The pre-lab asks you to count: add one to `second` each time that block runs, and when a value reaches its limit, add one to the next unit and reset it.' },
      { code: 'second++;                  // one more second\nif (second == 60) {        // reached 60 seconds\n  minute++;                // one more minute\n  second = 0;              // restart the seconds\n}', run: false },
      { p: 'The manual gives you that first piece and asks you to add the other two `if` statements, "either nested or consecutively", and to think about **what value each variable rolls over at and what it resets to**. That is the whole design question. Try it yourself in the simulator below before reading further.' },
      { widget: { name: 'clockLab', title: 'LCD clock' } },
      { predict: { q: 'The manual starts the hour at 1 (`int hour = 1`). Which hour rollover is the natural match for a clock that starts at 1?', opts: ['Reset to 0 when hour reaches 24', 'Reset to 1 when hour would pass 12', 'Reset to 0 when hour reaches 12', 'There is no rollover for hours'], ans: 1,
        why: 'This one is a design choice, and the manual does not fix it. A clock that begins at hour 1 and shows 1 to 12 resets to 1 after 12. A 24-hour clock runs 0 to 23 and resets to 0 at 24. Pick one, test it at the boundary (try the "Jump to" button), and be ready to explain it to the lab instructor.' } },
      { h: 'Turning numbers into text' },
      { p: 'To draw the time you build a string. The lab uses `i32toa(value, 1, 0, 2)`, which converts a 32-bit integer to text with a multiplication factor of 1, 0 decimal places and a **width of 2 characters**. That function does not pad with zeros, so a 2 comes out as a space followed by 2.' },
      { predict: { q: 'What text does `i32toa(2, 1, 0, 2)` give?', opts: ['A space followed by 2, written " 2"', '"02"', '"2" on its own, one character', '"20"'], ans: 0, why: 'The width is 2, the number is right-aligned, and the padding is a space, not a zero. That is exactly why the replace line is needed.' } },
      { p: 'The fix is a string replacement: `timeString.replace(": ", ":0")`. It changes every space that follows a colon into a zero. The hour is not preceded by a colon, so it keeps its space. Tick the box in the clock above to see the difference.' },
      { warn: 'The manual points out that the Arduino IDE may not accept "smart quotes". If your code was pasted from a document, make sure every quote is a straight quote (").' },
      { h: 'Drawing it' },
      { list: ['Add the screen header files and create the screen object, then call `myScreen.begin()` in `setup()`.', '`myScreen.gText(0, 0, timeString, whiteColour, blackColour, 2, 2)` writes the text at position (0, 0), white on black, scaled 2 times in x and y. Other colours (red, green, blue, yellow, cyan, orange, magenta, violet, gray, darkGray) work the same way.', 'Declare `hour`, `minute`, `second` and `timeString` as **global** variables so the `if` block and the drawing code share them.', 'Build and draw `timeString` at the bottom of `loop()`, outside the once-a-second `if`.'] },
      { h: 'Check yourself' },
      { ask: { q: 'At second 59 and minute 59, one more tick happens in a 24-hour clock showing 23:59:59. What does the display show next?', a: ['00:00:00', '0:00:00', ' 0:00:00', '0:0:0'], type: 'text', why: 'second reaches 60 so minute increments and second resets, then minute reaches 60 so hour increments and minute resets, then hour reaches 24 and resets to 0. The display is " 0:00:00" (hour has a leading space, not a zero).', hint: 'Work it through the three if statements in order.' } },
      { ask: { q: 'Order matters. Why must the seconds `if` come **before** the minutes `if` in the code?', a: ['so the carry reaches minutes in the same pass', 'carry', 'same pass'], type: 'text', check: function (v) { return /pass|same|carry|propagat|after|order|before|first/i.test(v); }, why: 'Within one pass, the seconds `if` may increment `minute`. The minutes `if` must then run after it, so it sees the new value and can roll over in the same pass. Reversed, the rollover would be one second late.' } }
    ],
    takeaways: ['A clock is counters that roll over: seconds and minutes at 60, hours at 12 or 24.', 'Each rollover resets its own variable and increments the next one.', 'i32toa pads with spaces, and replace(": ", ":0") turns the spaces after colons into zeros.', 'Variables the loop and the drawing code both use must be global.']
  });

  /* ---------- 3. serial ---------- */
  Lab.lesson({
    id: 'lab2-serial', title: 'Lab 2: serial communication and debugging', minutes: 14, source: 'Lab 2 manual (Part 1)',
    lede: 'The Serial Monitor lets the board talk back to you. It is the main debugging tool in this lab, and it is slow in a way that matters.',
    blocks: [
      { h: 'Setting it up' },
      { list: ['Call `Serial.begin(9600)` in `setup()`. 9600 is the **baud rate**, the same one used to connect to the target earlier.', 'Choose the board port under Tools, then Port, then the COM number.', 'Open Tools, then Serial Monitor, and make sure the Serial Monitor tab (not the Output tab) is selected.'] },
      { p: 'The link is two-way, so the same port you use to upload code can also carry text back from the board.' },
      { h: 'Where to put the print' },
      { p: 'The manual prints the raw `hour`, `minute` and `second` once per second. It warns that it is tempting to put the print in the main body of `loop()`, but that would run it several times per second, "which might be too often for the serial link to handle".' },
      { predict: { q: 'Why is putting `Serial.println` in the body of `loop()` (outside the once-a-second `if`) a problem?', opts: ['println only works inside an if', 'loop() runs very many times per second, so it floods a slow serial link', 'It would print the wrong numbers', 'It is not allowed by the compiler'], ans: 1, why: 'loop() runs as fast as the processor allows. The serial link is far slower, so the board would spend its time waiting on the link. Printing inside the once-per-second block sends one line a second.' } },
      { h: 'How slow is slow?' },
      { p: 'Try the calculator. It uses the usual framing of 8 data bits, no parity and 1 stop bit, so each character takes **10 bits** on the wire: a start bit, 8 data bits and a stop bit. (The manual does not state this, so it is an assumption here, but it is the Arduino default.)' },
      { widget: { name: 'baud', title: 'Serial timing' } },
      { ask: { q: 'At 9600 baud, about how many characters per second can be sent? (10 bits per character.)', a: ['960'], type: 'num', why: '9600 bits per second divided by 10 bits per character is 960 characters per second.' } },
      { ask: { q: 'The manual says the processor can do about 80,000,000 operations a second. At 9600 baud, roughly how many operations fit in the time it takes to send one character?', a: ['83333', '83,333', '83000', '83333.33', '80000'], type: 'text', check: function (v) { var n = parseFloat(String(v).replace(/,/g, '')); return n >= 75000 && n <= 90000; }, why: 'One character takes 10 / 9600 s = about 1.04 ms. In that time an 80 MHz processor does about 80,000,000 x 0.00104, or roughly 83,000 operations. The processor is vastly faster than the link, so waiting on serial wastes a lot of it.', hint: 'Time for one character is 10 bits / 9600 bits per second.' } },
      { h: 'Debugging with messages' },
      { p: 'The manual suggests adding more messages when something goes wrong: which section of code is running, or a line whenever a function is called or a condition is met. Treat the serial print as a probe.' },
      { warn: 'Start-up order matters. The light sensor talks over I2C, and the manual says I2C needs the serial setup to be ready first. Call `lightSensor.begin()` **after** `Serial.begin()`, or the board freezes on start-up.' }
    ],
    takeaways: ['Serial.begin(9600) sets the baud rate. One character takes about 10 bits on the wire.', 'At 9600 baud the link carries about 960 characters per second, while the processor does about 80 million operations per second.', 'Print inside the once-per-second block, not in the free-running loop body.', 'Call Serial.begin before lightSensor.begin.']
  });

  /* ---------- 4. light sensor and PWM ---------- */
  Lab.lesson({
    id: 'lab2-light', title: 'Lab 2: the light sensor and the dimming backlight', minutes: 20, source: 'Lab 2 manual (Part 2)',
    lede: 'Read a light level with the OPT3001, scale it with map(), keep it in range with constrain(), and drive the backlight with PWM so the screen dims in a dark room.',
    blocks: [
      { h: 'The plan' },
      { ol: ['Include the OPT3001 library and create a sensor object, then call `lightSensor.begin()` in `setup()` after `Serial.begin()`.', 'Inside the once-a-second block, read `lightSensor.readResult()` and print it to the Serial Monitor.', 'Watch the numbers in a bright room and a dark room and note a **lowest** and a **highest** reading.', 'Map that range onto a backlight value, constrain it, and write it to the backlight pin.'] },
      { p: 'The library comes as `OPT3001.7z` from the course site. Extract it into your Arduino `libraries` folder, so the `.h` and `.cpp` files sit in their own folder called `OPT3001`.' },
      { h: 'map() and constrain()' },
      { code: 'int backlight = map(readings, LOW_LEVEL, HIGH_LEVEL, 50, 255);\nbacklight = constrain(backlight, 50, 255);\nanalogWrite(Pin_Backlight, backlight);', run: false },
      { say: '`map` rescales a number from one range to another, linearly. It does **not** stop the answer going outside the new range. `constrain` clips it. You need both.' },
      { widget: { name: 'lightPwm', title: 'Light sensor to PWM' } },
      { predict: { q: 'The room gets brighter than the highest reading you noted. With only the `map` line (no `constrain`), what could the backlight value be?', opts: ['Still at most 255', 'Greater than 255, which is out of range for an 8-bit analogWrite', 'Exactly 255', 'Negative'], ans: 1, why: 'map extrapolates. A reading above your highest note maps to a value above 255. An 8-bit analogWrite takes only 0 to 255, so the value would be out of range, which is why the manual adds the constrain line.' } },
      { h: 'Why the floor is 50' },
      { p: 'The manual stops the output range at 50 "so the backlight will never turn off completely". A reading in a very dark room would otherwise map to 0 and the screen would go black, with no way to read it.' },
      { h: 'What PWM actually does' },
      { p: 'The Tiva LaunchPad has no true analog output. `analogWrite` uses pulse width modulation: the pin switches between fully off and fully on very fast, and the **average** level equals the value you wrote. A value of 128 out of 255 is on about half the time. The backlight is effectively responding to that average.' },
      { ask: { q: 'An 8-bit analogWrite of 51 is on for what fraction of the time? Give a percent.', a: ['20', '20%', '20 %'], type: 'text', why: '51 / 255 = 0.2, so 20% of each period. The floor of 50 in the lab is about 19.6%.' } },
      { h: 'Which pin?' },
      { p: 'Find the backlight pin in the pin table, define it as a `const int`, and set it as an `OUTPUT` in `setup()`. The pin also drives the LaunchPad green LED, so the green LED will light as well once the backlight is set. Make sure the jumper is in the **LCD BACKLT** position.' },
      { h: 'Making the backlight react faster' },
      { p: 'In the lab as written, the backlight is updated once per second because the code sits in the once-per-second block. This simulation uses made-up numbers, not data from a board, but the trade-off it shows is the one the lab quiz asks about.' },
      { widget: { name: 'reactSpeed', title: 'Update rate trade-off' } }
    ],
    takeaways: ['map rescales linearly and can overshoot. constrain clips it back.', 'The lab keeps the backlight at 50 or more so it never goes fully dark.', 'analogWrite on this board is PWM: the average of fast on and off pulses.', 'Reading more often reacts faster but also follows noise and costs time.']
  });

  /* ---------- 5. demo prep ---------- */
  Lab.lesson({
    id: 'lab2-demo', title: 'Lab 2: demo and quiz preparation', minutes: 12, source: 'Lab 2 manual',
    lede: 'What the instructor will ask, with model answers. Write your own answer first, then compare.',
    blocks: [
      { p: 'You demonstrate the finished code, and the instructor asks questions about it. Example questions are at the end of the manual. Only the final version needs a demonstration.' },
      { h: 'Lab 2 quiz' },
      { ask: { q: 'Q1. What is the backlight pin number?', a: ['39'], type: 'num', why: 'Pin 39 (J4-2, PF_3). It is labelled Red LED / LCD backlight on the MKII, and a jumper picks which.' } },
      { reveal: { q: 'Q2. The backlight updates every time the main `if` block runs, once per second. If we wanted it to react faster, how could we do that, and what could go wrong?', rows: 5,
        answer: '**How:** read the sensor and update the backlight outside the once-per-second block, so it runs on every pass of `loop()`, or give it its own faster timer, for example every 100 ms.<br><br>**What could go wrong** (any of these is a good answer):<ul><li>Serial printing on every pass would flood the 9600 baud link, so keep the print in the slow block.</li><li>Every sensor read costs time on the I2C bus, which slows the rest of `loop()`.</li><li>The sensor reading is noisy, so a fast update shows up as visible flicker.</li><li>The extra reads add nothing if the light does not change that fast.</li></ul>A fix for the flicker is to average a few readings or only update when the change is large enough. This model answer is built from the manual\'s own notes about the serial link and sensor, not from a published solution key.' } },
      { h: 'Questions the code invites' },
      { reveal: { q: 'Why are `hour`, `minute` and `second` global variables?', rows: 3, answer: 'The once-per-second `if` block updates them and the code at the bottom of `loop()` reads them to build the string. Local variables would be created fresh on every pass of `loop()` and would lose their values. Global variables keep their values between passes.' } },
      { reveal: { q: 'Why does `lightSensor.begin()` come after `Serial.begin()`?', rows: 3, answer: 'The manual says the I2C communications need the LaunchPad serial communications to be available before their own initialisation. Done the other way round, the board freezes on start-up.' } },
      { reveal: { q: 'What does `timeString.replace(": ", ":0")` do, and why does the hour not get a leading zero?', rows: 3, answer: '`i32toa` pads with spaces, not zeros. The replace turns every space after a colon into a zero. The hour is not preceded by a colon, so its space is left alone.' } },
      { reveal: { q: 'What does `constrain(backlight, 50, 255)` protect against?', rows: 3, answer: '`map` does not clip, so a reading outside the range you noted gives a value outside 50 to 255. `constrain` pulls it back, so analogWrite never receives an out-of-range value and the backlight never turns fully off.' } },
      { reveal: { q: 'The processor does about 80 million operations a second. Why is that a reason not to print to the serial port every pass of loop()?', rows: 3, answer: 'At 9600 baud the link carries only about 960 characters a second. The processor can do roughly 83,000 operations in the time one character takes to send, so waiting on the serial link wastes almost all of its speed and would flood the link.' } },
      { keep: 'Before the demo: jumper in LCD BACKLT, R9 and R10 removed (or use a lab board), serial begun before the sensor, a straight-quote check on the code, and your lowest and highest readings written down.' }
    ],
    takeaways: ['Pin 39 is the backlight pin.', 'Faster updates mean faster reaction, but more serial traffic, more sensor time and more flicker.', 'Know why each line is where it is: globals, begin order, replace, constrain.']
  });
})(window);
