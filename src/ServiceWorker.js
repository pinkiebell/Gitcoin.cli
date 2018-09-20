
self.skipWaiting();

self.addEventListener('fetch',
  function(event) {
    return fetch(event.request);
  }
);

self.addEventListener('message',
  function(event) {
    console.log(event);
    event.source.postMessage('pong ' + event.data);
  }
);

self.addEventListener('activate',
  function(event) {
    console.log('activate');

    self.clients.matchAll().then(
      function(clientList) {
        clientList.forEach(
          function(client) {
            //client.postMessage('worker rdy');
          }
        );
      }
    );
  }
);
