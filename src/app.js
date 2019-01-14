
window.speak = function(text, callback) {
  var u = new SpeechSynthesisUtterance();
  u.text = text;
  u.lang = 'en-US';

  u.onend = function () {
    if (callback) {
      callback();
    }
  };

  u.onerror = function (e) {
    if (callback) {
      callback(e);
    }
  };

  speechSynthesis.speak(u);
}

/*
  var range = document['createRange']();
  range['selectNode'](self.link.element);
  window['getSelection']()['removeAllRanges']();
  window['getSelection']()['addRange'](range);
  document['execCommand']('copy');
  window['getSelection']()['removeAllRanges']();
*/

function main() {
  window.navigator.serviceWorker.register('ServiceWorker.js');
  //window.navigator.serviceWorker.addEventListener('message',
  //  function(event) {
  //    console.log('worker rdy');
  //    window.console.log(event);
  //  }
  //);
  //window.navigator.serviceWorker.controller.postMessage('foo')
  const console = new GitcoinConsole();
}

main();
