/*
 ****************************************
 *** friendlywelcome.js: Welcome module
 ****************************************
 * Mode of invocation:     Tab ("Wel"), or from links on diff pages
 * Active on:              Existing user talk pages, diff pages
 * Config directives in:   FriendlyConfig
 */

Twinkle.welcome = function friendlywelcome() {
	if( Morebits.queryString.exists( 'friendlywelcome' ) ) {
		if( Morebits.queryString.get( 'friendlywelcome' ) === 'auto' ) {
			Twinkle.welcome.auto();
		} else {
			Twinkle.welcome.semiauto();
		}
	} else {
		Twinkle.welcome.normal();
	}
};

Twinkle.welcome.auto = function() {
	if( Morebits.queryString.get( 'action' ) !== 'edit' ) {
		// userpage not empty, aborting auto-welcome
		return;
	}

	Twinkle.welcome.welcomeUser();
};

Twinkle.welcome.semiauto = function() {
	Twinkle.welcome.callback( mw.config.get( 'wgTitle' ).split( '/' )[0].replace( /\"/, "\\\"") );
};

Twinkle.welcome.normal = function() {
	if( Morebits.queryString.exists( 'diff' ) ) {
		// check whether the contributors' talk pages exist yet
		var $oList = $("#mw-diff-otitle2").find("span.mw-usertoollinks a.new:contains(talk)").first();
		var $nList = $("#mw-diff-ntitle2").find("span.mw-usertoollinks a.new:contains(talk)").first();

		if( $oList.length > 0 || $nList.length > 0 ) {
			var spanTag = function( color, content ) {
				var span = document.createElement( 'span' );
				span.style.color = color;
				span.appendChild( document.createTextNode( content ) );
				return span;
			};

			var welcomeNode = document.createElement('strong');
			var welcomeLink = document.createElement('a');
			welcomeLink.appendChild( spanTag( 'Black', '[' ) );
			welcomeLink.appendChild( spanTag( 'Goldenrod', 'welcome' ) );
			welcomeLink.appendChild( spanTag( 'Black', ']' ) );
			welcomeNode.appendChild(welcomeLink);

			if( $oList.length > 0 ) {
				var oHref = $oList.attr("href");

				var oWelcomeNode = welcomeNode.cloneNode( true );
				oWelcomeNode.firstChild.setAttribute( 'href', oHref + '&' + Morebits.queryString.create( { 'friendlywelcome': Twinkle.getFriendlyPref('quickWelcomeMode')==='auto'?'auto':'norm' } ) + '&' + Morebits.queryString.create( { 'vanarticle': mw.config.get( 'wgPageName' ).replace(/_/g, ' ') } ) );
				$oList[0].parentNode.parentNode.appendChild( document.createTextNode( ' ' ) );
				$oList[0].parentNode.parentNode.appendChild( oWelcomeNode );
			}

			if( $nList.length > 0 ) {
				var nHref = $nList.attr("href");

				var nWelcomeNode = welcomeNode.cloneNode( true );
				nWelcomeNode.firstChild.setAttribute( 'href', nHref + '&' + Morebits.queryString.create( { 'friendlywelcome': Twinkle.getFriendlyPref('quickWelcomeMode')==='auto'?'auto':'norm' } ) + '&' + Morebits.queryString.create( { 'vanarticle': mw.config.get( 'wgPageName' ).replace(/_/g, ' ') } ) );
				$nList[0].parentNode.parentNode.appendChild( document.createTextNode( ' ' ) );
				$nList[0].parentNode.parentNode.appendChild( nWelcomeNode );
			}
		}
	}
	if( mw.config.get( 'wgNamespaceNumber' ) === 3 ) {
		var username = mw.config.get( 'wgTitle' ).split( '/' )[0].replace( /\"/, "\\\""); // only first part before any slashes
		twAddPortletLink( function(){ Twinkle.welcome.callback(username); }, "स्वागत", "friendly-welcome", "सदस्य स्वागत" );
	}
};

