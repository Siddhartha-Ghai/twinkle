//<nowiki>


(function($){


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

	Twinkle.addPortletLink( Twinkle.speedy.callback, "शीह", "tw-csd", Morebits.userIsInGroup('sysop') ? "शीघ्र हटाने के मापदंडों अनुसार पृष्ठ को हटाएँ" : "शीघ्र हटाने का नामांकन करें" );
};

// This function is run when the CSD tab/header link is clicked
Twinkle.speedy.callback = function twinklespeedyCallback() {
	Twinkle.speedy.initDialog(Morebits.userIsInGroup( 'sysop' ) ? Twinkle.speedy.callback.evaluateSysop : Twinkle.speedy.callback.evaluateUser, true);
};

Twinkle.speedy.dialog = null;  // used by unlink feature

// Prepares the speedy deletion dialog and displays it
Twinkle.speedy.initDialog = function twinklespeedyInitDialog(callbackfunc) {
	var dialog;
	Twinkle.speedy.dialog = new Morebits.simpleWindow( Twinkle.getPref('speedyWindowWidth'), Twinkle.getPref('speedyWindowHeight') );
	dialog = Twinkle.speedy.dialog;
	dialog.setTitle( "शीघ्र हटाने के लिये मापदंड चुनें" );
	dialog.setScriptName( "Twinkle" );
	dialog.addFooterLink( "पृष्ठ हटाने की नीति", "वि:हटाना" );
	dialog.addFooterLink( "Twinkle help", "WP:TW/DOC#speedy" );

	var form = new Morebits.quickForm( callbackfunc, (Twinkle.getPref('speedySelectionStyle') === 'radioClick' ? 'change' : null) );
	if( Morebits.userIsInGroup( 'sysop' ) ) {
		form.append( {
				type: 'checkbox',
				list: [
					{
						label: 'केवल टैग करें',
						value: 'tag_only',
						name: 'tag_only',
						tooltip: 'यदि आप पृष्ठ को हटाने के बजाए सिर्फ़ टैग करना चाहते हैं',
						checked : Twinkle.getPref('deleteSysopDefaultToTag'),
						event: function( event ) {
							var cForm = event.target.form;
							var cChecked = event.target.checked;
							// enable/disable talk page checkbox
							if (cForm.talkpage) {
								cForm.talkpage.disabled = cChecked;
								cForm.talkpage.checked = !cChecked && Twinkle.getPref('deleteTalkPageOnDelete');
							}
							// enable/disable redirects checkbox
							cForm.redirects.disabled = cChecked;
							cForm.redirects.checked = !cChecked;

							// enable/disable notify checkbox
							cForm.notify.disabled = !cChecked;
							cForm.notify.checked = cChecked;
							// enable/disable multiple
							cForm.multiple.disabled = !cChecked;
							cForm.multiple.checked = false;

							Twinkle.speedy.callback.dbMultipleChanged(cForm, false);

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
						checked: Twinkle.getPref('deleteRedirectsOnDelete'),
						disabled: Twinkle.getPref('deleteSysopDefaultToTag'),
						event: function( event ) {
							event.stopPropagation();
						}
					}
				]
			} );
		form.append( { type: 'header', label: 'टैग संबंधी विकल्प' } );
	}

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
		} );
	form.append( {
			type: 'checkbox',
			list: [
				{
					label: 'अनेक मापदंडों के साथ टैग करें',
					value: 'अनेक',
					name: 'multiple',
					tooltip: "इसे चुन के आप पृष्ठ पर लागू होने वाले अनेक मापदंड निर्दिष्ट कर सकते हैं।",
					disabled: Morebits.userIsInGroup( 'sysop' ) && !Twinkle.getPref('deleteSysopDefaultToTag'),
					event: function( event ) {
						Twinkle.speedy.callback.dbMultipleChanged( event.target.form, event.target.checked );
						event.stopPropagation();
					}
				}
			]
		} );

	form.append( {
			type: 'div',
			name: 'work_area',
			label: 'Failed to initialize the CSD module. Please try again, or tell the Twinkle developers about the issue.'
		} );

	if( Twinkle.getPref( 'speedySelectionStyle' ) !== 'radioClick' ) {
		form.append( { type: 'submit' } );
	}

	var result = form.render();
	dialog.setContent( result );
	dialog.display();

	Twinkle.speedy.callback.dbMultipleChanged( result, false );
};

