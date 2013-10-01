var allFileLists = [];

var exttoicon = {
	'c':		'c',
	'clj':		'clj',
	'coffee':	'coffee',
	'cpp':		'cpp',
	'cs':		'cs',
	'css':		'css',
	'go':		'go',
	'h':		'h',
	'htm':		'htm',
	'html':		'html',
	'hpp':		'hpp',
	'java':		'java',
	'js':		'js',
	'json':		'json',
	'lisp':		'lisp',
	'lua':		'lua',
	'md':		'md', //
	'pas':		'pas', //
	'php':		'php',
	'pl':		'pl',
	'py':		'py',
	'rb':		'rb',
	'sql':		'sql',
	'tex':		'tex',
	'vbs':		'vbs',
	'xml':		'xml'
}

function fileList(table) {

	var obj = $(table);

	var header = '<tr class="head"><th class="col1">&nbsp;</th>' +
		'<th class="col2">' + strings['filename'] + '</th><th class="col3">' + strings['state'] + '</th>' +
		'<th class="col4">' + strings['timestamp'] + '</th><th class="col5">&nbsp;</th></tr>';
	
	var elements = [];
	
	var mode = 3;
	
	var getpic = function(type, shared, ext) {
		var s = 'images/ext/';
		if(type == 'dir') {
			s += 'dict';
		} else {
			if(exttoicon[ext])
				s += exttoicon[ext];
			else
				s += 'file';
		}
		s += '.png';
		return s;
	};
	
	var n = allFileLists.length;
	
	var oldhtml = '';
	
	var haveloading = false;
	
	function formatDate(t) {
		var o = t.getMonth() + 1;
		var h = t.getHours();
		var m = t.getMinutes();
		var s = t.getSeconds();
		return t.getFullYear() + '-' + (o<10?'0'+o:o) + '-' + t.getDate() + ' ' +
			(h<10?'0'+h:h) + ':' + (m<10?'0'+m:m) + ':' + (s<10?'0'+s:s);
	}
	
	r = {

		elements: elements,

		clear: function() {
			obj.html(header + '<tr class="no-file"><td></td><td localization>' + strings['nofile'] + '</td><td></td><td></td><td></td></tr>');
			elements = [];
			this.elements = elements;
		},
		
		getmode: function() {
			return mode;
		},
		
		setmode: function(newmode) {
			mode = newmode;
			if(mode & 2)
				header = '<tr class="head"><th class="col1">&nbsp;</th>' +
		'<th class="col2" localization>' + strings['filename'] + '</th><th class="col3" localization>' + strings['state'] + '</th>' +
		'<th class="col4" localization>' + strings['timestamp'] + '</th><th class="col5">&nbsp;</th></tr>';
			else
				header = '<tr class="head"><th class="col1">&nbsp;</th>' +
		'<th class="col2" localization>' + strings['filename'] + '</th><th class="col3 owner" localization>' + strings['owner'] + '</th>' +
		'<th class="col4" localization>' + strings['timestamp'] + '</th><th class="col5">&nbsp;</th></tr>';
		},
	
		add: function(o) {
			obj.find('.no-file').remove();
			var i = elements.length;
			
			var namesplit = o.name.split('/');
			namesplit = namesplit[namesplit.length - 1];
			namesplit = namesplit.split('.');
			var ext = namesplit[namesplit.length - 1];
			if(namesplit.length == 1)
				ext = 'unknown';

			var toAppend = '<tr>' +
				'<td class="col1"><img src="' + getpic(o.type, o.shared, ext) + '" height="32" width="32" /></td>' +
				'<td class="col2"><a href="javascript:;" onclick="allFileLists['+n+'].onname(allFileLists['+n+'].elements['+i+'])">' + 
				htmlescape(o.showname) + '</a></td>' +
				(mode & 2?('<td class="col3" localization>' + (o.shared?strings['shared']:'') + '</td>'):
				'<td class="col3 owner"><img class="user-' + o.owner.name + '" src="' + o.owner.avatar + '" width="32" height="32"/>' + o.owner.name + '</td>') +
				'<td class="col4">' + o.time + '</td>' +
				'<td class="col5"><div class="dropdown">' +
				'<a href="javascript:;" class="dropdown-toggle' + (mode?'':' disabled') + ' opreation" data-toggle="dropdown">&nbsp;</a>' +
				'<ul class="dropdown-menu">' +
				(mode & 1?
				'<li><a href="javascript:;" onclick="allFileLists['+n+'].onshare(allFileLists['+n+'].elements['+i+'])" localization>' + strings['sharemanage'] + '</a></li>':'') +
				(mode & 2?(
				'<li><a href="javascript:;" onclick="allFileLists['+n+'].ondelete(allFileLists['+n+'].elements['+i+'])" localization>' + strings['delete'] + '</a></li>' +
				'<li><a href="javascript:;" onclick="allFileLists['+n+'].onrename(allFileLists['+n+'].elements['+i+'])" localization>' + strings['rename'] + '</a></li>'/* +
				'<li><a href="javascript:;" onclick="allFileLists['+n+'].ondownload(allFileLists['+n+'].elements['+i+'])" localization>' + strings['export'] + '</a></li>'*/):'') +
				'</ul>' +
				'</div>' +
				'</td>' +
				'</tr>';

			obj.append(toAppend);
			return elements.push(o);
		},
		
		formdocs: function(docs, filter, alwaysshared, parent) {
			this.clear();
			var all = [];
			var i;
			if(filter === undefined)
				filter = function(o){ return true; };
			for(i=0; i<docs.length; i++) {
				var o = docs[i];
				if(!filter(o))
					continue;
				var n = {};
				n['path'] = o.path;
				var paths = o.path.split('/');
				if((mode & 2) == 0 && paths.length == 3) {
					n['name'] = paths[1] + '/' + paths[2];
					n['showname'] = paths[2] + '@' + paths[1];
				} else {
					n['showname'] = n['name'] = paths[paths.length - 1];
				}
				n['type'] = o.type;
				if(!alwaysshared)
					n['shared'] = (o.members && o.members.length)?true:false;
				else
					n['shared'] = true;
				n['members'] = o.members;
				if(!o.owner && parent)
					n['owner'] = parent.owner;
				else
					n['owner'] = o.owner;
				if(o.modifyTime) {
					var t = new Date(o.modifyTime);
					n['time'] = formatDate(t);
				} else {
					n['time'] = '-';
				}
				n['toString'] = function() {
					return "{ path:" + this.path + ", name:" +
					this.name + ", type:" + this.type + ", shared:" +
					this.shared + ", time:" + this.time + " }";
				}
				all.push(n);
			}
			all.sort(function(a,b) {
				if(a.type == b.type)
					return a.name>b.name?1:-1;
				else
					return a.type=='dir'?-1:1;
			});
			for(i=0; i<all.length; i++) {
				var o = all[i];
				this.add(o);
			}
		},
		
		loading: function() {
			oldhtml = obj.html();
			haveloading = true;
			setTimeout('allFileLists['+n+'].loadingthen();', 300);
		},
		
		loadingthen: function() {
			if(haveloading)
				obj.html(header + '<tr class="loading"><td></td><td><img src="images/loading.gif"/></td><td></td><td></td><td></td></tr>');
		},
		
		removeloading: function() {
			obj.html(oldhtml);
			haveloading = false;
		},
		
		onname: function(o) {
			alert('onname');
		},
		
		onshare: function(o) {
			alert('onshare');
		},
		
		ondelete: function(o) {
			alert('ondelete');
		},
		
		onrename: function(o) {
			alert('onrename');
		},
		
		ondownload: function(o) {
			alert('ondownload');
		}
	};
	
	allFileLists.push(r);
	
	return r;
}
