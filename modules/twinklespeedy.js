/*
 ****************************************
 *** twinklespeedy.js: CSD module
 ****************************************
 * Mode of invocation:     Tab ("CSD")
 * Active on:              Non-special, existing pages
 * Config directives in:   TwinkleConfig
 *
 * NOTE FOR DEVELOPERS:
 *   If adding a new criterion, check out the default values of the CSD preferences
 *   in twinkle.header.js, and add your new criterion to those if you think it would
 *   be good. 
 */

Twinkle.speedy = function twinklespeedy() {
	// Disable on:
	// * special pages
	// * non-existent pages
	if (mw.config.get('wgNamespaceNumber') < 0 || !mw.config.get('wgArticleId')) {
		return;
	}

	twAddPortletLink( Twinkle.speedy.callback, "शीह", "tw-csd", Morebits.userIsInGroup('sysop') ? "शीघ्र हटाने के मापदंडों अनुसार पृष्ठ को हटाएँ" : "शीघ्र हटाने का नामांकन करें" );
};

// This function is run when the CSD tab/header link is clicked
Twinkle.speedy.callback = function twinklespeedyCallback() {
	if ( !twinkleUserAuthorized ) {
		alert("आपका अकाउंट ट्विंकल प्रयोग करने के लिये बहुत नया है।");
		return;
	}

	Twinkle.speedy.initDialog(Morebits.userIsInGroup( 'sysop' ) ? Twinkle.speedy.callback.evaluateSysop : Twinkle.speedy.callback.evaluateUser, true);
};