Twinkle.speedy.callback.dbMultipleChanged = function twinklespeedyCallbackDbMultipleChanged(form, checked) {
	var namespace = mw.config.get('wgNamespaceNumber');
	var value = checked;

	var work_area = new Morebits.quickForm.element( {
			type: 'div',
			name: 'work_area'
		} );

	if (checked && Twinkle.getPref('speedySelectionStyle') === 'radioClick') {
		work_area.append( {
				type: 'div',
				label: 'When finished choosing criteria, click:'
			} );
		work_area.append( {
				type: 'button',
				name: 'submit-multiple',
				label: 'Submit Query',
				event: function( event ) {
					Twinkle.speedy.callback.evaluateUser( event );
					event.stopPropagation();
				}
			} );
	}

	var radioOrCheckbox = (value ? 'checkbox' : 'radio');

	if (namespace % 2 === 1 && namespace !== 3) {  // talk pages, but not user talk pages
		work_area.append( { type: 'header', label: 'वार्ता पृष्ठ' } );
		work_area.append( { type: radioOrCheckbox, name: 'csd', list: Twinkle.speedy.talkList } );
	}

	switch (namespace) {
		case 0:  // article
		case 1:  // talk
			work_area.append( { type: 'header', label: 'लेख' } );
			work_area.append( { type: radioOrCheckbox, name: 'csd', list: Twinkle.speedy.getArticleList(value) } );
			break;

		case 2:  // user
		case 3:  // user talk
			work_area.append( { type: 'header', label: 'सदस्य पृष्ठ' } );
			work_area.append( { type: radioOrCheckbox, name: 'csd', list: Twinkle.speedy.getUserList(value) } );
			break;

		case 6:  // file
		case 7:  // file talk
			work_area.append( { type: 'header', label: 'फ़ाइलें' } );
			work_area.append( { type: radioOrCheckbox, name: 'csd', list: Twinkle.speedy.getFileList(value) } );
			break;

		case 10:  // template
		case 11:  // template talk
			work_area.append( { type: 'header', label: 'साँचे' } );
			work_area.append( { type: radioOrCheckbox, name: 'csd', list: Twinkle.speedy.templateList } );
			break;

		default:
			break;
	}

	work_area.append( { type: 'header', label: 'वैश्विक मापदंड' } );
	work_area.append( { type: radioOrCheckbox, name: 'csd', list: Twinkle.speedy.getGeneralList(value) });

	var old_area = Morebits.quickForm.getElements(form, "work_area")[0];
	form.replaceChild(work_area.render(), old_area);
};

Twinkle.speedy.talkList = [
	{
		label: 'हटाए गए पृष्ठों के वार्ता पृष्ठ',
		value: 'talk',
		tooltip: 'इसमें ऐसे कोई भी वार्ता पृष्ठ नहीं आते जिनसे विकिपीडिया को कोई फ़ायदा हो - खासकर सदस्य वार्ता पृष्ठ और वार्ता पुरालेख।'
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
		tooltip: 'ऐसी फ़ाइलों को हटाने से पहले जाँच लें  कि कॉमन्स पर स्रोत और लाइसेंस जानकारी सही हो, और यदि कॉमन्स पर फ़ाइल का नाम विकिपीडिया पर फ़ाइल के नाम से भिन्न है तो विकिपीडिया की फ़ाइल की जगह सभी जगह कॉमन्स की फ़ाइल का प्रयोग करें।'
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
		tooltip: 'वे सभी फ़ाइलें जो अंतरजाल पर किसी ऐसी वेबसाइट से लिये गए हैं जो साफ़-साफ़ फ़ाइल को मुक्त लाइसेंस के अंतर्गत नहीं देती है। इसमें वे फ़ाइलें भी आती हैं जिनका कॉपीराइट स्वयं अपलोडर के पास है और सदस्य ने उसका पहला प्रकाशन किसी मुक्त लाइसेंस के अंतर्गत नहीं किया है।'
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
			tooltip: 'इस मापदंड में वे सभी पृष्ठ आते हैं जो साफ़ तौर पर कॉपीराइट उल्लंघन हैं और जिनके इतिहास में उल्लंघन से मुक्त कोई भी अवतरण नहीं है। इसमें वे पृष्ठ भी आते हैं जिनपर डाली गई सामग्री का कॉपीराइट स्वयं उसी सदस्य के पास है और सदस्य ने उसका पहला प्रकाशन किसी मुक्त लाइसेंस के अंतर्गत नहीं किया है। इस मापदंड का प्रयोग तभी किया जाना चाहिये यदि पृष्ठ व6ल, व6फ़, अथवा व6स के अंतर्गत न आता हो।'
		});
	}
	return result;
};

