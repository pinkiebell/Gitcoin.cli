
class LocalStorage {
  static _onSuccess() {
    if (!this['result']) {
      return;
    }
    if (!LocalStorage._db) {
      LocalStorage._db = this['result'];
    }
  }

  static _onUpgradeNeeded() {
    this['result']['createObjectStore']('.');
  }

  static _init() {
    if (!LocalStorage._db) {
      var req = window['indexedDB']['open']('.', 1);
      req['addEventListener']('success', LocalStorage._onSuccess);
      req['onupgradeneeded'] = LocalStorage._onUpgradeNeeded;
      return false;
    }
    return true;
  }

  static lookup(key, callback, scope) {
    if (!LocalStorage._init()) {
      Scheduler.dispatch(LocalStorage.lookup, 100, [this, key, callback, scope]);
      return;
    }
    var tr = LocalStorage._db['transaction']('.')['objectStore']('.')['get'](key);
    tr['onsuccess'] = function() {
      callback.call(scope, this['result']);
    };
  }

  static commit(key, obj) {
    if (!LocalStorage._init()) {
      Scheduler.dispatch(LocalStorage.commit, 100, [this, key, obj]);
      return;
    }
    var tr = LocalStorage._db['transaction']('.', 'readwrite')['objectStore']('.')['put'](obj, key);
    tr['onsuccess'] = function() {
    };
  }
}