Twinkle.speedy.dialog = null;
// Prepares the speedy deletion dialog and displays it
// Parameters:
//  - callbackfunc: the function to call when the dialog box is submitted
//  - firstTime: is this the first time? (false during a db-multiple run, true otherwise)
//  - content: (optional) a div element in which the form content should be rendered - allows
//    for placing content in an existing dialog box
Twinkle.speedy.initDialog = function twinklespeedyInitDialog(callbackfunc, firstTime, content) {
	var dialog;
	if (!content)
	{
		Twinkle.speedy.dialog = new Morebits.simpleWindow( Twinkle.getPref('speedyWindowWidth'), Twinkle.getPref('speedyWindowHeight') );
		dialog = Twinkle.speedy.dialog;
		dialog.setTitle( "शीघ्र हटाने के लिये मापदंड चुनें" );
		dialog.setScriptName( "Twinkle" );
		dialog.addFooterLink( "पृष्ठ हटाने की नीति", "वि:हटाना" );
		dialog.addFooterLink( "Twinkle help", "WP:TW/DOC#speedy" );
	}

	var form = new Morebits.quickForm( callbackfunc, 'change' );
	if( firstTime && Morebits.userIsInGroup( 'sysop' ) ) {
		form.append( {
				type: 'checkbox',
				list: [
					{
						label: 'केवल टैग करें',
						value: 'tag_only',
						name: 'tag_only',
						tooltip: 'यदि आप पृष्ठ को हटाने के बजाए सिर्फ़ टैग करना चाहते हैं',
						checked : Twinkle.getPref('deleteSysopDefaultToTag'),
						event: function( event ) {
							// enable/disable notify checkbox
							event.target.form.notify.disabled = !event.target.checked;
							event.target.form.notify.checked = event.target.checked;
							// enable/disable talk page checkbox
							if (event.target.form.talkpage) {
								event.target.form.talkpage.disabled = event.target.checked;
								event.target.form.talkpage.checked = !event.target.checked && Twinkle.getPref('deleteTalkPageOnDelete');
							}
							// enable/disable redirects checkbox
							event.target.form.redirects.disabled = event.target.checked;
							event.target.form.redirects.checked = !event.target.checked;
							// enable/disable multiple
							$(event.target.form).find('input[name="csd"][value="अनेक"]')[0].disabled = !event.target.checked;
							event.stopPropagation();
						}
					}
				]
			} );
		form.append( { type: 'header', label: 'हटाने सम्बंधित विकल्प' } );
		if (mw.config.get('wgNamespaceNumber') % 2 === 0 && (mw.config.get('wgNamespaceNumber') !== 2 || (/\//).test(mw.config.get('wgTitle')))) {  // hide option for user pages, to avoid accidentally deleting user talk page
			form.append( {
				type: 'checkbox',
				list: [
					{
						label: 'वार्ता पृष्ठ भी हटाएँ',
						value: 'talkpage',
						name: 'talkpage',
						tooltip: "यह विकल्प पृष्ठ के साथ-साथ उसके वार्ता पृष्ठ को भी हटाता है।",
						checked: Twinkle.getPref('deleteTalkPageOnDelete'),
						disabled: Twinkle.getPref('deleteSysopDefaultToTag'),
						event: function( event ) {
							event.stopPropagation();
						}
					}
				]
			} );
		}
		form.append( {
				type: 'checkbox',
				list: [
					{
						label: 'सभी पुनर्निर्देश भी हटाएँ',
						value: 'redirects',
						name: 'redirects',
						tooltip: "यह विकल्प पृष्ठ को आ रहे सभी पुनार्निर्देशों को भी हटाता है। यदि लेख का विषय ज्ञानकोशीय हो तो आम तौर पर ऐसा नहीं किया जाना चाहिये।",
						checked: true,
						disabled: Twinkle.getPref('deleteSysopDefaultToTag'),
						event: function( event ) {
							event.stopPropagation();
						}
					}
				]
			} );
		form.append( { type: 'header', label: 'टैग संबंधी विकल्प' } );
	}

	// don't show this notification checkbox for db-multiple, as the value is ignored
	// XXX currently not possible to turn off notification when using db-multiple
	if (firstTime) {
		form.append( {
				type: 'checkbox',
				list: [
					{
						label: 'यदि संभव हो तो पृष्ठ निर्माता को सूचित करें',
						value: 'notify',
						name: 'notify',
						tooltip: "यदि यह विकल्प सक्षम है, और आपके Twinkle Preferences में सूचना देना सक्षम है, तो पृष्ठ निर्माता के वार्ता पृष्ठ पर एक सूचना साँचा जोड़ दिया जाएगा। " +
							"यदि आपके Twinkle Preferences में आपके द्वारा चुने मापदंड के लिये स्वागत सक्षम है, तो सदस्य का स्वागत भी किया जाएगा।",
						checked: !Morebits.userIsInGroup( 'sysop' ) || Twinkle.getPref('deleteSysopDefaultToTag'),
						disabled: Morebits.userIsInGroup( 'sysop' ) && !Twinkle.getPref('deleteSysopDefaultToTag'),
						event: function( event ) {
							event.stopPropagation();
						}
					}
				]
			}
		);
	} else {
		form.append( { type:'header', label: '{{शीह-अनेक}} के साथ टैगिंग' } );
	}

	if (firstTime) {
		form.append( { type: 'radio', name: 'csd',
			list: [
				{
					label: 'अनेक मापदंडों के साथ टैग करें',
					value: 'अनेक',
					tooltip: 'Twinkle की विंडो की एक श्रृंखला को खोलता है, जिससे आप उन मापदंडों को निर्दिष्ट कर सकते हैं जिनसे आप इस पृष्ठ को टैग करना चाहते हैं।',
					disabled: Morebits.userIsInGroup('sysop') && !Twinkle.getPref('deleteSysopDefaultToTag')
				}
			]
		} );
	} else if (Twinkle.speedy.dbmultipleparams.length > 0) {
		form.append( { type: 'radio', name: 'csd',
			list: [
				{
					label: 'कोई और मापदंड लागू नहीं होते - टैगिंग समाप्त करें',
					value: 'multiple-finish'
				}
			]
		} );
	}

	var namespace = mw.config.get('wgNamespaceNumber');
	if (namespace % 2 === 1 && namespace !== 3) {  // talk pages, but not user talk pages
		form.append( { type: 'header', label: 'वार्ता पृष्ठ' } );
		form.append( { type: 'radio', name: 'csd', list: Twinkle.speedy.talkList } );
	}

	switch (namespace) {
		case 0:  // article
		case 1:  // talk
			form.append( { type: 'header', label: 'लेख' } );
			form.append( { type: 'radio', name: 'csd', list: Twinkle.speedy.getArticleList(!firstTime) } );
			break;

		case 2:  // user
		case 3:  // user talk
			form.append( { type: 'header', label: 'सदस्य पृष्ठ' } );
			form.append( { type: 'radio', name: 'csd', list: Twinkle.speedy.getUserList(!firstTime) } );
			break;

		case 6:  // file
		case 7:  // file talk
			form.append( { type: 'header', label: 'फ़ाइलें' } );
			form.append( { type: 'radio', name: 'csd', list: Twinkle.speedy.getFileList(!firstTime) } );
			break;

		case 10:  // template
		case 11:  // template talk
			form.append( { type: 'header', label: 'साँचे' } );
			form.append( { type: 'radio', name: 'csd', list: Twinkle.speedy.templateList } );
			break;

		default:
			break;
	}

	form.append( { type: 'header', label: 'वैश्विक मापदंड' } );
	form.append( { type: 'radio', name: 'csd', list: Twinkle.speedy.getGeneralList(!firstTime) });

	var result = form.render();
	if (dialog)
	{
		// render new dialog
		dialog.setContent( result );
		dialog.display();
	}
	else
	{
		// place the form content into the existing dialog box
		content.textContent = ''; // clear children
		content.appendChild(result);
	}
};

Twinkle.speedy.talkList = [
	{
		label: 'हटाए गए पृष्ठों के वार्ता पृष्ठ',
		value: 'talk',
		tooltip: 'इसमें ऐसे कोई भी वार्ता पृष्ठ नहीं आते जिनसे विकिपीडिया को कोई फ़ायदा हो - खासकर सदस्य वार्ता पृष्ठ और वार्ता पुरालेख।'
	}
];

// this is a function to allow for db-multiple filtering
Twinkle.speedy.getFileList = function twinklespeedyGetFileList(multiple) {
	var result = [];
	result.push({
		label: 'फ़1. 14 दिन से अधिक समय तक कोई लाइसेंस न होना',
		value: 'लाइसेंस',
		tooltip: 'इसमें वे सभी फाइलें आती हैं जिनमें अपलोड होने से दो सप्ताह के बाद तक भी कोई लाइसेंस नहीं दिया गया है। ऐसा होने पर यदि फ़ाइल पुरानी होने के कारण सार्वजनिक क्षेत्र(पब्लिक डोमेन) में नहीं होगी, तो उसे शीघ्र हटा दिया जाएगा।'
	});
	if (!multiple) {
	result.push({
		label: 'फ़2. चित्र का विकिमीडिया कॉमन्स पर स्रोत और लाइसेंस जानकारी सहित उपलब्ध होना',
		value: 'कॉमन्स',
		tooltip: 'ऐसी फ़ाइलों को हटाने से पहले जाँच लें  कि कॉमन्स पर स्रोत और लाइसेंस जानकारी सही हो, और यदि कॉमन्स पर फ़ाइल का नाम विकिपीडिया पर फ़ाइल के नाम से भिन्न है तो विकिपीडिया की फ़ाइल की जगह सभी जगह कॉमन्स की फ़ाइल का प्रयोग करें।'
	});
	}
		result.push({
			label: 'फ़3. अप्रयुक्त ग़ैर मुक्त उचित उपयोग फ़ाइल',
			value: 'अप्रयुक्त ग़ैर मुक्त',
			tooltip: 'इस मापदंड के अंतर्गत वे फ़ाइलें आती हैं जो कॉपीराइट सुरक्षित हैं और उचित उपयोग हेतु विकिपीडिया पर डाली गई हैं, परंतु जिनका कोई उपयोग न किया जा रहा है और न ही होने की संभावना है।'
		});
	result.push({
		label: 'फ़4. ग़ैर मुक्त उचित उपयोग उपयोग फ़ाइल जिसपर कोई उचित उपयोग औचित्य न दिया हो',
		value: 'औचित्य',
		tooltip: 'ऐसी कॉपीराइट सुरक्षित फ़ाइलें जिनपर 7 दिन तक कोई उचित उपयोग औचित्य न दिया हो, उन्हें इस मापदंड के अंतर्गत हटाया जा सकता है।'
	});
	result.push({
		label: 'फ़5. ग़ैर मुक्त फ़ाइलें जिनका मुक्त विकल्प उपलब्ध हो',
		value: 'मुक्त विकल्प',
		tooltip: 'इस मापदंड के अंतर्गत वे फ़ाइलें आती हैं जो ग़ैर मुक्त हैं और जिनका कोई मुक्त विकल्प उपलब्ध है। यह आवश्यक नहीं कि मुक्त विकल्प हूबहू वही फ़ाइल हो।'
	});
	result.push({
		label: 'फ़6. फ़ालतू फ़ाइलें',
		value: 'फ़ालतू',
		tooltip: 'इस मापदंड के अंतर्गत वे फ़ाइलें आती हैं जिनका कोई प्रयोग नहीं हो रहा है और जिनका कोई ज्ञानकोशीय प्रयोग नहीं किया जा सकता है। इसमें चित्र, ध्वनियाँ एवं वीडियो फ़ाइलें नहीं आती हैं।'
	});
	if (!multiple) {
	result.push({
		label: 'व6फ़. साफ़ कॉपीराइट उल्लंघन - फ़ाइलें',
		value: 'कॉपीराइट फ़ाइल',
		tooltip: 'वे सभी फ़ाइलें जो अंतरजाल पर किसी ऐसी वेबसाइट से लिये गए हैं जो साफ़-साफ़ फ़ाइल को मुक्त लाइसेंस के अंतर्गत नहीं देती है। इसमें वे फ़ाइलें भी आती हैं जिनका कॉपीराइट स्वयं अपलोडर के पास है और सदस्य ने उसका पहला प्रकाशन किसी मुक्त लाइसेंस के अंतर्गत नहीं किया है।'
	});
	}
	return result;
};

Twinkle.speedy.getArticleList = function twinklespeedyGetArticleList(multiple) {
	var result = [];
	result.push({
		label: 'ल1. पूर्णतया अन्य भाषा में लिखे लेख',
		value: 'अन्य भाषा',
		tooltip: 'इसमें वे लेख आते हैं जो पूर्णतया हिन्दी के अलावा किसी और भाषा में लिखे हुए हैं, चाहे उनका नाम हिन्दी में हो या किसी और भाषा में।'
	});
	result.push({
		label: 'ल2. साफ़ प्रचार',
		value: 'प्रचार',
		tooltip: 'इसमें वे सभी पृष्ठ आते हैं जिनमें केवल प्रचार है, चाहे वह किसी व्यक्ति-विशेष का हो, किसी समूह का, किसी प्रोडक्ट का, अथवा किसी कंपनी का। इसमें प्रचार वाले केवल वही लेख आते हैं जिन्हें ज्ञानकोष के अनुरूप बनाने के लिये शुरू से दोबारा लिखना पड़ेगा।'
	});
	result.push({
		label: 'ल4. प्रतिलिपि लेख',
		value: 'प्रतिलिपि',
		tooltip: 'इस मापदंड के अंतर्गत वो लेख आते हैं जो किसी पुराने लेख की प्रतिलिपि हैं। इसमें वे लेख भी आते हैं जो किसी ऐसे विषय पर बनाए गए हैं जिनपर पहले से लेख मौजूद है और पुराना लेख नए लेख से बेहतर है।'
	});
	if (!multiple) {
		result.push({
			label: 'व6ल. साफ़ कॉपीराइट उल्लंघन - लेख',
			value: 'कॉपीराइट लेख',
			tooltip: 'इस मापदंड में वे सभी पृष्ठ आते हैं जो साफ़ तौर पर कॉपीराइट उल्लंघन हैं और जिनके इतिहास में उल्लंघन से मुक्त कोई भी अवतरण नहीं है।'
		});
	}
	return result;
};

Twinkle.speedy.getUserList = function twinklespeedyGetUserList(multiple) {
	var result = [];
	result.push({
		label: 'स1. सदस्य अनुरोध',
		value: 'सदस्य अनुरोध',
		tooltip: 'यदि सदस्य अपने सदस्य पृष्ठ, वार्ता पृष्ठ अथवा किसी उपपृष्ठ को हटाने का स्वयं अनुरोध करता है तो उस पृष्ठ को शीघ्र हटाया जा सकता है।'
	});
	result.push({
		label: 'स2. अस्तित्वहीन सदस्यों के सदस्य पृष्ठ अथवा उपपृष्ठ',
		value: 'अस्तित्वहीन',
		tooltip: 'ऐसे सदस्यों के पृष्ठ, वार्ता पृष्ठ अथवा उपपृष्ठ जो विकिपीडिया पर पंजीकृत नहीं हैं; इस मापदंड के अंतर्गत शाघ्र हटाए जा सकते हैं।'
	});
	if (!multiple) {
		result.push({
			label: 'व6स. साफ़ कॉपीराइट उल्लंघन - सदस्य पृष्ठ',
			value: 'कॉपीराइट सदस्य',
			tooltip: 'सदस्य अपने सदस्य पृष्ठ, वार्ता पृष्ठ अथवा किसी उपपृष्ठ पर कॉपीराइट सामग्री नहीं रख सकते और ऐसे पृष्ठों को शीघ्र हटाया जा सकता है। इसमें ऐसे पृष्ठ भी आते हैं जिनमें मुख्य रूप से "ग़ैर मुक्त उचित उपयोग चित्रों" की दीर्घा(गैलरी) हो, क्योंकि ऐसे चित्रों का सदस्य नामस्थान में प्रयोग विकिपीडिया की नीतियों के विरुद्ध है।'
		});
	}
	return result;
};

Twinkle.speedy.templateList = [
	{
		label: 'सा1. अप्रयुक्त साँचे जिनकी जगह किसी बेहतर साँचे ने ले ली है',
		value: 'पुराना साँचा',
		tooltip: 'इसके अंतर्गत वे सभी साँचे आते हैं जो अब प्रयोग में नहीं हैं और जिनकी जगह उनसे बेहतर किसी साँचे ने ले ली है। यदि नए साँचे के बेहतर होने पर विवाद हो, अथवा साँचा प्रयोग में हो तो हटाने हेतु चर्चा प्रक्रिया का प्रयोग करें।'
	}
];

Twinkle.speedy.getGeneralList = function twinklespeedyGetGeneralList(multiple) {
	var result = [];
	if (!multiple) {
		result.push({
			label: 'विशिष्ट कारण' + (Morebits.userIsInGroup('sysop') ? ' (हटाने का विशेष कारण)' : ' {'+'{शीह}} साँचे का प्रयोग करते हुए'),
			value: 'कारण',
			tooltip: '{'+'{शीह}} "शीघ्र हटाएँ" का लघु रूप है। ऐसे नामांकन में भी शीघ्र हटाने का कोई मापदंड लागू होना चाहिये। यदि कोई मापदंड लागू नहीं होता, तो पृष्ठ हटाने हेतु चर्चा का प्रयोग करें।'
		});
	}
	result.push({
		label: 'व1. अर्थहीन नाम अथवा सम्पूर्णतया अर्थहीन सामग्री वाले पृष्ठ',
		value: 'अर्थहीन',
		tooltip: 'इसमें वे पृष्ठ आते हैं जिनका नाम अर्थहीन है; अथवा जिनमें सामग्री अर्थहीन है, चाहे उसका नाम अर्थहीन न हो।'
	});
	result.push({
		label: 'व2. परीक्षण पृष्ठ',
		value: 'परीक्षण',
		tooltip: 'इसमें वे पृष्ठ आते हैं जिन्हें परीक्षण के लिये बनाया गया है, अर्थात यह जानने के लिये कि सचमुच सदस्य वहाँ बदलाव कर सकता है या नहीं। इस मापदंड के अंतर्गत सदस्यों के उपपृष्ठ नहीं आते।'
	});
	result.push({
		label: 'व3. साफ़ बर्बरता',
		value: 'बर्बरता',
		tooltip: 'इस मापदंड के अंतर्गत ऐसे पृष्ठ आते हैं जिनपर केवल बर्बरता हो। इसमें केवल वही पृष्ठ आते हैं जिनके इतिहास में बर्बरता मुक्त कोई भी अवतरण न हो।'
	});
	result.push({
		label: 'व4. साफ़ धोखा',
		value: 'धोखा',
		tooltip: 'इस मापदंड के अंतर्गत वे पृष्ठ आते हैं जिनपर साफ़ दिखाई दे रहा धोखा हो।'
	});
	result.push({
		label: 'व5. ख़ाली पृष्ठ',
		value: 'खाली',
		tooltip: 'इसमें वे सभी पृष्ठ आते हैं जिनमें कोई सामग्री नहीं है, और न ही किसी पुराने अवतरण में थी।'
	});
	if (!multiple) {
		result.push({
			label: 'व6. साफ़ कॉपीराइट उल्लंघन',
			value: 'कॉपीराइट',
			tooltip: 'इस मापदंड में वे सभी पृष्ठ आते हैं जो साफ़ तौर पर कॉपीराइट उल्लंघन हैं और जिनके इतिहास में उल्लंघन से मुक्त कोई भी अवतरण नहीं है। इसमें वे पृष्ठ भी आते हैं जिनपर डाली गई सामग्री का कॉपीराइट स्वयं उसी सदस्य के पास है और सदस्य ने उसका पहला प्रकाशन किसी मुक्त लाइसेंस के अंतर्गत नहीं किया है। इस मापदंड का प्रयोग तभी किया जाना चाहिये यदि पृष्ठ व6ल, व6फ़, अथवा व6स के अंतर्गत न आता हो।'
		});
	}
	return result;
};

Twinkle.speedy.normalizeHash = {
	'कारण': 'शीह',
	'अनेक': 'अनेक',
	'multiple-finish': 'multiple-finish',
	'अर्थहीन': 'व1',
	'परीक्षण': 'व2',
	'बर्बरता': 'व3',
	'धोखा': 'व4',
	'खाली': 'व5',
	'कॉपीराइट': 'व6',
	'कॉपीराइट लेख': 'व6ल',
	'कॉपीराइट फ़ाइल': 'व6फ़',
	'कॉपीराइट सदस्य': 'व6स',
	'अन्य भाषा': 'ल1',
	'प्रचार': 'ल2',
	'प्रतिलिपि': 'ल4',
	'लाइसेंस': 'फ़1',
	'कॉमन्स': 'फ़2',
	'अप्रयुक्त ग़ैर मुक्त': 'फ़3',
	'औचित्य': 'फ़4',
	'मुक्त विकल्प': 'फ़5',
	'फ़ालतू': 'फ़6',
	'पुराना साँचा': 'सा1',
	'सदस्य अनुरोध': 'स1',
	'अस्तित्वहीन': 'स2',
	'talk': ''
};

// keep this synched with [[MediaWiki:Deletereason-dropdown]]
Twinkle.speedy.reasonHash = {
	'कारण': '',
// General
	'अर्थहीन': 'अर्थहीन नाम अथवा सम्पूर्णतया अर्थहीन सामग्री वाले पृष्ठ',
	'परीक्षण': 'परीक्षण पृष्ठ',
	'बर्बरता': 'साफ़ बर्बरता',
	'धोखा': 'साफ़ धोखा',
	'खाली': 'ख़ाली पृष्ठ',
	'कॉपीराइट': 'साफ़ कॉपीराइट उल्लंघन',
	'कॉपीराइट लेख': 'साफ़ कॉपीराइट उल्लंघन - लेख',
	'कॉपीराइट फ़ाइल': 'साफ़ कॉपीराइट उल्लंघन - फ़ाइलें',
	'कॉपीराइट सदस्य': 'साफ़ कॉपीराइट उल्लंघन - सदस्य पृष्ठ',
// Articles
	'अन्य भाषा': 'पूर्णतया अन्य भाषा में लिखे पृष्ठ',
	'प्रचार': 'साफ़ प्रचार',
	'प्रतिलिपि': 'प्रतिलिपि लेख',
// Images and media
	'लाइसेंस': '14 दिन से अधिक समय तक कोई लाइसेंस न होना',
	'कॉमन्स': 'चित्र का विकिमीडिया कॉमन्स पर स्रोत और लाइसेंस जानकारी सहित उपलब्ध होना',
	'अप्रयुक्त ग़ैर मुक्त': 'अप्रयुक्त ग़ैर मुक्त उचित उपयोग फ़ाइल',
	'औचित्य': 'ग़ैर मुक्त उचित उपयोग उपयोग फ़ाइल जिसपर कोई उचित उपयोग औचित्य न दिया हो',
	'मुक्त विकल्प': 'ग़ैर मुक्त फ़ाइलें जिनका मुक्त विकल्प उपलब्ध हो',
	'फ़ालतू': 'फ़ालतू फ़ाइलें',
// Templates
	'पुराना साँचा': 'अप्रयुक्त साँचे जिनकी जगह किसी बेहतर साँचे ने ले ली है',
// User pages
	'सदस्य अनुरोध': 'सदस्य अनुरोध',
	'अस्तित्वहीन': 'अस्तित्वहीन सदस्यों के सदस्य पृष्ठ अथवा उपपृष्ठ',
//other
	'talk': 'हटाए गए पृष्ठ का वार्ता पृष्ठ'
};

Twinkle.speedy.callbacks = {
	sysop: {
		main: function( params ) {

			var thispage = new Morebits.wiki.page( mw.config.get('wgPageName'), "पृष्ठ हटाया जा रहा है" );
			var presetreason = "[[वि:हटाना#" + params.normalized + "|" + params.normalized + "]]." + params.reason;
			var statelem = thispage.getStatusElement();

			params.input = Twinkle.speedy.getParameters(params.value, params.normalized, statelem);	
			
			if(!Twinkle.speedy.cont) {
			return;
			}
			
			// delete page
			var reason;
			switch(params.normalized) {
				case 'शीह':
					reason = params.input.name + params.dbreason;
					break;
				case 'talk':
					reason = params.reason;
					break;
				default:
					reason = presetreason;
					params.input.val = '';
					$.each(params.input, function(prop, val){
					if (typeof val === 'string' && prop!== 'name' && prop!== 'val' && val!=="") {
						params.input.val += " " + val + " ";
						}
					});
					if (params.input.val!=='') {
					reason+=params.input.val;
					}
					break;
			}

			thispage.setEditSummary( reason + Twinkle.getPref('deletionSummaryAd') );
			thispage.deletePage();

			// delete talk page
			if (params.deleteTalkPage &&
			    document.getElementById( 'ca-talk' ).className !== 'new') {
				var talkpage = new Morebits.wiki.page( Morebits.wikipedia.namespaces[ mw.config.get('wgNamespaceNumber') + 1 ] + ':' + mw.config.get('wgTitle'), "वार्ता पृष्ठ हटाया जा रहा है" );
				talkpage.setEditSummary('हटाए गए पृष्ठ [[' + mw.config.get('wgPageName') + "]] का वार्ता पृष्ठ। " + Twinkle.getPref('deletionSummaryAd'));
				talkpage.deletePage();
			}

			// promote Unlink tool
			var $link, $bigtext;
			if( mw.config.get('wgNamespaceNumber') === 6) {
				$link = $('<a/>', {
					'href': '#',
					'text': 'click here to go to the Unlink tool',
					'css': { 'fontSize': '130%', 'fontWeight': 'bold' },
					'click': function(){
						Morebits.wiki.actionCompleted.redirect = null;
						Twinkle.speedy.dialog.close();
						Twinkle.unlink.callback("Removing usages of and/or links to deleted file " + mw.config.get('wgPageName'));
					}
				});
				$bigtext = $('<span/>', {
					'text': 'To orphan backlinks and remove instances of file usage',
					'css': { 'fontSize': '130%', 'fontWeight': 'bold' }
				});
				Morebits.status.info($bigtext[0], $link[0]);
			} else {
				$link = $('<a/>', {
					'href': '#',
					'text': 'click here to go to the Unlink tool',
					'css': { 'fontSize': '130%', 'fontWeight': 'bold' },
					'click': function(){
						Morebits.wiki.actionCompleted.redirect = null;
						Twinkle.speedy.dialog.close();
						Twinkle.unlink.callback("Removing links to deleted page " + mw.config.get('wgPageName'));
					}
				});
				$bigtext = $('<span/>', {
					'text': 'To orphan backlinks',
					'css': { 'fontSize': '130%', 'fontWeight': 'bold' }
				});
				Morebits.status.info($bigtext[0], $link[0]);
			}

			// open talk page of first contributor
			if( params.openusertalk ) {
				thispage = new Morebits.wiki.page( mw.config.get('wgPageName') );  // a necessary evil, in order to clear incorrect status text
				thispage.setCallbackParameters( params );
				thispage.lookupCreator( Twinkle.speedy.callbacks.sysop.openUserTalkPage );
			}

			// delete redirects
			if (params.deleteRedirects) {
				var query = {
					'action': 'query',
					'list': 'backlinks',
					'blfilterredir': 'redirects',
					'bltitle': mw.config.get('wgPageName'),
					'bllimit': 5000  // 500 is max for normal users, 5000 for bots and sysops
				};
				var wikipedia_api = new Morebits.wiki.api( 'getting list of redirects...', query, Twinkle.speedy.callbacks.sysop.deleteRedirectsMain,
					new Morebits.status( 'Deleting redirects' ) );
				wikipedia_api.params = params;
				wikipedia_api.post();
			}
		},
		openUserTalkPage: function( pageobj ) {
			pageobj.getStatusElement().unlink();  // don't need it anymore
			var user = pageobj.getCreator();
			var statusIndicator = new Morebits.status('Opening user talk page edit form for ' + user, 'opening...');

			var query = {
				'title': 'User talk:' + user,
				'action': 'edit',
				'preview': 'yes',
				'vanarticle': mw.config.get('wgPageName').replace(/_/g, ' ')
			};
			switch( Twinkle.getPref('userTalkPageMode') ) {
			case 'tab':
				window.open( mw.util.wikiScript('index') + '?' + Morebits.queryString.create( query ), '_tab' );
				break;
			case 'blank':
				window.open( mw.util.wikiScript('index') + '?' + Morebits.queryString.create( query ), '_blank', 'location=no,toolbar=no,status=no,directories=no,scrollbars=yes,width=1200,height=800' );
				break;
			case 'window':
				/* falls through */
				default :
				window.open( mw.util.wikiScript('index') + '?' + Morebits.queryString.create( query ), 'twinklewarnwindow', 'location=no,toolbar=no,status=no,directories=no,scrollbars=yes,width=1200,height=800' );
				break;
			}

			statusIndicator.info( 'complete' );
		},
		deleteRedirectsMain: function( apiobj ) {
			var xmlDoc = apiobj.getXML();
			var $snapshot = $(xmlDoc).find('backlinks bl');

			var total = $snapshot.length;

			if( !total ) {
				return;
			}

			var statusIndicator = apiobj.statelem;
			statusIndicator.status("0%");

			var onsuccess = function( apiobj ) {
				var obj = apiobj.params.obj;
				var total = apiobj.params.total;
				var now = parseInt( 100 * ++(apiobj.params.current)/total, 10 ) + '%';
				obj.update( now );
				apiobj.statelem.unlink();
				if( apiobj.params.current >= total ) {
					obj.info( now + ' (completed)' );
					Morebits.wiki.removeCheckpoint();
				}
			};

			Morebits.wiki.addCheckpoint();

			var params = $.extend( {}, apiobj.params );
			params.current = 0;
			params.total = total;
			params.obj = statusIndicator;

			$snapshot.each(function(key, value) {
				var title = $(value).attr('title');
				var page = new Morebits.wiki.page(title, 'Deleting redirect "' + title + '"');
				page.setEditSummary('हटाए गए पृष्ठ [[' + mw.config.get('wgPageName') + "]] को पुनर्निर्देश। " + Twinkle.getPref('deletionSummaryAd'));
				page.deletePage(onsuccess);
			});
		}
	},

	user: {
		main: function(pageobj) {
			var statelem = pageobj.getStatusElement();

			if (!pageobj.exists()) {
				statelem.error( "लगता है पृष्ठ अस्तित्व में नहीं है। इसे शायद पहले ही कोई हटा चुका है।" );
				return;
			}

			var text = pageobj.getPageText();
			var params = pageobj.getCallbackParameters();

			if(params.value!=='अनेक') {
			params.input = Twinkle.speedy.getParameters(params.value, params.normalized, statelem);
			}

			if(!Twinkle.speedy.cont) {
			return;
			}
			
			if(params.value!=='सदस्य अनुरोध') {
				if(Twinkle.speedy.self && Twinkle.getPref('NotifySelfSpeedy')) {
					if(params.value==='अनेक') {
						if(Twinkle.speedy.dbmultipleparams.indexOf('स1')=== -1) {
							if(!confirm('इस पृष्ठ के निर्माता आप ही हैं। क्या आप इसे शीघ्र हटाने हेतु नामांकित करना चाहते हैं?')) {
								return;
							}
						}
					}
					if(!confirm('इस पृष्ठ के निर्माता आप ही हैं। क्या आप इसे शीघ्र हटाने हेतु नामांकित करना चाहते हैं?')) {
						return;
					}
				}
			}
			
			statelem.status( 'Checking for tags on the page...' );
			
			// check for existing deletion tags
			var tag = /(\{\{(शीह|हटाएँ)-[a-zA-Z0-9\u0900-\u097F]*\}\})/.exec( text );
			if( tag ) {
				statelem.error( [ Morebits.htmlNode( 'strong', tag[1] ) , " पहले से पृष्ठ पर है।" ] );
				return;
			}

			var xfd = /(?:\{\{(हहेच (लेख|साँचा|श्रेणी|फ़ाइल|अन्य))[^{}]*?\}\})/i.exec( text );
			if( xfd && !confirm( "पृष्ठ पर हहेच साँचा {{" + xfd[1] + "}} पाया गया है। क्या आप अब भी शीघ्र हटाने का नामांकन जोड़ना चाहते हैं?" ) ) {
				return;
			}

			var code, parameters, i;
			if (params.normalized === 'अनेक') {
				code = "{{शीह-अनेक";
				for (i in Twinkle.speedy.dbmultipleparams) {
					if (typeof Twinkle.speedy.dbmultipleparams[i] === 'string') {
						code += "|" + Twinkle.speedy.dbmultipleparams[i];
					}
				}
			}
			else {
				code = "{{शीह-";
				if (params.value === 'talk') {
					code+= "कारण|हटाए गए पृष्ठ का वार्ता पृष्ठ";
				}
				else {
				code+= params.value;
				}
				for(var i in params.input) {
					if (typeof params.input[i] === 'string' && i!== 'name' && i!== 'val' && params.input[i]!=="") {
						code += "|" + params.input[i];
					}
				}
			}
			if (Twinkle.speedy.self) {
				code += "|स्वयं=हाँ";
			}
			code += "}}";

			var thispage = new Morebits.wiki.page(mw.config.get('wgPageName'));
			// patrol the page, if reached from Special:NewPages
			if( Twinkle.getPref('markSpeedyPagesAsPatrolled') ) {
				thispage.patrol();
			}

			// Notification to first contributor			
			if (params.usertalk) {
				Twinkle.speedy.callbacks.user.notifyuser (params);
			}
			// or, if not notifying, add this nomination to the user's userspace log without the initial contributor's name
			else if (params.lognomination) {
				Twinkle.speedy.callbacks.user.addToLog(params, null);
			}

			// Wrap SD template in noinclude tags if we are in template space.
			// Won't work with userboxes in userspace, or any other transcluded page outside template space
			if (mw.config.get('wgNamespaceNumber') === 10) {  // Template:
				code = "<noinclude>" + code + "</noinclude>";
			}

			// Remove tags that become superfluous with this action
			text = text.replace(/\{\{\s*(New unreviewed article|नया असमीक्षित लेख|Userspace draft)\s*(\|(?:\{\{[^{}]*\}\}|[^{}])*)?\}\}\s*/ig, "");
			if (mw.config.get('wgNamespaceNumber') === 6) {
				// remove "move to Commons" tag - deletion-tagged files cannot be moved to Commons
				text = text.replace(/\{\{(mtc|(copy |move )?to ?commons|move to wikimedia commons|copy to wikimedia commons)[^}]*}}/gi, "");
			}

			// Generate edit summary for edit
			var editsummary;
			switch (params.normalized)
			{
				case 'शीह':
					editsummary = '[[वि:हटाना#शीघ्र हटाना|शीघ्र हटाने]] का नामांकन। कारण: \"' + params.input.dbreason + '\"।';
					break;
				case 'अनेक':
					editsummary = 'शीघ्र हटाने का नामांकन (';
					for (i in Twinkle.speedy.dbmultipleparams) {
						if (typeof Twinkle.speedy.dbmultipleparams[i] === 'string' && Twinkle.speedy.dbmultipleparams[i].length <= 3 && Twinkle.speedy.dbmultipleparams[i].length >= 2 && !isNaN(Twinkle.speedy.dbmultipleparams[i].charAt(1))) {
							editsummary += '[[वि:हटाना#' + Twinkle.speedy.dbmultipleparams[i] + '|शीह ' + Twinkle.speedy.dbmultipleparams[i] + ']], ';
						}
					}
					editsummary = editsummary.substr(0, editsummary.length - 2); // remove trailing comma
					editsummary += ')।';
					break;
				case 'talk':
					editsummary = 'शीघ्र हटाने का नामांकन (हटाए गए पृष्ठ का वार्ता पृष्ठ)';
					break;
				default:
					editsummary = "शीघ्र हटाने का नामांकन ([[वि:हटाना#" + params.normalized + "|शीह " + params.normalized + "]]).";
					break;
			}

			pageobj.setPageText(code + "\n" + text);
			pageobj.setEditSummary(editsummary + Twinkle.getPref('summaryAd'));
			pageobj.setWatchlist(params.watch);
			pageobj.setCreateOption('nocreate');
			if (!params.usertalk && !params.lognomination && !Twinkle.speedy.cont) {
			return;}
			pageobj.save();
		},
		notifyuser: function (params) {
			// don't notify users when their user talk page is nominated, or if the user is the creator
			if (Twinkle.speedy.initialContrib === mw.config.get('wgTitle') && mw.config.get('wgNamespaceNumber') === 3) {
				Status.warn("सूचना साँचा नहीं जोड़ा जाएगा।"); 
				return;
			}
			
			if(Twinkle.speedy.self && Twinkle.getPref('NotifySelfSpeedy')) {
				alert('आपको सूचित किया जाता है कि आपके बनाए इस पृष्ठ को शीघ्र हटाने हेतु नामांकित किया गया है। आपके वार्ता पृष्ठ पर सूचना साँचा नहीं जोड़ा जाएगा।');
				return;
			}
			
			var usertalkpage = new Morebits.wiki.page('सदस्य वार्ता:' + Twinkle.speedy.initialContrib, "पृष्ठ निर्माता को सूचित किया जा रहा है (" + Twinkle.speedy.initialContrib + ")");
			var notifytext = "\n\n{{subst:शीह सूचना-";

			// specialcase "db" and "talk"
			switch (params.value)
			{
				case 'कारण':
					notifytext += "कारण|" + mw.config.get('wgPageName');
					break;
				case 'talk':
					notifytext += "कारण|" + mw.config.get('wgPageName') + "|हटाए गए पृष्ठ का वार्ता पृष्ठ";
					break;
				default:
					notifytext += params.normalized + "|" + mw.config.get('wgPageName');
					break;
			}
			if (params.normalized!== 'अनेक') {
				for (var i in params.input) {
					if (typeof params.input[i] === 'string' && i!=='name' && params.normalized!==('व6' || 'व6ल' || 'व6फ़' || 'व6स') && params.input[i]!=='') {
						notifytext += '|' + params.input[i];
					}
				}
			}
			else {
				for (var i in Twinkle.speedy.dbmultipleparams) {
					if (typeof Twinkle.speedy.dbmultipleparams[i] === 'string') {
					notifytext+= '|' + Twinkle.speedy.dbmultipleparams[i];
					}
				}
			}
			notifytext +="}}~~~~";

			usertalkpage.setAppendText(notifytext);
			usertalkpage.setEditSummary("सूचना: [[" + mw.config.get('wgPageName') + "]] को शीघ्र हटाने का नामांकन।" + Twinkle.getPref('summaryAd'));
			usertalkpage.setCreateOption('recreate');
			usertalkpage.setFollowRedirect(true);

			if(!Twinkle.speedy.cont) {
				return;
			}

			usertalkpage.append();

			// add this nomination to the user's userspace log, if the user has enabled it
			if (params.lognomination) {
				Twinkle.speedy.callbacks.user.addToLog(params);
			}
		},

		// the params used are:
		//   for all: params.normalized
		//   for CSD: params.value
		addToLog: function(params) {
			var wikipedia_page = new Morebits.wiki.page("सदस्य:" + mw.config.get('wgUserName') + "/" + Twinkle.getPref('speedyLogPageName'), "Adding entry to userspace log");
			wikipedia_page.setCallbackParameters(params);
			wikipedia_page.load(Twinkle.speedy.callbacks.user.saveLog);
		},

		saveLog: function(pageobj) {
			var text = pageobj.getPageText();
			var params = pageobj.getCallbackParameters();

			// add blurb if log page doesn't exist
			if (!pageobj.exists()) {
				text =
					"ये इस सदस्य द्वारा ट्विंकल के प्रयोग से किये गए सभी [[वि:हटाना#शीघ्र हटाना|शीघ्र हटाने]] के नामांकनों का लॉग है।\n\n" +
					"यदि आप यह लॉग अब नहीं रखना चाहते, तो आप [[वि:Twinkle/Preferences|preferences panel]] का प्रयोग कर के इसमें अद्यतन बंद कर सकते हैं, और " +
					"[[वि:हटाना#स1|स1]] के अंतर्गत इसे शीघ्र हटाने के लिये नामांकित कर सकते हैं।\n";
				if (Morebits.userIsInGroup("sysop") ) {
					text += "\nयह लॉग ट्विंकल के प्रयोग से सीधे हटाए गए पृष्ठों को नहीं दिखाता।\n";
				}
			}

			// create monthly header
			var date = new Date();
			var headerRe = new RegExp("^==+\\s*" + date.getUTCMonthName() + "\\s+" + date.getUTCFullYear() + "\\s*==+", "m");
			if (!headerRe.exec(text)) {
				text += "\n\n=== " + date.getUTCMonthName() + " " + date.getUTCFullYear() + " ===";
			}

			text += "\n# [[:" + mw.config.get('wgPageName') + "]]: ";
			switch (params.normalized)
			{
				case 'शीह':
					text += "{{tl|शीह-कारण}}";
					break;
				case 'अनेक':
					text += "अनेक मापदंड (";
					for (var i in Twinkle.speedy.dbmultipleparams) {
						if (typeof Twinkle.speedy.dbmultipleparams[i] === 'string' && Twinkle.speedy.dbmultipleparams[i].length <= 3 && Twinkle.speedy.dbmultipleparams[i].length >= 2 && !isNaN(Twinkle.speedy.dbmultipleparams[i].charAt(1))) {
							text += '[[वि:हटाना#' + Twinkle.speedy.dbmultipleparams[i] + '|' + Twinkle.speedy.dbmultipleparams[i] + ']], ';
						}
					}
					text = text.substr(0, text.length - 2);  // remove trailing comma
					text += ')';
					break;
				default:
					text += "[[वि:हटाना#" + params.normalized + "|शीह " + params.normalized + "]] ({{tl|शीह-" + params.value + "}})";
					break;
			}

			if (Twinkle.speedy.initialContrib) {
				text += "; {{सदस्य|" + Twinkle.speedy.initialContrib + "}} को सूचित किया";
			}
			text += " ~~~~~\n";

			pageobj.setPageText(text);
			pageobj.setEditSummary("[[" + mw.config.get('wgPageName') + "]] के शीघ्र हटाने के नामांकन का लॉग।" + Twinkle.getPref('summaryAd'));
			pageobj.setCreateOption("recreate");
			if (!Twinkle.speedy.cont) {
				return;
			}
			pageobj.save();
		}
	}
};

// prompts user for parameters to be passed into the speedy deletion tag
Twinkle.speedy.getParameters = function twinklespeedyGetParameters(value, normalized, statelem)
{
	var parameters = {};
	Twinkle.speedy.cont = true;
	switch( normalized ) {
		case 'शीह':
			var dbrationale = prompt('कृपया शीघ्र हटाने के लिये कारण दें।   \n\"यह पृष्ठ शीघ्र हटाने योग्य है क्योंकि:\"', "");
			if (!dbrationale || !dbrationale.replace(/^\s*/, "").replace(/\s*$/, ""))
			{
				statelem.error( 'कारण बताना आवश्यक है।  नामांकन रोक दिया गया है।' );
				Twinkle.speedy.cont = false;
			}
			parameters.name = "कारण";
			parameters.dbreason = dbrationale;
			break;
		case 'व6':
		case 'व6ल':
		case 'व6फ़':
		case 'व6स':
			var url = prompt( 'कृपया स्रोत यू॰आर॰एल बताएँ, http समेत', "" );
			
			if (url === "")
			{
				statelem.error( 'आपने स्रोत यू॰आर॰एल नहीं दिया है। नामांकन रोक दिया गया है।' );
				Twinkle.speedy.cont = false;
			}
			else if (url.indexOf("http")!==0)
			{
				statelem.error( 'आपने जो स्रोत यू॰आर॰एल दिया है, वह http से नहीं शुरू होता। नामांकन रोक दिया गया है।' );
				Twinkle.speedy.cont = false;
			}
			parameters.name = "स्रोत यू॰आर॰एल";
			parameters.source = url;
			break;
		case 'ल4':
			var article = prompt( 'कृपया मूल लेख का नाम बताएँ', "");
			var oarticle = new Morebits.wiki.page(article);
			if (article === "")
			{
				statelem.error( 'आपने मूल लेख का नाम नहीं दिया है। नामांकन रोक दिया गया है।' );
				Twinkle.speedy.cont = false;
			}
			oarticle.load(function loadsuccess() {
			if (!oarticle.exists())
				{
					statelem.error( 'आपने जो नाम दिया है, इस नाम का कोई लेख नहीं है। नामांकन रोक दिया गया है।' );
					Twinkle.speedy.cont = false;
				}
			});
			parameters.name = "मूल लेख";
			parameters.art = article;
			break;
		case 'फ़2':
			var cfile = prompt( 'कृपया कॉमन्स पर फ़ाइल का नाम बताएँ', "");
			
			if (cfile === "")
			{
				statelem.error( 'आपने कॉमन्स पर फ़ाइल का नाम नहीं दिया है। नामांकन रोक दिया गया है।' );
				Twinkle.speedy.cont = false;
			}
			parameters.name = "कॉमन्स पर फ़ाइल";
			parameters.cfile = cfile;
			break;
		case 'फ़5':
			var alternative = prompt( 'कृपया मुक्त विकल्प का नाम बताएँ।', "");
			
			if (alternative === "")
			{
				statelem.error( 'आपने मुक्त विकल्प का नाम नहीं दिया है। नामांकन रोक दिया गया है।' );
				Twinkle.speedy.cont = false;
			}
			parameters.name = "मुक्त विकल्प";
			parameters.altfile = alternative;
			break;
		case 'सा1':
			var bettertemplate = prompt( 'कृपया बेहतर साँचे का नाम बताएँ:', "" );
			if (bettertemplate === "")
			{
				statelem.error( 'आपने बेहतर साँचे का नाम नहीं दिया है। नामांकन रोक दिया गया है।' );
				Twinkle.speedy.cont = false;
			}
			parameters.name = "बेहतर साँचा";
			parameters.template = bettertemplate;
			break;
		default:
			break;
	}
	return parameters;
};

Twinkle.speedy.callback.evaluateSysop = function twinklespeedyCallbackEvaluateSysop(e)
{
	mw.config.set('wgPageName', mw.config.get('wgPageName').replace(/_/g, ' ')); // for queen/king/whatever and country!

	var tag_only = e.target.form.tag_only;
	if( tag_only && tag_only.checked ) {
		Twinkle.speedy.callback.evaluateUser(e);
		return;
	}

	var value = e.target.values;
	var normalized = Twinkle.speedy.normalizeHash[ value ];
	var params = {
		value: value,
		normalized: normalized,
		watch: Twinkle.getPref('watchSpeedyPages').indexOf( normalized ) !== -1,
		reason: Twinkle.speedy.reasonHash[ value ],
		openusertalk: Twinkle.getPref('openUserTalkPageOnSpeedyDelete').indexOf( normalized ) !== -1,
		deleteTalkPage: e.target.form.talkpage && e.target.form.talkpage.checked,
		deleteRedirects: e.target.form.redirects.checked
	};
	Morebits.status.init( e.target.form );

	Twinkle.speedy.callbacks.sysop.main( params );
};

Twinkle.speedy.callback.evaluateUser = function twinklespeedyCallbackEvaluateUser(e) {
	mw.config.set('wgPageName', mw.config.get('wgPageName').replace(/_/g, ' '));  // for queen/king/whatever and country!
	var value = e.target.values;

	if (value === 'अनेक')
	{
		e.target.form.style.display = "none"; // give the user a cue that the dialog is being changed
		setTimeout(function() {
			Twinkle.speedy.initDialog(Twinkle.speedy.callback.doMultiple, false, e.target.form.parentNode);
		}, 150);
		return;
	}

	if (value === 'multiple-finish') {
		value = 'अनेक';
	}
	else
	{
		// clear these out, whatever the case, to avoid errors
		Twinkle.speedy.dbmultipleparams = [];
	}

	var normalized = Twinkle.speedy.normalizeHash[ value ];
	var i;

	// analyse each db-multiple criterion to determine whether to watch the page/notify the creator
	var watchPage = false;
	if (value === 'अनेक')
	{
		for (i in Twinkle.speedy.dbmultipleparams)
		{
			if (typeof Twinkle.speedy.dbmultipleparams[i] === 'string' &&
				Twinkle.getPref('watchSpeedyPages').indexOf(Twinkle.speedy.dbmultipleparams[i]) !== -1)
			{
				watchPage = true;
				break;
			}
		}
	}
	else
	{
		watchPage = Twinkle.getPref('watchSpeedyPages').indexOf(normalized) !== -1;
	}

	var notifyuser = false;
	if (value === 'अनेक')
	{
		for (i in Twinkle.speedy.dbmultipleparams)
		{
			if (typeof Twinkle.speedy.dbmultipleparams[i] === 'string' &&
				Twinkle.getPref('notifyUserOnSpeedyDeletionNomination').indexOf(Twinkle.speedy.dbmultipleparams[i]) !== -1)
			{
				notifyuser = true;
				break;
			}
		}
	}
	else
	{
		notifyuser = (Twinkle.getPref('notifyUserOnSpeedyDeletionNomination').indexOf(normalized) !== -1) && e.target.form.notify.checked;
	}

/*
	var welcomeuser = false;
	if (notifyuser)
	{
		if (value === 'अनेक')
		{
			for (i in Twinkle.speedy.dbmultipleparams)
			{
				if (typeof Twinkle.speedy.dbmultipleparams[i] === 'string' &&
					Twinkle.getPref('welcomeUserOnSpeedyDeletionNotification').indexOf(Twinkle.speedy.dbmultipleparams[i]) !== -1)
				{
					welcomeuser = true;
					break;
				}
			}
		}
		else
		{
			welcomeuser = Twinkle.getPref('welcomeUserOnSpeedyDeletionNotification').indexOf(normalized) !== -1;
		}
	}
*/

	var csdlog = false;
	if (Twinkle.getPref('logSpeedyNominations') && value === 'अनेक')
	{
		for (i in Twinkle.speedy.dbmultipleparams)
		{
			if (typeof Twinkle.speedy.dbmultipleparams[i] === 'string' &&
				Twinkle.getPref('noLogOnSpeedyNomination').indexOf(Twinkle.speedy.dbmultipleparams[i]) === -1)
			{
				csdlog = true;
				break;
			}
		}
	}
	else
	{
		csdlog = Twinkle.getPref('logSpeedyNominations') && Twinkle.getPref('noLogOnSpeedyNomination').indexOf(normalized) === -1;
	}

	var params = {
		value: value,
		normalized: normalized,
		watch: watchPage,
		usertalk: notifyuser,
//		welcomeuser: welcomeuser,
		lognomination: csdlog
	};
	
	Morebits.status.init( e.target.form );

	Morebits.wiki.actionCompleted.redirect = mw.config.get('wgPageName');
	Morebits.wiki.actionCompleted.notice = "टैगिंग सम्पूर्ण, पृष्ठ कुछ ही क्षणों में रीलोड होगा";

	var wikipedia_page = new Morebits.wiki.page(mw.config.get('wgPageName'), "पृष्ठ टैग हो रहा है");
	wikipedia_page.setCallbackParameters(params);
	wikipedia_page.load(function (params) {
		wikipedia_page.lookupCreator(function() {
			Twinkle.speedy.initialContrib = wikipedia_page.getCreator();
			Twinkle.speedy.self = (Twinkle.speedy.initialContrib === mw.config.get('wgUserName')) ? true : false;
			Twinkle.speedy.callbacks.user.main(params);
		});
	});
};

Twinkle.speedy.dbmultipleparams = [];
Twinkle.speedy.callback.doMultiple = function twinklespeedyCallbackDoMultiple(e)
{
	var value = e.target.values;
	var normalized = Twinkle.speedy.normalizeHash[value];
	if (value !== 'multiple-finish')
	{
		if (Twinkle.speedy.dbmultipleparams.indexOf(normalized) !== -1)
		{
			alert('आप यह मापदंड पहले ही चुन चुके हैं। कृपया कोई अन्य मापदंड चुनें।');
		}
		else
		{
			var parameters = Twinkle.speedy.getParameters(value, normalized, Morebits.status);
			Twinkle.speedy.dbmultipleparams.push(normalized);
			$.each(parameters, function addparams(prop, val) {
				if (typeof val === 'string' && prop!== 'name') {
					Twinkle.speedy.dbmultipleparams.push(val);
				}
			});
		}
		e.target.form.style.display = "none"; // give the user a cue that the dialog is being changed
		setTimeout(function() {
			Twinkle.speedy.initDialog(Twinkle.speedy.callback.doMultiple, false, e.target.form.parentNode);
		}, 150);
	}
	else
	{
		Twinkle.speedy.callback.evaluateUser(e);
	}
};