Twinkle.welcome.welcomeUser = function welcomeUser() {
	Morebits.status.init( document.getElementById('bodyContent') );

	var params = {
		value: Twinkle.getFriendlyPref('quickWelcomeTemplate'),
		article: Morebits.queryString.exists( 'vanarticle' ) ? Morebits.queryString.get( 'vanarticle' ) : '',
		mode: 'auto'
	};

	Morebits.wiki.actionCompleted.redirect = mw.config.get('wgPageName');
	Morebits.wiki.actionCompleted.notice = "स्वागत संपूर्ण, वार्ता पन्ना कुछ ही क्षणों में रीलोड होगा";

	var wikipedia_page = new Morebits.wiki.page(mw.config.get('wgPageName'), "User talk page modification");
	wikipedia_page.setFollowRedirect(true);
	wikipedia_page.setCallbackParameters(params);
	wikipedia_page.load(Twinkle.welcome.callbacks.main);
};

Twinkle.welcome.callback = function friendlywelcomeCallback( uid ) {
	if( uid === mw.config.get('wgUserName') ){
		alert( 'आपका बहुत बहुत स्वागत है!' );
		return;
	}	
	var Window = new Morebits.simpleWindow( 600, 400 );
	Window.setTitle( "सदस्य स्वागत" );
	Window.setScriptName( "Twinkle" );
	//Window.addFooterLink( "Welcoming Committee", "WP:WC" );
	Window.addFooterLink( "Twinkle help", "WP:TW/DOC#welcome" );

	var form = new Morebits.quickForm( Twinkle.welcome.callback.evaluate, 'change' );

	form.append( {
			type: 'input',
			name: 'article',
			label: 'सम्बन्धित लेख (यदि साँचे द्वारा स्वीकृत)',
			value:( QueryString.exists( 'vanarticle' ) ? QueryString.get( 'vanarticle' ) : '' ),
			tooltip: 'स्वागत में एक लेख की कड़ी जोड़ी जा सकती है, यदि स्वागत साँचे द्वारा स्वीकृत हो। ऐसे साँचों के आगे * लगा है। किसी भी लेख की कड़ी न जोड़ने के लिये खाली छोड़ दें।',
			event: function( event ) {
				event.stopPropagation();
			}
		} );

	form.append( { type:'header', label:'मानक स्वागत' } );
	form.append( { type: 'radio', name: 'Standard', list: Twinkle.welcome.StandardList } );
 
	form.append( { type:'header', label:'संक्षिप्त स्वागत' } );
	form.append( { type: 'radio', name: 'short', list: Twinkle.welcome.shortList } );

	form.append( {type:'header', label:'मूल जानकारी सहित स्वागत' } );
	form.append( {type: 'radio', name: 'basic', list: Twinkle.welcome.basicList } );

	form.append( {type:'header', label:'ग्राफ़िक मेन्यू सहित स्वागत' } );
	form.append( {type:'radio', name: 'graphic', list: Twinkle.welcome.graphicList } );
	
	if( Twinkle.getFriendlyPref('customWelcomeList').length ) {
		form.append( { type:'header', label:'Custom templates' } );
		form.append( { type: 'radio', name: 'custom', list: Twinkle.getFriendlyPref('customWelcomeList') } );
	}

	form.append( { type:'header', label:'Potential problem user templates' } );
	form.append( { type: 'radio', name: 'problem', list: Twinkle.welcome.problemList } );

	form.append( { type:'header', label:'IP सदस्य स्वागत' } );
	form.append( { type: 'radio', name: 'anonymous', list: Twinkle.welcome.anonymousList } );

	var result = form.render();
	Window.setContent( result );
	Window.display();

};

Twinkle.welcome.StandardList = [
	{
		label: '{{Welcome}}: मानक स्वागत*',//standard welcome
		value: 'Welcome'
	}
];	

Twinkle.welcome.shortList = [
	{ 
		label: '{{Welcomeshort}}: संक्षिप्त स्वागत',//short welcome
		value: 'Welcomeshort',
		tooltip: 'Includes section heading.'
	},
	{ 
		label: '{{W-short}}: concise; won\'t overwhelm',
		value: 'W-short||',
		tooltip: 'This template is similar to {{Welcomeshort}} but supports many different options.  Includes a signature.'
	},
	{ 
		label: '{{WelcomeSimple}}: सिम्पल स्वागत',//simple welcome
		value: 'WelcomeSimple',
		tooltip: 'Won\'t overwhelm new users.  Includes section heading.'
	}
];
 
