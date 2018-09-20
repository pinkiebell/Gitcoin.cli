
class Scheduler {
  constructor(context) {
    this.micros = [];
    this.ticks = 0;
    this.rtime = 1;
    this.lastEntry = Date.now();

    var self = this;
    this.entry = function() {
      self._drain();
      window['setTimeout'](self.entry, self.rtime);
    };
    window['setTimeout'](self.entry, 1);
  }

  _drain() {
    var micros = this.micros;
    var len = micros.length;

    if (len === 0) {
      return;
    }
    var now = Date.now();
    if (this.lastEntry !== 0) {
      this.ticks += now - this.lastEntry;
    }
    this.lastEntry = now;
    this.rtime = 1000;
    this.micros = [];
    var delta = 0;

    for (var i = 0; i < len; i++) {
      var micro = micros[i];
      var d = micro.ticks - this.ticks;

      if (d < 2) {
        if (d < delta) {
          delta = d;
        }
        try {
          if (micro.args) {
            micro.func.call(...micro.args);
          } else {
            micro.func();
          }
        } catch (e) {
          console.log(e);
        }
      } else {
        this.micros.push(micro);
        if (d < this.rtime) {
          this.rtime = d;
        }
      }
    }
    this.rtime += delta;
    if (this.rtime < 0) {
      this.rtime = 0;
    }
  }

  dispatch(func, ms, args) {
    var micro = {};
    micro.func = func;
    micro.args = args;
    ms = ms || 0;
    micro.ticks = this.ticks + ms;

    this.micros.push(micro);
    if (ms < this.rtime) {
      this.rtime = ms;
    }
  }
}

Scheduler = new Scheduler(this);
this.Scheduler = Scheduler;

