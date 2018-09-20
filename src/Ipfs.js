
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
        console.log('timedOut ' + link);
        callback.call(scope, null);
      }
    }, 5000);

    fetch('https://ipfs.infura.io:5001/api/v0/cat/' + link).then(
      function(response) {
        if (timedOut) {
          return;
        }
        timedOut = false;
        response.json().then(function(blob) {
          callback.call(scope, blob);
        }).catch(
          function() {
            callback.call(scope, null);
          }
        );
      }
    ).catch(
      function() {
        if (timedOut) {
          return;
        }
        timedOut = false;
        callback.call(scope, null);
      }
    );
  }

  static push(payload, callback, scope) {
    const formData = new FormData();

    formData.append('file', payload);

    const opts = { 'method': 'POST', 'body': formData };

    fetch('https://ipfs.infura.io:5001/api/v0/add?pin=true', opts).then(
      function(response) {
        response.json().then(function(blob) {
          callback.call(scope, blob);
        });
      }
    ).catch(
      function() {
        callback.call(scope, null);
      }
    );
  }
}
Ipfs._queue = [];
