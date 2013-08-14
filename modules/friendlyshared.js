/*
 ****************************************
 *** friendlyshared.js: Shared IP tagging module
 ****************************************
 * Mode of invocation:     Tab ("Shared")
 * Active on:              Existing IP user talk pages
 * Config directives in:   FriendlyConfig
 */

Twinkle.shared = function friendlyshared() {
	if( mw.config.get('wgNamespaceNumber') === 3 && Morebits.isIPAddress(mw.config.get('wgTitle')) ) {
		var username = mw.config.get('wgTitle').split( '/' )[0].replace( /\"/, "\\\""); // only first part before any slashes
		twAddPortletLink( function(){ Twinkle.shared.callback(username); }, "साझा आइ॰पी॰", "friendly-shared", "साझा आइ॰पी॰ पता टैगिंग" );
	}
};

Twinkle.shared.callback = function friendlysharedCallback( uid ) {
	var Window = new Morebits.simpleWindow( 600, 400 );
	Window.setTitle( "साझा आइ॰पी॰ पता टैगिंग" );
	Window.setScriptName( "Twinkle" );
	Window.addFooterLink( "Twinkle help", "WP:TW/DOC#shared" );

	var form = new Morebits.quickForm( Twinkle.shared.callback.evaluate );

	var div = form.append( { type: 'div', id: 'sharedip-templatelist' } );
	div.append( { type: 'header', label:'साझा आइ॰पी॰ पता साँचे' } );
	div.append( { type: 'radio', name: 'shared', list: Twinkle.shared.standardList,
		event: function( e ) {
			Twinkle.shared.callback.change_shared( e );
			e.stopPropagation();
		}
	} );

	var org = form.append( { type:'field', label:'नीचे आइ॰पी॰ पते के स्वामी/संचालक का नाम, होस्ट-नाम तथा संपर्क-सूचना (यदि लागू हो तो) भरें, और \"Submit\" बटन पर क्लिक करें।' } );
	org.append( {
			type: 'input',
			name: 'organization',
			label: 'संगठन का नाम (वैकल्पिक)',
			disabled: true,
			tooltip: 'इनमें से कुछ साँचे एक वैकल्पिक पैरामीटर की सुविधा प्रदान करते हैं, जिसमें आई॰पी॰ पतों के स्वामी या इनको संचालित करने वाले संगठन का नाम भरा जा सकता है। आप वह नाम यहाँ डाल सकते हैं। यदि आवश्यक हो तो wikimarkup का प्रयोग कर सकते हैं।'
		}
	);
	org.append( {
			type: 'input',
			name: 'host',
			label: 'होस्ट नाम (वैकल्पिक)',
			disabled: true,
			tooltip: 'ये साँचे होस्ट नाम के लिए एक वैकल्पिक पैरामीटर स्वीकार करते हैं। आप होस्ट नाम (जैसे proxy.example.com) यहाँ डाल सकते हैं।'
		}
	);
	org.append( {
			type: 'input',
			name: 'contact',
			label: 'संगठन के संपर्कसूत्र (सिर्फ संगठन के अनुरोध पर भरें)',
			disabled: true,
			tooltip: 'इनमें से कुछ साँचे संगठनो के संपर्कसूत्र के लिए एक वैकल्पिक पैरामीटर स्वीकार करते हैं। इस पैरामीटर का इस्तेमाल संगठन के विशेष अनुरोध पर ही किया जाना चाहिए। यदि आवश्यक हो तो wikimarkup का प्रयोग कर सकते हैं।'
		}
	);
	
	form.append( { type:'submit' } );

	var result = form.render();
	Window.setContent( result );
	Window.display();

	$(result).find('div#sharedip-templatelist').addClass('quickform-scrollbox');
};

