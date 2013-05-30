(function($){


/*
 ****************************************
 *** friendlytalkback.js: Talkback module
 ****************************************
 * Mode of invocation:     Tab ("TB")
 * Active on:              Existing user talk pages
 * Config directives in:   FriendlyConfig
 */

Twinkle.talkback = function friendlytalkback() {
	if( mw.config.get('wgNamespaceNumber') === 3 ) {
		var username = mw.config.get('wgTitle').split( '/' )[0].replace( /\"/, "\\\""); // only first part before any slashes
		$(twAddPortletLink("#", "सन्देश", "friendly-talkback", "सरल सन्देश", "")).click(function() { Twinkle.talkback.callback(username); });
	}
};

Twinkle.talkback.callback = function friendlytalkbackCallback( uid ) {
	if( uid === mw.config.get('wgUserName') ){
		alert( 'Is it really so bad that you\'re talking back to yourself?' );
		return;
	}

	var Window = new Morebits.simpleWindow( 600, 350 );
	Window.setTitle( "सन्देश" );
	Window.setScriptName( "Twinkle" );
	Window.addFooterLink( "{{सन्देश}} पर जानकारी", "साँचा:सन्देश" );
	Window.addFooterLink( "Twinkle help", "WP:TW/DOC#talkback" );

	var form = new Morebits.quickForm( Twinkle.talkback.callback.evaluate );

	form.append( { type: 'radio', name: 'tbtarget',
				list: [ {
						label: 'मेरे वार्ता पृष्ठ पर',
						value: 'mytalk',
						checked: 'true' },
					{
						label: 'किसी अन्य सदस्य के वार्ता पृष्ठ पर',
						value: 'usertalk' },
					{
						label: 'प्रबंधक सूचनापट',
						value: 'an' },
					{
						label: 'किसी अन्य पृष्ठ पर',
						value: 'other' } ],
				event: Twinkle.talkback.callback.change_target
			} );

	form.append( {
			type: 'field',
			label: 'Work area',
			name: 'work_area'
		} );

	form.append( { type:'submit' } );

	var result = form.render();
	Window.setContent( result );
	Window.display();

	// We must init the
	var evt = document.createEvent( "Event" );
	evt.initEvent( 'change', true, true );
	result.tbtarget[0].dispatchEvent( evt );
};

Twinkle.talkback.prev_page = '';
Twinkle.talkback.prev_section = '';
Twinkle.talkback.prev_message = '';

Twinkle.talkback.callback.change_target = function friendlytagCallbackChangeTarget(e) {
	var value = e.target.values;
	var root = e.target.form;
	var old_area;

	if(root.section) {
		Twinkle.talkback.prev_section = root.section.value;
	}
	if(root.message) {
		Twinkle.talkback.prev_message = root.message.value;
	}
	if(root.page) {
		Twinkle.talkback.prev_page = root.page.value;
	}

	for( var i = 0; i < root.childNodes.length; ++i ) {
		var node = root.childNodes[i];
		if (node instanceof Element && node.getAttribute( 'name' ) === 'work_area' ) {
			old_area = node;
			break;
		}
	}
	var work_area = new Morebits.quickForm.element( { 
			type: 'field',
			label: 'सन्देश जानकारी',
			name: 'work_area'
		} );

	switch( value ) {
		case 'mytalk':
			/* falls through */
		default:
			work_area.append( { 
					type:'input',
					name:'section',
					label:'सम्बंधित अनुभाग (वैकल्पिक)',
					tooltip:'आपके वार्ता पन्ने के उस अनुभाग का नाम जहाँ आपने सन्देश छोड़ा है। अनुभाग की जगह सिर्फ़ वार्ता पन्ने की कड़ी छोड़ने के लिये खाली छोड़ दें।',
					value: Twinkle.talkback.prev_section
				} );
			break;
		case 'usertalk':
			work_area.append( { 
					type:'input',
					name:'page',
					label:'सदस्य',
					tooltip:'उस सदस्य का नाम जिसके वार्ता पन्ने पर आपने सन्देश छोड़ा है।',
					value: Twinkle.talkback.prev_page
				} );
			
			work_area.append( { 
					type:'input',
					name:'section',
					label:'सम्बंधित अनुभाग (वैकल्पिक)',
					tooltip:'उस अनुभाग का नाम जहाँ आपने सन्देश छोड़ा है। अनुभाग की जगह सिर्फ़ वार्ता पन्ने की कड़ी छोड़ने के लिये खाली छोड़ दें।',
					value: Twinkle.talkback.prev_section
				} );
			break;
		case 'an':
			work_area.append( {
					type:'input',
					name:'section',
					label:'सम्बंधित अनुभाग (वैकल्पिक)',
					tooltip:'उस अनुभाग का नाम जहाँ आपने सन्देश छोड़ा है। अनुभाग की जगह सिर्फ़ सूचनापट की कड़ी छोड़ने के लिये खाली छोड़ दें।',
					value: Twinkle.talkback.prev_section
				} );
			break;
		case 'other':
			work_area.append( { 
					type:'input',
					name:'page',
					label:'पन्ने का पूरा नाम',
					tooltip:'उस पन्ने का पूरा नाम जिस पर आपने सन्देश छोड़ा है। उदहारण: "विकिपीडिया:चौपाल"।',
					value: Twinkle.talkback.prev_page
				} );
			
			work_area.append( { 
					type:'input',
					name:'section',
					label:'सम्बंधित अनुभाग (वैकल्पिक)',
					tooltip:'उस अनुभाग का नाम जहाँ आपने सन्देश छोड़ा है। अनुभाग की जगह सिर्फ़ वार्ता पन्ने की कड़ी छोड़ने के लिये खाली छोड़ दें।',
					value: Twinkle.talkback.prev_section
				} );
			break;
	}

	if (value !== "an") {
		work_area.append( { type:'textarea', label:'अतिरिक्त सन्देश (वैकल्पिक):', name:'message', tooltip:'कोई सन्देश जो आप सन्देश साँचे के बाद छोड़ना चाहेंगे।' } );
	}

	work_area = work_area.render();
	root.replaceChild( work_area, old_area );
	if (root.message) {
		root.message.value = Twinkle.talkback.prev_message;
	}
};

Twinkle.talkback.callback.evaluate = function friendlytalkbackCallbackEvaluate(e) {
	var tbtarget = e.target.getChecked( 'tbtarget' )[0];
	var page = null;
	var section = e.target.section.value;
	if( tbtarget === 'usertalk' || tbtarget === 'other' ) {
		page = e.target.page.value;
		
		if( tbtarget === 'usertalk' ) {
			if( !page ) {
				alert( 'आपको उस सदस्य का नाम बताना होगा जिसके वार्ता पन्ने पर आपने सन्देश छोड़ा है।' );
				return;
			}
		} else {
			if( !page ) {
				alert( 'यदि आपका सन्देश सदस्य वार्ता पन्ने की जगह किसी और पन्ने पर है तो आपको उस पन्ने का पूरा नाम बताना होगा।' );
				return;
			}
		}
	} else if (tbtarget === "an") {
		page = 'विकिपीडिया:प्रबंधक सूचनापट';
	}

	var message;
	if (e.target.message) {
		message = e.target.message.value;
	}

	Morebits.simpleWindow.setButtonsEnabled( false );
	Morebits.status.init( e.target );

	Morebits.wiki.actionCompleted.redirect = mw.config.get('wgPageName');
	Morebits.wiki.actionCompleted.notice = "सन्देश दे दिया, वार्ता पन्ना कुछ ही क्षणों में रीलोड होगा";

	var talkpage = new Morebits.wiki.page(mw.config.get('wgPageName'), "सन्देश जोड़ा जा रहा है");
	var tbPageName = (tbtarget === 'mytalk') ? mw.config.get('wgUserName') : page;

	var text;
	if ( tbtarget === "an" ) {
		text = "\n\n{{subst:ANI-notice|thread=";
		text += section + "|noticeboard=" + tbPageName + "}} --~~~~";

		talkpage.setEditSummary("प्रबंधक सूचनापट पर चर्चा का नोटिस" + Twinkle.getPref('summaryAd'));
	} else {
		//clean talkback heading: strip section header markers, were erroneously suggested in the documentation
		text = '\n\n==' + Twinkle.getFriendlyPref('talkbackHeading').replace(/^\s*=+\s*(.*?)\s*=+$\s*/, "$1") + '==\n\n{{सन्देश|';
		text += tbPageName;

			if( section ) {
				text += '|' + section;
			}
	
			text += '|ts=~~~~~}}';
	
			if( message ) {
				text += '\n' + message + '  ~~~~';
			} else if( Twinkle.getFriendlyPref('insertTalkbackSignature') ) {
				text += '\n~~~~';
		}
	
		talkpage.setEditSummary("सन्देश [[" + (tbtarget === 'other' ? '' : 'सदस्य वार्ता:') + tbPageName +
			(section ? ('#' + section) : '') + "]] पर" + Twinkle.getPref('summaryAd'));
	}

	talkpage.setAppendText(text);
	talkpage.setCreateOption('recreate');
	talkpage.setMinorEdit(Twinkle.getFriendlyPref('markTalkbackAsMinor'));
	talkpage.setFollowRedirect(true);
	talkpage.append();
};
})(jQuery);
