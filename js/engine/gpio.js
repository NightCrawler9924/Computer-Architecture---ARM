/* The GPIO port model from Handout 03, Part 5: four memory-mapped registers.
   IOFPIN (+0x0)  read the pins; writing sets the output pins
   IOFSET (+0x4)  write 1s to drive output pins high
   IOFDIR (+0x8)  1 = output, 0 = input
   IOFCLR (+0xC)  write 1s to drive output pins low
   This is the course's teaching map. The TM4C123 itself lays its registers out differently. */
(function (g) {
  'use strict';
  var E = g.E359;
  var BASE = 0xE0028000;
  function Gpio() { this.reset(); }
  Gpio.prototype.reset = function () { this.dir = 0; this.out = 0; this.ext = 0xFFFFFFFF; this.log = []; };
  Gpio.prototype.covers = function (a) { return a >= BASE && a < BASE + 0x10; };
  Gpio.prototype.pins = function () { return (((this.out & this.dir) | (this.ext & ~this.dir)) >>> 0); };
  Gpio.prototype.read = function (a) {
    var off = a - BASE, v = off === 0 ? this.pins() : off === 8 ? this.dir : 0;
    this.log.push({ kind: 'read', off: off, val: v >>> 0 });
    return v >>> 0;
  };
  Gpio.prototype.write = function (a, v) {
    var off = a - BASE;
    if (off === 0) this.out = ((this.out & ~this.dir) | (v & this.dir)) >>> 0;
    else if (off === 4) this.out = (this.out | (v & this.dir)) >>> 0;
    else if (off === 8) this.dir = v >>> 0;
    else if (off === 12) this.out = (this.out & ~(v & this.dir)) >>> 0;
    this.log.push({ kind: 'write', off: off, val: v >>> 0 });
  };
  Gpio.NAMES = { 0: 'IOFPIN', 4: 'IOFSET', 8: 'IOFDIR', 12: 'IOFCLR' };
  Gpio.BASE = BASE;
  E.Gpio = Gpio;
})(typeof window !== 'undefined' ? window : globalThis);
