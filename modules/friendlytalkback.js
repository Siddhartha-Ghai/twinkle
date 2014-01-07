//<nowiki>


(function($){


/*
 ****************************************
 *** friendlytalkback.js: Talkback module
 ****************************************
 * Mode of invocation:     Tab ("TB")
 * Active on:              Existing user talk pages
 * Config directives in:   FriendlyConfig
 */

Twinkle.talkback = function() {

	if ( !mw.config.get('wgRelevantUserName') ) {
		return;
	}

	Twinkle.addPortletLink( Twinkle.talkback.callback, "सन्देश", "friendly-talkback", "सरल सन्देश" );
};

Twinkle.talkback.callback = function( ) {
	if( mw.config.get('wgRelevantUserName') === mw.config.get("wgUserName") && !confirm("Is it really so bad that you're talking back to yourself?") ){
		return;
	}

	var Window = new Morebits.simpleWindow( 600, 350 );
	Window.setTitle("सन्देश");
	Window.setScriptName("Twinkle");
	Window.addFooterLink( "{{सन्देश}} पर जानकारी", "साँचा:सन्देश" );
	Window.addFooterLink( "Twinkle help", "WP:TW/DOC#talkback" );

	var form = new Morebits.quickForm( callback_evaluate );

	form.append({ type: "radio", name: "tbtarget",
				list: [
					{
						label: "मेरे वार्ता पृष्ठ पर",
						value: "mytalk",
						checked: "true" 
					},
					{
						label: "किसी अन्य सदस्य के वार्ता पृष्ठ पर",
						value: "usertalk"
					},
					{
						label: "किसी अन्य पृष्ठ पर",
						value: "other"
					},
					{
						label: "सूचनापट पर",
						value: "notice"
					}
				],
				event: callback_change_target
			});

	form.append({
			type: "field",
			label: "Work area",
			name: "work_area"
		});

	form.append({ type: "submit" });

	var result = form.render();
	Window.setContent( result );
	Window.display();

	// We must init the
	var evt = document.createEvent("Event");
	evt.initEvent( "change", true, true );
	result.tbtarget[0].dispatchEvent( evt );

	// Check whether the user has opted out from talkback
	// TODO: wgCategories is only set on action=view (bug 45033)
	var wgcat = mw.config.get("wgCategories");
	if (wgcat.length && wgcat.indexOf("Users who do not wish to receive talkbacks") === -1) {
		Twinkle.talkback.optout = false;
	} else {
		var query = {
			action: 'query',
			prop: 'extlinks',
			titles: mw.config.get('wgPageName'),
			elquery: 'userjs.invalid/noTalkback',
			ellimit: '1'
		};
		var wpapi = new Morebits.wiki.api("Fetching talkback opt-out status", query, Twinkle.talkback.callback.optoutStatus);
		wpapi.post();
	}
};

Twinkle.talkback.optout = null;

Twinkle.talkback.callback.optoutStatus = function(apiobj) {
	var xml = apiobj.getXML();
	var $el = $(xml).find('el');

	if ($el.length) {
		Twinkle.talkback.optout = mw.config.get('wgRelevantUserName') + " prefers not to receive talkbacks";
		var url = $el.text();
		if (url.indexOf("reason=") > -1) {
			Twinkle.talkback.optout += ": " + decodeURIComponent(url.substring(url.indexOf("reason=") + 7)) + ".";
		} else {
			Twinkle.talkback.optout += ".";
		}
	} else {
		Twinkle.talkback.optout = false;
	}

	var $status = $("#twinkle-talkback-optout-message");
	if ($status.length) {
		$status.append(Twinkle.talkback.optout);
	}
};

var prev_page = "";
var prev_section = "";
var prev_message = "";

var callback_change_target = function( e ) {
	var value = e.target.values;
	var root = e.target.form;
	var old_area = Morebits.quickForm.getElements(root, "work_area")[0];

	if(root.section) {
		prev_section = root.section.value;
	}
	if(root.message) {
		prev_message = root.message.value;
	}
	if(root.page) {
		prev_page = root.page.value;
	}

	var work_area = new Morebits.quickForm.element({
			type: "field",
			label: "सन्देश जानकारी",
			name: "work_area"
		});

	switch( value ) {
		case "mytalk":
			/* falls through */
		default:
			work_area.append({
				type: "div",
				label: "",
				style: "color: red",
				id: "twinkle-talkback-optout-message"
			});
			work_area.append({
					type:"input",
					name:"section",
					label:"सम्बंधित अनुभाग (वैकल्पिक)",
					tooltip:"आपके वार्ता पन्ने के उस अनुभाग का नाम जहाँ आपने सन्देश छोड़ा है। अनुभाग की जगह सिर्फ़ वार्ता पन्ने की कड़ी छोड़ने के लिये खाली छोड़ दें।",
					value: prev_section
				});
			break;
		case "usertalk":
			work_area.append({
				type: "div",
				label: "",
				style: "color: red",
				id: "twinkle-talkback-optout-message"
			});
			work_area.append({
					type:"input",
					name:"page",
					label:"सदस्य",
					tooltip:"उस सदस्य का नाम जिसके वार्ता पन्ने पर आपने सन्देश छोड़ा है।",
					value: prev_page
				});
			
			work_area.append({
					type:"input",
					name:"section",
					label:"सम्बंधित अनुभाग (वैकल्पिक)",
					tooltip:"उस अनुभाग का नाम जहाँ आपने सन्देश छोड़ा है। अनुभाग की जगह सिर्फ़ वार्ता पन्ने की कड़ी छोड़ने के लिये खाली छोड़ दें।",
					value: prev_section
				});
			break;
		case "notice":
			var noticeboard = work_area.append({
					type: "select",
					name: "noticeboard",
					label: "सूचनापट:"
				});
			noticeboard.append({
					type: "option",
					label: "वि:प्रबंधक सूचनापट",
					value: "an"
				});
			noticeboard.append({
					type: "option",
					label: "वि:चौपाल",
					value: "vp"
				});
			work_area.append({
					type:"input",
					name:"section",
					label:"भाग",
					tooltip:"सूचनापट पर सम्बंधित अनुभाग (वैकल्पिक)",
					value: prev_section
				});
			break;
		case "other":
			work_area.append({
				type: "div",
				label: "",
				style: "color: red",
				id: "twinkle-talkback-optout-message"
			});
			work_area.append({
					type:"input",
					name:"page",
					label:"पन्ने का पूरा नाम",
					tooltip:"उस पन्ने का पूरा नाम जिस पर आपने सन्देश छोड़ा है। उदहारण: 'विकिपीडिया वार्ता:Twinkle'।",
					value: prev_page
				});
			
			work_area.append({
					type:"input",
					name:"section",
					label:"सम्बंधित अनुभाग (वैकल्पिक)",
					tooltip:"उस अनुभाग का नाम जहाँ आपने सन्देश छोड़ा है। अनुभाग की जगह सिर्फ़ वार्ता पन्ने की कड़ी छोड़ने के लिये खाली छोड़ दें।",
					value: prev_section
				});
			break;
	}

	if (value !== "notice") {
		work_area.append({ type:"textarea", label:"अतिरिक्त सन्देश (वैकल्पिक):", name:"message", tooltip:"कोई सन्देश जो आप सन्देश साँचे के बाद छोड़ना चाहेंगे।" });
	}

	work_area = work_area.render();
	root.replaceChild( work_area, old_area );
	if (root.message) {
		root.message.value = prev_message;
	}

	if (Twinkle.talkback.optout) {
		$("#twinkle-talkback-optout-message").append(Twinkle.talkback.optout);
	}
};

var callback_evaluate = function( e ) {

	var tbtarget = e.target.getChecked( "tbtarget" )[0];
	var page = null;
	var section = e.target.section.value;
	var fullUserTalkPageName = mw.config.get("wgFormattedNamespaces")[ mw.config.get("wgNamespaceIds").user_talk ] + ":" + mw.config.get('wgRelevantUserName');

	if( tbtarget === "usertalk" || tbtarget === "other" ) {
		page = e.target.page.value;
		
		if( tbtarget === "usertalk" ) {
			if( !page ) {
				alert("आपको उस सदस्य का नाम बताना होगा जिसके वार्ता पन्ने पर आपने सन्देश छोड़ा है।");
				return;
			}
		} else {
			if( !page ) {
				alert("यदि आपका सन्देश सदस्य वार्ता पन्ने की जगह किसी और पन्ने पर है तो आपको उस पन्ने का पूरा नाम बताना होगा।");
				return;
			}
		}
	} else if (tbtarget === "notice") {
		page = e.target.noticeboard.value;
	}

	var message;
	if (e.target.message) {
		message = e.target.message.value;
	}

	Morebits.simpleWindow.setButtonsEnabled( false );
	Morebits.status.init( e.target );

	Morebits.wiki.actionCompleted.redirect = fullUserTalkPageName;
	Morebits.wiki.actionCompleted.notice = "सन्देश दे दिया, वार्ता पन्ना कुछ ही क्षणों में रीलोड होगा";

	var talkpage = new Morebits.wiki.page(fullUserTalkPageName, "सन्देश जोड़ा जा रहा है");
	var tbPageName = (tbtarget === "mytalk") ? mw.config.get("wgUserName") : page;

	var text;
	if ( tbtarget === "notice" && page === "an") {
			text = "\n\n== " + Twinkle.getFriendlyPref("adminNoticeHeading") + " ==\n";
			text += "{{subst:ANI-notice|thread=" + section + "|noticeboard=विकिपीडिया:प्रबंधक सूचनापट}} --~~~~";
			talkpage.setEditSummary( "प्रबंधक सूचनापट पर चर्चा का नोटिस" + Twinkle.getPref("summaryAd") );
	} else {
		//clean talkback heading: strip section header markers, were erroneously suggested in the documentation
		text = "\n\n==" + Twinkle.getFriendlyPref("talkbackHeading").replace( /^\s*=+\s*(.*?)\s*=+$\s*/, "$1" ) + "==\n\n{{सन्देश|";
		text += ( tbtarget === "notice" && page === "vp") ? 'विकिपीडिया:चौपाल' : tbPageName;

		if( section ) {
			text += "|" + section;
		}

		text += "|ts=~~~~~}}";

		if( message ) {
			text += "\n" + message.trim() + " ~~~~";
		} else if( Twinkle.getFriendlyPref("insertTalkbackSignature") ) {
			text += "\n~~~~";
		}

		talkpage.setEditSummary("सन्देश [[" + ((tbtarget === "other" || tbtarget === "notice") ? "" : "सदस्य वार्ता:") +
			(( tbtarget === "notice" && page === "vp") ? 'विकिपीडिया:चौपाल' : tbPageName) +
			(section ? ("#" + section) : "") + "]] पर" + Twinkle.getPref("summaryAd"));
	}

	talkpage.setAppendText( text );
	talkpage.setCreateOption("recreate");
	talkpage.setMinorEdit(Twinkle.getFriendlyPref("markTalkbackAsMinor"));
	talkpage.setFollowRedirect( true );
	talkpage.append();
};

})(jQuery);


//</nowiki>
