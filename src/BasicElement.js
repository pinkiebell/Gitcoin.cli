
class BasicElement {
  constructor(name, elementType, touchable, existingElement) {
    this.element = existingElement || document['createElement'](elementType || 'div');

    if (name) {
      this.element['className'] = name;
    }

    if (this.onTouch || touchable) {
      this._x = 0;
      this._y = 0;
      this.element['addEventListener']('touchstart', this, false);
      this.element['addEventListener']('touchmove', this, false);
      this.element['addEventListener']('touchend', this, false);
      this.element['addEventListener']('mousedown', this, false);
      this.element['addEventListener']('mousemove', this, false);
      this.element['addEventListener']('mouseup', this, false);
    }

    if (this.onKeyDown) {
      this.element['tabIndex'] = '0';
      this.element['addEventListener']('keydown', this, false);
    }

    if (this.onKeyUp) {
      this.element['tabIndex'] = '0';
      this.element['addEventListener']('keyup', this, false);
    }

    if (this.onScroll) {
      this.element['addEventListener']('mousewheel', this, false);
    }

    if (this.onResize) {
      window['addEventListener']('resize', this, false);
    }

    if (this.onVisibilityChange) {
      document['addEventListener']('visibilitychange', this, false);
    }

    if (this.onPaste) {
      this.element['addEventListener']('paste', this, false);
    }
  }

  addElement(element) {
    this.element['appendChild'](element.element);
  }

  addElementAtTop(element) {
    this.element['insertBefore'](element.element, this.element['childNodes'][0]);
  }

  get width() {
    return this.element['offsetWidth'];
  }

  set width(val) {
    this.element['style']['width'] = val + 'px';
  }

  get height() {
    return this.element['offsetHeight'];
  }

  set height(val) {
    this.element['style']['height'] = val + 'px';
  }

  get x() {
    return this.element['offsetLeft'];
  }

  set x(val) {
    this.element['style']['left'] = val + 'px';
  }

  get y() {
    return this.element['offsetTop'];
  }

  set y(val) {
    this.element['style']['top'] = val + 'px';
  }

  get z() {
    return parseFloat(this.element['style']['z-index']);
  }

  set z(val) {
    this.element['style']['z-index'] = val.toString();
  }

  set top(val) {
    this.element['style']['top'] = val + 'px';
  }

  set right(val) {
    this.element['style']['right'] = val + 'px';
  }

  get bottom() {
    return parseFloat(this.element['style']['bottom']);
  }

  set bottom(val) {
    this.element['style']['bottom'] = val + 'px';
  }

  set left(val) {
    this.element['style']['left'] = val + 'px';
  }

  set rotationZ(val) {
    this.element['style']['transform'] = 'rotateZ(' + val + 'deg)';
  }

  set bgra(val) {
    var c = 'rgba('
        + ((val >> 16) & 0xFF)
        + ','
        + ((val >> 8) & 0xFF)
        + ','
        + (val & 0xFF)
        + ','
        + (((val >> 24) & 0xFF) / 255)
        + ')';
    this.element['style']['background-color'] = c;
    this.element['style']['border-color'] = c;
    this.element['style']['color'] = c;
  }

  set borderColor(val) {
    var c = 'rgba('
        + ((val >> 16) & 0xFF)
        + ','
        + ((val >> 8) & 0xFF)
        + ','
        + (val & 0xFF)
        + ','
        + (((val >> 24) & 0xFF) / 255)
        + ')';
    this.element['style']['border-color'] = c;
  }

  set borderWidth(val) {
    this.element['style']['border'] = val + 'px solid';
  }

  set borderRadius(val) {
    this.element['style']['border-radius'] = val + 'px';
  }

  set bgColor(val) {
    if (typeof val !== 'string') {
      val = 'rgba('
        + ((val >> 16) & 0xFF)
        + ','
        + ((val >> 8) & 0xFF)
        + ','
        + (val & 0xFF)
        + ','
        + (((val >> 24) & 0xFF) / 255)
        + ')';
    }

    this.element['style']['background-color'] = val;
  }

