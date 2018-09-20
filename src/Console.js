
class Console extends BasicElement {
  constructor(root) {
    super('abs');

    this.left = 0;
    this.right = 0;
    this.top = 0;
    this.bottom = 0;

    this.cols = 80;
    this.rows = 40;
    this.col = 0;

    this.scrollDelta = 0;
    this.lastKey = 0;

    this.env = {};

    this.history = [];
    this.historyIndex = 0;

    this.autoScroll = true;

    this.inputElement = new BasicElement('abs', 'input');
    this.inputElement.element['tabIndex'] = '0';
    this.inputElement.left = 0;
    this.inputElement.top = -100;

    this.addElement(this.inputElement);

    this.container = new BasicElement();
    this.container.element.style.margin = '0.5em';
    this.addElement(this.container);

    root = root || new BasicElement(null, null, false, document['body']);
    root.addElement(this);

    this.clear();
    this.onResize();
    this.dispatchInputEvents();
  }

  clear() {
    this.container.element.innerHTML = '';
    this.col = 0;
    this.scrollDelta = 0;
    this._lastWasNum = false;
    this.lastRow = document.createElement('row');
    this.lastCol = document.createElement('col');
    this.lastRow.style.display = 'none';
    this.lastCol.className = 'cursor';
    this.lastRow.appendChild(this.lastCol);
    this.container.element.appendChild(this.lastRow);

    this.resetScroll();
  }

  clearLine() {
    const childs = this.lastRow.children;

    while (childs.length > 1) {
      childs[childs.length - 1].remove();
    }

    this._lastWasNum = false;
    this.lastCol = childs[0];
    this.lastCol.className = 'cursor';
    this.lastCol.innerHTML = '';
    this.lastCol.style.color = '';
    this.col = 0;
  }

  onResize() {
    let tmp = this.lastRow.style.display;
    this.lastRow.style.display = 'block';

    const rowWidth = this.lastRow.offsetWidth;
    const colWidth = this.lastCol.offsetWidth;
    const containerHeight = this.element.offsetHeight;
    const rowHeight = this.lastRow.offsetHeight;

    this.lastRow.style.display = tmp;

    this.cols = ~~(rowWidth / colWidth);
    this.rows = ~~(containerHeight / rowHeight) - 1;

    this.focus();
  }

  onVisibilityChange() {
    this._lastMeta = false;
    this._lastCtrl = false;
  }

  onChar(str) {
    let rowLength = this.lastRow.children.length;
    let col = document.createElement('col');

    col.className = 'cursor';

    this.lastCol.className = '';
    this.col++;

    if (this.col >= this.cols || str === '\n') {
      let newRow = document.createElement('row');
      newRow.style.display = 'none';
      this.container.element.appendChild(newRow);

      this.col = 0;
      this.scrollDelta++;
      this.lastRow = newRow

      rowLength = 0;

      if (this.autoScroll) {
        this.resetScroll();
      }
    }

    if (this.col === rowLength) {
      this.lastRow.appendChild(col);
    } else {
      this.lastRow.insertBefore(col, this.lastRow.childNodes[this.col - 1]);
      this.lastCol = col;
    }

    if (str !== '\n') {
      this.lastCol.innerHTML = str;
      let lastWasNum = this._lastWasNum;
      this._lastWasNum = false;

      const green = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
      const blue = ['(', ')'];
      const orange = ['*', '~', '=', '+', '-', '|', '!', '^', '%', '.', ','];
      const red = ['/', ':', ';', '<', '>'];
      const magenta = ['{', '}', '[', ']', '\\'];
      const hex = ['a', 'A', 'b', 'B', 'c', 'C', 'd', 'D', 'e', 'E', 'f', 'F', 'x', 'X'];

      if (red.indexOf(str) !== -1) {
        this.lastCol.style.color = this.env.red;
      }
      else if (orange.indexOf(str) !== -1) {
        this.lastCol.style.color = this.env.orange;
      }
      else if (blue.indexOf(str) !== -1) {
        this.lastCol.style.color = this.env.blue;
      }
      else if (magenta.indexOf(str) !== -1) {
        this.lastCol.style.color = this.env.magenta;
      }
      else if (green.indexOf(str) !== -1 ||
               (lastWasNum && hex.indexOf(str) !== -1))
      {
        this.lastCol.style.color = this.env.green;
        this._lastWasNum = true;
      }
    }

    this.lastCol = col;
    if (str === ' ' || str === '\n' || str === '\t') {
      this._lastWasNum = false;
    }
  }