Twinkle.speedy.normalizeHash = {
	'कारण': 'शीह',
	'अनेक': 'अनेक',
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
			var thispage;

			Morebits.wiki.addCheckpoint();  // prevent actionCompleted from kicking in until user interaction is done
			
			// look up initial contributor. If prompting user for deletion reason, just display a link.
			// Otherwise open the talk page directly
			if( params.openusertalk ) {
				thispage = new Morebits.wiki.page( mw.config.get('wgPageName') );  // a necessary evil, in order to clear incorrect status text
				thispage.setCallbackParameters( params );
				thispage.lookupCreator( Twinkle.speedy.callbacks.sysop.openUserTalkPage );
			}

			var input, reason;
			var presetreason = "[[वि:हटाना#" + params.normalized + "|" + params.normalized + "]]." + params.reason;
			var thispage = new Morebits.wiki.page( mw.config.get('wgPageName'), "पृष्ठ हटाया जा रहा है" );
			var statelem = thispage.getStatusElement();
//			var inputparams = Twinkle.speedy.getParameters(params.value, params.normalized, statelem);	
			
//			if(!inputparams) {
//			return;
//			}
			
			// delete page
			switch(params.normalized) {
				case 'शीह':
					input = prompt('कृपया शीघ्र हटाने के लिये कारण दें।\n\"यह पृष्ठ शीघ्र हटाने योग्य है क्योंकि:\"', "");

					if (!input || !input.replace(/^\s*/, "").replace(/\s*$/, ""))
					{
						statelem.error( 'कारण बताना आवश्यक है।  नामांकन रोक दिया गया है।' );
						Morebits.wiki.removeCheckpoint();
						return;
					}
					reason = 'कारण: ' + input;
					break;
				case 'व6':
				case 'व6ल':
				case 'व6फ़':
				case 'व6स':
					input = prompt( 'कृपया स्रोत यू॰आर॰एल बताएँ, http समेत', "" );
					
					if (input === "" || !input)
					{
						statelem.error( 'आपने स्रोत यू॰आर॰एल नहीं दिया है। नामांकन रोक दिया गया है।' );
						return null;
					}
					else if (input.indexOf("http") !== 0)
					{
						statelem.error( 'आपने जो स्रोत यू॰आर॰एल दिया है, वह http से नहीं शुरू होता। नामांकन रोक दिया गया है।' );
						Morebits.wiki.removeCheckpoint();
						return;
					}
					reason = presetreason + " स्रोत यू॰आर॰एल: " + input;
					break;
				case 'ल4':
					input = prompt( 'कृपया मूल लेख का नाम बताएँ', "");

					if (input === "" || !input)
					{
						statelem.error( 'आपने मूल लेख का नाम नहीं दिया है। नामांकन रोक दिया गया है।' );
						Morebits.wiki.removeCheckpoint();
						return;
					}
					reason = presetreason + " मूल लेख: " + input;
					break;
				case 'फ़2':
					input = prompt( 'कृपया कॉमन्स पर फ़ाइल का नाम बताएँ', "");
					
					if (input === "" || !input)
					{
						statelem.error( 'आपने कॉमन्स पर फ़ाइल का नाम नहीं दिया है। नामांकन रोक दिया गया है।' );
						Morebits.wiki.removeCheckpoint();
						return;
					}
					reason = presetreason + " कॉमन्स पर फ़ाइल: " + input;
					break;
				case 'फ़5':
					input = prompt( 'कृपया मुक्त विकल्प का नाम बताएँ।', "");
					
					if (input === "" || !input)
					{
						statelem.error( 'आपने मुक्त विकल्प का नाम नहीं दिया है। नामांकन रोक दिया गया है।' );
						Morebits.wiki.removeCheckpoint();
						return;
					}
					reason = presetreason + " मुक्त विकल्प: " + input;
					break;
				case 'सा1':
					input = prompt( 'कृपया बेहतर साँचे का नाम बताएँ:', "" );

					if (input === "" || !input)
					{
						statelem.error( 'आपने बेहतर साँचे का नाम नहीं दिया है। नामांकन रोक दिया गया है।' );
						Morebits.wiki.removeCheckpoint();
						return;
					}
					reason = presetreason + " बेहतर साँचा: " + input;
					break;
				default:
					reason = presetreason;
					break;
			}

			thispage.setEditSummary( reason + Twinkle.getPref('deletionSummaryAd') );
			thispage.deletePage(function() {
				statelem.info("done");
				Twinkle.speedy.callbacks.sysop.deleteTalk( params );
			});
			Morebits.wiki.removeCheckpoint();
		},
		deleteTalk: function( params ) {
			// delete talk page
			if (params.deleteTalkPage &&
			    document.getElementById( 'ca-talk' ).className !== 'new') {
				var talkpage = new Morebits.wiki.page( Morebits.wikipedia.namespaces[ mw.config.get('wgNamespaceNumber') + 1 ] + ':' + mw.config.get('wgTitle'), "वार्ता पृष्ठ हटाया जा रहा है" );
				talkpage.setEditSummary('हटाए गए पृष्ठ [[' + mw.config.get('wgPageName') + "]] का वार्ता पृष्ठ। " + Twinkle.getPref('deletionSummaryAd'));
				talkpage.deletePage();
				// this is ugly, but because of the architecture of wiki.api, it is needed
				// (otherwise success/failure messages for the previous action would be suppressed)
				window.setTimeout(function() { Twinkle.speedy.callbacks.sysop.deleteRedirects( params ) }, 1800);
			} else {
				Twinkle.speedy.callbacks.sysop.deleteRedirects( params );
			}
		},
		deleteRedirects: function( params ) {
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
		},
		openUserTalkPage: function( pageobj ) {
			pageobj.getStatusElement().unlink();  // don't need it anymore
			var user = pageobj.getCreator();
			var params = pageobj.getCallbackParameters();

			var query = {
				'title': 'User talk:' + user,
				'action': 'edit',
				'preview': 'yes',
				'vanarticle': mw.config.get('wgPageName').replace(/_/g, ' ')
			};

			if (params.normalized.indexOf([ 'शीह', 'व6', 'व6ल', 'व6फ़', 'व6स', 'ल4', 'फ़2', 'फ़5', 'सा1']) !== -1) {
				// provide a link to the user talk page
				var $link, $bigtext;
				$link = $('<a/>', {
					'href': mw.util.wikiScript('index') + '?' + Morebits.queryString.create( query ),
					'text': 'click here to open User talk:' + user,
					'target': '_blank',
					'css': { 'fontSize': '130%', 'fontWeight': 'bold' }
				});
				$bigtext = $('<span/>', {
					'text': 'To notify the page creator',
					'css': { 'fontSize': '130%', 'fontWeight': 'bold' }
				});
				Morebits.status.info($bigtext[0], $link[0]);
			} else {
				// open the initial contributor's talk page
				var statusIndicator = new Morebits.status('Opening user talk page edit form for ' + user, 'opening...');

				switch( Twinkle.getPref('userTalkPageMode') ) {
				case 'tab':
					window.open( mw.util.wikiScript('index') + '?' + Morebits.queryString.create( query ), '_tab' );
					break;
				case 'blank':
					window.open( mw.util.wikiScript('index') + '?' + Morebits.queryString.create( query ), '_blank', 'location=no,toolbar=no,status=no,directories=no,scrollbars=yes,width=1200,height=800' );
					break;
				case 'window':
					/* falls through */
				default:
					window.open( mw.util.wikiScript('index') + '?' + Morebits.queryString.create( query ),
						( window.name === 'twinklewarnwindow' ? '_blank' : 'twinklewarnwindow' ),
						'location=no,toolbar=no,status=no,directories=no,scrollbars=yes,width=1200,height=800' );
					break;
				}

				statusIndicator.info( 'complete' );
			}
		},
		deleteRedirectsMain: function( apiobj ) {
			var xmlDoc = apiobj.getXML();
			var $snapshot = $(xmlDoc).find('backlinks bl');
			var total = $snapshot.length;
			var statusIndicator = apiobj.statelem;

			if( !total ) {
				statusIndicator.status("no redirects found");
				return;
			}

			statusIndicator.status("0%");

			var current = 0;
			var onsuccess = function( apiobjInner ) {
				var now = parseInt( 100 * (++current)/total, 10 ) + '%';
				statusIndicator.update( now );
				apiobjInner.statelem.unlink();
				if( current >= total ) {
					statusIndicator.info( now + ' (completed)' );
					Morebits.wiki.removeCheckpoint();
				}
			};

			Morebits.wiki.addCheckpoint();

			$snapshot.each(function(key, value) {
				var title = $(value).attr('title');
				var page = new Morebits.wiki.page(title, 'Deleting redirect "' + title + '"');
				page.setEditSummary('हटाए गए पृष्ठ [[' + mw.config.get('wgPageName') + "]] को पुनर्निर्देश। " + Twinkle.getPref('deletionSummaryAd'));
				page.deletePage(onsuccess);
			});
		}
	},

	user: {
		lookupCreator: function(pageobj) {
			pageobj.lookupCreator(Twinkle.speedy.callbacks.user.getCreator);
		},
		getCreator: function(pageobj) {
			var params = pageobj.getCallbackParameters();
			params.initialContrib = pageobj.getCreator();
			params.self = (params.initialContrib === mw.config.get('wgUserName')) ? true : false;
			pageobj.setCallbackParameters(params);
			Twinkle.speedy.callbacks.user.main(pageobj);
		},
		main: function(pageobj) {
			var statelem = pageobj.getStatusElement();

			if (!pageobj.exists()) {
				statelem.error( "लगता है पृष्ठ अस्तित्व में नहीं है। इसे शायद पहले ही कोई हटा चुका है।" );
				return;
			}

			var text = pageobj.getPageText();
			var params = pageobj.getCallbackParameters();
			
			if(params.normalizeds.indexOf('स1') === -1) {
				if(params.self && Twinkle.getPref('NotifySelfSpeedy')) { //???
					if(!confirm('इस पृष्ठ के निर्माता आप ही हैं। क्या आप इसे शीघ्र हटाने हेतु नामांकित करना चाहते हैं?')) {
						statelem.error("नामांकन रद्द कर दिया गया है।");
						return;
					}
				}
			}
			
			statelem.status( 'पृष्ठ को मौजूदा टैगों के लिए जाँचा जा रहा है...' );
			// check for existing deletion tags
			var tag = /(\{\{(शीह|हटाएँ|शीह-.*?|हटाएँ-.*?)(?:\s*\||\s*\}\}))/.exec( text );
			if( tag ) {
				statelem.error( [ Morebits.htmlNode( 'strong', tag[1] ) , " पहले से पृष्ठ पर है।" ] );
				return;
			}

			var xfd = /(?:\{\{(हहेच (लेख|साँचा|श्रेणी|फ़ाइल|अन्य))[^{}]*?\}\})/i.exec( text );
			if( xfd && !confirm( "पृष्ठ पर हहेच साँचा {{" + xfd[1] + "}} पाया गया है। क्या आप अब भी शीघ्र हटाने का नामांकन जोड़ना चाहते हैं?" ) ) {
				statelem.error("नामांकन रद्द कर दिया गया है।");
				return;
			}

			var code, i;
			if (params.normalizeds.length > 1)
			{
				params.inputs = {};
				code = "{{शीह-अनेक";
				var breakFlag = false;
				$.each(params.normalizeds, function(index, norm) {
					code += "|" + norm;
					params.input = Twinkle.speedy.getParameters(params.values[index], norm, statelem);
					if (!params.input) {
						breakFlag = true;
						return false;  // the user aborted
					}
					$.extend(params.inputs, params.input);
					for (i in params.input) {
						if (typeof params.input[i] === 'string') {
							code += "|" + params.input[i];
						}
					}
				});
				if (breakFlag) {
					return;
				}
			}
			else
			{
				params.input = Twinkle.speedy.getParameters(params.values[0], params.normalizeds[0], statelem);
				if (!params.input) {
					return;  // the user aborted
				}
				code = "{{शीह-";
				if (params.value === 'talk') {
					code+= "कारण|हटाए गए पृष्ठ का वार्ता पृष्ठ";
				}
				else {
				code+= params.values[0];
				}
				for (i in params.input) {
					if (typeof params.input[i] === 'string') {
						code += "|" + params.input[i];
					}
				}
			}
			if (params.self) {
				code += "|स्वयं=हाँ";
			}
			code += "}}";

			var thispage = new Morebits.wiki.page(mw.config.get('wgPageName'));
			// patrol the page, if reached from Special:NewPages
			if( Twinkle.getPref('markSpeedyPagesAsPatrolled') ) {
				thispage.patrol();
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
//setCallbackParameters
			// Generate edit summary for edit
			var editsummary;
			if (params.normalizeds.length > 1) {
				editsummary = 'शीघ्र हटाने का नामांकन (';
				$.each(params.normalizeds, function(index, norm) {
					editsummary += '[[वि:हटाना#' + norm + '|शीह ' + norm + ']], ';
				});
				editsummary = editsummary.substr(0, editsummary.length - 2); // remove trailing comma
				editsummary += ')।';
			} else if (params.normalizeds[0] === 'शीह') {
				editsummary = '[[वि:हटाना#शीघ्र हटाना|शीघ्र हटाने]] का नामांकन। कारण: \"' + params.input.dbreason + '\"।';
			} else if (params.values[0] === 'talk') {
				editsummary =  'शीघ्र हटाने का नामांकन (हटाए गए पृष्ठ का वार्ता पृष्ठ)';
			} else {
				editsummary = "शीघ्र हटाने का नामांकन ([[वि:हटाना#" + params.normalizeds[0] + "|शीह " + params.normalizeds[0] + "]])।";
			}

			pageobj.setCallbackParameters(params);
			pageobj.setPageText(code + "\n" + text);
			pageobj.setEditSummary(editsummary + Twinkle.getPref('summaryAd'));
			pageobj.setWatchlist(params.watch);
			pageobj.setCreateOption('nocreate');
			pageobj.save(Twinkle.speedy.callbacks.user.tagComplete);
		},
		tagComplete: function(pageobj) {
			var params = pageobj.getCallbackParameters();

			// Notification to first contributor
			if (params.usertalk) {
//				Twinkle.speedy.callbacks.user.notifyuser (params);
				// don't notify users when their user talk page is nominated
				if (params.initialContrib === mw.config.get('wgTitle') && mw.config.get('wgNamespaceNumber') === 3) {
					Status.warn("सूचना साँचा नहीं जोड़ा जाएगा।"); 
					return;
				}
				
				if (params.self && Twinkle.getPref('NotifySelfSpeedy')) {
					alert('आपको सूचित किया जाता है कि आपके बनाए इस पृष्ठ को शीघ्र हटाने हेतु नामांकित किया गया है। आपके वार्ता पृष्ठ पर सूचना साँचा नहीं जोड़ा जाएगा।');
					return;
				}
				
				var usertalkpage = new Morebits.wiki.page('सदस्य वार्ता:' + params.initialContrib, "पृष्ठ निर्माता को सूचित किया जा रहा है (" + params.initialContrib + ")");
				var notifytext = "\n\n{{subst:शीह सूचना-";
				if (params.normalizeds.length === 1) {
					// specialcase "db" and "talk"
					switch (params.values[0])
					{
						case 'कारण':
							notifytext += "कारण|" + mw.config.get('wgPageName');
							break;
						case 'talk':
							notifytext += "कारण|" + mw.config.get('wgPageName') + "|हटाए गए पृष्ठ का वार्ता पृष्ठ";
							break;
						default:
							notifytext += params.normalizeds[0] + "|" + mw.config.get('wgPageName');
							for (var i in params.input) {
								if (typeof params.input[i] === 'string' && i!=='name' && params.normalizeds[0]!==('व6' || 'व6ल' || 'व6फ़' || 'व6स') && params.input[i]!=='') {
									notifytext += '|' + params.input[i];
								}
							}
							break;
					}
				}
				else {
					notifytext += 'अनेक' + '|' + mw.config.get('wgPageName');
					$.each(params.normalizeds, function(index, norm) {
						notifytext += "|" + norm;
						switch (norm) {
							case 'शीह':
								notifytext += "|" + params.inputs.dbreason;
								break;
							case 'व6':
							case 'व6ल':
							case 'व6फ़':
							case 'व6स':
								notifytext += "|" + params.inputs.source;
								break;
							case 'ल4':
								notifytext += "|" + params.inputs.art;
								break;
							case 'फ़2':
								notifytext += "|" + params.inputs.cfile;
								break;
							case 'फ़5':
								notifytext += "|" + params.inputs.altfile;
								break;
							case 'सा1':
								notifytext += "|" + params.inputs.template;
								break;
							default:
								break;
						}
					});
				}
				notifytext +="}}~~~~";

				usertalkpage.setAppendText(notifytext);
				usertalkpage.setEditSummary("सूचना: [[" + mw.config.get('wgPageName') + "]] को शीघ्र हटाने का नामांकन।" + Twinkle.getPref('summaryAd'));
				usertalkpage.setCreateOption('recreate');
				usertalkpage.setFollowRedirect(true);

				usertalkpage.append();
				// add this nomination to the user's userspace log, if the user has enabled it
				if (params.lognomination) {
					Twinkle.speedy.callbacks.user.addToLog(params, params.initialContrib);
				}
			}
			// or, if not notifying, add this nomination to the user's userspace log without the initial contributor's name
			else if (params.lognomination) {
				Twinkle.speedy.callbacks.user.addToLog(params, null);
			}
		},
		// the params used are:
		//   for CSD: params.values, params.normalizeds  (note: normalizeds is an array)
		addToLog: function(params, initialContrib) {
			var wikipedia_page = new Morebits.wiki.page("सदस्य:" + mw.config.get('wgUserName') + "/" + Twinkle.getPref('speedyLogPageName'), "Adding entry to userspace log");
			params.logInitialContrib = initialContrib;
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
			if (params.normalizeds.length > 1) {
				text += "अनेक मापदंड (";
				$.each(params.normalizeds, function(index, norm) {
					text += '[[वि:हटाना#' + norm + '|' + norm + ']], ';
				});
				text = text.substr(0, text.length - 2);  // remove trailing comma
				text += ')';
			}
			else if (params.normalizeds[0] === 'शीह') {
				text += "{{tl|शीह-कारण}}";
			} else {
				text += "[[वि:हटाना#" + params.normalizeds[0] + "|शीह " + params.normalizeds[0] + "]] ({{tl|शीह-" + params.values[0] + "}})";
			}

			if (params.logInitialContrib) {
				text += "; {{सदस्य|1=" + params.logInitialContrib + "}} को सूचित किया";
			}
			text += " ~~~~~\n";

			pageobj.setPageText(text);
			pageobj.setEditSummary("[[" + mw.config.get('wgPageName') + "]] के शीघ्र हटाने के नामांकन का लॉग।" + Twinkle.getPref('summaryAd'));
			pageobj.setCreateOption("recreate");
			pageobj.save();
		}
	}
};

