
const http = require('http');
const fs = require('fs');

let BRIDGE_JS = '';

class EthereumProviderBridge {
  constructor() {
    this._queue = [];
    this._callbacks = {};

    var server = new http.Server(this._onRequest.bind(this));
    server.listen(54321, '127.0.0.1', function(a, b) {
      let url = 'http://127.0.0.1:' + server.address().port + '/';
      console.log('Open this URL in your Ethereum powered browser ;):\n' + url + '\n');
    });
  }

  _onRequest(req, res) {
    const path = req.url;

    if (path === '/get') {
      let ob = {};
      if (this._queue.length) {
        ob = this._queue.shift();
      }
      res.end(JSON.stringify(ob));

      return;
    }

    if (path === '/post') {
      const self = this;

      let body = Buffer.alloc(0);
      function check() {
        if (!req.complete) {
          body = Buffer.concat([body, req.read()]);
          setTimeout(check, 10);
          return;
        }

        let ob = Buffer.concat([body, req.read()]);
        res.end();

        self._handleMessage(JSON.parse(ob));
      }

      setTimeout(check, 10);
      return;
    }

    if (!BRIDGE_JS) {
      BRIDGE_JS = fs.readFileSync('./src/bridge.html');
    }

    res.end(BRIDGE_JS);
  }

  _handleMessage(evt) {
    let callback = this._callbacks[evt['id']];

    delete callback[evt['id']];

    if (callback) {
      callback(null, evt);
    }
  }

  enable() {
  }

  reconnect() {
  }

  send(payload, callback) {
    payload['id'] = Date.now() + this._queue.length;
    this._queue.push(payload);
    this._callbacks[payload['id']] = callback;
  }

  on(typeStr, callback) {
    console.log('..on', typeStr);
  }

  once(typeStr, callback) {
    console.log('..once', typeStr);
  }

  removeListener(typeStr, callbackToRemove) {
    console.log('..removeListener', typeStr);
  }

  removeAllListeners(typeStr) {
    console.log('..removeAllLis', typeStr);
  }

  reset() {
    console.log('..reset..');
  }
}
this.EthereumProviderBridge = EthereumProviderBridge;