  write(str, disableSpeech) {
    const len = str.length;

    for (let i = 0; i < len; i++) {
      this.onChar(str[i]);
    }

    if (this.env.canSpeak && !disableSpeech) {
      speak(str);
    }
  }

  writeLine(str) {
    this.write(str + '\n');
  }

  log(obj) {
    try {
      this.writeLine(JSON.stringify(obj, 2, 2));
    } catch(e) {
      this.writeLine(e.toString());
    }
  }

  focus() {
    this.inputElement.element['focus']();
  }

  onTouch() {
    this.focus();
  }

  _translateView(scrollDelta) {
    scrollDelta = scrollDelta | 0;

    if (scrollDelta === this.scrollDelta) {
      if (this.scrollDelta === 0) {
        this.lastRow.style.display = 'block';
      }
      return;
    }

    let upwards = scrollDelta > this.scrollDelta;
    let childs = this.container.element.children;
    let len = childs.length;

    if (upwards) {
      if (len < this.rows) {
        this.autoScroll = true;
        return;
      }

      if (scrollDelta > (len - this.rows)) {
        return;
      }

      if (this.scrollDelta < 0) {
        this.scrollDelta = 0;
      }

      const diff = scrollDelta - this.scrollDelta;
      const start = (len - 1) - this.scrollDelta;

      for (let i = 0; i < diff; i++) {
        const n = start - i;
        const f = n - this.rows;

        childs[n].style.display = 'none';

        if (f >= 0 && f < len) {
          childs[f].style.display = 'block';
        }
      }

      this.scrollDelta = scrollDelta;
    } else {
      const diff = this.scrollDelta - scrollDelta;
      const start = (len - 1) - this.scrollDelta;

      for (let i = 0; i <= diff; i++) {
        const n = start + i;

        childs[n].style.display = 'block';

        if (n >= this.rows) {
          const f = n - this.rows;

          childs[f].style.display = 'none';
        }
      }

      this.scrollDelta = scrollDelta;
    }
  }

  resetScroll() {
    this._translateView(0);
  }

  onScroll(x, deltaY) {
    if (!deltaY) {
      return;
    }

    this.autoScroll = false;

    let upwards = deltaY < 0;
    if (upwards) {
      deltaY = ~deltaY + 1;
    }

    let steps = deltaY || 1;
    if (steps > 3) {
      steps = 3;
    }

    let scrollDelta = this.scrollDelta;

    if (upwards) {
      scrollDelta += steps;

      const len = this.container.element.children.length;

      if (scrollDelta > len) {
        scrollDelta = len;
      }
    } else {
      scrollDelta -= steps;

      if (scrollDelta < 0) {
        scrollDelta = 0;
        this.autoScroll = true;
      }
    }

    this._translateView(scrollDelta);
  }

  onPaste(evt) {
    const val = evt.clipboardData.getData('text/plain').replace('\n', '');
    this.write(val, true);
  }

  onKeyDown(keyCode, evt, obj) {
    if (keyCode === 9) {
      //tab
      evt.preventDefault();
    }

    this.lastKey = keyCode;
  }

  dispatchInputEvents() {
    Scheduler.dispatch(this.dispatchInputEvents, 15, [this]);

    const lastKey = this.lastKey;

    if (lastKey) {
      this.lastKey = 0;
      this.onKeyDownDispatch(lastKey);
    }
  }

  get lastCommand() {
    const len = this.lastRow.children.length - 1;

    let str = '';
    for (let i = 0; i < len; i++) {
      str += this.lastRow.children[i].textContent;
    }

    return str;
  }

  set lastCommand(val) {
  }

