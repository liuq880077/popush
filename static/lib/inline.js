var fs = require('fs');

var html = fs.readFileSync(process.argv[2]).toString();

var css = fs.readFileSync(process.argv[3]).toString();

var js = fs.readFileSync(process.argv[4]).toString();

html = html.replace(/<\/title>.*<\/head>/g, '</title></head>');

html = html.substr(0, html.indexOf('</head>'))
		+ '<style type="text/css">' + css + '</style>'
		+ '<script type="text/javascript">' + js + '</script>'
		+ html.substr(html.indexOf('</head>'));

fs.writeFileSync(process.argv[3], css.replace(/\n/g, ''));

fs.writeFileSync(process.argv[4], js.replace(/\n/g, ''));

html = html.replace(/\n/g, '');

html = html.replace(/\.\.\/images/g, 'images')

process.stdout.write(html);