
const fs = require('fs');

class LocalStorage {
  static _init() {
    LocalStorage.HOME = (process.env['HOME'] || '/tmp') + '/.gitcoin.cli/';

    if (!fs.existsSync(LocalStorage.HOME)) {
      fs.mkdirSync(LocalStorage.HOME);
    }
    this.INITD = true;
  }

  static lookup(key, callback, scope) {
    if (!this.INITD) {
      this._init();
    }

    fs.readFile(this.HOME + key, function (err, res) {
      if (err) {
        res = '{}';
      }

      res = res.toString() || '{}';

      try {
        res = JSON.parse(res || '{}');
      } catch (e) {
        res = {};
      }

      callback.call(scope, res);
    });
  }

  static commit(key, obj) {
    if (!this.INITD) {
      this._init();
    }

    fs.writeFile(this.HOME + key, JSON.stringify(obj), function() {});
  }
}
LocalStorage.INITD = false;
LocalStorage.HOME = '';
this.LocalStorage = LocalStorage;
