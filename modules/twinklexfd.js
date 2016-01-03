//<nowiki>


(function($){


/*
 ****************************************
 *** twinklexfd.js: XFD module
 ****************************************
 * Mode of invocation:     Tab ("XFD")
 * Active on:              Existing, non-special pages, except for file pages with no local (non-Commons) file which are not redirects
 * Config directives in:   TwinkleConfig
 */

Twinkle.xfd = function twinklexfd() {
	// Disable on:
	// * special pages
	// * non-existent pages
	// * files on Commons, whether there is a local page or not (unneeded local pages of files on Commons are eligible for CSD F2)
	// * file pages without actual files (these are eligible for CSD G8)
	if ( mw.config.get('wgNamespaceNumber') < 0 || !mw.config.get('wgArticleId') || (mw.config.get('wgNamespaceNumber') === 6 && (document.getElementById('mw-sharedupload') || (!document.getElementById('mw-imagepage-section-filehistory') && !Morebits.wiki.isPageRedirect()))) ) {
		return;
	}
	Twinkle.addPortletLink( Twinkle.xfd.callback, "हहेच", "tw-xfd", "हटाने हेतु चर्चा के लिये नामांकित करें" );
};

Twinkle.xfd.currentRationale = null;

// error callback on Morebits.status.object
Twinkle.xfd.printRationale = function twinklexfdPrintRationale() {
	if (Twinkle.xfd.currentRationale) {
		Morebits.status.printUserText(Twinkle.xfd.currentRationale, "आपका दिया हटाने का कारण निम्नलिखित है। यदि आप चाहें तो ट्विंकल की नई ह॰हे॰च विंडो में कॉपी कर के पुनः प्रयास कर सकते हैं:");
		// only need to print the rationale once
		Twinkle.xfd.currentRationale = null;
	}
};

Twinkle.xfd.callback = function twinklexfdCallback() {
	var Window = new Morebits.simpleWindow( 600, 350 );
	Window.setTitle( "हटाने हेतु चर्चा के लिये नामांकन" );
	Window.setScriptName( "Twinkle" );
	Window.addFooterLink( "पृष्ठ हटाने हेतु चर्चा", "वि:पृष्ठ_हटाने_हेतु_चर्चा" );
	Window.addFooterLink( "Twinkle help", "WP:TW/DOC#xfd" );

	var form = new Morebits.quickForm( Twinkle.xfd.callback.evaluate );
	var categories = form.append( {
			type: 'select',
			name: 'category',
			label: 'चर्चा पृष्ठ:',
			tooltip: 'आपके लिये अपने-आप सबसे उपयुक्त चर्चा पृष्ठ चुना जाता है, परंतु आप चाहें तो किसी अन्य विकल्प का प्रयोग भी कर सकते हैं (ऐसा ना किया जाए तो बेहतर है)',
			event: Twinkle.xfd.callback.change_category
		} );
	categories.append( {
			type: 'option',
			label: 'लेख हटाने हेतु चर्चा',
			selected: mw.config.get('wgNamespaceNumber') === 0,  // Main namespace
			value: 'लेख'
		} );
	categories.append( {
			type: 'option',
			label: 'श्रेणियाँ हटाने, विलय अथवा स्थानांतरित करने हेतु चर्चा',
			selected: mw.config.get('wgNamespaceNumber') === 14,  // Category namespace
			value: 'श्रेणियाँ'
		} );
	categories.append( {
			type: 'option',
			label: 'साँचे हटाने हेतु चर्चा',
			selected: mw.config.get('wgNamespaceNumber') === 10,  // Template namespace
			value: 'साँचे'
		} );
	categories.append( {
			type: 'option',
			label: 'फ़ाइलें हटाने हेतु चर्चा',
			selected: mw.config.get('wgNamespaceNumber') === 6,  // File namespace
			value: 'फ़ाइलें'
		} );
	categories.append( {
			type: 'option',
			label: 'अन्य पृष्ठ हटाने हेतु चर्चा',
			selected: mw.config.get('wgNamespaceNumber') !== 0 && 
						mw.config.get('wgNamespaceNumber') !== 6 && 
						mw.config.get('wgNamespaceNumber') !== 10 && 
						mw.config.get('wgNamespaceNumber') !== 14,  // Other namespaces
			value: 'अन्य'
		} );
	form.append( {
			type: 'checkbox',
			list: [
				{
					label: 'यदि संभव हो तो पृष्ठ निर्माता को सूचित करें',
					value: 'notify',
					name: 'notify',
					tooltip: "यदि यह सक्षम है तो पृष्ठ निर्माता के वार्ता पृष्ठ पर एक सूचना साँचा जोड़ दिया जाएगा।",
					checked: true
				}
			]
		}
	);
	form.append( {
			type: 'field',
			label:'Work area',
			name: 'work_area'
		} );

	var previewlink = document.createElement( 'a' );
	$(previewlink).click(function(){
		Twinkle.xfd.callbacks.preview(result);  // |result| is defined below
	});
	previewlink.style.cursor = "pointer";
	previewlink.textContent = 'झलक देखें';
	form.append( { type: 'div', id: 'xfdpreview', label: [ previewlink ] } );
	form.append( { type: 'div', id: 'twinklexfd-previewbox', style: 'display: none' } );

	form.append( { type:'submit' } );

	var result = form.render();
	Window.setContent( result );
	Window.display();
	result.previewer = new Morebits.wiki.preview($(result).find('div#twinklexfd-previewbox').last()[0]);

	// We must init the controls
	var evt = document.createEvent( "Event" );
	evt.initEvent( 'change', true, true );
	result.category.dispatchEvent( evt );
};

Twinkle.xfd.callback.change_category = function twinklexfdCallbackChangeCategory(e) {
	var value = e.target.value;
	var form = e.target.form;
	var old_area = Morebits.quickForm.getElements(e.target.form, "work_area")[0];
	var work_area = null;

	var oldreasontextbox = form.getElementsByTagName('textarea')[0];
	var oldreason = (oldreasontextbox ? oldreasontextbox.value : '');

	var appendReasonBox = function twinklexfdAppendReasonBox() {
		work_area.append( {
			type: 'textarea',
			name: 'xfdreason',
			label: 'कारण: ',
			value: oldreason,
			tooltip: 'आप कारण में विकिपाठ का प्रयोग कर सकते हैं। ट्विंकल स्वचालित रूप से आपके हस्ताक्षर उपयुक्त स्थानों पर जोड़ देगा।'
		} );
	};

	form.previewer.closePreview();

	switch( value ) {
	case 'लेख':
		work_area = new Morebits.quickForm.element( {
				type: 'field',
				label: 'लेख हटाने हेतु चर्चा',
				name: 'work_area'
			} );
		appendReasonBox();
		work_area = work_area.render();
		old_area.parentNode.replaceChild( work_area, old_area );
		break;
	case 'श्रेणियाँ':
		work_area = new Morebits.quickForm.element( {
				type: 'field',
				label: 'श्रेणियाँ हटाने, विलय अथवा स्थानांतरित करने हेतु चर्चा',
				name: 'work_area'
			} );
		var cfd_category = work_area.append( {
				type: 'select',
				label: 'कृपया कार्य चुनें: ',
				name: 'xfdcat',
				event: function(e) {
					var value = e.target.value;
					var target = e.target.form.xfdtarget;
					// update enabled status
					if( value === 'हटाना' ) {
						target.disabled = true;
					} else {
						target.disabled = false;
					}
					// update label
					if( value === 'विलय' ) {
						target.previousSibling.textContent = "दूसरी श्रेणी का नाम: ";
					} else if( value === 'स्थानान्तरण' ) {
						target.previousSibling.textContent = "श्रेणी के लिये नया नाम: ";
					}
				}
			} );
		cfd_category.append( { type: 'option', label: 'हटाना', value: 'हटाना', selected: true } );
		cfd_category.append( { type: 'option', label: 'विलय', value: 'विलय' } );
		cfd_category.append( { type: 'option', label: 'स्थानान्तरण', value: 'स्थानान्तरण' } );

		work_area.append( {
				type: 'input',
				name: 'xfdtarget',
				label: 'श्रेणी का नाम: ',
				disabled: true,
				value: ''
			} );
		appendReasonBox();
		work_area = work_area.render();
		old_area.parentNode.replaceChild( work_area, old_area );
		break;
	case 'साँचे':
		work_area = new Morebits.quickForm.element( {
				type: 'field',
				label: 'साँचे हटाने हेतु चर्चा',
				name: 'work_area'
			} );
		appendReasonBox();
		work_area = work_area.render();
		old_area.parentNode.replaceChild( work_area, old_area );
		break;
	case 'फ़ाइलें':
		work_area = new Morebits.quickForm.element( {
				type: 'field',
				label: 'फ़ाइलें हटाने हेतु चर्चा',
				name: 'work_area'
			} );
		appendReasonBox();
		work_area = work_area.render();
		old_area.parentNode.replaceChild( work_area, old_area );
		break;
	case 'अन्य':
		work_area = new Morebits.quickForm.element( {
				type: 'field',
				label: 'अन्य पृष्ठ हटाने हेतु चर्चा',
				name: 'work_area'
			} );
		work_area.append( {
				type: 'checkbox',
				list: [
						{
							label: 'नामांकन साँचे को <noinclude> में डालें',
							value: 'noinclude',
							name: 'noinclude',
							tooltip: 'इससे नामांकन साँचे को &lt;noinclude&gt; में लपेट दिया जाएगा, जिससे नामांकन साँचा पृष्ठ के साथ ट्रान्सक्लूड नहीं होगा।'
						}
					]
		} );
		appendReasonBox();
		work_area = work_area.render();
		old_area.parentNode.replaceChild( work_area, old_area );
		break;
	default:
		work_area = new Morebits.quickForm.element( {
				type: 'field',
				label: 'Nothing for anything',
				name: 'work_area'
			} );
		work_area = work_area.render();
		old_area.parentNode.replaceChild( work_area, old_area );
		break;
	}

	form.notify.checked = true;
	form.notify.disabled = false;
};

Twinkle.xfd.callbacks = {
	getDiscussionWikitext: function(params) {
		var text = "";

		switch(params.xfdtype) {
			case 'लेख':
				text += "{{subst:हहेच लेख नामांकन|कारण=" + params.reason + "|पृष्ठ=" + mw.config.get('wgTitle') + "}}\n";
				break;
			case 'श्रेणियाँ':
				text += "{{subst:हहेच श्रेणी नामांकन|कारण=" + params.reason + "|पृष्ठ=" + mw.config.get('wgTitle') + "|प्रकार=" + params.type;
				switch (params.type) {
					case 'विलय':
						text += '|दूसरी श्रेणी=' + params.target;
						break;
					case 'स्थानान्तरण':
						text += '|नया नाम=' + params.target;
						break;
					case 'हटाना': //falls through
					default:
						break;
				}
				text += "}}\n";
				break;
			case 'साँचे':
				text += "{{subst:हहेच साँचा नामांकन|कारण=" + params.reason + "|पृष्ठ=" + mw.config.get('wgTitle') + "}}\n";
				break;
			case 'फ़ाइलें':
				text += "{{subst:हहेच फ़ाइल नामांकन|कारण=" + params.reason + "|पृष्ठ=" + mw.config.get('wgTitle') + "}}\n";
				break;
			case 'अन्य':
				text += "{{subst:हहेच अन्य नामांकन|कारण=" + params.reason + "|पृष्ठ=" + Morebits.pageNameNorm + "}}\n";
				break;
			default:
				break;
		}
		return text;
	},
	showPreview: function(form, params) {
		var templatetext = Twinkle.xfd.callbacks.getDiscussionWikitext(params);
		form.previewer.beginRender(templatetext, "Wikipedia:Null");
	},
	preview: function(form) {
		var templatetext;
		var params = {
			reason: form.xfdreason.value
		};
		if (form.xfdcat) {
			params.type = form.xfdcat.value;
		}
		if (form.xfdtarget) {
			params.target = form.xfdtarget.value;
		}
		params.xfdtype = form.category.value;
		Twinkle.xfd.callbacks.showPreview(form, params);
	},
	discussionPage: function(pageobj) {
		var text = pageobj.getPageText();
		var params = pageobj.getCallbackParameters();
		var editsummary = "[[" + mw.config.get('wgPageName') + "]] ";

		switch(params.xfdtype) {
			case 'लेख':
				editsummary += "लेख";
				break;
			case 'श्रेणियाँ':
				editsummary += "श्रेणी पृष्ठ को";
				switch (params.type) {
					case 'विलय':
						editsummary += 'विलय करने';
						break;
					case 'स्थानान्तरण':
						editsummary += 'स्थानांतरित करने';
						break;
					case 'हटाना': //falls through
					default:
						editsummary += 'हटाने';
						break;
				}
				editsummary += 'का नामांकन ';
				break;
			case 'साँचे':
				editsummary += "साँचे";
				break;
			case 'फ़ाइलें':
				editsummary += "फ़ाइल";
				break;
			case 'अन्य':
				editsummary += "पृष्ठ";
				break;
			default:
				break;
		}
		if(params.xfdtype !== 'श्रेणियाँ') {
			editsummary += " को हटाने का नामांकन ";
		}
		pageobj.setPageText(text + "\n\n"+ Twinkle.xfd.callbacks.getDiscussionWikitext(params));
		pageobj.setEditSummary(editsummary + Twinkle.getPref('summaryAd'));

		switch (Twinkle.getPref('xfdWatchDiscussion')) {
			case 'yes':
				pageobj.setWatchlist(true);
				break;
			case 'no':
				pageobj.setWatchlistFromPreferences(false);
				break;
			default:
				pageobj.setWatchlistFromPreferences(true);
				break;
		}
		pageobj.setCreateOption('recreate');
		pageobj.save();
		Twinkle.xfd.currentRationale = null;  // any errors from now on do not need to print the rationale, as it is safely saved on-wiki
	},
	afd: {
		// Tagging needs to happen before everything else: this means we can check if there is an AfD tag already on the page
		taggingArticle: function(pageobj) {
			var text = pageobj.getPageText();
			var params = pageobj.getCallbackParameters();
			var statelem = pageobj.getStatusElement();

			if (!pageobj.exists()) {
				statelem.error("लगता है पृष्ठ मौजूद नहीं है; शायद हटाया जा चुका है");
				return;
			}

			// Check for existing AfD tag, for the benefit of new page patrollers
			var textNoAfd = text.replace(/\{\{\s*हहेच लेख\s*(\|(?:\{\{[^{}]*\}\}|[^{}])*)?\}\}\s*/g, "");
			if (text !== textNoAfd) {
				if (confirm("इस लेख पर पहले से एक नामांकन साँचा मौजूद है।  \nवर्तमान नामांकन साँचे को हटाकर नया नामांकन साँचा लगाने के लिये OK दबाएँ। नया नामांकन ख़ारिज करने के लिये Cancel दबाएँ।")) {
					text = textNoAfd;
				} else {
					statelem.error("लेख पहले से हटाने के लिये नामांकित है, और आपका नामांकन ख़ारिज कर दिया गया है।");
					window.location.reload();
					return;
				}
			}

			// Now we know we want to go ahead with it, trigger the other AJAX requests

			// Mark the page as patrolled, if wanted
			if (Twinkle.getPref('markXfdPagesAsPatrolled')) {
				pageobj.patrol();
			}

			// Starting discussion page
			var wikipedia_page = new Morebits.wiki.page('विकिपीडिया:पृष्ठ हटाने हेतु चर्चा/लेख/' + mw.config.get('wgTitle'), "नामांकन चर्चा पृष्ठ पर नामांकन जोड़ा जा रहा है");
			wikipedia_page.setCallbackParameters(params);
			wikipedia_page.load(Twinkle.xfd.callbacks.discussionPage);

			// Notification to first contributor
			if (params.usertalk) {
				var thispage = new Morebits.wiki.page(mw.config.get('wgPageName'));
				thispage.setCallbackParameters(params);
				thispage.lookupCreator(Twinkle.xfd.callbacks.afd.userNotification);
			}

			// Remove some tags that should always be removed on AfD.
			text = text.replace(/\{\{\s*(New unreviewed article|नया असमीक्षित लेख|Userspace draft)\s*(\|(?:\{\{[^{}]*\}\}|[^{}])*)?\}\}\s*/ig, "");
			// Then, test if there are speedy deletion-related templates on the article.
			var textNoSd = text.replace(/\{\{\s*((db|शीह|हटाएँ)(-[a-zA-Z0-9\u0900-\u097F]*)?|delete)\s*(\|(?:\{\{[^{}]*\}\}|[^{}])*)?\}\}\s*/ig, "");
			if (text !== textNoSd && confirm("इस लेख पर शीघ्र हटाने का नामांकन पाया गया है। क्या उस नामांकन को हटाया जाए?")) {
				text = textNoSd;
			}

			pageobj.setPageText('{{हहेच लेख|कारण=' + params.reason + "}}\n" + text);
			pageobj.setEditSummary("हटाने हेतु चर्चा के लिये नामांकन; देखें [[वि:पृष्ठ हटाने हेतु चर्चा/लेख/" + mw.config.get('wgTitle') + "|चर्चा पृष्ठ]]।" + Twinkle.getPref('summaryAd'));
			switch (Twinkle.getPref('xfdWatchPage')) {
				case 'yes':
					pageobj.setWatchlist(true);
					break;
				case 'no':
					pageobj.setWatchlistFromPreferences(false);
					break;
				default:
					pageobj.setWatchlistFromPreferences(true);
					break;
			}
			pageobj.setCreateOption('nocreate');
			pageobj.save();
		},
		userNotification: function(pageobj) {
			var params = pageobj.getCallbackParameters();
			var initialContrib = pageobj.getCreator();
			// Disallow warning yourself
			if (initialContrib === mw.config.get('wgUserName')) {
				pageobj.getStatusElement().warn("आपको सूचित किया जाता है कि इस पृष्ठ का निर्माण आपने (" + initialContrib + ") किया था। आपके वार्ता पृष्ठ पर सूचना नहीं जोड़ी जाएगी।");
				return;
			}
			var usertalkpage = new Morebits.wiki.page('सदस्य वार्ता:' + initialContrib, "पृष्ठ निर्माता को सूचित किया जा रहा है (" + initialContrib + ")");
			var notifytext = "\n{{subst:हहेच लेख सूचना|पृष्ठ=" + mw.config.get('wgTitle') + "|कारण=" + params.reason + "}}~~~~";
			usertalkpage.setAppendText(notifytext);
			usertalkpage.setEditSummary("सूचना: [[" + Morebits.pageNameNorm + "]] को हटाने हेतु चर्चा के लिये नामांकित किया गया है।" + Twinkle.getPref('summaryAd'));
			usertalkpage.setCreateOption('recreate');
			switch (Twinkle.getPref('xfdWatchUser')) {
				case 'yes':
					usertalkpage.setWatchlist(true);
					break;
				case 'no':
					usertalkpage.setWatchlistFromPreferences(false);
					break;
				default:
					usertalkpage.setWatchlistFromPreferences(true);
					break;
			}
			usertalkpage.setFollowRedirect(true);
			usertalkpage.append();
		}
	},


	cfd: {
		taggingCategory: function(pageobj) {
			var text = pageobj.getPageText();
			var params = pageobj.getCallbackParameters();

			// Mark the page as patrolled, if wanted
			if (Twinkle.getPref('markXfdPagesAsPatrolled')) {
				pageobj.patrol();
			}

			var added_data = "{{हहेच श्रेणी|प्रकार=" + params.type + '|कारण=' + params.reason;
			var editsummary = "";
			switch( params.type ) {
			case 'हटाना':
				editsummary += "हटाने";
				break;
			case 'विलय':
				added_data += '|दूसरी श्रेणी=' + params.target;
				editsummary += "विलय";
				break;
			case 'स्थानान्तरण':
				added_data += '|नया नाम=' + params.target;
				editsummary += "स्थानान्तरण";
				break;
			default:
				alert("twinklexfd in taggingCategory(): unknown CFD action");
				break;
			}
			
			added_data += '}}';
			editsummary+= 'हेतु श्रेणी का नामांकन, देखें [[वि:पृष्ठ हटाने हेतु चर्चा/श्रेणियाँ/' + mw.config.get('wgTitle') + '|चर्चा पृष्ठ]]।';

			pageobj.setPageText(added_data + "\n" + text);
			pageobj.setEditSummary(editsummary + Twinkle.getPref('summaryAd'));
			switch (Twinkle.getPref('xfdWatchPage')) {
				case 'yes':
					pageobj.setWatchlist(true);
					break;
				case 'no':
					pageobj.setWatchlistFromPreferences(false);
					break;
				default:
					pageobj.setWatchlistFromPreferences(true);
					break;
			}
			pageobj.setCreateOption('recreate');  // since categories can be populated without an actual page at that title
			pageobj.save();
		},
		userNotification: function(pageobj) {
			var initialContrib = pageobj.getCreator();
			var params = pageobj.getCallbackParameters();
			// Disallow warning yourself
			if (initialContrib === mw.config.get('wgUserName')) {
				pageobj.getStatusElement().warn("आपको सूचित किया जाता है कि इस पृष्ठ का निर्माण आपने (" + initialContrib + ") किया था। आपके वार्ता पृष्ठ पर सूचना नहीं जोड़ी जाएगी।");
				return;
			}
			var usertalkpage = new Morebits.wiki.page('सदस्य वार्ता:' + initialContrib, "पृष्ठ निर्माता को सूचित किया जा रहा है (" + initialContrib + ")");
			var notifytext = "\n{{subst:हहेच श्रेणी सूचना|पृष्ठ=" + mw.config.get('wgTitle') + "|प्रकार=" + params.type + '|कारण=' + params.reason;
			switch (params.type) {
				case 'विलय':
					notifytext += '|दूसरी श्रेणी=' + params.target;
					break;
				case 'स्थानान्तरण':
					notifytext += '|नया नाम=' + params.target;
					break;
				default:
					break;
			}
			
			notifytext += "}}~~~~";
			
			var editsummary = 'सूचना:' + mw.config.get('wgPageName') + "]] को";
			editsummary += (params.type === 'हटाना') ? 'हटाने' : params.type;
			editsummary+= 'हेतु चर्चा के लिये नामांकित किया गया है।';

			usertalkpage.setAppendText(notifytext);
			usertalkpage.setEditSummary(editsummary + Twinkle.getPref('summaryAd'));
			usertalkpage.setCreateOption('recreate');
			switch (Twinkle.getPref('xfdWatchUser')) {
				case 'yes':
					usertalkpage.setWatchlist(true);
					break;
				case 'no':
					usertalkpage.setWatchlistFromPreferences(false);
					break;
				default:
					usertalkpage.setWatchlistFromPreferences(true);
					break;
			}
			usertalkpage.setFollowRedirect(true);
			usertalkpage.append();
		}
	},


	tfd: {
		taggingTemplate: function(pageobj) {
			var text = pageobj.getPageText();
			var params = pageobj.getCallbackParameters();

			// Mark the page as patrolled, if wanted
			if (Twinkle.getPref('markXfdPagesAsPatrolled')) {
				pageobj.patrol();
			}

			pageobj.setPageText((params.noinclude ? "<noinclude>{{हहेच साँचा" : "{{हहेच साँचा") + '|कारण=' + params.reason + (params.noinclude ? "}}</noinclude>" : "}}\n") + text);
			pageobj.setEditSummary("हटाने हेतु चर्चा के लिये नामांकन; देखें [[वि:पृष्ठ हटाने हेतु चर्चा/साँचे/" + mw.config.get('wgTitle') + "|नामांकन पृष्ठ]]।" + Twinkle.getPref('summaryAd'));
			switch (Twinkle.getPref('xfdWatchPage')) {
				case 'yes':
					pageobj.setWatchlist(true);
					break;
				case 'no':
					pageobj.setWatchlistFromPreferences(false);
					break;
				default:
					pageobj.setWatchlistFromPreferences(true);
					break;
			}
			pageobj.setCreateOption('nocreate');
			pageobj.save();
		},
		userNotification: function(pageobj) {
			var initialContrib = pageobj.getCreator();
			var params = pageobj.getCallbackParameters();
			if (initialContrib === mw.config.get('wgUserName')) {
				pageobj.getStatusElement().warn("आपको सूचित किया जाता है कि इस पृष्ठ का निर्माण आपने (" + initialContrib + ") किया था। आपके वार्ता पृष्ठ पर सूचना नहीं जोड़ी जाएगी।");
				return;
			}
			var usertalkpage = new Morebits.wiki.page('सदस्य वार्ता:' + initialContrib, "पृष्ठ निर्माता को सूचित किया जा रहा है (" + initialContrib + ")");
			var notifytext = "\n{{subst:हहेच साँचा सूचना|पृष्ठ=" + mw.config.get('wgTitle') + '|कारण=' + params.reason + "}}~~~~";

			usertalkpage.setAppendText(notifytext);
			usertalkpage.setEditSummary("सूचना: [[" + mw.config.get('wgPageName') + "]] को हटाने हेतु चर्चा के लिये नामांकित किया गया है।" + Twinkle.getPref('summaryAd'));
			usertalkpage.setCreateOption('recreate');
			switch (Twinkle.getPref('xfdWatchUser')) {
				case 'yes':
					usertalkpage.setWatchlist(true);
					break;
				case 'no':
					usertalkpage.setWatchlistFromPreferences(false);
					break;
				default:
					usertalkpage.setWatchlistFromPreferences(true);
					break;
			}
			usertalkpage.setFollowRedirect(true);
			usertalkpage.append();
		}
	},


	ffd: {
		taggingImage: function(pageobj) {
			var text = pageobj.getPageText();
			var params = pageobj.getCallbackParameters();

			// Mark the page as patrolled, if wanted
			if (Twinkle.getPref('markXfdPagesAsPatrolled')) {
				pageobj.patrol();
			}

			text = text.replace(/\{\{(mtc|(copy |move )?to ?commons|move to wikimedia commons|copy to wikimedia commons)[^}]*\}\}/gi, "");

			pageobj.setPageText('{{हहेच फ़ाइल|कारण=' + params.reason + "}}\n" + text);
			pageobj.setEditSummary("हटाने हेतु चर्चा के लिये नामांकन; देखें [[वि:पृष्ठ हटाने हेतु चर्चा/फ़ाइलें/" + mw.config.get('wgTitle') + "|नामांकन पृष्ठ]]।" + Twinkle.getPref('summaryAd'));
			switch (Twinkle.getPref('xfdWatchPage')) {
				case 'yes':
					pageobj.setWatchlist(true);
					break;
				case 'no':
					pageobj.setWatchlistFromPreferences(false);
					break;
				default:
					pageobj.setWatchlistFromPreferences(true);
					break;
			}
			pageobj.setCreateOption('recreate');  // it might be possible for a file to exist without a description page
			pageobj.save();
		},
		discussionPage: function(pageobj) {
			var text = pageobj.getPageText();
			var params = pageobj.getCallbackParameters();

			pageobj.setPageText(text + "\n\n{{subst:हहेच फ़ाइल नामांकन|कारण=" + params.reason + "|पृष्ठ=" + mw.config.get('wgTitle') + "}}\n");
			pageobj.setEditSummary("[[" + Morebits.pageNameNorm + "]] फ़ाइल को हटाने का नामांकन " + Twinkle.getPref('summaryAd'));
			switch (Twinkle.getPref('xfdWatchDiscussion')) {
				case 'yes':
					pageobj.setWatchlist(true);
					break;
				case 'no':
					pageobj.setWatchlistFromPreferences(false);
					break;
				default:
					pageobj.setWatchlistFromPreferences(true);
					break;
			}
			pageobj.setCreateOption('recreate');
			pageobj.save();
			Twinkle.xfd.currentRationale = null;  // any errors from now on do not need to print the rationale, as it is safely saved on-wiki
		},
		userNotification: function(pageobj) {
			var initialContrib = pageobj.getCreator();
			var params = pageobj.getCallbackParameters();
			if (initialContrib === mw.config.get('wgUserName')) {
				pageobj.getStatusElement().warn("आपको सूचित किया जाता है कि इस पृष्ठ का निर्माण आपने (" + initialContrib + ") किया था। आपके वार्ता पृष्ठ पर सूचना नहीं जोड़ी जाएगी।");
				return;
			}
			var usertalkpage = new Morebits.wiki.page('सदस्य वार्ता:' + initialContrib, "पृष्ठ निर्माता को सूचित किया जा रहा है (" + initialContrib + ")");
			var notifytext = "\n{{subst:हहेच फ़ाइल सूचना|पृष्ठ=" + mw.config.get('wgTitle') + '|कारण=' + params.reason + "}}~~~~";

			usertalkpage.setAppendText(notifytext);
			usertalkpage.setEditSummary("सूचना: [[" + Morebits.pageNameNorm + "]] को हटाने हेतु चर्चा के लिये नामांकित किया गया है।" + Twinkle.getPref('summaryAd'));
			usertalkpage.setCreateOption('recreate');
			switch (Twinkle.getPref('xfdWatchUser')) {
				case 'yes':
					usertalkpage.setWatchlist(true);
					break;
				case 'no':
					usertalkpage.setWatchlistFromPreferences(false);
					break;
				default:
					usertalkpage.setWatchlistFromPreferences(true);
					break;
			}
			usertalkpage.setFollowRedirect(true);
			usertalkpage.append();
		}
	},


	mfd: {
		taggingPage: function(pageobj) {
			var text = pageobj.getPageText();
			var params = pageobj.getCallbackParameters();

			// Mark the page as patrolled, if wanted
			if (Twinkle.getPref('markXfdPagesAsPatrolled')) {
				pageobj.patrol();
			}

			pageobj.setPageText((params.noinclude ? "<noinclude>{{हहेच अन्य" : "{{हहेच अन्य") + '|कारण=' + params.reason + (params.noinclude ? "}}</noinclude>" : "}}\n") + text);
			pageobj.setEditSummary("हटाने हेतु चर्चा के लिये नामांकन; देखें [[वि:पृष्ठ हटाने हेतु चर्चा/अन्य/" + Morebits.pageNameNorm + "|नामांकन पृष्ठ]]।" + Twinkle.getPref('summaryAd'));
			switch (Twinkle.getPref('xfdWatchPage')) {
				case 'yes':
					pageobj.setWatchlist(true);
					break;
				case 'no':
					pageobj.setWatchlistFromPreferences(false);
					break;
				default:
					pageobj.setWatchlistFromPreferences(true);
					break;
			}
			pageobj.setCreateOption('recreate');  // it might be possible for a file to exist without a description page
			pageobj.save();
		},
		userNotification: function(pageobj) {
			var initialContrib = pageobj.getCreator();
			var params = pageobj.getCallbackParameters();
			if (initialContrib === mw.config.get('wgUserName')) {
				pageobj.getStatusElement().warn("आपको सूचित किया जाता है कि इस पृष्ठ का निर्माण आपने (" + initialContrib + ") किया था। आपके वार्ता पृष्ठ पर सूचना नहीं जोड़ी जाएगी।");
				return;
			}
			var usertalkpage = new Morebits.wiki.page('सदस्य वार्ता:' + initialContrib, "पृष्ठ निर्माता को सूचित किया जा रहा है (" + initialContrib + ")");
			var notifytext = "\n{{subst:हहेच अन्य सूचना|पृष्ठ=" + Morebits.pageNameNorm + '|कारण=' + params.reason + "}}~~~~";

			usertalkpage.setAppendText(notifytext);
			usertalkpage.setEditSummary("सूचना: [[" + Morebits.pageNameNorm + "]] को हटाने हेतु चर्चा के लिये नामांकित किया गया है।" + Twinkle.getPref('summaryAd'));
			usertalkpage.setCreateOption('recreate');
			switch (Twinkle.getPref('xfdWatchUser')) {
				case 'yes':
					usertalkpage.setWatchlist(true);
					break;
				case 'no':
					usertalkpage.setWatchlistFromPreferences(false);
					break;
				default:
					usertalkpage.setWatchlistFromPreferences(true);
					break;
			}
			usertalkpage.setFollowRedirect(true);
			usertalkpage.append();
		}
	}
};

Twinkle.xfd.callback.evaluate = function(e) {
	var type = e.target.category.value;
	var usertalk = e.target.notify.checked;
	var reason = Morebits.string.formatReasonText(e.target.xfdreason.value);
	var xfdtarget, noinclude, xfdcat;
	if( type === "श्रेणियाँ" ) {
		xfdtarget = e.target.xfdtarget.value;
		xfdcat = e.target.xfdcat.value;
	}
	if( type === "अन्य" ) {
		noinclude = e.target.noinclude.checked;
	}
	else if (type === 'साँचे' ) {
		noinclude = true;
	}

	Morebits.simpleWindow.setButtonsEnabled( false );
	Morebits.status.init( e.target );

	Twinkle.xfd.currentRationale = reason;
	Morebits.status.onError(Twinkle.xfd.printRationale);

	if( !type ) {
		Morebits.status.error( 'Error', 'चर्चा पृष्ठ का नाम नहीं मिला!' );
		return;
	}

	var query, wikipedia_page, wikipedia_api, nompage, thispage, params;
	var date = new Date();
	switch( type ) {

	case 'लेख':
//		Morebits.wiki.addCheckpoint();
		params = { usertalk: usertalk, reason: reason, xfdtype: type };

		Morebits.wiki.actionCompleted.redirect = 'वि:पृष्ठ हटाने हेतु चर्चा/लेख/' + mw.config.get('wgTitle');
		Morebits.wiki.actionCompleted.notice = "नामांकन सम्पूर्ण, चर्चा पृष्ठ खोला जा रहा है";

		wikipedia_page = new Morebits.wiki.page(mw.config.get('wgPageName'), "लेख पर नामांकन साँचा जोड़ा जा रहा है");
		wikipedia_page.setFollowRedirect(true);  // should never be needed, but if the article is moved, we would want to follow the redirect
		wikipedia_page.setCallbackParameters(params);
		wikipedia_page.load(Twinkle.xfd.callbacks.afd.taggingArticle);

//		Morebits.wiki.removeCheckpoint();
		break;

	case 'श्रेणियाँ':
		Morebits.wiki.addCheckpoint();

		if( xfdtarget ) {
			xfdtarget = xfdtarget.replace( /^\:?(Category|श्रेणी)\:/i, '' );
		} else {
			xfdtarget = '';
		}

		params = { reason: reason, target: xfdtarget, type: xfdcat, xfdtype: type };

		// Tagging category
		wikipedia_page = new Morebits.wiki.page(mw.config.get('wgPageName'), "श्रेणी पृष्ठ पर नामांकन साँचा जोड़ा जा रहा है");
		wikipedia_page.setCallbackParameters(params);
		wikipedia_page.load(Twinkle.xfd.callbacks.cfd.taggingCategory);

		// Starting discussion page
		nompage = new Morebits.wiki.page('वि:पृष्ठ हटाने हेतु चर्चा/श्रेणियाँ/' + mw.config.get('wgTitle'), "नामांकन चर्चा पृष्ठ पर नामांकन जोड़ा जा रहा है");
		nompage.setCallbackParameters(params);
		nompage.load(Twinkle.xfd.callbacks.discussionPage);

		// Updating data for the action completed event
		Morebits.wiki.actionCompleted.redirect = 'वि:पृष्ठ हटाने हेतु चर्चा/श्रेणियाँ/' + mw.config.get('wgTitle');
		Morebits.wiki.actionCompleted.notice = "नामांकन सम्पूर्ण, चर्चा पृष्ठ खोला जा रहा है";

		// Notification to first contributor
		if (usertalk) {
			thispage = new Morebits.wiki.page(mw.config.get('wgPageName'));
			thispage.setCallbackParameters(params);
			thispage.lookupCreator(Twinkle.xfd.callbacks.cfd.userNotification);
		}

		Morebits.wiki.removeCheckpoint();
		break;

	case 'साँचे': // TFD
		Morebits.wiki.addCheckpoint();

		params = { reason: reason, noinclude: noinclude, xfdtype: type };
		// Tagging template
		wikipedia_page = new Morebits.wiki.page(mw.config.get('wgPageName'), "साँचे पर नामांकन साँचा जोड़ा जा रहा है");
		wikipedia_page.setFollowRedirect(true);  // should never be needed, but if the page is moved, we would want to follow the redirect
		wikipedia_page.setCallbackParameters(params);
		wikipedia_page.load(Twinkle.xfd.callbacks.tfd.taggingTemplate);

		// Starting discussion page
		nompage = new Morebits.wiki.page('वि:पृष्ठ हटाने हेतु चर्चा/साँचे/' + mw.config.get('wgTitle'), "नामांकन चर्चा पृष्ठ पर नामांकन जोड़ा जा रहा है");
		nompage.setCallbackParameters(params);
		nompage.load(Twinkle.xfd.callbacks.discussionPage);

		// Updating data for the action completed event
		Morebits.wiki.actionCompleted.redirect =  'वि:पृष्ठ हटाने हेतु चर्चा/साँचे/' + mw.config.get('wgTitle');
		Morebits.wiki.actionCompleted.notice = "नामांकन सम्पूर्ण, चर्चा पृष्ठ खोला जा रहा है";

		// Notification to first contributor
		if (usertalk) {
			thispage = new Morebits.wiki.page(mw.config.get('wgPageName'));
			thispage.setCallbackParameters(params);
			thispage.lookupCreator(Twinkle.xfd.callbacks.tfd.userNotification);
		}

		Morebits.wiki.removeCheckpoint();
		break;

	case 'फ़ाइलें': // FFD
		Morebits.wiki.addCheckpoint();

		params = { reason: reason, xfdtype: type };
		// Tagging file
		wikipedia_page = new Morebits.wiki.page(mw.config.get('wgPageName'), "फ़ाइल विवरण पृष्ठ पर नामांकन साँचा जोड़ा जा रहा है");
		wikipedia_page.setFollowRedirect(true);
		wikipedia_page.setCallbackParameters(params);
		wikipedia_page.load(Twinkle.xfd.callbacks.ffd.taggingImage);

		// Adding discussion
		nompage = new Morebits.wiki.page('वि:पृष्ठ हटाने हेतु चर्चा/फ़ाइलें/' + mw.config.get('wgTitle'), "नामांकन चर्चा पृष्ठ पर नामांकन जोड़ा जा रहा है");
		nompage.setCallbackParameters(params);
		nompage.load(Twinkle.xfd.callbacks.discussionPage);

		// Updating data for the action completed event
		Morebits.wiki.actionCompleted.redirect = 'वि:पृष्ठ हटाने हेतु चर्चा/फ़ाइलें/' + mw.config.get('wgTitle');
		Morebits.wiki.actionCompleted.notice = "नामांकन सम्पूर्ण, चर्चा पृष्ठ खोला जा रहा है";

		// Notification to first contributor
		if (usertalk) {
			thispage = new Morebits.wiki.page(mw.config.get('wgPageName'));
			thispage.setCallbackParameters(params);
			thispage.lookupCreator(Twinkle.xfd.callbacks.ffd.userNotification);
		}

		Morebits.wiki.removeCheckpoint();
		break;

	case 'अन्य': // MFD
		Morebits.wiki.addCheckpoint();

		params = { noinclude: noinclude, reason: reason, xfdtype: type };
		// Tagging file
		wikipedia_page = new Morebits.wiki.page(mw.config.get('wgPageName'), "पृष्ठ पर नामांकन साँचा जोड़ा जा रहा है");
		wikipedia_page.setFollowRedirect(true);
		wikipedia_page.setCallbackParameters(params);
		wikipedia_page.load(Twinkle.xfd.callbacks.mfd.taggingPage);

		// Adding discussion
		nompage = new Morebits.wiki.page('वि:पृष्ठ हटाने हेतु चर्चा/अन्य/' + mw.config.get('wgPageName'), "नामांकन चर्चा पृष्ठ पर नामांकन जोड़ा जा रहा है");
		nompage.setCallbackParameters(params);
		nompage.load(Twinkle.xfd.callbacks.discussionPage);

		// Updating data for the action completed event
		Morebits.wiki.actionCompleted.redirect = 'वि:पृष्ठ हटाने हेतु चर्चा/अन्य/' + mw.config.get('wgPageName');
		Morebits.wiki.actionCompleted.notice = "नामांकन सम्पूर्ण, चर्चा पृष्ठ खोला जा रहा है";

		// Notification to first contributor
		if (usertalk) {
			thispage = new Morebits.wiki.page(mw.config.get('wgPageName'));
			thispage.setCallbackParameters(params);
			thispage.lookupCreator(Twinkle.xfd.callbacks.mfd.userNotification);
		}

		Morebits.wiki.removeCheckpoint();
		break;

	default:
		alert("twinklexfd: unknown XFD discussion venue");
		break;
	}
};
})(jQuery);


//</nowiki>
