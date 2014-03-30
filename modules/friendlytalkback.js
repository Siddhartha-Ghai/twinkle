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
	
		if ( Morebits.getPageAssociatedUser() === false ) {
			return;
		}
	
		twAddPortletLink( callback, "सन्देश", "friendly-talkback", "सरल सन्देश" );
	};
	
	var callback = function( ) {
		if( Morebits.getPageAssociatedUser() === mw.config.get("wgUserName") && !confirm("Is it really so bad that you're talking back to yourself?") ){
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
							label: "Noticeboard notification",
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
						type:"input",
						name:"section",
						label:"सम्बंधित अनुभाग (वैकल्पिक)",
						tooltip:"आपके वार्ता पन्ने के उस अनुभाग का नाम जहाँ आपने सन्देश छोड़ा है। अनुभाग की जगह सिर्फ़ वार्ता पन्ने की कड़ी छोड़ने के लिये खाली छोड़ दें।",
						value: prev_section
					});
				break;
			case "usertalk":
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
	};
	
	var callback_evaluate = function( e ) {
	
		var tbtarget = e.target.getChecked( "tbtarget" )[0];
		var page = null;
		var section = e.target.section.value;
		var fullUserTalkPageName = mw.config.get("wgFormattedNamespaces")[ mw.config.get("wgNamespaceIds").user_talk ] + ":" + Morebits.getPageAssociatedUser();
	
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
				text = "\n== " + Twinkle.getFriendlyPref("adminNoticeHeading") + " ==\n";
				text += "{{subst:ANI-notice|thread=" + section + "|noticeboard=विकिपीडिया:प्रबंधक सूचनापट}} ~~~~";
				talkpage.setEditSummary( "प्रबंधक सूचनापट पर चर्चा का नोटिस" + Twinkle.getPref("summaryAd") );
				break;
		} else {
			//clean talkback heading: strip section header markers, were erroneously suggested in the documentation
			text = "\n\n==" + Twinkle.getFriendlyPref("talkbackHeading").replace( /^\s*=+\s*(.*?)\s*=+$\s*/, "$1" ) + "==\n{{सन्देश|";
			text += tbPageName;

			if( section ) {
				text += "|" + section;
			}
	
			text += "|ts=~~~~~}}";
	
			if( message ) {
				text += "\n" + message + "  ~~~~";
			} else if( Twinkle.getFriendlyPref("insertTalkbackSignature") ) {
				text += "\n~~~~";
			}
	
			talkpage.setEditSummary("सन्देश [[" + (tbtarget === "other" ? "" : "सदस्य वार्ता:") + tbPageName +
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