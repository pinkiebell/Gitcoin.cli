
class Console {
  constructor() {
    this._lastWasNum = false;

    const self = this;

    function myEval(a) {
      if (self.activeCommand) {
        const cmdRet = self.activeCommand.onInput(a.replace('\n', ''), self);
        if (!cmdRet) {
          self.activeCommand = null;
        }
        return;
      }

      const args = a.replace('\n', '').split(' ');

      self.dispatchCommand(args.shift(), args);
    }

    function completer(line) {
      const cmds = Object.keys(ConsoleCommands);
      const hits = cmds.filter((c) => c.startsWith(line));

      return [hits.length ? hits : cmds, line];
    }

    let repl = require('repl').start(
      {
        prompt: '> ',
        eval: myEval,
        completer: completer,
      }
    );
  }

  onChar(str) {
    let color = 37;

    if (str !== '\n') {
      let lastWasNum = this._lastWasNum;
      this._lastWasNum = false;

      const green = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
      const blue = ['(', ')'];
      const orange = ['*', '~', '=', '+', '-', '|', '!', '^', '%', '.', ','];
      const red = ['/', ':', ';', '<', '>'];
      const magenta = ['{', '}', '[', ']', '\\'];
      const hex = ['a', 'A', 'b', 'B', 'c', 'C', 'd', 'D', 'e', 'E', 'f', 'F', 'x', 'X'];

      if (red.indexOf(str) !== -1) {
        color = 31;
      }
      else if (orange.indexOf(str) !== -1) {
        color = 33;
      }
      else if (blue.indexOf(str) !== -1) {
        color = 34;
      }
      else if (magenta.indexOf(str) !== -1) {
        color = 35;
      }
      else if (green.indexOf(str) !== -1 ||
        (lastWasNum && hex.indexOf(str) !== -1))
      {
        this._lastWasNum = true;
        color = 32;
      }
    }

    if (str === ' ' || str === '\n' || str === '\t') {
      this._lastWasNum = false;
    }

    process.stdout.write('\x1B[1;' + color + 'm' + str + '\x1B[0m');
  }

  clear() {
    process.stdout.write('\x1b[2J');
  }

  clearLine() {
    process.stdout.write('\x1b[1K\x1b[1G');
  }

  write(str) {
    const len = str.length;

    for (let i = 0; i < len; i++) {
      this.onChar(str[i]);
    }
  }

  writeLine(str) {
    this.write(str + '\n');
  }

  log(obj) {
    this.writeLine(JSON.stringify(obj, 2, 2));
  }
}
global.Console = Console;
