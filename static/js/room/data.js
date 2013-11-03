var app = app || {};

/* 房间控制器数据 */
(function() {
var Room = function() {
	_.extend(this, {
    	runLock: false,
    	debugLock: false,
	    operationLock: false,
	    waiting: false,
		chatstate: false,
    	runable: true,
    	debugable: false,
    	cursors: {},
    	docModel: null,
    	lock: false,
    	docData: null,
    	q: [],
    	timer: null,
    	ext: '',
    	bq: [],
    	bps: '',
    	consoleOpened: false,
    	old_text: '',
    	old_bps: null,
    
    	timestamp: 0,
    	isSaving: false,
    	saveTimeout: 500,
    	buffertimeout: app.Package.SAVE_TIME_OUT,
    	buffertext: "",
		bufferfrom: -1,
		bufferto: -1,

	}, Room.prototype);
	return this;
};

/**
  the following function (this.stringFill) are learnt from:
  http://blog.163.com/huangkui_009@126/blog/static/5227269420127140374565/
    Posted on 2009-09-22 by amberlife.
  param: ch: char to fill with;
  return a new string with 'length' 'ch's, such as 100 '0's.
  */
app.stringFill = function (ch, length) {
	for(var a = length, r = [], s = ch; a; s += s) {
		if (a % 2) { 
			r.push(s);
			a = (a-1) / 2; 
		}
		else {
			r.push(s); 
			a = a / 2;
		}
	}
	delete s;
	return r.join('');
};


app.languageMap = { 
  'c':      'clike',
  'clj':    'clojure',
  'coffee': 'coffeescript',
  'cpp':    'clike',
  'cs':     'clike',
  'css':    'css',
  'go':     'go',
  'h':      'clike',
  'htm':    'htmlmixed',
  'html':   'htmlmixed',
  'hpp':    'clike',
  'java':   'clike',
  'js':     'javascript',
  'json':   'javascript',
  'lisp':   'commonlisp',
  'lua':    'lua',
  'md':     'markdown',
  'pas':    'pascal',
  'php':    'php',
  'pl':     'perl',
  'py':     'python',
  'rb':     'ruby',
  'sql':    'sql',
  'tex':    'stex',
  'vbs':    'vb',
  'xml':    'xml',
};

app.modeMap = {
  'c':      'text/x-csrc',
  'clj':    'text/x-clojure',
  'coffee': 'text/x-coffeescript',
  'cpp':    'text/x-c++src',
  'cs':     'text/x-csharp',
  'css':    'text/css',
  'go':     'text/x-go',
  'h':      'text/x-csrc',
  'htm':    'text/html',
  'html':   'text/html',
  'hpp':    'text/x-c++src',
  'java':   'text/x-java',
  'js':     'text/javascript',
  'json':   'application/json',
  'lisp':   'text/x-common-lisp',
  'lua':    'text/x-lua',
  'md':     'text/x-markdown',
  'pas':    'text/x-pascal',
  'php':    'application/x-httpd-php',
  'pl':     'text/x-perl',
  'py':     'text/x-python',
  'rb':     'text/x-ruby',
  'sql':    'text/x-sql',
  'tex':    'text/x-latex',
  'vbs':    'text/x-vb',
  'xml':    'application/xml',
};

app.RunableExt = ['c','cpp', 'js', 'py', 'pl','rb','lua', 'java'];
app.DebugableExt = ['c', 'cpp'];

app.Room = Room;

app.init || (app.init = {});

app.init.room = function() {
  app.room || (app.room = new app.Room());
};

})();