// prompts user for parameters to be passed into the speedy deletion tag
Twinkle.speedy.getParameters = function twinklespeedyGetParameters(value, normalized, statelem)
{
	var parameters = {};
	switch( normalized ) {
		case 'शीह':
			var dbrationale = prompt('कृपया शीघ्र हटाने के लिये कारण दें।   \n\"यह पृष्ठ शीघ्र हटाने योग्य है क्योंकि:\"', "");
			if (!dbrationale || !dbrationale.replace(/^\s*/, "").replace(/\s*$/, ""))
			{
				statelem.error( 'कारण बताना आवश्यक है।  नामांकन रोक दिया गया है।' );
				return null;
			}
//			parameters.name = "कारण";
			parameters.dbreason = dbrationale;
			break;
		case 'व6':
		case 'व6ल':
		case 'व6फ़':
		case 'व6स':
			var url = prompt( 'कृपया स्रोत यू॰आर॰एल बताएँ, http समेत', "" );
			
			if (url === "" || !url)
			{
				statelem.error( 'आपने स्रोत यू॰आर॰एल नहीं दिया है। नामांकन रोक दिया गया है।' );
				return null;
			}
			else if (url.indexOf("http") !== 0)
			{
				statelem.error( 'आपने जो स्रोत यू॰आर॰एल दिया है, वह http से नहीं शुरू होता। नामांकन रोक दिया गया है।' );
				return null;
			}
//			parameters.name = "स्रोत यू॰आर॰एल";
			parameters.source = url;
			break;
		case 'ल4':
			var article = prompt( 'कृपया मूल लेख का नाम बताएँ', "");
			var oarticle = new Morebits.wiki.page(article);
			if (article === "" || !article)
			{
				statelem.error( 'आपने मूल लेख का नाम नहीं दिया है। नामांकन रोक दिया गया है।' );
				return null;
			}
//			parameters.name = "मूल लेख";
			parameters.art = article;
			break;
		case 'फ़2':
			var cfile = prompt( 'कृपया कॉमन्स पर फ़ाइल का नाम बताएँ', "");
			
			if (cfile === "" || !cfile)
			{
				statelem.error( 'आपने कॉमन्स पर फ़ाइल का नाम नहीं दिया है। नामांकन रोक दिया गया है।' );
				return null;
			}
//			parameters.name = "कॉमन्स पर फ़ाइल";
			parameters.cfile = cfile;
			break;
		case 'फ़5':
			var alternative = prompt( 'कृपया मुक्त विकल्प का नाम बताएँ।', "");
			
			if (alternative === "" || !alternative)
			{
				statelem.error( 'आपने मुक्त विकल्प का नाम नहीं दिया है। नामांकन रोक दिया गया है।' );
				return null;
			}
//			parameters.name = "मुक्त विकल्प";
			parameters.altfile = alternative;
			break;
		case 'सा1':
			var bettertemplate = prompt( 'कृपया बेहतर साँचे का नाम बताएँ:', "" );
			if (bettertemplate === "" || !bettertemplate)
			{
				statelem.error( 'आपने बेहतर साँचे का नाम नहीं दिया है। नामांकन रोक दिया गया है।' );
				return null;
			}
//			parameters.name = "बेहतर साँचा";
			parameters.template = bettertemplate;
			break;
		default:
			break;
	}
	return parameters;
};

