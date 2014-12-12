var app = app || {};

app.Package = {
  VERSION: '1.0.3',
  SOCKET_IO: (window.location.href.substring(0,4) != 'file') ? '/' : 'http://127.0.0.1:4444/',
  SAVE_TIME_OUT: 1000,
  ENABLE_RUN: true,
  ENABLE_DEBUG: true,
  ROUTE_ROOT: '/',
  CODE_MIRROR_MODEURL: 'js/lib/codemirror/%N.js',
  ALLOW_MISS: true,
};