Twinkle.welcome.basicList = [
	{
		label: '{{Welcome-personal}}: includes a plate of cookies',
		value: 'Welcome-personal',
		tooltip: 'A personal welcome with an introduction from you and a plate of cookies.  Includes section heading and signature.'
	},
	{ 
		label: '{{Welcome-belated}}: welcome for users with more substantial contributions',
		value: 'Welcome-belated'
	},
	{ 
		label: '{{W-basic}}: standard template, similar to {{Welcome}} with additional options',
		value: 'W-basic',
		tooltip: 'This template is similar to {{Welcome}} but supports many different options.  Includes a signature.'
	},
	{ 
		label: '{{W-shout}}: extroverted message with bold advice',
		value: 'W-shout',
		tooltip: 'This template is similar to {{WelcomeShout}} but supports many different options.  Includes a signature.'
	}
];
 
Twinkle.welcome.graphicList = [
	{ 
		label: '{{WelcomeMenu}}: कड़ियों की सूची के साथ स्वागत',//welcome with menu of links
		value: 'WelcomeMenu',
		tooltip: 'Contains a welcome message and many useful links broken up into different sections.  Includes signature.' 
	},
	{ 
		label: '{{Welcomeg}}: {{WelcomeMenu}} जैसा',//similar to {{WelcomeMenu}}
		value: 'Welcomeg',
		tooltip: 'Contains a welcome message and many useful links broken up into different sections.  Includes signature.'
	},
	{ 
		label: '{{Welcomeh}}: {{Welcomeg}} जैसा, अनुभाग नाम के साथ',//same as {{Welcomeg}} but with a section heading
		value: 'Welcomeh',
		tooltip: 'Contains a section heading, a welcome message and many useful links broken up into different sections.  Includes section heading and signature.'
	},
	{ 
		label: '{{W-graphical}}: graphical menu format to ease transition from the graphic-heavy web',
		value: 'W-graphical',
		tooltip: 'This template is similar to {{Welcomeg}} but has fewer links.  Supports many different options.  Includes a signature.'
	},
	{ 
		label: '{{W-screen}}: graphical; designed to fit the size of the user\'s screen',
		value: 'W-screen',
		tooltip: 'This template is a nice graphical welcome with many different options.  Includes a signature.'
	}
];

Twinkle.welcome.problemList = [
	{ 
		label: '{{Welcomelaws}}: welcome with information about copyrights, npov, the sandbox, and vandalism',
		value: 'Welcomelaws'
	},
	{ 
		label: '{{Firstarticle}}: for someone whose first article did not meet page creation guidelines*',
		value: 'Firstarticle'
	},
	{ 
		label: '{{Welcomevandal}}: for someone whose initial efforts appear to be vandalism*',
		value: 'Welcomevandal',
		tooltip: 'Includes a section heading.'
	},
	{ 
		label: '{{Welcomenpov}}: for someone whose initial efforts do not adhere to the neutral point of view policy*',
		value: 'Welcomenpov'
	},
	{ 
		label: '{{Welcomespam}}: welcome with additional discussion of anti-spamming policies*',
		value: 'Welcomespam'
	},
	{ 
		label: '{{Welcomeunsourced}}: for someone whose initial efforts are uncited*',
		value: 'Welcomeunsourced'
	},
	{ 
		label: '{{Welcomeauto}}: for someone who created an autobiographical article*',
		value: 'Welcomeauto'
	},
	{ 
		label: '{{Welcome-COI}}: for someone who created an article about a subject with which they have a conflict of interest*',
		value: 'Welcome-COI'
	}
];

Twinkle.welcome.anonymousList = [
	{
		label: '{{Welcome-anon}}: for anonymous users; encourages getting a username*',
		value: 'Welcome-anon'
	},
	{
		label: '{{Welcomeanon2}}: similar to {{Welcome-anon}} but with hints and tips*',
		value: 'Welcomeanon2',
		tooltip: 'Includes section heading.'
	},
	{
		label: '{{Welc-anon}}: similar to {{Welcome-anon}} but with a border and section heading',
		value: 'Welc-anon||',
		tooltip: 'Includes section heading.'
	},
	{
		label: '{{Welcome-anon-vandal}}: for anonymous users who have vandalized a page*',
		value: 'Welcome-anon-vandal',
		tooltip: 'Includes a section heading and signature.'
	},
	{
		label: '{{Welcome-anon-vandalism-fighter}}: for anonymous users who fight vandalism, urging them to create an account*',
		value: 'Welcome-anon-vandalism-fighter', 
		tooltip: 'Includes section heading.'
	}
];

