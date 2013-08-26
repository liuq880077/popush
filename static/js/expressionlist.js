var allExpressionLists = [];

function expressionList(table) {

	var obj = $(table);
	
	var n = allExpressionLists.length;
	
	var elemid = 1;
	
	var elements = {};
	
	var editingelem = null;
	
	var r = {
	
		elements: elements,
	
		clear: function() {
			obj.html(
				'<tr class="new"><td class="col1">&nbsp;</td>' +
				'<td class="col2" onclick="allExpressionLists['+n+'].addExpression()" title="' +
					strings['addexpression'] + '"><i class="icon-plus"></i></td>' +
				'<td class="col3"></td></tr>'
				);
			elemid = 1;
		},

		addExpression: function(expression) {
			this.doneall();
			var id = elemid;
			elemid++;
			var elem = $(
				'<tr id="express-elem-' + n + '-' + id +'" onmouseover="$(this).find(\'a\').show()" onmouseout="$(this).find(\'a\').hide()">' +
					'<td class="col1">' + /*'&nbsp;<a href="javascript:;" class="hide" title="' + strings['removeexpression'] + '" onclick="allExpressionLists['+n+'].removeExpression('+id+')">' +
						'<i class="icon-remove"></i>' +
					'</a>' + */ '</td>' +
					'<td class="col2">' +
						'<span class="title" onclick="allExpressionLists['+n+'].renameExpression('+id+')"></span>' +
						'<input type="text" onkeydown="if(event.keyCode==13)allExpressionLists['+n+'].renameExpressionDone('+id+')" ' +
							'onblur="allExpressionLists['+n+'].doneall()"/></td>' +
					'<td class="col3"></td>' +
				'</tr>'
				);
			if(expression === undefined) {
				elem.find('span').hide();
				obj.find('.new').before(elem);
				elem.find('input').focus();
				elements[id] = {elem: elem, expression: '', notnew: false};
				editingelem = id;
			} else {
				elem.find('input').hide();
				elem.find('span').text(expression);
				obj.find('.new').before(elem);
				elements[id] = {elem: elem, expression: expression, notnew: true};
			}
		},
		
		removeElement: function(id) {
			elements[id].elem.remove();
			if(elements[id].elem == editingelem)
				editingelem = null;
			delete elements[id];
		},
		
		removeExpression: function(id) {
			this.doneall();
			this.removeElement(id);
		},
		
		renameExpression: function(id) {
			this.doneall();
			var input = elements[id].elem.find('input');
			var span = elements[id].elem.find('.title');
			var expression = span.text();
			span.hide();
			input.val($.trim(expression));
			input.show();
			input.focus();
			input.select();
			editingelem = id;
		},
		
		renameExpressionDone: function(id) {
			var input = elements[id].elem.find('input');
			var span = elements[id].elem.find('.title');
			var expression = $.trim(input.val());
			input.hide();
			if(expression == '') {
				elements[id].elem.remove();
				delete elements[id];
				editingelem = null;
				return;
			} else
				span.text(expression);
			span.show();
			elements[id].expression = expression;
		},
		
		doneall: function() {
			if(editingelem) {
				r.renameExpressionDone(editingelem);
				editingelem = null;
			}
		},
		
		findElementByExpression: function(expression) {
			for(var k in elements) {
				var element = elements[k];
				if(element.expression == expression) {
					return element;
				}
			}
		},
		
		removeElementByExpression: function(expression) {
			for(var k in elements) {
				var element = elements[k];
				if(element.expression == expression) {
					this.removeElement(k);
					return;
				}
			}
		},
		
		seteditingelem: function(elem) {
			editingelem = elem;
		},
		
		geteditingelem: function() {
			return editingelem;
		},
		
		setValue: function(expression, value) {
			var v = this.findElementByExpression(expression);
			if(!v)
				return;
			var elem = v.elem;
			if(value !== null)
				elem.find('.col3').text(value);
			else
				elem.find('.col3').html('<span style="color:red">undefined</span>');
		}
	};

	allExpressionLists.push(r);
	
	return r;
}