Twinkle.speedy.resolveCsdValues = function twinklespeedyResolveCsdValues(e) {
	var values = (e.target.form ? e.target.form : e.target).getChecked('csd');
	if (values.length === 0) {
		alert( "Please select a criterion!" );
		return null;
	}
	return values;
};

Twinkle.speedy.callback.evaluateSysop = function twinklespeedyCallbackEvaluateSysop(e)
{
	mw.config.set('wgPageName', mw.config.get('wgPageName').replace(/_/g, ' ')); // for queen/king/whatever and country!
	var form = (e.target.form ? e.target.form : e.target);

	var tag_only = form.tag_only;
	if( tag_only && tag_only.checked ) {
		Twinkle.speedy.callback.evaluateUser(e);
		return;
	}

	var value = Twinkle.speedy.resolveCsdValues(e)[0];
	if (!value) {
		return;
	}
	var normalized = Twinkle.speedy.normalizeHash[ value ];
	var params = {
		value: value,
		normalized: normalized,
		watch: Twinkle.getPref('watchSpeedyPages').indexOf( normalized ) !== -1,
		reason: Twinkle.speedy.reasonHash[ value ],
		openusertalk: Twinkle.getPref('openUserTalkPageOnSpeedyDelete').indexOf( normalized ) !== -1,
		deleteTalkPage: form.talkpage && form.talkpage.checked,
		deleteRedirects: form.redirects.checked
	};

	SimpleWindow.setButtonsEnabled( false );
	Morebits.status.init( form );

	Twinkle.speedy.callbacks.sysop.main( params );
};