  set textColor(val) {
    var c = 'rgba('
        + ((val >> 16) & 0xFF)
        + ','
        + ((val >> 8) & 0xFF)
        + ','
        + (val & 0xFF)
        + ','
        + (((val >> 24) & 0xFF) / 255)
        + ')';
    this.element['style']['color'] = c;
  }

  get fontSize() {
    return parseFloat(this.element['style']['font-size']);
  }

  set fontSize(val) {
    this.element['style']['font-size'] = val + 'px';
  }

  get text() {
    return this.element['innerText'];
  }

  set text(val) {
    this.element['innerText'] = val;
  }

  set transitionTime(time) {
    this.element['style']['transition'] = time + 's ease-out';
  }

  remove() {
    this.element['style']['transition'] = '0.3s ease-in-out';
    this.element['style']['opacity'] = '0';
    var self = this;
    window['setTimeout'](function() {
      self.element['remove']();
    }, 300);
  }

  'handleEvent'(evt) {
    this[evt['type']](evt, this);
  }

  'touchstart'(evt) {
    evt['stopImmediatePropagation']();

    this._x = evt['changedTouches'][0]['screenX'];
    this._y = evt['changedTouches'][0]['screenY'];

    if (this.onTapDown) {
      evt['preventDefault']();
      this._active = true;
      this.onTapDown();
    }
  }

  'mousedown'(evt) {
    evt['stopImmediatePropagation']();

    this._x = evt.screenX;
    this._y = evt.screenY;

    if (this.onTapDown) {
      evt['preventDefault']();
      this._active = true;
      this.onTapDown();
    }
  }

  'touchmove'(evt, obj) {
    evt['stopImmediatePropagation']();

    if (this.onTouchMove && this._active) {
      evt['preventDefault']();
      var x = evt['changedTouches'][0]['screenX'];
      var y = evt['changedTouches'][0]['screenY'];
      this.onTouchMove(x, y);
      return;
    }
  }

  'mousemove'(evt, obj) {
    evt['stopImmediatePropagation']();

    if (this.onTouchMove && this._active) {
      evt['preventDefault']();
      var x = evt['screenX'];
      var y = evt['screenY'];
      this.onTouchMove(x, y);
      return;
    }
  }

  'touchend'(evt, obj) {
    evt['stopImmediatePropagation']();

    if (this.onTapUp) {
      this._active = false;
      evt['preventDefault']();
      this.onTapUp();
      return;
    }

    var x = evt['changedTouches'][0]['screenX'];
    var y = evt['changedTouches'][0]['screenY'];
    if (!this._touchDisabled
        && x === this._x
        && y === this._y) {
      this._touchDisabled = true;
      var self = this;
      window['setTimeout'](function() {
        self._touchDisabled = false;
      }, 600);

      if (this.onTouch) {
        this.onTouch(x, y, obj);
      }
    }
  }

  'mouseup'(evt, obj) {
    evt['stopImmediatePropagation']();

    if (this.onTapUp) {
      evt['preventDefault']();
      this._active = false;
      this.onTapUp();
      return;
    }

    var x = evt['screenX'];
    var y = evt['screenY'];
    if (!this._touchDisabled
        && x === this._x
        && y === this._y) {
      this._touchDisabled = true;
      var self = this;
      window['setTimeout'](function() {
        self._touchDisabled = false;
      }, 600);

      if (this.onTouch) {
        this.onTouch(x, y, obj);
      }
    }
  }

  'keydown'(evt, obj) {
    this.onKeyDown(evt['which'], evt, obj);
  }

  'keyup'(evt, obj) {
    this.onKeyUp(evt['which'], evt, obj);
  }

  'mousewheel'(evt, obj) {
    evt.preventDefault();
    this.onScroll(evt['deltaX'] | 0, evt['deltaY'] | 0, evt, obj);
  }

  'paste'(evt, obj) {
    this.onPaste(evt, obj);
  }

  'resize'(evt, obj) {
    this.onResize();
  }

  'visibilitychange'(evt, obj) {
    this.onVisibilityChange();
  }
}