Twinkle.shared.standardList = [
	{
		label: '{{shared IP}}: मानक साझा आइ॰पी॰ साँचा',
		value: 'shared IP',
		tooltip: 'आइ॰पी॰ सदस्य वार्ता पृष्ठ पर प्रयोग हेतु साँचा। यह साँचा आइ॰पी॰ सदस्य तथा उन लोगों को जो उसे चेतावनी देना चाहते हैं या प्रतिबन्धित करना चाहते हैं, को उपयोगी जानकारी उपलब्ध करता है।'
	},
	{ 
		label: '{{shared IP edu}}: शैक्षिक संस्थानों के लिए संशोधित साझा आइ॰पी॰ साँचा',
		value: 'shared IP edu'
	},
	{
		label: '{{shared IP public}}: सार्वजनिक टर्मिनलों के लिए संशोधित साझा आइ॰पी॰ साँचा',
		value: 'shared IP public'
	},
	{
		label: '{{shared IP gov}}: सरकारी सुविधाओं या एजेंसियों के लिए संशोधित साझा आइ॰पी॰ साँचा',
		value: 'shared IP gov'
	},
	{
		label: '{{dynamicIP}}: अस्थिर पतों(dynamic IP) वाले संगठनो के लिए संशोधित साझा आइ॰पी॰ साँचा',
		value: 'dynamicIP'
	},
	{ 
		label: '{{ISP}}: इंटरनेट सेवा प्रदाता(ISP) संगठनों(खासकर प्रॉक्सीज़) के लिए संशोधित साझा आइ॰पी॰ साँचा',
		value: 'ISP'
	},
	{ 
		label: '{{mobileIP}}: मोबाइल फोन कंपनी और उनके ग्राहकों के लिए संशोधित साझा आइ॰पी॰ साँचा',
		value: 'mobileIP'
	}
];

Twinkle.shared.callback.change_shared = function friendlysharedCallbackChangeShared(e) {
	e.target.form.contact.disabled = ( e.target.value === 'shared IP edu' ) ? false : true;
	e.target.form.organization.disabled = false;
	e.target.form.host.disabled = false;
};

Twinkle.shared.callbacks = {
	main: function( pageobj ) {
		var params = pageobj.getCallbackParameters();
		var pageText = pageobj.getPageText();
		var found = false;
		var text = '{{';

		for( var i=0; i < Twinkle.shared.standardList.length; i++ ) {
			var tagRe = new RegExp( '(\\{\\{' + Twinkle.shared.standardList[i].value + '(\\||\\}\\}))', 'im' );
			if( tagRe.exec( pageText ) ) {
				Morebits.status.warn( 'Info', 'सदस्य वार्ता पृष्ठ पर {{' + Twinkle.shared.standardList[i].value + '}} पाया गया। टैगिंग रद्द कर डी गयी है।' );
				return;
			}
		}

		Morebits.status.info( 'Info', 'साझा आइ॰पी॰ पता साँचा सदस्य के वार्ता पृष्ठ में ऊपर-ऊपर जोड़ा जाएगा।' );
		text += params.value + '|' + params.organization;
		if( params.value === 'shared IP edu' && params.contact !== '') {
			text += '|' + params.contact;
		}
		if( params.host !== '' ) {
			text += '|host=' + params.host;
		}
		text += '}}\n\n';

		var summaryText = '{{[[सा:' + params.value + '|' + params.value + ']]}} साँचा जोड़ा।';
		pageobj.setPageText(text + pageText);
		pageobj.setEditSummary(summaryText + Twinkle.getPref('summaryAd'));
		pageobj.setMinorEdit(Twinkle.getFriendlyPref('markSharedIPAsMinor'));
		pageobj.setCreateOption('recreate');
		pageobj.save();
	}
};

Twinkle.shared.callback.evaluate = function friendlysharedCallbackEvaluate(e) {
	var shared = e.target.getChecked( 'shared' );
	if( !shared || shared.length <= 0 ) {
		alert( 'आपको प्रयोग करने के लिए एक साझा आइ॰पी साँचा चुनना होगा।' );
		return;
	}
	
	var value = shared[0];
	
	if( e.target.organization.value === '') {
		alert( 'आपको {{' + value + '}} साँचे के लिए संगठन का नाम देना होगा।' );
		return;
	}
	
	var params = {
		value: value,
		organization: e.target.organization.value,
		host: e.target.host.value,
		contact: e.target.contact.value
	};

	Morebits.simpleWindow.setButtonsEnabled( false );
	Morebits.status.init( e.target );

	Morebits.wiki.actionCompleted.redirect = mw.config.get('wgPageName');
	Morebits.wiki.actionCompleted.notice = "टैगिंग सम्पूर्ण, वार्ता पन्ना कुछ ही क्षणों में रीलोड होगा";

	var wikipedia_page = new Morebits.wiki.page(mw.config.get('wgPageName'), "सदस्य वार्ता पृष्ठ सम्पादन");
	wikipedia_page.setFollowRedirect(true);
	wikipedia_page.setCallbackParameters(params);
	wikipedia_page.load(Twinkle.shared.callbacks.main);
};