Twinkle.speedy.callback.evaluateUser = function twinklespeedyCallbackEvaluateUser(e) {
	mw.config.set('wgPageName', mw.config.get('wgPageName').replace(/_/g, ' '));  // for queen/king/whatever and country!
	var form = (e.target.form ? e.target.form : e.target);

	if (e.target.type === "checkbox") {
		return;
	}

	var values = Twinkle.speedy.resolveCsdValues(e);
	if (!values) {
		return;
	}
	//var multiple = form.multiple.checked;
	var normalizeds = [];
	$.each(values, function(index, value) {
		var norm = Twinkle.speedy.normalizeHash[ value ];

		normalizeds.push(norm);
	});
	// analyse each criterion to determine whether to watch the page/notify the creator
	var watchPage = false;
	$.each(normalizeds, function(index, norm) {
		if (Twinkle.getPref('watchSpeedyPages').indexOf(norm) !== -1) {
			watchPage = true;
			return false;  // break
		}
	});

	var notifyuser = false;
	if (form.notify.checked) {
		$.each(normalizeds, function(index, norm) {
			if (Twinkle.getPref('notifyUserOnSpeedyDeletionNomination').indexOf(norm) !== -1) {
				notifyuser = true;
				return false;  // break
			}
		});
	}

/*
	var welcomeuser = false;
	if (notifyuser) {
		$.each(normalizeds, function(index, norm) {
			if (Twinkle.getPref('welcomeUserOnSpeedyDeletionNotification').indexOf(norm) !== -1) {
				welcomeuser = true;
				return false;  // break
			}
		});
	}
*/

	var csdlog = false;
	if (Twinkle.getPref('logSpeedyNominations')) {
		$.each(normalizeds, function(index, norm) {
			if (Twinkle.getPref('noLogOnSpeedyNomination').indexOf(norm) === -1) {
				csdlog = true;
				return false;  // break
			}
		});
	}

	var params = {
		values: values,
		normalizeds: normalizeds,
		watch: watchPage,
		usertalk: notifyuser,
//		welcomeuser: welcomeuser,
		lognomination: csdlog
	};

	Morebits.simpleWindow.setButtonsEnabled( false );
	Morebits.status.init( form );

	Morebits.wiki.actionCompleted.redirect = mw.config.get('wgPageName');
	Morebits.wiki.actionCompleted.notice = "टैगिंग सम्पूर्ण, पृष्ठ कुछ ही क्षणों में रीलोड होगा";

	var wikipedia_page = new Morebits.wiki.page(mw.config.get('wgPageName'), "पृष्ठ टैग हो रहा है");
	wikipedia_page.setCallbackParameters(params);
	wikipedia_page.load(Twinkle.speedy.callbacks.user.lookupCreator);
};
})(jQuery);


//</nowiki>
