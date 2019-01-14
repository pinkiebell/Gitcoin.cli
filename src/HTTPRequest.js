
const http = require('http');
const https = require('https');
const urlParse = require('url').parse;

class HTTPRequest {
  constructor(url, callback, scope, payload, headers, method) {
    this.callback = callback;
    this.scope = scope;
    this.body = Buffer.alloc(0);

    var opts = urlParse(url);
    opts['method'] = method || (payload ? 'PUT' : 'GET');

    headers = headers || {};
    headers['User-Agent'] = 'curl/7.54.0';
    opts['headers'] = headers;

    var self = this;
    var m = opts['protocol'] === 'http:' ? http : https;
    var req = m['request'](opts, this._callback);

    req.setTimeout(30000, function() {
      req.abort();
      self._callback(null);
    });

    req.scope = this;
    req.on('error', function(e) { self._callback(null); });
    req.end(payload);
  }

  _read(req) {
    if (!req.complete) {
      var buf = req.read();
      if (buf) {
        this.body = Buffer.concat([this.body, buf]);
      }
      var self = this;
      setTimeout(function() {
        self._read(req);
      }, 30);
      return;
    }

    var buf = req.read();
    if (buf) {
      this.body = Buffer.concat([this.body, buf]);
    }
    this.callback.call(this.scope, this.body, req.statusCode, req.headers, this);
  }

  _callback(result) {
    if (this._dispatched) {
      return;
    }
    this._dispatched = true;
    if (!result) {
      this.callback.call(this.scope, null, 0, null, this);
      return;
    }
    this.scope._read(result);
  }
}

class XMLHttpRequest {
  constructor() {
    this._headers = {};
  }

  open(method, url) {
    this.method = method;
    this.url = url;

    return this;
  }

  setRequestHeader(key, val) {
    this._headers[key] = val;

    return this;
  }

  getResponseHeader(key) {
    if (!this.headers) {
      return '';
    }

    return this.headers[key] || '';
  }

  send(payload) {
    function callback(buffer, status, headers) {
      if (!buffer) {
        this.status = 0;
        this.headers = {};

        if (this.onerror) {
          this.onerror();
        }
        return;
      }

      this.readyState = 4;
      this.status = status;
      this.headers = headers;
      this.responseText = buffer.toString();
      this.onreadystatechange();
    }

    new HTTPRequest(this.url, callback, this, payload, this._headers, this.method);

    return this;
  }
}
global.XMLHttpRequest = XMLHttpRequest;