// Set to true if template does not already have heading
Twinkle.welcome.headingHash = {
	'Welcome': true,
	'Welcomeshort': false,
	'WelcomeSimple': false,
	'Welcom': false,
	'Welcome-personal': false,
	'WelcomeMenu': true,
	'Welcomeg': true,
	'Welcomeh': false,
	'Welcome-belated': false,
	'W-basic': true,
	'W-shout': true,
	'W-short||': true,
	'W-graphical': true,
	'W-screen': true,
	'Welcomelaws': true,
	'Firstarticle': true,
	'Welcomevandal': false,
	'Welcomenpov': true,
	'Welcomespam': true,
	'Welcomeunsourced': true,
	'Welcomeauto': false,
	'Welcome-COI': true,
	'Welcome-anon': true,
	'Welcomeanon2': false,
	'Welc-anon||': false,
	'Welcome-anon-vandalism-fighter': false,
	'Welcome-anon-vandal': false
};

// Set to true if template already has signature
Twinkle.welcome.signatureHash = {
	'Welcome': false,
	'Welcomeshort': false,
	'WelcomeSimple': false,
	'Welcom': true,
	'Welcome-personal': false,
	'WelcomeMenu': true,
	'Welcomeg': true,
	'Welcomeh': true,
	'Welcome-belated': true,
	'W-basic': true,
	'W-shout': true,
	'W-short||': true,
	'W-graphical': true,
	'W-screen': true,
	'Welcomelaws': false,
	'Firstarticle': true,
	'Welcomevandal': true,
	'Welcomenpov': false,
	'Welcomespam': false,
	'Welcomeunsourced': false,
	'Welcome-COI': false,
	'Welcome-anon': false,
	'Welcomeanon2': false,
	'Welc-anon||': false,
	'Welcome-anon-vandalism-fighter': false,
	'Welcome-anon-vandal': true
};

/* Set to true if template supports article
 * name from art template parameter 
 */
Twinkle.welcome.artHash = {
	'Welcome': true,
	'Welcomeshort': false,
	'WelcomeSimple': false,
	'Welcom': false,
	'Welcome-personal': false,
	'WelcomeMenu': false,
	'Welcomeg': false,
	'Welcomeh': false,
	'Welcome-belated': false,
	'W-basic': false,
	'W-shout': false,
	'W-short||': false,
	'W-graphical': false,
	'W-screen': false,
	'Welcomelaws': false,
	'Firstarticle': false,
	'Welcomevandal': false,
	'Welcomenpov': false,
	'Welcomespam': false,
	'Welcomeunsourced': false,
	'Welcomeauto': true,
	'Welcome-COI': false,
	'Welcome-anon': true,
	'Welcomeanon2': true,
	'Welc-anon||': false,
	'Welcome-anon-vandalism-fighter': true,
	'Welcome-anon-vandal': false
};

/* Set to true if template supports article
 * name from vanarticle template parameter 
 */
Twinkle.welcome.vandalHash = {
	'Welcome': false,
	'Welcomeshort': false,
	'WelcomeSimple': false,
	'Welcom': false,
	'Welcome-personal': false,
	'WelcomeMenu': false,
	'Welcomeg': false,
	'Welcomeh': false,
	'Welcome-belated': false,
	'W-basic': false,
	'W-shout': false,
	'W-short||': false,
	'W-graphical': false,
	'W-screen': false,
	'Welcomelaws': false,
	'Firstarticle': true,
	'Welcomevandal': true,
	'Welcomenpov': true,
	'Welcomespam': true,
	'Welcomeunsourced': true,
	'Welcomeauto': false,
	'Welcome-COI': false,
	'Welcome-anon': false,
	'Welcomeanon2': false,
	'Welc-anon||': false,
	'Welcome-anon-vandalism-fighter': false,
	'Welcome-anon-vandal': true
};