  onKeyDownDispatch(keyCode) {
    const lastMeta = this._lastMeta;
    const lastCtrl = this._lastCtrl;

    speechSynthesis.cancel();

    this.autoScroll = true;

    let val = this.inputElement.element.value;
    this.inputElement.element.value = '';

    if (keyCode === 8) {
      //backspace
      if (this.col > 0) {
        this.lastRow.children[this.col - 1].remove();
        this.col--;
      }
      return;
    }
    if (keyCode === 9) {
      //tab
      const cmds = Object.keys(ConsoleCommands);
      while (cmds.length) {
        const cmd = cmds.pop();
        const lastCommand = this.lastCommand;

        if (cmd.startsWith(lastCommand)) {
          this.clearLine();
          this.write(cmd);
          break;
        }
      }
      return;
    }
    if (keyCode === 13) {
      //enter
      const lastCommand = this.lastCommand;

      this.onChar('\n');

      if (this.activeCommand) {
        const cmdRet = this.activeCommand.onInput(lastCommand, this);
        if (!cmdRet) {
          this.activeCommand = null;
        }
        return;
      }

      const args = lastCommand.split(' ');
      if (lastCommand) {
        this.historyIndex = this.history.push(lastCommand);
      }
      this.dispatchCommand(args.shift(), args);
      return;
    }
    if (keyCode === 16) {
      //shift;
      return;
    }
    if (keyCode === 17) {
      //ctrl
      this._lastCtrl = true;
      return;
    }
    if (keyCode === 18) {
      //alt
      return;
    }
    if (keyCode === 20) {
      //capslock
      return;
    }
    if (keyCode === 27) {
      //esc
      return;
    }
    if (keyCode === 37) {
      //left
      const len = this.lastRow.children.length;
      if (this.col > 0) {
        this.lastCol.className = '';
        this.lastRow.children[this.col - 1].className = 'cursor';
        this.lastCol = this.lastRow.children[this.col - 1];
        this.col--;
      }
      return;
    }
    if (keyCode === 38) {
      //up
      if (this.historyIndex > 0 && this.history.length) {
        const cmd = this.history[--this.historyIndex];
        this.clearLine();
        this.write(cmd);
      }
      return;
    }
    if (keyCode === 39) {
      //right
      const len = this.lastRow.children.length - 1;
      if (this.col < len) {
        this.lastCol.className = '';
        this.lastRow.children[this.col + 1].className = 'cursor';
        this.lastCol = this.lastRow.children[this.col + 1];
        this.col++;
      }
      return;
    }
    if (keyCode === 40) {
      //down
      if (this.historyIndex < this.history.length) {
        const cmd = this.history[++this.historyIndex];
        this.clearLine();
        this.write(cmd || '');
        return;
      }

      this.clearLine();
      return;
    }
    if (lastCtrl && keyCode === 67) {
      if (this.activeCommand && this.activeCommand.kill) {
        this.activeCommand.kill();
      }
      this.activeCommand = null;
      return;
    }
    if (lastMeta && keyCode === 75) {
      // clear screen (meta & k)
      this.clear();
      return;
    }
    if (keyCode === 86 && lastMeta) {
      // paste
      return;
    }
    if (keyCode === 91) {
      //left cmd
      this._lastMeta = true;
      return;
    }
    if (keyCode === 93) {
      //right cmd
      return;
    }

    if (this._lastCtrl || this._lastMeta) {
      return;
    }

    this.write(val, true);
  }

  onKeyUp(keyCode) {
    if (keyCode === 17) {
      //ctrl
      this._lastCtrl = false;
      return;
    }
    if (keyCode === 18) {
      //alt
      return;
    }
    if (keyCode === 20) {
      //capslock
      return;
    }
    if (keyCode === 27) {
      //esc
      return;
    }
    if (keyCode === 37) {
      //left
      return;
    }
    if (keyCode === 38) {
      //up
      return;
    }
    if (keyCode === 39) {
      //right
      return;
    }
    if (keyCode === 40) {
      //down
      return;
    }
    if (keyCode === 91) {
      //left cmd
      this._lastMeta = false;
      return;
    }
    if (keyCode === 93) {
      //right cmd
      this._lastMeta = false;
      return;
    }
  }
}
