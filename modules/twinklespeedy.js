//<nowiki>


(function($){


/*
 ****************************************
 *** twinklespeedy.js: CSD module
 ****************************************
 * Mode of invocation:     Tab ("शीह")
 * Active on:              Non-special, existing pages
 * Config directives in:   TwinkleConfig
 *
 * NOTE FOR DEVELOPERS:
 *   If adding a new criterion, add it to the appropriate places at the top of
 *   twinkleconfig.js.  Also check out the default values of the CSD preferences
 *   in twinkle.js, and add your new criterion to those if you think it would be
 *   good.
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

// Used by unlink feature
Twinkle.speedy.dialog = null;

// The speedy criteria list can be in one of several modes
Twinkle.speedy.mode = {
	sysopSingleSubmit: 1,  // radio buttons, no subgroups, submit when "Submit" button is clicked
	sysopRadioClick: 2,  // radio buttons, no subgroups, submit when a radio button is clicked
	sysopMultipleSubmit: 3, // check boxes, subgroups, "Submit" button already present
	sysopMultipleRadioClick: 4, // check boxes, subgroups, need to add a "Submit" button
	userMultipleSubmit: 5,  // check boxes, subgroups, "Submit" button already pressent
	userMultipleRadioClick: 6,  // check boxes, subgroups, need to add a "Submit" button
	userSingleSubmit: 7,  // radio buttons, subgroups, submit when "Submit" button is clicked
	userSingleRadioClick: 8,  // radio buttons, subgroups, submit when a radio button is clicked

	// are we in "delete page" mode?
	// (sysops can access both "delete page" [sysop] and "tag page only" [user] modes)
	isSysop: function twinklespeedyModeIsSysop(mode) {
		return mode === Twinkle.speedy.mode.sysopSingleSubmit ||
			mode === Twinkle.speedy.mode.sysopMultipleSubmit ||
			mode === Twinkle.speedy.mode.sysopRadioClick ||
			mode === Twinkle.speedy.mode.sysopMultipleRadioClick;
	},
	// do we have a "Submit" button once the form is created?
	hasSubmitButton: function twinklespeedyModeHasSubmitButton(mode) {
		return mode === Twinkle.speedy.mode.sysopSingleSubmit ||
			mode === Twinkle.speedy.mode.sysopMultipleSubmit ||
			mode === Twinkle.speedy.mode.sysopMultipleRadioClick ||
			mode === Twinkle.speedy.mode.userMultipleSubmit ||
			mode === Twinkle.speedy.mode.userMultipleRadioClick ||
			mode === Twinkle.speedy.mode.userSingleSubmit;
	},
	// is db-multiple the outcome here?
	isMultiple: function twinklespeedyModeIsMultiple(mode) {
		return mode === Twinkle.speedy.mode.userMultipleSubmit ||
			mode === Twinkle.speedy.mode.sysopMultipleSubmit ||
			mode === Twinkle.speedy.mode.userMultipleRadioClick ||
			mode === Twinkle.speedy.mode.sysopMultipleRadioClick;
	},
};

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
							// enable/disable delete multiple
							cForm.delmultiple.disabled = cChecked;
							cForm.delmultiple.checked = false;
							// enable/disable open talk page checkbox
							cForm.openusertalk.disabled = cChecked;
							cForm.openusertalk.checked = false;

							// enable/disable notify checkbox
							cForm.notify.disabled = !cChecked;
							cForm.notify.checked = cChecked;
							// enable/disable multiple
							cForm.multiple.disabled = !cChecked;
							cForm.multiple.checked = false;

							Twinkle.speedy.callback.modeChanged(cForm);

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
		form.append( {
			type: 'checkbox',
			list: [
				{
					label: 'अनेक मापदंडों के अंतर्गत पृष्ठ हटायें',
					value: 'delmultiple',
					name: 'delmultiple',
					tooltip: "इस विकल्प का प्रयोग कर के आप पृष्ठ को विभिन्न मापदंडों के अंतर्गत हटा सकते हैं।",
					disabled: Twinkle.getPref('deleteSysopDefaultToTag'),
					event: function( event ) {
						Twinkle.speedy.callback.modeChanged( event.target.form );
						event.stopPropagation();
					}
				}
			]
		} );
		form.append( {
				type: 'checkbox',
				list: [
					{
						label: 'पृष्ठ निर्माता का वार्ता पृष्ठ खोलें',
						value: 'openusertalk',
						name: 'openusertalk',
						tooltip: 'यदि आप इसे चेक करते हैं तो पृष्ठ हटाने के उपरान्त पृष्ठ निर्माता का वार्ता पृष्ठ खोले जाएगा, अन्यथा नहीं।',
						checked : false,
						disabled: Twinkle.getPref('deleteSysopDefaultToTag')
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
						Twinkle.speedy.callback.modeChanged( event.target.form );
						event.stopPropagation();
					}
				}
			]
		} );

	form.append( {
			type: 'div',
			name: 'work_area',
			label: 'शीह मॉड्यूल शुरू होने में असफल रहा। कृपया पुनः प्रयास करें, या ट्विंकल के डेवेलपर्स को समस्या बतायें।'
		} );

	if( Twinkle.getPref( 'speedySelectionStyle' ) !== 'radioClick' ) {
		form.append( { type: 'submit' } );
	}

	var result = form.render();
	dialog.setContent( result );
	dialog.display();

	Twinkle.speedy.callback.modeChanged( result );

	// if sysop, check if CSD is already on the page and fill in custom rationale
	if (Morebits.userIsInGroup('sysop') && $("#delete-reason").length) {
		var customOption = $("input[name=csd][value=कारण]")[0];

		if (Twinkle.getPref('speedySelectionStyle') !== 'radioClick') {
			// force listeners to re-init
			customOption.click();
			customOption.parentNode.appendChild(customOption.subgroup);
		}

		customOption.subgroup.querySelector('input').value = decodeURIComponent($("#delete-reason").text()).replace(/\+/g, ' ');
	}
};

Twinkle.speedy.callback.modeChanged = function twinklespeedyCallbackModeChanged(form) {
	var namespace = mw.config.get('wgNamespaceNumber');

	// first figure out what mode we're in
	var mode = Twinkle.speedy.mode.userSingleSubmit;
	if (form.tag_only && !form.tag_only.checked) {
		if (form.delmultiple.checked) {
			mode = Twinkle.speedy.mode.sysopMultipleSubmit;
		} else {
			mode = Twinkle.speedy.mode.sysopSingleSubmit;
		}
	} else {
		if (form.multiple.checked) {
			mode = Twinkle.speedy.mode.userMultipleSubmit;
		} else {
			mode = Twinkle.speedy.mode.userSingleSubmit;
		}
	}
	if (Twinkle.getPref('speedySelectionStyle') === 'radioClick') {
		mode++;
	}

	var work_area = new Morebits.quickForm.element( {
			type: 'div',
			name: 'work_area'
		} );

	if (mode === Twinkle.speedy.mode.userMultipleRadioClick || mode === Twinkle.speedy.mode.sysopMultipleRadioClick) {
		var evaluateType = Twinkle.speedy.mode.isSysop(mode) ? 'evaluateSysop' : 'evaluateUser';

		work_area.append( {
				type: 'div',
				label: 'जब मापदंड चुन लिए हों तो यह बटन दबाएँ:'
			} );
		work_area.append( {
				type: 'button',
				name: 'submit-multiple',
				label: 'Submit Query',
				event: function( event ) {
					Twinkle.speedy.callback[evaluateType]( event );
					event.stopPropagation();
				}
			} );
	}

	var radioOrCheckbox = (Twinkle.speedy.mode.isMultiple(mode) ? 'checkbox' : 'radio');

	if (Twinkle.speedy.mode.isSysop(mode) && !Twinkle.speedy.mode.isMultiple(mode)) {
		work_area.append( { type: 'header', label: 'विशिष्ट कारण' } );
		work_area.append( { type: radioOrCheckbox, name: 'csd', list: Twinkle.speedy.generateCsdList(Twinkle.speedy.customRationale, mode) } );
	}

	if (namespace % 2 === 1 && namespace !== 3) {
		// show db-talk on talk pages, but not user talk pages
		work_area.append( { type: 'header', label: 'वार्ता पृष्ठ' } );
		work_area.append( { type: radioOrCheckbox, name: 'csd', list: Twinkle.speedy.generateCsdList(Twinkle.speedy.talkList, mode) } );
	}

	switch (namespace) {
		case 0:  // article
		case 1:  // talk
			work_area.append( { type: 'header', label: 'लेख' } );
			work_area.append( { type: radioOrCheckbox, name: 'csd', list: Twinkle.speedy.generateCsdList(Twinkle.speedy.articleList, mode) } );
			break;

		case 2:  // user
		case 3:  // user talk
			work_area.append( { type: 'header', label: 'सदस्य पृष्ठ' } );
			work_area.append( { type: radioOrCheckbox, name: 'csd', list: Twinkle.speedy.generateCsdList(Twinkle.speedy.userList, mode) } );
			break;

		case 6:  // file
		case 7:  // file talk
			work_area.append( { type: 'header', label: 'फ़ाइलें' } );
			work_area.append( { type: radioOrCheckbox, name: 'csd', list: Twinkle.speedy.generateCsdList(Twinkle.speedy.fileList, mode) } );
			break;

		case 10:  // template
		case 11:  // template talk
			work_area.append( { type: 'header', label: 'साँचे' } );
			work_area.append( { type: radioOrCheckbox, name: 'csd', list: Twinkle.speedy.generateCsdList(Twinkle.speedy.templateList, mode) } );
			break;

		default:
			break;
	}

	// custom rationale lives under general criteria when tagging
	var generalCriteria = Twinkle.speedy.generalList;
	if(!Twinkle.speedy.mode.isSysop(mode)) {
		generalCriteria = Twinkle.speedy.customRationale.concat(generalCriteria);
	}
	work_area.append( { type: 'header', label: 'वैश्विक मापदंड' } );
	work_area.append( { type: radioOrCheckbox, name: 'csd', list: Twinkle.speedy.generateCsdList(generalCriteria, mode) });

	var old_area = Morebits.quickForm.getElements(form, "work_area")[0];
	form.replaceChild(work_area.render(), old_area);
};

Twinkle.speedy.generateCsdList = function twinklespeedyGenerateCsdList(list, mode) {
	// mode switches
	var isSysop = Twinkle.speedy.mode.isSysop(mode);
	var multiple = Twinkle.speedy.mode.isMultiple(mode);
	var hasSubmitButton = Twinkle.speedy.mode.hasSubmitButton(mode);

	var openSubgroupHandler = function(e) {
		$(e.target.form).find('input').prop('disabled', true);
		$(e.target.form).children().css('color', 'gray');
		$(e.target).parent().css('color', 'black').find('input').prop('disabled', false);
		$(e.target).parent().find('input:text')[0].focus();
		e.stopPropagation();
	};
	var submitSubgroupHandler = function(e) {
		var evaluateType = Twinkle.speedy.mode.isSysop(mode) ? 'evaluateSysop' : 'evaluateUser';
		Twinkle.speedy.callback[evaluateType](e);
		e.stopPropagation();
	};

	return $.map(list, function(critElement) {
		var criterion = $.extend({}, critElement);

		if (multiple) {
			if (criterion.hideWhenMultiple) {
				return null;
			}
			if (criterion.hideSubgroupWhenMultiple) {
				criterion.subgroup = null;
			}
		} else {
			if (criterion.hideWhenSingle) {
				return null;
			}
			if (criterion.hideSubgroupWhenSingle) {
				criterion.subgroup = null;
			}
		}

		if (isSysop) {
			if (criterion.hideWhenSysop) {
				return null;
			}
			if (criterion.hideSubgroupWhenSysop) {
				criterion.subgroup = null;
			}
		} else {
			if (criterion.hideWhenUser) {
				return null;
			}
			if (criterion.hideSubgroupWhenUser) {
				criterion.subgroup = null;
			}
		}

		if (criterion.subgroup && !hasSubmitButton) {
			if ($.isArray(criterion.subgroup)) {
				criterion.subgroup.push({
					type: 'button',
					name: 'submit',
					label: 'Submit Query',
					event: submitSubgroupHandler
				});
			} else {
				criterion.subgroup = [
					criterion.subgroup,
					{
						type: 'button',
						name: 'submit',  // ends up being called "csd.submit" so this is OK
						label: 'Submit Query',
						event: submitSubgroupHandler
					}
				];
			}
			// FIXME: does this do anything?
			criterion.event = openSubgroupHandler;
		}

		criterion.event = function(e) {
			if (multiple) return;
			if( isSysop ) {
				var normalizedCriterion = Twinkle.speedy.normalizeHash[e.target.value];
				$('[name=openusertalk]').prop('checked',
						Twinkle.getPref('openUserTalkPageOnSpeedyDelete').indexOf(normalizedCriterion) !== -1
					);
			} else {
				$('[name=openusertalk]').prop('checked', false);
			}
		};

		return criterion;
	});
};

Twinkle.speedy.customRationale = [
	{
		label: 'विशिष्ट कारण' + (Morebits.userIsInGroup('sysop') ? ' (हटाने का विशेष कारण)' : ' {'+'{शीह}} साँचे का प्रयोग करते हुए'),
		value: 'कारण',
		tooltip: '{'+'{शीह}} "शीघ्र हटाएँ" का लघु रूप है। ऐसे नामांकन में भी शीघ्र हटाने का कोई मापदंड लागू होना चाहिये। यदि कोई मापदंड लागू नहीं होता, तो पृष्ठ हटाने हेतु चर्चा का प्रयोग करें।',
		subgroup: {
			name: 'reason_1',
			type: 'input',
			label: 'कारण: ',
			size: 60
		},
		hideWhenMultiple: true
	}
];

Twinkle.speedy.talkList = [
	{
		label: 'हटाए गए पृष्ठों के वार्ता पृष्ठ',
		value: 'talk',
		tooltip: 'इसमें ऐसे कोई भी वार्ता पृष्ठ नहीं आते जिनसे विकिपीडिया को कोई फ़ायदा हो - खासकर सदस्य वार्ता पृष्ठ और वार्ता पुरालेख।'
	}
];

Twinkle.speedy.fileList = [
	{
		label: 'फ़1. 14 दिन से अधिक समय तक कोई लाइसेंस न होना',
		value: 'लाइसेंस',
		tooltip: 'इसमें वे सभी फाइलें आती हैं जिनमें अपलोड होने से दो सप्ताह के बाद तक भी कोई लाइसेंस नहीं दिया गया है। ऐसा होने पर यदि फ़ाइल पुरानी होने के कारण सार्वजनिक क्षेत्र(पब्लिक डोमेन) में नहीं होगी, तो उसे शीघ्र हटा दिया जाएगा।'
	},
	{
		label: 'फ़2. चित्र का विकिमीडिया कॉमन्स पर स्रोत और लाइसेंस जानकारी सहित उपलब्ध होना',
		value: 'कॉमन्स',
		tooltip: 'ऐसी फ़ाइलों को हटाने से पहले जाँच लें  कि कॉमन्स पर स्रोत और लाइसेंस जानकारी सही हो, और यदि कॉमन्स पर फ़ाइल का नाम विकिपीडिया पर फ़ाइल के नाम से भिन्न है तो विकिपीडिया की फ़ाइल की जगह सभी जगह कॉमन्स की फ़ाइल का प्रयोग करें।',
		subgroup: {
			name: 'nowcommons_filename',
			type: 'input',
			label: 'कॉमन्स पर फ़ाइल का नाम: ',
			value: Morebits.pageNameNorm,
			tooltip: 'यदि कॉमन्स पर फ़ाइल का यही नाम है तो आप इसे रिक्त छोड़ सकते हैं। फ़ाइल के नाम से पहले "File:" अथवा "चित्र:" लगाना वैकल्पिक है।'
		},
		hideWhenMultiple: true
	},
	{
			label: 'फ़3. अप्रयुक्त ग़ैर मुक्त उचित उपयोग फ़ाइल',
			value: 'अप्रयुक्त ग़ैर मुक्त',
			tooltip: 'इस मापदंड के अंतर्गत वे फ़ाइलें आती हैं जो कॉपीराइट सुरक्षित हैं और उचित उपयोग हेतु विकिपीडिया पर डाली गई हैं, परंतु जिनका कोई उपयोग न किया जा रहा है और न ही होने की संभावना है।'
	},
	{
		label: 'फ़4. ग़ैर मुक्त उचित उपयोग उपयोग फ़ाइल जिसपर कोई उचित उपयोग औचित्य न दिया हो',
		value: 'औचित्य',
		tooltip: 'ऐसी कॉपीराइट सुरक्षित फ़ाइलें जिनपर 7 दिन तक कोई उचित उपयोग औचित्य न दिया हो, उन्हें इस मापदंड के अंतर्गत हटाया जा सकता है।'
	},
	{
		label: 'फ़5. ग़ैर मुक्त फ़ाइलें जिनका मुक्त विकल्प उपलब्ध हो',
		value: 'मुक्त विकल्प',
		tooltip: 'इस मापदंड के अंतर्गत वे फ़ाइलें आती हैं जो ग़ैर मुक्त हैं और जिनका कोई मुक्त विकल्प उपलब्ध है। यह आवश्यक नहीं कि मुक्त विकल्प हूबहू वही फ़ाइल हो।',
		subgroup: {
			name: 'free_alternative_filename',
			type: 'input',
			label: 'मुक्त विकल्प फ़ाइल का नाम: '
		}
	},
	{
		label: 'फ़6. फ़ालतू फ़ाइलें',
		value: 'फ़ालतू',
		tooltip: 'इस मापदंड के अंतर्गत वे फ़ाइलें आती हैं जिनका कोई प्रयोग नहीं हो रहा है और जिनका कोई ज्ञानकोशीय प्रयोग नहीं किया जा सकता है। इसमें चित्र, ध्वनियाँ एवं वीडियो फ़ाइलें नहीं आती हैं।'
	},
	{
		label: 'व6फ़. साफ़ कॉपीराइट उल्लंघन - फ़ाइलें',
		value: 'कॉपीराइट फ़ाइल',
		tooltip: 'वे सभी फ़ाइलें जो अंतरजाल पर किसी ऐसी वेबसाइट से लिये गए हैं जो साफ़-साफ़ फ़ाइल को मुक्त लाइसेंस के अंतर्गत नहीं देती है। इसमें वे फ़ाइलें भी आती हैं जिनका कॉपीराइट स्वयं अपलोडर के पास है और सदस्य ने उसका पहला प्रकाशन किसी मुक्त लाइसेंस के अंतर्गत नहीं किया है।',
		subgroup: {
				name: 'copyvio_url',
				type: 'input',
				label: 'स्रोत यू॰आर॰एल: ',
				tooltip: 'कृपया स्रोत यू॰आर॰एल बताएँ, http अथवा https समेत।',
				size: 60
			},
		hideWhenMultiple: true
	}
];

Twinkle.speedy.articleList = [
	{
		label: 'ल1. पूर्णतया अन्य भाषा में लिखे लेख',
		value: 'अन्य भाषा',
		tooltip: 'इसमें वे लेख आते हैं जो पूर्णतया हिन्दी के अलावा किसी और भाषा में लिखे हुए हैं, चाहे उनका नाम हिन्दी में हो या किसी और भाषा में।'
	},
//to be removed possibly per policy
	{
		label: 'ल2. साफ़ प्रचार',
		value: 'प्रचार लेख',
		tooltip: 'इसमें वे सभी पृष्ठ आते हैं जिनमें केवल प्रचार है, चाहे वह किसी व्यक्ति-विशेष का हो, किसी समूह का, किसी प्रोडक्ट का, अथवा किसी कंपनी का। इसमें प्रचार वाले केवल वही लेख आते हैं जिन्हें ज्ञानकोष के अनुरूप बनाने के लिये शुरू से दोबारा लिखना पड़ेगा।'
	},
	{
		label: 'ल4. प्रतिलिपि लेख',
		value: 'प्रतिलिपि',
		tooltip: 'इस मापदंड के अंतर्गत वो लेख आते हैं जो किसी पुराने लेख की प्रतिलिपि हैं। इसमें वे लेख भी आते हैं जो किसी ऐसे विषय पर बनाए गए हैं जिनपर पहले से लेख मौजूद है और पुराना लेख नए लेख से बेहतर है।',
		subgroup: {
				name: 'copypaste_1',
				type: 'input',
				label: 'मूल लेख: ',
				tooltip: 'मूल पुराने लेख का नाम जिसकी प्रतिलिपि यह लेख है'
			}
	},
	{
		label: 'व6ल. साफ़ कॉपीराइट उल्लंघन - लेख',
		value: 'कॉपीराइट लेख',
		tooltip: 'इस मापदंड में वे सभी पृष्ठ आते हैं जो साफ़ तौर पर कॉपीराइट उल्लंघन हैं और जिनके इतिहास में उल्लंघन से मुक्त कोई भी अवतरण नहीं है।',
		subgroup: {
				name: 'copyvio_url',
				type: 'input',
				label: 'स्रोत यू॰आर॰एल: ',
				tooltip: 'कृपया स्रोत यू॰आर॰एल बताएँ, http अथवा https समेत।',
				size: 60
			},
		hideWhenMultiple: true
	}
];

Twinkle.speedy.userList = [
	{
		label: 'स1. सदस्य अनुरोध',
		value: 'सदस्य अनुरोध',
		tooltip: 'यदि सदस्य अपने सदस्य पृष्ठ, वार्ता पृष्ठ अथवा किसी उपपृष्ठ को हटाने का स्वयं अनुरोध करता है तो उस पृष्ठ को शीघ्र हटाया जा सकता है।'
	},
	{
		label: 'स2. अस्तित्वहीन सदस्यों के सदस्य पृष्ठ अथवा उपपृष्ठ',
		value: 'अस्तित्वहीन',
		tooltip: 'ऐसे सदस्यों के पृष्ठ, वार्ता पृष्ठ अथवा उपपृष्ठ जो विकिपीडिया पर पंजीकृत नहीं हैं; इस मापदंड के अंतर्गत शाघ्र हटाए जा सकते हैं।'
	},
	{
		label: 'स3. वेब होस्ट के रूप में विकिपीडिया का स्पष्ट दुरुपयोग',
		value: 'वेब होस्ट',
		tooltip: 'सदस्य नामस्थान में बने ऐसे पृष्ठ जिनका विकिपीडिया के लक्ष्यों से बारीकी से संबंध नहीं, जहाँ स्वामी ने सदस्य स्थान के बाहर बहुत कम या कोई संपादन नहीं किया है। इस मापदंड के अंतर्गत आते हैं।'
	},
	{
		label: 'व6स. साफ़ कॉपीराइट उल्लंघन - सदस्य पृष्ठ',
		value: 'कॉपीराइट सदस्य',
		tooltip: 'सदस्य अपने सदस्य पृष्ठ, वार्ता पृष्ठ अथवा किसी उपपृष्ठ पर कॉपीराइट सामग्री नहीं रख सकते और ऐसे पृष्ठों को शीघ्र हटाया जा सकता है। इसमें ऐसे पृष्ठ भी आते हैं जिनमें मुख्य रूप से "ग़ैर मुक्त उचित उपयोग चित्रों" की दीर्घा(गैलरी) हो, क्योंकि ऐसे चित्रों का सदस्य नामस्थान में प्रयोग विकिपीडिया की नीतियों के विरुद्ध है।',
		subgroup: {
				name: 'copyvio_url',
				type: 'input',
				label: 'स्रोत यू॰आर॰एल: ',
				tooltip: 'कृपया स्रोत यू॰आर॰एल बताएँ, http अथवा https समेत।',
				size: 60
			},
		hideWhenMultiple: true
	}
];

Twinkle.speedy.templateList = [
	{
		label: 'सा1. अप्रयुक्त साँचे जिनकी जगह किसी बेहतर साँचे ने ले ली है',
		value: 'पुराना साँचा',
		tooltip: 'इसके अंतर्गत वे सभी साँचे आते हैं जो अब प्रयोग में नहीं हैं और जिनकी जगह उनसे बेहतर किसी साँचे ने ले ली है। यदि नए साँचे के बेहतर होने पर विवाद हो, अथवा साँचा प्रयोग में हो तो हटाने हेतु चर्चा प्रक्रिया का प्रयोग करें।',
		subgroup: {
				name: 'better_template',
				type: 'input',
				label: 'बेहतर साँचा: '
			},
	}
];

Twinkle.speedy.generalList = [
	{
		label: 'व1. अर्थहीन नाम अथवा सम्पूर्णतया अर्थहीन सामग्री वाले पृष्ठ',
		value: 'अर्थहीन',
		tooltip: 'इसमें वे पृष्ठ आते हैं जिनका नाम अर्थहीन है; अथवा जिनमें सामग्री अर्थहीन है, चाहे उसका नाम अर्थहीन न हो।'
	},
	{
		label: 'व2. परीक्षण पृष्ठ',
		value: 'परीक्षण',
		tooltip: 'इसमें वे पृष्ठ आते हैं जिन्हें परीक्षण के लिये बनाया गया है, अर्थात यह जानने के लिये कि सचमुच सदस्य वहाँ बदलाव कर सकता है या नहीं। इस मापदंड के अंतर्गत सदस्यों के उपपृष्ठ नहीं आते।'
	},
	{
		label: 'व3. साफ़ बर्बरता',
		value: 'बर्बरता',
		tooltip: 'इस मापदंड के अंतर्गत ऐसे पृष्ठ आते हैं जिनपर केवल बर्बरता हो। इसमें केवल वही पृष्ठ आते हैं जिनके इतिहास में बर्बरता मुक्त कोई भी अवतरण न हो।'
	},
	{
		label: 'व4. साफ़ धोखा',
		value: 'धोखा',
		tooltip: 'इस मापदंड के अंतर्गत वे पृष्ठ आते हैं जिनपर साफ़ दिखाई दे रहा धोखा हो।'
	},
	{
		label: 'व5. ख़ाली पृष्ठ',
		value: 'खाली',
		tooltip: 'इसमें वे सभी पृष्ठ आते हैं जिनमें कोई सामग्री नहीं है, और न ही किसी पुराने अवतरण में थी।'
	},
	{
		label: 'व6. साफ़ कॉपीराइट उल्लंघन',
		value: 'कॉपीराइट',
		tooltip: 'इस मापदंड में वे सभी पृष्ठ आते हैं जो साफ़ तौर पर कॉपीराइट उल्लंघन हैं और जिनके इतिहास में उल्लंघन से मुक्त कोई भी अवतरण नहीं है। इसमें वे पृष्ठ भी आते हैं जिनपर डाली गई सामग्री का कॉपीराइट स्वयं उसी सदस्य के पास है और सदस्य ने उसका पहला प्रकाशन किसी मुक्त लाइसेंस के अंतर्गत नहीं किया है। इस मापदंड का प्रयोग तभी किया जाना चाहिये यदि पृष्ठ व6ल, व6फ़, अथवा व6स के अंतर्गत न आता हो।',
		subgroup: {
				name: 'copyvio_url',
				type: 'input',
				label: 'स्रोत यू॰आर॰एल: ',
				tooltip: 'कृपया स्रोत यू॰आर॰एल बताएँ, http अथवा https समेत।',
				size: 60
			},
		hideWhenMultiple: true
	},
	{
		label: 'व7. साफ़ प्रचार',
		value: 'प्रचार',
		tooltip: 'इस मापदंड में वे सभी पृष्ठ आते हैं जिनमें केवल प्रचार है, चाहे वह किसी व्यक्ति-विशेष का हो, किसी समूह का, किसी प्रोडक्ट का, अथवा किसी कंपनी का। इसमें प्रचार वाले केवल वही लेख आते हैं जिन्हें ज्ञानकोश के अनुरूप बनाने के लिये शुरू से दोबारा लिखना पड़ेगा।'
	}
];

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
	'प्रचार': 'व7',
	'अन्य भाषा': 'ल1',
	'प्रचार लेख': 'ल2',
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
	'वेब होस्ट': 'स3',
	'talk': ''
};

Twinkle.speedy.callbacks = {
	getTemplateCodeAndParams: function(params) {
		var code, parameters, i;
		if (params.normalizeds.length > 1) {
			code = "{{शीह-अनेक";
			$.each(params.normalizeds, function(index, norm) {
				code += "|" + norm;
				parameters = params.templateParams[index] || [];
				for (var i in parameters) {
					if (typeof parameters[i] === 'string') {
						code += "|" + parameters[i];
					}
				}
			});
			code += "}}";
		} else {
			parameters = params.templateParams[0] || [];
			code = "{{शीह-";
			if (params.value === 'talk') {
				code+= "कारण|हटाए गए पृष्ठ का वार्ता पृष्ठ";
			}
			else {
			code += params.values[0];
			}
			for (i in parameters) {
				if (typeof parameters[i] === 'string') {
					code += "|" + parameters[i];
				}
			}
			if (params.self) {
				code += "|स्वयं=हाँ";
			}
			code += "}}";
		}

		return [code];
	},

	parseWikitext: function(wikitext, callback) {
		var query = {
			action: "parse",
			prop: "text",
			pst: "true",
			text: wikitext,
			title: mw.config.get("wgPageName")
		};

		var statusIndicator = new Morebits.status( 'हटाने के लॉग हेतु सारांश बनाया जा रहा है' );
		var api = new Morebits.wiki.api( 'शीह साँचे से कारण प्राप्त किया जा रहा है', query, function(apiObj) {
				statusIndicator.info( 'पूर्ण' );
				callback(apiObj);
			},  statusIndicator);
		api.post();
	},

	sysop: {
		main: function( params ) {
			var reason;

			if (!params.normalizeds.length && params.normalizeds[0] === 'शीह') {
				reason = prompt('कृपया शीघ्र हटाने के लिये कारण दें।\n\"यह पृष्ठ शीघ्र हटाने योग्य है क्योंकि:\"', "");
				Twinkle.speedy.callbacks.sysop.deletePage( reason, params );
			} else {
				var code = Twinkle.speedy.callbacks.getTemplateCodeAndParams(params)[0];
				Twinkle.speedy.callbacks.parseWikitext(code, function(apiobj) {
					reason = decodeURIComponent($(apiobj.getXML().querySelector('text').childNodes[0].nodeValue).find('#delete-reason').text()).replace(/\+/g, ' ');
					reason = prompt('कृपया शीघ्र हटाने के लिये कारण दें। स्वतः जनरेट किये गए कारण को स्वीकार करने के लिये OK दबायें।', reason);
					Twinkle.speedy.callbacks.sysop.deletePage( reason, params );
				});
			}
		},
		deletePage: function( reason, params ) {
			var thispage = new Morebits.wiki.page( mw.config.get('wgPageName'), "पृष्ठ हटाया जा रहा है" );

			if (reason === null) {
				return Morebits.status.error("कारण पूछा गया था", "सदस्य द्वारा रद्द किया गया");
			} else if (!reason || !reason.replace(/^\s*/, "").replace(/\s*$/, "")) {
				return Morebits.status.error("कारण पूछा गया था", "आपके द्वारा कोई कारण नहीं दिया गया है। अतः पृष्ठ नहीं हटाया जाएगा।");
			}

			thispage.setEditSummary( reason + Twinkle.getPref('deletionSummaryAd') );
			thispage.deletePage(function() {
				thispage.getStatusElement().info("पूर्ण");
				Twinkle.speedy.callbacks.sysop.deleteTalk( params );
			});

			// look up initial contributor. If prompting user for deletion reason, just display a link.
			// Otherwise open the talk page directly
			if( params.openUserTalk ) {
				thispage.setCallbackParameters( params );
				thispage.lookupCreator( Twinkle.speedy.callbacks.sysop.openUserTalkPage );
			}
		},
		deleteTalk: function( params ) {
			// delete talk page
			if (params.deleteTalkPage &&
			    document.getElementById( 'ca-talk' ).className !== 'new') {
				var talkpage = new Morebits.wiki.page( Morebits.wikipedia.namespaces[ mw.config.get('wgNamespaceNumber') + 1 ] + ':' + mw.config.get('wgTitle'), "वार्ता पृष्ठ हटाया जा रहा है" );
				talkpage.setEditSummary('हटाए गए पृष्ठ [[' + Morebits.pageNameNorm + "]] का वार्ता पृष्ठ। " + Twinkle.getPref('deletionSummaryAd'));
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
					'titles': mw.config.get('wgPageName'),
					'prop': 'redirects',
					'rdlimit': 5000  // 500 is max for normal users, 5000 for bots and sysops
				};
				var wikipedia_api = new Morebits.wiki.api( 'पुनर्प्रेषणों की सूची प्राप्त की जा रही है...', query, Twinkle.speedy.callbacks.sysop.deleteRedirectsMain,
					new Morebits.status( 'पुनर्प्रेषण पृष्ठ हटाए जा रहे हैं' ) );
				wikipedia_api.params = params;
				wikipedia_api.post();
			}

			// promote Unlink tool
			var $link, $bigtext;
			if( mw.config.get('wgNamespaceNumber') === 6) {
				$link = $('<a/>', {
					'href': '#',
					'text': 'कड़ीतोड़ पर जाने के लिए यहाँ क्लिक करें',
					'css': { 'fontSize': '130%', 'fontWeight': 'bold' },
					'click': function(){
						Morebits.wiki.actionCompleted.redirect = null;
						Twinkle.speedy.dialog.close();
						Twinkle.unlink.callback("हटाई गयी फ़ाइल के सभी प्रयोग एवं/अथवा कड़ियाँ हटाई जा रही हैं: " + Morebits.pageNameNorm);
					}
				});
				$bigtext = $('<span/>', {
					'text': 'इस पृष्ठ की कड़ियाँ हटाने व फ़ाइल प्रयोग हटाने के लिए',
					'css': { 'fontSize': '130%', 'fontWeight': 'bold' }
				});
				Morebits.status.info($bigtext[0], $link[0]);
			} else {
				$link = $('<a/>', {
					'href': '#',
					'text': 'कड़ीतोड़ पर जाने के लिए यहाँ क्लिक करें',
					'css': { 'fontSize': '130%', 'fontWeight': 'bold' },
					'click': function(){
						Morebits.wiki.actionCompleted.redirect = null;
						Twinkle.speedy.dialog.close();
						Twinkle.unlink.callback("हटाए गए पृष्ठ कि कड़ियाँ हटाई जा रही हैं: " + Morebits.pageNameNorm);
					}
				});
				$bigtext = $('<span/>', {
					'text': 'कड़ियाँ हटाने के लिए',
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
				'vanarticle': Morebits.pageNameNorm
			};

			if (params.normalized.indexOf([ 'शीह', 'व6', 'व6ल', 'व6फ़', 'व6स', 'ल4', 'फ़2', 'फ़5', 'सा1']) !== -1) {
				// provide a link to the user talk page
				var $link, $bigtext;
				$link = $('<a/>', {
					'href': mw.util.wikiScript('index') + '?' + Morebits.queryString.create( query ),
					'text': 'सदस्य वार्ता:' + user + ' पृष्ठ खोलने के लिए यहाँ क्लिक करें',
					'target': '_blank',
					'css': { 'fontSize': '130%', 'fontWeight': 'bold' }
				});
				$bigtext = $('<span/>', {
					'text': 'पृष्ठ निर्माता को सूचित करने हेतु',
					'css': { 'fontSize': '130%', 'fontWeight': 'bold' }
				});
				Morebits.status.info($bigtext[0], $link[0]);
			} else {
				// open the initial contributor's talk page
				var statusIndicator = new Morebits.status('सदस्य ' + user, ' के वार्ता पृष्ठ को सम्पादन हेतु खोला जा रहा है...');

				switch( Twinkle.getPref('userTalkPageMode') ) {
				case 'tab':
					window.open( mw.util.wikiScript('index') + '?' + Morebits.queryString.create( query ), '_blank' );
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

				statusIndicator.info( 'पूर्ण' );
			}
		},
		deleteRedirectsMain: function( apiobj ) {
			var xmlDoc = apiobj.getXML();
			var $snapshot = $(xmlDoc).find('redirects rd');
			var total = $snapshot.length;
			var statusIndicator = apiobj.statelem;

			if( !total ) {
				statusIndicator.status("कोई पुनर्प्रेषण नहीं मिले");
				return;
			}

			statusIndicator.status("0%");

			var current = 0;
			var onsuccess = function( apiobjInner ) {
				var now = parseInt( 100 * (++current)/total, 10 ) + '%';
				statusIndicator.update( now );
				apiobjInner.statelem.unlink();
				if( current >= total ) {
					statusIndicator.info( now + ' (पूर्ण)' );
					Morebits.wiki.removeCheckpoint();
				}
			};

			Morebits.wiki.addCheckpoint();

			$snapshot.each(function(key, value) {
				var title = $(value).attr('title');
				var page = new Morebits.wiki.page(title, 'पुनर्प्रेषण हटाया जा रहा है: "' + title + '"');
				page.setEditSummary('हटाए गए पृष्ठ [[' + Morebits.pageNameNorm + "]] को पुनर्निर्देश। " + Twinkle.getPref('deletionSummaryAd'));
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
				if(params.self && Twinkle.getPref('NotifySelfSpeedy')) {
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

			// given the params, builds the template
			// returns => [<string> wikitext]
			var buildData = Twinkle.speedy.callbacks.getTemplateCodeAndParams(params),
				code = buildData[0];

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
			text = text.replace(/\{\{\s*([Nn]ew unreviewed article|नया असमीक्षित लेख|[Uu]serspace draft)\s*(\|(?:\{\{[^{}]*\}\}|[^{}])*)?\}\}\s*/ig, "");
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
				editsummary = '[[वि:हटाना#शीघ्र हटाना|शीघ्र हटाने]] का नामांकन। कारण: \"' + params["1"];
				for (i in parameters) {
					if (typeof parameters[i] === 'string') {
						editsummary += parameters[i];
					}
				}
				editsummary += '\"।';
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
			var params = pageobj.getCallbackParameters(), parameters;

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
							notifytext += "कारण|" + Morebits.pageNameNorm;
							parameters = params.templateParams[0] || [];
							for (var i in parameters) {
								if (typeof parameters[i] === 'string' && parameters[i]!=='') {
									notifytext += '|' + parameters[i];
								}
							}
							break;
						case 'talk':
							notifytext += "कारण|" + Morebits.pageNameNorm + "|हटाए गए पृष्ठ का वार्ता पृष्ठ";
							break;
						default:
							notifytext += params.normalizeds[0] + "|" + Morebits.pageNameNorm;
							parameters = params.templateParams[0] || [];
							for (var i in parameters) {
								if (typeof parameters[i] === 'string' && params.normalizeds[0]!==('व6' || 'व6ल' || 'व6फ़' || 'व6स') && parameters[i]!=='') {
									notifytext += '|' + parameters[i];
								}
							}
							break;
					}
				}
				else {
					notifytext += 'अनेक' + '|' + mw.config.get('wgPageName');
					$.each(params.normalizeds, function(index, norm) {
						notifytext += "|" + norm;
//						if (['शीह', 'व6', 'व6ल', 'व6फ़', 'व6स', 'ल4', 'फ़2', 'फ़5', 'सा1'].indexOf(norm) !== -1) {
						parameters = params.templateParams[index] || [];
						for (i in parameters) {
							if (typeof parameters[i] === 'string') {
								notifytext += "|" + parameters[i];
							}
						}
//						}
					});
				}
				notifytext +="}}~~~~";

				usertalkpage.setAppendText(notifytext);
				usertalkpage.setEditSummary("सूचना: [[" + Morebits.pageNameNorm + "]] को शीघ्र हटाने का नामांकन।" + Twinkle.getPref('summaryAd'));
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
			var wikipedia_page = new Morebits.wiki.page("सदस्य:" + mw.config.get('wgUserName') + "/" + Twinkle.getPref('speedyLogPageName'), "आपकी शीह लॉग में प्रविष्टि जोड़ी जा रही है");
			params.logInitialContrib = initialContrib;
			wikipedia_page.setCallbackParameters(params);
			wikipedia_page.load(Twinkle.speedy.callbacks.user.saveLog);
		},

		saveLog: function(pageobj) {
			var text = pageobj.getPageText();
			var params = pageobj.getCallbackParameters();

			var appendText = "";

			// add blurb if log page doesn't exist
			if (!pageobj.exists()) {
				appendText +=
					"ये इस सदस्य द्वारा ट्विंकल के प्रयोग से किये गए सभी [[वि:हटाना#शीघ्र हटाना|शीघ्र हटाने]] के नामांकनों का लॉग है।\n\n" +
					"यदि आप यह लॉग अब नहीं रखना चाहते, तो आप [[वि:Twinkle/Preferences|preferences panel]] का प्रयोग कर के इसमें अद्यतन बंद कर सकते हैं, और " +
					"[[वि:हटाना#स1|स1]] के अंतर्गत इसे शीघ्र हटाने के लिये नामांकित कर सकते हैं।\n";
				if (Morebits.userIsInGroup("sysop") ) {
					appendText += "\nयह लॉग ट्विंकल के प्रयोग से सीधे हटाए गए पृष्ठों को नहीं दिखाता।\n";
				}
			}

			// create monthly header
			var date = new Date();
			var headerRe = new RegExp("^==+\\s*" + date.getUTCMonthName() + "\\s+" + date.getUTCFullYear() + "\\s*==+", "m");
			if (!headerRe.exec(text)) {
				appendText += "\n\n=== " + date.getUTCMonthName() + " " + date.getUTCFullYear() + " ===";
			}

			appendText += "\n# [[:" + Morebits.pageNameNorm + "]]: ";
			if (params.normalizeds.length > 1) {
				appendText += "अनेक मापदंड (";
				$.each(params.normalizeds, function(index, norm) {
					appendText += '[[वि:हटाना#' + norm + '|' + norm + ']], ';
				});
				appendText = appendText.substr(0, appendText.length - 2);  // remove trailing comma
				appendText += ')';
			}
			else if (params.normalizeds[0] === 'शीह') {
				appendText += "{{tl|शीह-कारण}}";
			} else {
				appendText += "[[वि:हटाना#" + params.normalizeds[0] + "|शीह " + params.normalizeds[0] + "]] ({{tl|शीह-" + params.values[0] + "}})";
			}

			if (params.logInitialContrib) {
				appendText += "; {{सदस्य|1=" + params.logInitialContrib + "}} को सूचित किया";
			}
			appendText += " ~~~~~\n";

			pageobj.setAppendText(appendText);
			pageobj.setEditSummary("[[" + Morebits.pageNameNorm + "]] के शीघ्र हटाने के नामांकन का लॉग।" + Twinkle.getPref('summaryAd'));
			pageobj.setCreateOption("recreate");
			pageobj.append();
		}
	}
};

// validate subgroups in the form passed into the speedy deletion tag
Twinkle.speedy.getParameters = function twinklespeedyGetParameters(form, values) {
	var parameters = [];

	$.each(values, function(index, value) {
		var currentParams = [];
		switch (value) {
			case 'कारण':
				if (form["csd.reason_1"]) {
					var dbrationale = form["csd.reason_1"].value;
					if (!dbrationale || !dbrationale.trim()) {
						alert( 'कारण बताना आवश्यक है।  नामांकन रोक दिया गया है।' );
						parameters = null;
						return false;
					}
					currentParams["1"] = dbrationale;
				}
				break;

			case 'कॉपीराइट':
			case 'कॉपीराइट लेख':
			case 'कॉपीराइट फ़ाइल':
			case 'कॉपीराइट सदस्य':
				if (form["csd.copyvio_url"] && form["csd.copyvio_url"].value) {
					copyvio_url = form["csd.copyvio_url"].value;
					if (!copyvio_url || !copyvio_url.trim()) {
						alert( 'आपने स्रोत यू॰आर॰एल नहीं दिया है। नामांकन रोक दिया गया है।' );
						parameters = null;
						return false;
					}
					if (copyvio_url.indexOf("http") !== 0) {
						alert( 'आपने जो स्रोत यू॰आर॰एल दिया है, वह http से नहीं शुरू होता। नामांकन रोक दिया गया है।' );
						parameters = null;
						return false;
					}
					currentParams["1"] = copyvio_url;
				}
				break;

			case 'प्रतिलिपि':
				if (form["csd.copypaste_1"]) {
					var copypaste = form["csd.copypaste_1"].value;
					if (!copypaste || !copypaste.trim()) {
						alert( 'आपने मूल लेख का नाम नहीं दिया है। नामांकन रोक दिया गया है।' );
						parameters = null;
						return false;
					}
					currentParams["1"] = copypaste;
				}
				break;

			case 'कॉमन्स':
				if (form["csd.nowcommons_filename"]) {
					var filename = form["csd.nowcommons_filename"].value;
					if (filename && filename !== Morebits.pageNameNorm) {
						if (filename.indexOf("Image:") === 0
							|| filename.indexOf("File:") === 0
							|| filename.indexOf("चित्र:") === 0) {
							currentParams["1"] = filename;
						} else {
							currentParams["1"] = "File:" + filename;
						}
					}
					else {
						alert( 'आपने कॉमन्स पर फ़ाइल का नाम नहीं दिया है। नामांकन रोक दिया गया है।' );
						parameters = null;
						return false;
					}
				}
				break;

			case 'मुक्त विकल्प':
				if (form["csd.free_alternative_filename"]) {
					var altfile = form["csd.free_alternative_filename"].value;
					if (!altfile || !altfile.trim()) {
						alert( 'आपने कॉमन्स पर फ़ाइल का नाम नहीं दिया है। नामांकन रोक दिया गया है।' );
						parameters = null;
						return false;
					}
					if (altfile.indexOf("Image:") === 0
						|| altfile.indexOf("File:") === 0
						|| altfile.indexOf("चित्र:") === 0) {
						currentParams["1"] = altfile;
					} else {
						currentParams["1"] = "File:" + altfile;
					}
				}
				break;

			case 'पुराना साँचा':
				if (form["csd.better_template"]) {
					var bettertemplate = form["csd.better_template"].value;
					if (!bettertemplate || !bettertemplate.trim()) {
						alert( 'आपने बेहतर साँचे का नाम नहीं दिया है। नामांकन रोक दिया गया है।' );
						parameters = null;
						return false;
					}
					currentParams["1"] = bettertemplate;
				}
				break;

			default:
				break;
		}
		parameters.push(currentParams);
	});
	return parameters;
};

Twinkle.speedy.resolveCsdValues = function twinklespeedyResolveCsdValues(e) {
	var values = (e.target.form ? e.target.form : e.target).getChecked('csd');
	if (values.length === 0) {
		alert( "कृपया मापदंड चुनें!" );
		return null;
	}
	return values;
};

Twinkle.speedy.callback.evaluateSysop = function twinklespeedyCallbackEvaluateSysop(e)
{
	var form = (e.target.form ? e.target.form : e.target);

	if (e.target.type === "checkbox" || e.target.type === "text" ||
			e.target.type === "select") {
		return;
	}

	var tag_only = form.tag_only;
	if( tag_only && tag_only.checked ) {
		Twinkle.speedy.callback.evaluateUser(e);
		return;
	}

	var values = Twinkle.speedy.resolveCsdValues(e);
	if (!values) {
		return;
	}

	var normalizeds = values.map(function(value) {
		return Twinkle.speedy.normalizeHash[ value ];
	});

	// analyse each criterion to determine whether to watch the page, prompt for summary, or open user talk page
	var watchPage;
	normalizeds.forEach(function(norm) {
		if (Twinkle.getPref("watchSpeedyPages").indexOf(norm) !== -1) {
			watchPage = true;
		}
	});

	var params = {
		values: values,
		normalizeds: normalizeds,
		watch: watchPage,
		deleteTalkPage: form.talkpage && form.talkpage.checked,
		deleteRedirects: form.redirects.checked,
		openUserTalk: form.openusertalk.checked,
		templateParams: Twinkle.speedy.getParameters( form, values )
	};

	SimpleWindow.setButtonsEnabled( false );
	Morebits.status.init( form );

	Twinkle.speedy.callbacks.sysop.main( params );
};

Twinkle.speedy.callback.evaluateUser = function twinklespeedyCallbackEvaluateUser(e) {
	var form = (e.target.form ? e.target.form : e.target);

	if (e.target.type === "checkbox" || e.target.type === "text" ||
			e.target.type === "select") {
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
		lognomination: csdlog,
		templateParams: Twinkle.speedy.getParameters( form, values )
	};
	if (!params.templateParams) {
		return;
	}

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
