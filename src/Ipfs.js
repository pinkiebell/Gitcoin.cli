
class Ipfs {
  static _fetchNext() {
    this.pending = false;

    let a = this._queue.shift();
    if (a) {
      this.pull(a[0], a[1], a[2], true);
    }
  }

  static pull(link, callback, scope, force) {
    if (!force) {
      this._queue.push([link, callback, scope]);

      if (!this.pending) {
        this._fetchNext();
      }

      return;
    }

    this.pending = true;
    let timedOut = undefined;

    setTimeout(function() {
      Ipfs._fetchNext();
    }, 200);

    setTimeout(function() {
      if (timedOut === undefined) {
        timedOut = true;
        // console.log('timedOut ' + link);
        callback.call(scope, null);
      }
    }, 5000);

    const req = new XMLHttpRequest();
    req.open('GET', 'https://ipfs.infura.io:5001/api/v0/cat/' + link);
    req.onreadystatechange = function() {
      if (req.readyState !== 4) {
        return;
      }

      if (timedOut) {
        return;
      }
      timedOut = false;

      let obj;

      try {
        obj = JSON.parse(req.responseText);
      } catch (e) {
      }

      callback.call(scope, obj);
    };

    req.onerror = function() {
      if (timedOut) {
        return;
      }
      timedOut = false;
      callback.call(scope, null);
    };
    req.send();
  }

  static push(payload, callback, scope) {
    const boundary = '----0000000000000000000000000000000000';
    const req = new XMLHttpRequest();

    req.open('POST', 'https://ipfs.infura.io:5001/api/v0/add?pin=true');
    req.setRequestHeader('Content-Type', 'multipart/form-data; boundary=' + boundary);
    req.onreadystatechange = function() {
      if (req.readyState !== 4) {
        return;
      }

      if (req.responseText) {
        let obj;

        try {
          obj = JSON.parse(req.responseText);
        } catch (e) {
        }

        callback.call(scope, obj);
        return;
      }

      callback.call(scope, null);
    };

    const data =
      '--' +
      boundary +
      '\r\nContent-Disposition: form-data; name="file"\r\n\r\n' +
      payload +
      '\r\n--' +
      boundary +
      '--\r\n';
    req.send(data);
  }
}
Ipfs._queue = [];
this.Ipfs = Ipfs;
