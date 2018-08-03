//<nowiki>


(function($){


/*
 ****************************************
 *** twinkleunlink.js: Unlink module
 ****************************************
 * Mode of invocation:     Tab ("Unlink")
 * Active on:              Non-special pages, except Wikipedia:Sandbox
 * Config directives in:   TwinkleConfig
 */

Twinkle.unlink = function twinkleunlink() {
	if( mw.config.get('wgNamespaceNumber') < 0 || mw.config.get('wgPageName') === 'विकिपीडिया:प्रयोगस्थल' ) {
		return;
	}
	Twinkle.addPortletLink( Twinkle.unlink.callback, "कड़ीतोड़", "tw-unlink", "अन्य पृष्ठों से इस पृष्ठ की कड़ियाँ हटाएँ" );
};

Twinkle.unlink.getChecked2 = function twinkleunlinkGetChecked2( nodelist ) {
	if( !( nodelist instanceof NodeList ) && !( nodelist instanceof HTMLCollection ) ) {
		return nodelist.checked ? [ nodelist.values ] : [];
	}
	var result = [];
	for(var i  = 0; i < nodelist.length; ++i ) {
		if( nodelist[i].checked ) {
			result.push( nodelist[i].values );
		}
	}
	return result;
};

// the parameter is used when invoking unlink from admin speedy
Twinkle.unlink.callback = function(presetReason) {
	var Window = new Morebits.simpleWindow( 600, 440 );
	Window.setTitle( "कड़ियाँ" + (mw.config.get('wgNamespaceNumber') === 6 ? " और फ़ाइल प्रयोग" : "") + " हटाएँ" );
	Window.setScriptName( "Twinkle" );
	Window.addFooterLink( "Twinkle help", "WP:TW/DOC#unlink" );

	var form = new Morebits.quickForm( Twinkle.unlink.callback.evaluate );

	// prepend some basic documentation
	var node1 = Morebits.htmlNode("code", "[[" + Morebits.pageNameNorm + "|कड़ी पाठ]]")
	var node2 = Morebits.htmlNode("code", "कड़ी पाठ");
	node1.style.fontFamily = node2.style.fontFamily = "monospace";
	node1.style.fontStyle = node2.style.fontStyle = "normal";
	form.append( {
		type: 'div',
		style: 'margin-bottom: 0.5em',
		label: [ 
			'यह उपकरण अन्य पृष्ठों पर मौजूद इस पृष्ठ की सभी कड़ियों ("backlinks") को हटाने का विकल्प प्रदान करता है' + 
				(mw.config.get('wgNamespaceNumber') === 6 ? ", और/या इस फ़ाइल की कड़ियों को <!-- --> में डालकर फ़ाइल के सभी प्रयोग छुपाने का विकल्प प्रदान करता है।" : "") + 
				". उदाहरणतः ",
			node1,
			" बन जाएगा ",
			node2,
			"। ध्यान से प्रयोग कीजियेगा।"
		]
	} );

	form.append( {
		type: 'input',
		name: 'reason',
		label: 'कारण: ',
		value: (presetReason ? presetReason : ''),
		size: 60
	} );

	var query;
	if(mw.config.get('wgNamespaceNumber') === 6) {  // File:
		query = {
			'action': 'query',
			'list': [ 'backlinks', 'imageusage' ],
			'bltitle': mw.config.get('wgPageName'),
			'iutitle': mw.config.get('wgPageName'),
			'bllimit': Morebits.userIsInGroup( 'sysop' ) ? 5000 : 500, // 500 is max for normal users, 5000 for bots and sysops
			'iulimit': Morebits.userIsInGroup( 'sysop' ) ? 5000 : 500, // 500 is max for normal users, 5000 for bots and sysops
			'blnamespace': Twinkle.getPref('unlinkNamespaces'),
			'iunamespace': Twinkle.getPref('unlinkNamespaces')
		};
	} else {
		query = {
			'action': 'query',
			'list': 'backlinks',
			'bltitle': mw.config.get('wgPageName'),
			'blfilterredir': 'nonredirects',
			'bllimit': Morebits.userIsInGroup( 'sysop' ) ? 5000 : 500, // 500 is max for normal users, 5000 for bots and sysops
			'blnamespace': Twinkle.getPref('unlinkNamespaces')
		};
	}
	var wikipedia_api = new Morebits.wiki.api( 'कड़ियाँ खोजी जा रही हैं', query, Twinkle.unlink.callbacks.display.backlinks );
	wikipedia_api.params = { form: form, Window: Window, image: mw.config.get('wgNamespaceNumber') === 6 };
	wikipedia_api.post();

	var root = document.createElement( 'div' );
	root.style.padding = '15px';  // just so it doesn't look broken
	Morebits.status.init( root );
	wikipedia_api.statelem.status( "कड़ियाँ लोड हो रही हैं..." );
	Window.setContent( root );
	Window.display();
};

Twinkle.unlink.callback.evaluate = function twinkleunlinkCallbackEvaluate(event) {
	Twinkle.unlink.backlinksdone = 0;
	Twinkle.unlink.imageusagedone = 0;

	function processunlink(pages, imageusage) {
		var statusIndicator = new Morebits.status((imageusage ? 'फ़ाइल प्रयोग हटाया जा रहा है' : 'कड़ियाँ हटाई जा रही हैं'), '0%');
		var total = pages.length;  // removing doubling of this number - no apparent reason for it

		Morebits.wiki.addCheckpoint();

		if( !pages.length ) {
			statusIndicator.info( '100% (सम्पूर्ण)' );
			Morebits.wiki.removeCheckpoint();
			return;
		}

		// get an edit token
		var params = { reason: reason, imageusage: imageusage, globalstatus: statusIndicator, current: 0, total: total };
		for (var i = 0; i < pages.length; ++i)
		{
			var myparams = $.extend({}, params);
			var articlepage = new Morebits.wiki.page(pages[i], '"' + pages[i] + '"' + ' पृष्ठ से कड़ियाँ हटाई जा रही हैं');
			articlepage.setCallbackParameters(myparams);
			articlepage.setBotEdit(true);  // unlink considered a floody operation
			articlepage.load(imageusage ? Twinkle.unlink.callbacks.unlinkImageInstances : Twinkle.unlink.callbacks.unlinkBacklinks);
		}
	}

	var reason = event.target.reason.value;
	if (!reason) {
		alert("कड़ियाँ हटाने के लिए कारण देना अनिवार्य है।");
		return;
	}

	var backlinks, imageusage;
	if( event.target.backlinks ) {
		backlinks = Twinkle.unlink.getChecked2(event.target.backlinks);
	}
	if( event.target.imageusage ) {
		imageusage = Twinkle.unlink.getChecked2(event.target.imageusage);
	}

	Morebits.simpleWindow.setButtonsEnabled( false );
	Morebits.status.init( event.target );
	Morebits.wiki.addCheckpoint();
	if (backlinks) {
		processunlink(backlinks, false);
	}
	if (imageusage) {
		processunlink(imageusage, true);
	}
	Morebits.wiki.removeCheckpoint();
};

Twinkle.unlink.backlinksdone = 0;
Twinkle.unlink.imageusagedone = 0;

Twinkle.unlink.callbacks = {
	display: {
		backlinks: function twinkleunlinkCallbackDisplayBacklinks(apiobj) {
			var xmlDoc = apiobj.responseXML;
			var havecontent = false;
			var list, namespaces, i;

			if( apiobj.params.image ) {
				var imageusage = $(xmlDoc).find('query imageusage iu');
				list = [];
				for ( i = 0; i < imageusage.length; ++i ) {
					var usagetitle = imageusage[i].getAttribute('title');
					list.push( { label: usagetitle, value: usagetitle, checked: true } );
				}
				if (!list.length)
				{
					apiobj.params.form.append( { type: 'div', label: 'फ़ाइल का प्रयोग कहीं नहीं मिला।' } );
				}
				else
				{
					apiobj.params.form.append( { type:'header', label: 'फ़ाइल प्रयोग' } );
					namespaces = [];
					$.each(Twinkle.getPref('unlinkNamespaces'), function(k, v) {
						namespaces.push(Morebits.wikipedia.namespacesFriendly[v]);
					});
					apiobj.params.form.append( {
						type: 'div',
						label: "चुने हुए नामस्थान: " + namespaces.join(', '),
						tooltip: "आप ये नामस्थान अपनी ट्विंकल वरीयताओं में बदल सकते हैं, [[वि:Twinkle/Preferences]] पर।"
					});
					if ($(xmlDoc).find('query-continue').length) {
						apiobj.params.form.append( {
							type: 'div',
							label: "पहले " + list.length.toString() + " फ़ाइल प्रयोग नीचे सूचीबद्ध हैं।"
						});
					}
					apiobj.params.form.append({
						type: 'button',
						label: "Select All",
						event: function(e) {
							$(Morebits.quickForm.getElements(e.target.form, "imageusage")).prop('checked', true);
						}
					});
					apiobj.params.form.append({
						type: 'button',
						label: "Deselect All",
						event: function(e) {
							$(Morebits.quickForm.getElements(e.target.form, "imageusage")).prop('checked', false);
						}
					});
					apiobj.params.form.append({
						type: 'checkbox',
						name: 'imageusage',
						list: list
					});
					havecontent = true;
				}
			}

			var backlinks = $(xmlDoc).find('query backlinks bl');
			if( backlinks.length > 0 ) {
				list = [];
				for ( i = 0; i < backlinks.length; ++i ) {
					var title = backlinks[i].getAttribute('title');
					list.push( { label: title, value: title, checked: true } );
				}
				apiobj.params.form.append( { type:'header', label: 'Backlinks' } );
				namespaces = [];
				$.each(Twinkle.getPref('unlinkNamespaces'), function(k, v) {
					namespaces.push(Morebits.wikipedia.namespacesFriendly[v]);
				});
				apiobj.params.form.append( {
					type: 'div',
					label: "चुने हुए नामस्थान: " + namespaces.join(', '),
					tooltip: "आप ये नामस्थान अपनी ट्विंकल वरीयताओं में बदल सकते हैं, [[वि:Twinkle/Preferences]] पर।"
				});
				if ($(xmlDoc).find('query-continue').length) {
					apiobj.params.form.append( {
						type: 'div',
						label: "यहाँ की कड़ियों वाले पहले" + list.length.toString() + "पृष्ठ नीचे सूचीबद्ध हैं।"
					});
				}
				apiobj.params.form.append({
					type: 'button',
					label: "Select All",
						event: function(e) {
							$(Morebits.quickForm.getElements(e.target.form, "backlinks")).prop('checked', true);
						}
				});
				apiobj.params.form.append({
					type: 'button',
					label: "Deselect All",
						event: function(e) {
							$(Morebits.quickForm.getElements(e.target.form, "backlinks")).prop('checked', false);
						}
				});
				apiobj.params.form.append({
					type: 'checkbox',
					name: 'backlinks',
					list: list
				});
				havecontent = true;
			}
			else
			{
				apiobj.params.form.append( { type: 'div', label: "कोई कड़ियाँ नहीं मिली।" } );
			}

			if (havecontent) {
				apiobj.params.form.append( { type:'submit' } );
			}

			var result = apiobj.params.form.render();
			apiobj.params.Window.setContent( result );

			Morebits.checkboxShiftClickSupport($("input[name='imageusage']", result));
			Morebits.checkboxShiftClickSupport($("input[name='backlinks']", result));

		}
	},
	unlinkBacklinks: function twinkleunlinkCallbackUnlinkBacklinks(pageobj) {
		var text, oldtext;
		text = oldtext = pageobj.getPageText();
		var params = pageobj.getCallbackParameters();

		var wikiPage = new Morebits.wikitext.page(text);
		wikiPage.removeLink(Morebits.pageNameNorm);
		text = wikiPage.getText();
		if (text === oldtext) {
			// Nothing to do, return
			Twinkle.unlink.callbacks.success(pageobj);
			Morebits.wiki.actionCompleted();
			return;
		}

		pageobj.setPageText(text);
		pageobj.setEditSummary("\"" + Morebits.pageNameNorm + "\" पृष्ठ की कड़ियाँ हटाई जा रही हैं। कारण: " + params.reason + "।" + Twinkle.getPref('summaryAd'));
		pageobj.setCreateOption('nocreate');
		pageobj.save(Twinkle.unlink.callbacks.success);
	},
	unlinkImageInstances: function twinkleunlinkCallbackUnlinkImageInstances(pageobj) {
		var text, oldtext;
		text = oldtext = pageobj.getPageText();
		var params = pageobj.getCallbackParameters();

		var wikiPage = new Morebits.wikitext.page(text);
		wikiPage.commentOutImage(mw.config.get('wgTitle'), 'Commented out');
		text = wikiPage.getText();
		if (text === oldtext) {
			// Nothing to do, return
			Twinkle.unlink.callbacks.success(pageobj);
			Morebits.wiki.actionCompleted();
			return;
		}

		pageobj.setPageText(text);
		pageobj.setEditSummary("\"" + Morebits.pageNameNorm + "\" फ़ाइल का प्रयोग हटाया जा रहा है। कारण: " + params.reason + "।" + Twinkle.getPref('summaryAd'));
		pageobj.setCreateOption('nocreate');
		pageobj.save(Twinkle.unlink.callbacks.success);
	},
	success: function twinkleunlinkCallbackSuccess(pageobj) {
		var params = pageobj.getCallbackParameters();
		var total = params.total;
		var now = parseInt( 100 * (params.imageusage ? ++(Twinkle.unlink.imageusagedone) : ++(Twinkle.unlink.backlinksdone))/total, 10 ) + '%';
		params.globalstatus.update( now );
		if((params.imageusage ? Twinkle.unlink.imageusagedone : Twinkle.unlink.backlinksdone) >= total) {
			params.globalstatus.info( now + ' (सम्पूर्ण)' );
			Morebits.wiki.removeCheckpoint();
		}
	}
};
})(jQuery);


//</nowiki>
