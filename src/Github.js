
class Github {
  static fetchTimeline(issueUrl, callback, scope, ETag, page, results) {
    let uri = issueUrl.split('github.com/');
    if (uri.length !== 2) {
      Scheduler.dispatch(callback, 0, [scope, null, 0, null]);
      return;
    }

    uri[1] = uri[1].split('#')[0].split('?')[0];

    const headers = {};

    headers['Accept'] = 'application/vnd.github.mockingbird-preview';

    if (this.TOKEN) {
      headers['Authorization'] = 'token ' + this.TOKEN;
    }
    if (ETag) {
      headers['If-None-Match'] = ETag;
    }

    page = page || 1;
    results = results || [];

    const self = this;

    fetch('https://api.github.com/repos/' + uri[1] + '/timeline?page=' + page, { headers }).then(
      function(response) {
        if (response.status === 200) {
          response.json().then(
            function(blob) {
              if (blob && blob.length !== 0) {
                results = results.concat(blob);
                self.fetchTimeline(issueUrl, callback, scope, ETag, page + 1, results);
                return;
              }

              callback.call(
                scope,
                results,
                response.status,
                response.headers.get('ETag'),
                (page > 1 ? page - 1 : page)
              );
            }
          );
          return;
        }

        callback.call(
          scope,
          results,
          response.status,
          response.headers.get('ETag'),
          (page > 1 ? page - 1 : page)
        );
      }
    );
  }

  static fetchComments(issueUrl, callback, scope, ETag) {
    let uri = issueUrl.split('github.com/');
    if (uri.length !== 2) {
      Scheduler.dispatch(callback, 0, [scope, null, 0, null]);
      return;
    }

    const headers = {};

    if (this.TOKEN) {
      headers['Authorization'] = 'token ' + this.TOKEN;
    }
    if (ETag) {
      headers['If-None-Match'] = ETag;
    }

    fetch('https://api.github.com/repos/' + uri[1] + '/comments', { headers }).then(
      function(response) {
        if (response.status === 200) {
          response.json().then(function(blob) {
            callback.call(scope, blob, response.status, response.headers.get('ETag'));
          });
          return;
        }

        callback.call(scope, null, response.status, response.headers.get('ETag'));
      }
    );
  }
}
