
class Github {
  static fetchTimeline(issueUrl, callback, scope, ETag, page, results) {
    let uri = issueUrl.split('github.com/');
    if (uri.length !== 2) {
      Scheduler.dispatch(callback, 0, [scope, null, 0, null]);
      return;
    }

    uri[1] = uri[1].split('#')[0].split('?')[0];
    page = page || 1;
    results = results || [];

    const req = new XMLHttpRequest();
    req.open('GET', 'https://api.github.com/repos/' + uri[1] + '/timeline?page=' + page);
    req.setRequestHeader('Accept', 'application/vnd.github.mockingbird-preview');

    if (this.TOKEN) {
      req.setRequestHeader('Authorization', 'token ' + this.TOKEN);
    }
    if (ETag) {
      req.setRequestHeader('If-None-Match', ETag);
    }

    const self = this;

    req.onreadystatechange = function() {
      if (req.readyState !== 4) {
        return;
      }

      if (req.status === 200) {
        const blob = JSON.parse(req.responseText);

        if (blob && blob.length !== 0) {
          results = results.concat(blob);
          self.fetchTimeline(issueUrl, callback, scope, ETag, page + 1, results);
          return;
        }

        callback.call(
          scope,
          results,
          req.status,
          req.getResponseHeader('ETag'),
          (page > 1 ? page - 1 : page)
        );
        return;
      }

      callback.call(
        scope,
        results,
        req.status,
        req.getResponseHeader('ETag'),
        (page > 1 ? page - 1 : page)
      );
    };

    req.send();
  }

  static fetchComments(issueUrl, callback, scope, ETag) {
    let uri = issueUrl.split('github.com/');
    if (uri.length !== 2) {
      Scheduler.dispatch(callback, 0, [scope, null, 0, null]);
      return;
    }

    const req = new XMLHttpRequest();
    req.open('GET', 'https://api.github.com/repos/' + uri[1] + '/comments');

    if (this.TOKEN) {
      req.setRequestHeader('Authorization', 'token ' + this.TOKEN);
    }
    if (ETag) {
      req.setRequestHeader('If-None-Match', ETag);
    }


    req.onreadystatechange = function() {
      if (req.readyState !== 4) {
        return;
      }

      if (req.status === 200) {
        const blob = JSON.parse(req.responseText);

        callback.call(scope, blob, req.status, req.getResponseHeader('ETag'));
        return;
      }

      callback.call(scope, null, req.status, req.getResponseHeader('ETag'));
    };

    req.send();
  }
}
this.Github = Github;