Twinkle.welcome.callbacks = {
	main: function( pageobj ) {
		var params = pageobj.getCallbackParameters();
		var oldText = pageobj.getPageText();

		// abort if mode is auto and form is not empty
		if( pageobj.exists() && params.mode === 'auto' ) {
			Morebits.status.info( 'Warning', 'User talk page not empty; aborting automatic welcome' );
			Morebits.wiki.actionCompleted.event();
			return;
		}
		
		var text = '';
		Morebits.status.info( 'Info', 'स्वागत सन्देश सदस्य के वार्ता पन्ने के सबसे ' +
			( Twinkle.getFriendlyPref('topWelcomes') ? 'ऊपर' : 'नीचे' ) +
			' जोड़ा जाएगा।' );/*Will add the welcome template to the top or bottom of the user\'s talk page*/
		if( !Twinkle.getFriendlyPref('topWelcomes') ) {
			text += oldText + '\n';
		}
		
		if( Twinkle.welcome.headingHash[ params.value ] && Twinkle.getFriendlyPref('insertHeadings') ) {
			Morebits.status.info( 'Info', 'स्वागत सन्देश के लिये नया अनुभाग बनाया जाएगा' );//Will create a new heading for the welcome
			// strip section header markers from pref, to preserve backwards compatibility
			text += "== " + Twinkle.getFriendlyPref('welcomeHeading').replace(/^\s*=+\s*(.*?)\s*=+$\s*/, "$1") + " ==\n";
		}
		
		Morebits.status.info( 'Info', 'Will substitute the {{' + params.value + '}} welcome template' );
		text += '{{subst:' + params.value;
		
		if( Twinkle.welcome.artHash[ params.value ] ) {
			if( Twinkle.getFriendlyPref('insertUsername') && params.value.substring(2,0) !== 'W-' ) {
				Morebits.status.info( 'Info', 'स्वागत सन्देश में आपका सदस्य नाम जोड़ा जाएगा' );//Will add your username to the template
				text += '|' + mw.config.get('wgUserName');
			}
			
			if( params.article ) {
				Morebits.status.info( 'Info', 'स्वागत सन्देश में लेख की कड़ी जोड़ी जाएगी' );//Will add article link to the template
				text += '|art=' + params.article;
			}
		} else if( Twinkle.welcome.vandalHash[ params.value ] ) {
			if( params.article ) {
				Morebits.status.info( 'Info', 'स्वागत सन्देश में लेख की कड़ी जोड़ी जाएगी' );
			}
			text += '|' + params.article;
			
			if( Twinkle.getFriendlyPref('insertUsername') ) {
				Morebits.status.info( 'Info', 'स्वागत सन्देश में आपका सदस्य नाम जोड़ा जाएगा' );
				text += '|' + mw.config.get('wgUserName');
			}
		} else if( Twinkle.getFriendlyPref('insertUsername') ) {
			Morebits.status.info( 'Info', 'स्वागत सन्देश में आपका सदस्य नाम जोड़ा जाएगा' );
			text += '|' + mw.config.get('wgUserName');
		} 
		
		text += '}}';
		
		if( !Twinkle.welcome.signatureHash[ params.value ] && Twinkle.getFriendlyPref('insertSignature') ) {
			Morebits.status.info( 'Info', 'सन्देश के बाद आपके हस्ताक्षर जोड़े जाएँगे' );//Will add your signature after the welcome
			text += ' \n~~~~';
		}
		
		if( Twinkle.getFriendlyPref('topWelcomes') ) {
			text += '\n\n' + oldText;
		}
 
		var summaryText = "सदस्य के वार्ता पन्ने पर " + ( Twinkle.getFriendlyPref('maskTemplateInSummary') ? 'स्वागत सन्देश' : ( '{{[[साँचा:' + params.value + '|' + params.value + ']]}}' ) ) +
			" जोड़ा";
		pageobj.setPageText(text);
		pageobj.setEditSummary(summaryText + Twinkle.getPref('summaryAd'));
		pageobj.setWatchlist(Twinkle.getFriendlyPref('watchWelcomes'));
		pageobj.setCreateOption('recreate');
		pageobj.save();
	}
};

Twinkle.welcome.callback.evaluate = function friendlywelcomeCallbackEvaluate(e) {
	// Ignore if a change to the text field triggered this event
	if( e.target.name === 'article' ) {
		return;
	}

	var params = {
		value: e.target.values,
		article: e.target.form.article.value,
		mode: 'manual'
	};

	Morebits.simpleWindow.setButtonsEnabled( false );
	Morebits.status.init( e.target.form );

	Morebits.wiki.actionCompleted.redirect = mw.config.get('wgPageName');
	Morebits.wiki.actionCompleted.notice = "स्वागत संपूर्ण, वार्ता पन्ना कुछ ही क्षणों में रीलोड होगा";

	var wikipedia_page = new Morebits.wiki.page(mw.config.get('wgPageName'), "User talk page modification");
	wikipedia_page.setFollowRedirect(true);
	wikipedia_page.setCallbackParameters(params);
	wikipedia_page.load(Twinkle.welcome.callbacks.main);
};
