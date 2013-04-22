/*
 ****************************************
 *** friendlytag.js: Tag module
 ****************************************
 * Mode of invocation:     Tab ("Tag")
 * Active on:              Existing articles; file pages with a corresponding file
 *                         which is local (not on Commons); existing user subpages
 *                         and existing subpages of Wikipedia:Articles for creation;
 *                         all redirects
 * Config directives in:   FriendlyConfig
 */

Twinkle.tag = function friendlytag() {
	// redirect tagging
	if( Morebits.wiki.isPageRedirect() ) {
		Twinkle.tag.mode = 'redirect';
		twAddPortletLink( Twinkle.tag.callback, "टैग", "friendly-tag", "पुनर्निर्देश टैग" );
	}
	// file tagging
	else if( mw.config.get('wgNamespaceNumber') === 6 && !document.getElementById("mw-sharedupload") && document.getElementById("mw-imagepage-section-filehistory") ) {
		Twinkle.tag.mode = 'file';
		twAddPortletLink( Twinkle.tag.callback, "टैग", "friendly-tag", "फ़ाइल रखरखाव टैग" );
	}
	// article tagging
	else if( mw.config.get('wgNamespaceNumber') === 0 && mw.config.get('wgCurRevisionId') ) {
		Twinkle.tag.mode = 'article';
		twAddPortletLink( Twinkle.tag.callback, "टैग", "friendly-tag", "लेख रखरखाव टैग" );
	}
};

Twinkle.tag.callback = function friendlytagCallback( uid ) {
	var Window = new Morebits.simpleWindow( 630, (Twinkle.tag.mode === "article") ? 450 : 400 );
	Window.setScriptName( "Twinkle" );
	// anyone got a good policy/guideline/info page/instructional page link??
	Window.addFooterLink( "Twinkle help", "WP:TW/DOC#tag" );

	var form = new Morebits.quickForm( Twinkle.tag.callback.evaluate );

	switch( Twinkle.tag.mode ) {
		case 'article':
			Window.setTitle( "लेख रखरखाव टैगिंग" );

			form.append( {
					type: 'checkbox',
					list: [
						{
							label: 'यदि संभव  हो तो {{अनेक समस्याएँ}} द्वारा वर्गीकृत करें',
							value: 'group',
							name: 'group',
							tooltip: 'यदि {{अनेक समस्याएँ}} द्वारा  स्वीकृत 3 से अधिक साँचों का प्रयोग कर रहे हों और ये चैकबौक्स checked हो, तो सभी स्वीकृत साँचे एक {{अनेक समस्याएँ}} साँचे में एकत्रित कर दिए जायेंगे।',
							checked: Twinkle.getFriendlyPref('groupByDefault')
						}
					]
				}
			);

			form.append({
				type: 'select',
				name: 'sortorder',
				label: 'यह सूची देखें:',
				tooltip: 'You can change the default view order in your Twinkle preferences (WP:TWPREFS).',
				event: Twinkle.tag.updateSortOrder,
				list: [
					{ type: 'option', value: 'cat', label: 'वर्ग अनुसार', selected: Twinkle.getFriendlyPref('tagArticleSortOrder') === 'cat' },
					{ type: 'option', value: 'alpha', label: 'वर्णमाला अनुसार', selected: Twinkle.getFriendlyPref('tagArticleSortOrder') === 'alpha' }
				]
			});

			form.append( { type: 'div', id: 'tagWorkArea' } );

			if( Twinkle.getFriendlyPref('customTagList').length ) {
				form.append( { type: 'header', label: 'Custom tags' } );
				form.append( { type: 'checkbox', name: 'articleTags', list: Twinkle.getFriendlyPref('customTagList') } );
			}
			break;

		case 'file':
			Window.setTitle( "फ़ाइल रखरखाव टैगिंग" );

			// TODO: perhaps add custom tags TO list of checkboxes

			form.append({ type: 'header', label: 'लाइसेंस और स्रोत समस्या टैग' });
			form.append({ type: 'checkbox', name: 'imageTags', list: Twinkle.tag.file.licenseList } );

			form.append({ type: 'header', label: 'सफ़ाई टैग' } );
			form.append({ type: 'checkbox', name: 'imageTags', list: Twinkle.tag.file.cleanupList } );

			form.append({ type: 'header', label: 'विकिमीडिया कॉमन्स सम्बन्धी टैग' });
			form.append({ type: 'checkbox', name: 'imageTags', list: Twinkle.tag.file.commonsList } );
			break;

		case 'redirect':
			Window.setTitle( "Redirect tagging" );

			form.append({ type: 'header', label:'गलत एवं अलग वर्तनी, काल और वचन' });
			form.append({ type: 'checkbox', name: 'redirectTags', list: Twinkle.tag.spellingList });

			form.append({ type: 'header', label:'अन्य नाम' });
			form.append({ type: 'checkbox', name: 'redirectTags', list: Twinkle.tag.alternativeList });

			form.append({ type: 'header', label:'रखरखाव' });
			form.append({ type: 'checkbox', name: 'redirectTags', list: Twinkle.tag.administrativeList });
			break;

		default:
			alert("Twinkle.tag: unknown mode " + Twinkle.tag.mode);
			break;
	}

	form.append( { type:'submit' } );

	var result = form.render();
	Window.setContent( result );
	Window.display();

	if (Twinkle.tag.mode === "article") {
		// fake a change event on the sort dropdown, to initialize the tag list
		var evt = document.createEvent("Event");
		evt.initEvent("change", true, true);
		result.sortorder.dispatchEvent(evt);
	}
};

Twinkle.tag.checkedTags = [];

Twinkle.tag.updateSortOrder = function(e) {
	var sortorder = e.target.value;
	var $workarea = $(e.target.form).find("div#tagWorkArea");

	Twinkle.tag.checkedTags = e.target.form.getChecked("articleTags");
	if (!Twinkle.tag.checkedTags) {
		Twinkle.tag.checkedTags = [];
	}

	// function to generate a checkbox, with appropriate subgroup if needed
	var makeCheckbox = function(tag, description) {
		var checkbox = { value: tag, label: "{{" + tag + "}}: " + description };
		if (Twinkle.tag.checkedTags.indexOf(tag) !== -1) {
			checkbox.checked = true;
		}
		switch (tag) {
			case "सफ़ाई":
				checkbox.subgroup = {
					name: 'cleanup',
					type: 'input',
					label: 'सफ़ाई की आवश्यकता का कारण: ',
					tooltip: 'आवश्यक',
					size: 35
				};
				break;
			case "प्रतिलिपि सम्पादन":
				checkbox.subgroup = {
					name: 'copyEdit',
					type: 'input',
					label: '"इस लेख को ___ के लिए प्रतिलिपि सम्पादन की आवश्यकता है" ',
					tooltip: 'उदाहरण, "वर्तनी सुधार"। वैकल्पिक।',
					size: 35
				};
				break;
			case "कॉपी पेस्ट":
				checkbox.subgroup = {
					name: 'copypaste',
					type: 'input',
					label: 'स्रोत यू॰आर॰एल: ',
					tooltip: 'यदि ज्ञात हो।',
					size: 50
				};
				break;
			case "विशेषज्ञ":
				checkbox.subgroup = {
					name: 'expertSubject',
					type: 'input',
					label: 'Name of relevant WikiProject: ',
					tooltip: 'Optionally, enter the name of a WikiProject which might be able to help recruit an expert. Don\'t include the "WikiProject" prefix.',
				};
				break;
			case "वैश्वीकरण":
				checkbox.subgroup = {
					name: 'globalize',
					type: 'select',
					list: [
					{ label: "{{वैश्वीकरण}}: लेख विषय का विश्वव्यापी दृष्टिकोण नहीं दर्शाता है", value: "वैश्वीकरण" },
						{
							label: "क्षेत्र-विशिष्ट {{वैश्वीकरण}} उपसाँचे",
							list: [
								{ label: "{{वैश्वीकरण/अंग्रेज़ी}}: लेख मुख्य रूप से अंग्रेज़ी वक्ताओं का दृष्टिकोण दर्शाता है", value: "वैश्वीकरण/अंग्रेज़ी" },
								{ label: "{{वैश्वीकरण/यूरोप}}: लेख मुख्य रूप से यूरोपीय दृष्टिकोण दर्शाता है", value: "वैश्वीकरण/यूरोप" },
								{ label: "{{वैश्वीकरण/भारत}}: लेख मुख्य रूप से भारतीय दृष्टिकोण दर्शाता है", value: "वैश्वीकरण/भारत" }
							]
						}
					]
				};
				break;
			case "विलय":
			case "को विलय":
			case "में विलय":
				var otherTagName = "विलय";
				switch (tag)
				{
					case "को विलय":
						otherTagName = "में विलय";
						break;
					case "में विलय":
						otherTagName = "को विलय";
						break;
				}
				checkbox.subgroup = [
					{
						name: 'mergeTarget',
						type: 'input',
						label: 'अन्य लेख: ',
						tooltip: 'यदि एक से अधिक लेख निर्दिष्ट करने हों तो उनके बीच में पाइप का प्रयोग करें, जैसे पहला लेख|दूसरा लेख'
					},
					{
						name: 'mergeTagOther',
						type: 'checkbox',
						list: [
							{
								label: 'दूसरे लेख को {{' + otherTagName + '}} साँचे से चिन्हित करें',
								checked: true,
								tooltip: 'यह केवल तभी उपलब्ध है यदि केवल एक लेख का नाम दिया जाये।'
							}
						]
					}
				];
				if (mw.config.get('wgNamespaceNumber') === 0) {
					checkbox.subgroup.push({
						name: 'mergeReason',
						type: 'textarea',
						label: 'विलय के लिये कारण (वार्ता पृष्ठ पर जोड़ा जायेगा):',
						tooltip: 'यह वैकल्पिक है, परन्तु जहाँ तक संभव हो इसका प्रयोग किया जाना चाहिए। इसका प्रयोग ना करना हो तो इसे खाली छोड़ दें। यह तभी जोड़ा जाएगा यदि विलय हेतु एक ही लेख का नाम दिया जाए।'
					});
				}
				break;
			case "हिन्दी नहीं":
				checkbox.subgroup = [
					{
						name: 'translationLanguage',
						type: 'input',
						label: 'लेख की भाषा (यदि ज्ञात हो): ',
						tooltip: 'यदि समझ ना आये तो [[वि:चौपाल]] पर पूछें।'
					},
				];
				break;
			case "खराब अनुवाद":
				checkbox.subgroup = [
					{
						name: 'translationLanguage',
						type: 'input',
						label: 'स्रोत भाषा जिससे अनुवाद किया गया है (यदि ज्ञात हो): ',
						tooltip: 'यदि समझ ना आये तो [[वि:चौपाल]] पर पूछें।'
					},
				];
				break;
			default:
				break;
		}
		return checkbox;
	};

	// categorical sort order
	if (sortorder === "cat") {
		var div = new Morebits.quickForm.element({
			type: "div",
			id: "tagWorkArea"
		});

		// function to iterate through the tags and create a checkbox for each one
		var doCategoryCheckboxes = function(subdiv, array) {
			var checkboxes = [];
			$.each(array, function(k, tag) {
				var description = Twinkle.tag.article.tags[tag];
				checkboxes.push(makeCheckbox(tag, description));
			});
			subdiv.append({
				type: "checkbox",
				name: "articleTags",
				list: checkboxes
			});
		};

		var i = 0;
		// go through each category and sub-category and append lists of checkboxes
		$.each(Twinkle.tag.article.tagCategories, function(title, content) {
			div.append({ type: "header", id: "tagHeader" + i, label: title });
			var subdiv = div.append({ type: "div", id: "tagSubdiv" + i++ });
			if ($.isArray(content)) {
				doCategoryCheckboxes(subdiv, content);
			} else {
				$.each(content, function(subtitle, subcontent) {
					subdiv.append({ type: "div", label: [ Morebits.htmlNode("b", subtitle) ] });
					doCategoryCheckboxes(subdiv, subcontent);
				});
			}
		});

		var rendered = div.render();
		$workarea.replaceWith(rendered);
		var $rendered = $(rendered);
		$rendered.find("h5").css({ 'font-size': '110%', 'margin-top': '1em' });
		$rendered.find("div").filter(":has(span.quickformDescription)").css({ 'margin-top': '0.4em' });
	}
	// alphabetical sort order
	else {
		var checkboxes = [];
		$.each(Twinkle.tag.article.tags, function(tag, description) {
			checkboxes.push(makeCheckbox(tag, description));
		});
		var tags = new Morebits.quickForm.element({
			type: "checkbox",
			name: "articleTags",
			list: checkboxes
		});
		$workarea.empty().append(tags.render());
	}
};


// Tags for ARTICLES start here

Twinkle.tag.article = {};

// A list of all article tags, in alphabetical order
// To ensure tags appear in the default "categorized" view, add them to the tagCategories hash below.

Twinkle.tag.article.tags = {
	"अत्यधिक विवरण": "लेख में अनावश्यक अत्यधिक विवरण है",
	"अद्यतन": "लेख में नई जानकारी जोड़ने की आवश्यकता है",
	"अस्पष्ट": "लेख भ्रामक अथवा अस्पष्ट है",
	"अतिरंजित": "लेख में अतिरंजित शब्दावली का प्रयोग है जो सत्यापित जानकारी जोड़े बिना विषयवस्तु का प्रचार करती है",
	"अविश्वसनीय स्रोत": "लेख में दिये गए सन्दर्भों के विश्वसनीय न होने की आशंका है",
	"आत्मकथा": "लेख आत्मकथा है एवं ग़ैर तटस्थ दृष्टिकोण का हों सकता है",
	"उद्धरण कम": "लेख में संदर्भ हैं परन्तु उद्धरण अपर्याप्त हैं",
	"उद्धरण शैली": "लेख में अस्पष्ट अथवा परस्पर-विरोधी शैली के उद्धरण हैं",
	"उद्धरणहीन": "लेख में संदर्भ हैं परन्तु उद्धरण नहीं हैं",
	"उल्लेखनीयता": "लेख की विषयवस्तु उल्लेखनीयता दिशानिर्देशों पर खरी नहीं उतरती",
	"एक स्रोत": "लेख मुख्य रूप से अथवा पूर्णतया एक स्रोत पर निर्भर करता है",
	"एकाकी": "लेख से बहुत कम अथवा कोई भी लेख नहीं जुड़ते",
	"कम दृष्टिकोण": "लेख सभी महत्वपूर्ण दृष्टिकोण नहीं दर्शाता, केवल कुछ को दर्शाता है",
	"कहानी": "लेख में कहानी का सारांश बहुत लम्बा है",
	"काम जारी": "लेख पर इस समय काम चल रहा है और लेख में काफ़ी विस्तार अथवा सुधार किया जा रहा है",
	"को विलय": "इस लेख का एक और लेख में विलय कर देना चाहिए",
	"काल्पनिक परिप्रेक्ष्य": "लेख का विषय कल्पना पर आधारित है और लेख को वास्तविकता के परिप्रेक्ष्य से लिखने की आवश्यकता है",
	"कॉपी पेस्ट": "लेख किसी स्रोत से कॉपी-पेस्ट किया गया है",
	"खराब अनुवाद": "लेख किसी और भाषा से खराब तरीके से अनूदित किया गया है",
	"गद्य": "लेख सूची आरूप में है जिसे गद्य का प्रयोग करके बेहतर दर्शाया जा सकता है",
	"ग़ैर मुक्त": "लेख में ग़ैर मुक्त सामग्री का अत्यधिक अथवा अनुचित उपयोग है",
	"छोटी भूमिका": "लेख की भूमिका बहुत छोटी है और विस्तारित की जानी चाहिए",
	"जीवनी स्रोत कम": "जीवित व्यक्ति की जीवनी में सत्यापन हेतु अतिरिक्त स्रोतों की आवश्यकता है",
	"जीवनी स्रोतहीन": "जीवित व्यक्ति की जीवनी जिसमें कोई संदर्भ नहीं हैं",
	"दृष्टिकोण": "लेख की तटस्थता इस समय विवादित है",
	"दृष्टिकोण जाँच": "लेख को तटस्थता जाँच के लिए नामित करें",
	"धोखा": "लेख सम्पूर्णतया धोखा हो सकता है",
	"नया असमीक्षित लेख": "लेख को बाद में जाँचने के लिये चिन्हित करें",
	"निबंध": "लेख निबंध की तरह लिखा है और ठीक करने की आवश्यकता है",
	"पुराना": "लेख में पुरानी जानकारी है जिसे अद्यतन की आवश्यकता है",
	"प्रसंग": "लेख का प्रसंग अपर्याप्त है",
	"प्रतिलिपि सम्पादन": "लेख को व्याकरण, शैली, सामंजस्य, लहजे अथवा वर्तनी के लिए प्रतिलिपि सम्पादन की आवश्यकता है",
	"प्रशंसक दृष्टिकोण": "लेख प्रशंसक के दृष्टिकोण से लिखा है",
	"प्राथमिक स्रोत": "लेख प्राथमिक स्रोतों पर अत्यधिक रूप से निर्भर है। लेख में तृतीय पक्ष के स्रोतों की आवश्यकता है।",
	"बाहरी कड़ियाँ": "लेख कि बाहरी कड़ियाँ विकी नीतियों एवं दिशानिर्देशों के उल्लंघन में हैं",
	"बन्द सिरा": "लेख में दूसरे लेखों की कड़ियाँ नहीं हैं",
	"बड़े सम्पादन": "लेख में कुछ समय के लिये बड़े सम्पादन किये जा रहे हैं",
	"भाग": "लेख को भागों में विभाजित करने की आवश्यकता है",
	"भूमिका नहीं": "लेख में भूमिका नहीं है, लिखी जानी चाहिए",
	"भूमिका फिर लिखें": "लेख की भूमिका को दिशानिर्देशों के अनुसार पुनर्लेखन की आवश्यकता है",
	"भ्रामक": "भ्रामक शब्दों के प्रयोग से लेख में पक्षपात उत्पन्न हो रहा है",
	"में विलय": "एक और लेख का इस लेख में विलय कर देना चाहिए",
	"मूल शोध": "लेख में मूल शोध अथवा असत्यापित दावे हैं",
	"लम्बा": "लेख बहुत लम्बा है",
	"लम्बी भूमिका": "लेख की भूमिका बहुत लम्बी है, छोटी की जानी चाहिए",
	"लहजा": "लेख का लहजा ठीक नहीं हैं",
	"विकिफ़ाइ": "लेख को विकिफिकेशन की आवश्यकता है",
	"विलय": "लेख का एक और लेख से विलय कर देना चाहिए",
	"विवादित": "लेख की तथ्यात्मक सटीकता संदिग्ध है",
	"विशेषज्ञ": "लेख को विषय के विशेषज्ञ से ध्यान की आवश्यकता है",
	"विज्ञापन": "लेख विज्ञापन की तरह लिखा है",
	"वैश्वीकरण": "लेख विषय का विश्वव्यापी दृष्टिकोण नहीं दर्शाता है",
	"संदर्भ सिर्फ़ कड़ी": "स्रोतों के लिए सिर्फ़ यूआरएल का प्रयोग हुआ है, जिनके टूटने की संभावना है",
	"सफ़ाई": "लेख को  ठीक करने की आवश्यकता है",
	"सिर्फ़ कहानी": "लेख लगभग सम्पूर्णतः कहानी का सारांश है",
	"स्रोत कम": "लेख को सत्यापन के लिए अतिरिक्त संदर्भ एवं स्रोतों की आवश्यकता है",
	"स्रोतहीन": "लेख स्रोतहीन है",
	"स्वयं प्रकाशित स्रोत": "लेख में स्वप्रकाशित स्रोतों का अनुचित प्रयोग है",
	"हालही झुकाव": "लेख हाल की घटनाओं की ओर झुका हुआ है",
	"हिन्दी नहीं": "लेख हिन्दी के स्थान पर किसी और भाषा में लिखा है एवं अनूदित करने की आवश्यकता है",
	"ज्ञानकोषीय नहीं": "लेख में ज्ञानकोष के लिये अनुपयुक्त जानकारी है जो वि:नहीं के विरुद्ध है",
	"श्रेणी कम": "लेख को अतिरिक्त श्रेणियों की आवश्यकता है",
	"श्रेणीहीन": "लेख श्रेणीहीन है"
};

// A list of tags in order of category
// Tags should be in alphabetical order within the categories
// Add new categories with discretion - the list is long enough as is!

Twinkle.tag.article.tagCategories = {
	"सफ़ाई एवं रखरखाव": {
		"सामान्य सफ़ाई": [
			"सफ़ाई",  // has a subgroup with text input
			"प्रतिलिपि सम्पादन",  // has a subgroup with text input
			"विकिफ़ाइ"
		],
		"अवांछित सामग्री": [
			"कॉपी पेस्ट",  // has a subgroup with text input
			"बाहरी कड़ियाँ",
			"ग़ैर मुक्त",
			"ज्ञानकोषीय नहीं"
		],
		"संरचना, रूप, एवं भूमिका": [
			"भूमिका नहीं",
			"भूमिका फिर लिखें",
			"लम्बी भूमिका",
			"छोटी भूमिका",
			"भाग",
			"लम्बा"
		],
		"काल्पनिक विषयवस्तु संबंधी सफ़ाई": [
			"सिर्फ़ कहानी",
			"काल्पनिक परिप्रेक्ष्य",
			"कहानी"
		]
	},
	"सामग्री संबंधी आम मुद्दे": {
		"उल्लेखनीयता": [
			"उल्लेखनीयता"
		],
		"लेखन शैली": [
			"विज्ञापन",
			"निबंध",
			"गद्य",
			"अस्पष्ट",
			"लहजा"
		],
		"जानकारी एवं विवरण": [
			"प्रसंग",
			"विशेषज्ञ",
			"अत्यधिक विवरण",
			"पुराना",
			"अद्यतन"
		],
		"तटस्थता, पक्षपात एवं तथ्यात्मक सटीकता": [
			"आत्मकथा",
			"विवादित",
			"धोखा",
			"वैश्वीकरण",  // has a subgroup with subcategories
			"दृष्टिकोण",
			"दृष्टिकोण जाँच",
			"प्रशंसक दृष्टिकोण",
			"कम दृष्टिकोण",
			"हालही झुकाव",
			"अतिरंजित",
			"भ्रामक"
		],
		"सत्यापन एवं स्रोत": [
			"जीवनी स्रोत कम",
			"जीवनी स्रोतहीन",
			"मूल शोध",
			"प्राथमिक स्रोत",
			"स्रोत कम",
			"स्वयं प्रकाशित स्रोत",
			"स्रोतहीन",
			"अविश्वसनीय स्रोत"
		]
	},
	"सामग्री संबंधी विशिष्ट मुद्दे": {
		"भाषा": [
			"हिन्दी नहीं",  // has a subgroup with text input
			"खराब अनुवाद"  // has a subgroup with text input
		],
		"कड़ियाँ": [
			"बन्द सिरा",
			"एकाकी"
		],
		"संदर्भ शैली": [
			"उद्धरण शैली",
			"संदर्भ सिर्फ़ कड़ी",
			"उद्धरण कम",
			"उद्धरणहीन"
		],
		"श्रेणियाँ": [
			"श्रेणीहीन",
			"श्रेणी कम"
		]
	},
	"विलय": [  // these three have a subgroup with several options
		"विलय",
		"को विलय",
		"में विलय"
	],
	"सूचनात्मक": [
		"बड़े सम्पादन",
		"नया असमीक्षित लेख",
		"काम जारी"
	]
};

// Tags for REDIRECTS start here

Twinkle.tag.spellingList = [
	{
		label: '{{R from abbreviation}}: संक्षिप्त नाम से पुनर्निर्देशन',
		value: 'R from abbreviation' 
	},
	{
		label: '{{R to list entry}}: \"छोटी चीज़ों कि सूची\" प्रकार के लेख को पुनर्निर्देशन(ऐसे विषयों के लिये जो अपने-आप में सम्पूर्ण लेख जितने उल्लेखनीय नहीं हैं)',
		value: 'R to list entry' 
	},
	{
		label: '{{R to section}}: {{R to list entry}} जैसा, परंतु तब प्रयोग करें जब सूची अनुभाजित हो और पुनर्निर्देशन किसी अनुभाग को किया जा रहा हो',
		value: 'R to section' 
	},
	{
		label: '{{R from misspelling}}: गलत वर्तनी अथवा टंकन में गलती से पुनर्निर्देशन',
		value: 'R from misspelling' 
	},
	{
		label: '{{R from alternative spelling}}: अलग वर्तनी से पुनर्निर्देशन',
		value: 'R from alternative spelling' 
	},
	{
		label: '{{R from plural}}: बहुवचन से एकवचन को पुनर्निर्देशन',
		value: 'R from plural' 
	},
	{
		label: '{{R from related word}}: सम्बंधित शब्द से पुनर्निर्देशन',
		value: 'R from related word' 
	},
	/*{
		label: '{{R with possibilities}}: redirect from a more specific title to a more general, less detailed article, hence something which can and should be expanded',
		value: 'R with possibilities' 
	},*/
	{
		label: '{{R from member}}: किसी समूह के सदस्य से उस समूह, संगठन अथवा टीम इत्यादि को पुनर्निर्देशन',
		value: 'R from member' 
	}
];

Twinkle.tag.alternativeList = [
	{
		label: '{{R from alternative name}}: किसी और नाम, तख़ल्लुस, निकनेम, अथवा पर्यायवाची से पुनर्निर्देशन',
		value: 'R from alternative name' 
	},
	{
		label: '{{R from full name}}: पूरे नाम से पुनर्निर्देशन',
		value: 'R from full name' 
	},
	{
		label: '{{R from surname}}: उपनाम से पुनर्निर्देशन',
		value: 'R from surname' 
	},
	{
		label: '{{R from historic name}}: किसी ऐसे नाम से पुनर्निर्देशन जो ऐतिहासिक रूप से जगह से जुड़ा हुआ है',
		value: 'R from historic name',
		tooltip: 'उदहारण: उत्तरांचल से उत्तराखण्ड, मद्रास से चेन्नई'
	},
	{
		label: '{{R from scientific name}}: वैज्ञानिक नाम से आम नाम को पुनर्निर्देशन',
		value: 'R from scientific name' 
	},
	{
		label: '{{R to scientific name}}: आम नाम से वैज्ञानिक नाम को पुनर्निर्देशन',
		value: 'R to scientific name' 
	},
	{
		label: '{{R from name and country}}: देश सहित नाम से सिर्फ़ जगह के नाम को पुनर्निर्देशन',
		value: 'R from name and country' 
	},
	{
		label: '{{R from alternative language}}: किसी दूसरी भाषा के नाम से हिन्दी भाषा को पुनर्निर्देशन',
		value: 'R from alternative language' 
	}/*,
	{
		label: '{{R from ASCII}}: redirect from a title in basic ASCII to the formal article title, with differences that are not diacritical marks (accents, umlauts, etc.)',
		value: 'R from ASCII' 
	},
	{
		label: '{{R from title without diacritics}}: redirect to the article title with diacritical marks (accents, umlauts, etc.)',
		value: 'R from title without diacritics'
	}*/
];

Twinkle.tag.administrativeList = [
	{
		label: '{{R from merge}}: विलय किये गए पन्ने से पुनर्निर्देशन(सम्पादन इतिहास संरक्षित करने के लिये)',
		value: 'R from merge',
		tooltip: 'इसका प्रयोग तब करें जब दो सम्बन्धित विषयों के लेखों का विलय किया गया हो। एक ही विषय पर बने दो लेखों के लिये {{R from duplicated article}} का प्रयोग करें।'
	},
	{
		label: '{{R to disambiguation page}}: बहुविकल्पी पन्ने को पुनर्निर्देशन',
		value: 'R to disambiguation page' 
	},
	{
		label: '{{R from duplicated article}}: इसी विषय पर बने दूसरे लेख को पुनर्निर्देशन',
		value: 'R from duplicated article' 
	},
	{
		label: '{{R to decade}}: वर्ष से दशक को पुनर्निर्देशन',
		value: 'R to decade' 
	},
	{
		label: '{{R from shortcut}}: विकिपीडिया शॉर्टकट से पुनर्निर्देशन',
		value: 'R from shortcut' 
	},
	{
		label: '{{R from EXIF}}: redirect of a wikilink created from JPEG EXIF information (i.e. the \"metadata\" section on some image description pages)',
		value: 'R from EXIF' 
	}/*,
	{
		label: '{{R from school}}: redirect from a school article that had very little information',
		value: 'R from school'
	}*/
];

// maintenance tags for FILES start here

Twinkle.tag.file = {};

Twinkle.tag.file.licenseList = [
	{ label: '{{Bsr}}: source info consists of bare image URL/generic base URL only', value: 'Bsr' },
	{ label: '{{Non-free reduce}}: non-low-resolution fair use image (or too-long audio clip, etc)', value: 'Non-free reduce' },
	{ label: '{{Non-free reduced}}: fair use media which has been reduced (old versions need to be deleted)', value: 'Non-free reduced' }
];

Twinkle.tag.file.cleanupList = [
	{ label: '{{BadJPEG}}: JPEG that should be PNG or SVG', value: 'Bad JPEG' },
	{
		label: '{{Should be SVG}}: PNG, GIF or JPEG should be vector graphics', value: 'Should be SVG',
		subgroup: {
			name: 'svgCategory',
			type: 'select',
			list: [
				{ label: '{{Should be SVG|other}}', value: 'other' },
				{ label: '{{Should be SVG|alphabet}}: character images, font examples, etc.', value: 'alphabet' },
				{ label: '{{Should be SVG|chemical}}: chemical diagrams, etc.', value: 'chemical' },
				{ label: '{{Should be SVG|circuit}}: electronic circuit diagrams, etc.', value: 'circuit' },
				{ label: '{{Should be SVG|coat of arms}}: coats of arms', value: 'coat of arms' },
				{ label: '{{Should be SVG|diagram}}: diagrams that do not fit any other subcategory', value: 'diagram' },
				{ label: '{{Should be SVG|emblem}}: emblems, free/libre logos, insignias, etc.', value: 'emblem' },
				{ label: '{{Should be SVG|fair use}}: fair-use images, fair-use logos', value: 'fair use' },
				{ label: '{{Should be SVG|flag}}: flags', value: 'flag' },
				{ label: '{{Should be SVG|graph}}: visual plots of data', value: 'graph' },
				{ label: '{{Should be SVG|logo}}: logos', value: 'logo' },
				{ label: '{{Should be SVG|map}}: maps', value: 'map' },
				{ label: '{{Should be SVG|music}}: musical scales, notes, etc.', value: 'music' },
				{ label: '{{Should be SVG|physical}}: "realistic" images of physical objects, people, etc.', value: 'physical' },
				{ label: '{{Should be SVG|symbol}}: miscellaneous symbols, icons, etc.', value: 'symbol' }
			]
		}
	}
];

Twinkle.tag.file.commonsList = [
	{ label: '{{Move to Commons}}: मुक्त मीडिया जिसे कॉमन्स पर होना चाहिये', value: 'Move to Commons' },
	{ label: '{{Do not move to Commons}} (सार्वजनिक क्षेत्र समस्या): फ़ाइल संयुक्त राष्ट्र अमेरिका में सार्वजनिक क्षेत्र में है परंतु स्रोत देश में नहीं', value: 'Do not move to Commons' },
	{ label: '{{Do not move to Commons}} (अन्य कारण)', value: 'Do not move to Commons_reason' },
	{ label: '{{NowCommons}}: फ़ाइल कॉमन्स पर उपलब्ध है', value: 'subst:ncd' }
];

// Contains those article tags that can be grouped into {{multiple issues}}.
// This list includes synonyms.
Twinkle.tag.groupHash = [
 	'advert',
	'विज्ञापन',
	'autobiography',
	'आत्मकथा',
	'BLPrefimprove',
	'refimproveBLP',
	'BLP sources',
	'BLPsources',
	'जीवनी स्रोत कम',
	'BLP unsourced',
	'BLPunsourced',
	'BLPunreferenced',
	'BLPunref',
	'unrefBLP',
	'unreferencedBLP',
	'जीवनी स्रोतहीन',
	'citation style',
	'citationstyle',
	'citation-style',
	'उद्धरण शैली',
	'उद्धरण अनुपस्थित',
	'citations missing',
	'सफ़ाई',
	'cleanup',
	'laundry',
	'laundrylists',
	'organize',
	'restructure',
	'reorganisation',
	'spam',
	'confusing',
	'अस्पष्ट',
	'context',
	'प्रसंग',
	'contradict',
	'copy edit',
	'copyedit',
	'प्रतिलिपि सम्पादन',
	'प्रतिलिपि संपादन',
	'dead end',
	'deadend',
	'बन्द सिरा',
	'disputed',
	'विवादित',
	'essay-like',
	'essay',
	'निबंध',
	'examplefarm',
	'expert',
	'विशेषज्ञ',
	'external links',
	'बाहरी कड़ियाँ',
	'fanpov',
	'fansite',
	'प्रशंसक दृष्टिकोण',
	'globalize',
	'वैश्वीकरण',
	'hoax',
	'धोखा',
	'howto',
	'incomplete',
	'in-universe',
	'काल्पनिक परिप्रेक्ष्य',
	'lead missing',
	'intromissing',
	'भूमिका नहीं',
	'lead rewrite',
	'introrewrite',
	'भूमिका फिर लिखें',
	'lead too long',
	'intro length',
	'intro-toolong',
	'लम्बी भूमिका',
	'lead too short',
	'intro-tooshort',
	'छोटी भूमिका',
	'like resume',
	'likeresume',
	'newsrelease',
	'notability',
	'notable',
	'उल्लेखनीयता',
	'onesource',
	'one source',
	'एक स्रोत',
	'original research',
	'मूल शोध',
	'orphan',
	'do-attempt',
	'एकाकी',
	'out of date',
	'पुराना',
	'अत्यधिक विवरण',
	'fancruft',
	'peacock',
	'अतिरंजित',
	'plot',
	'कहानी',
	'POV',
	'NPOV',
	'pov',
	'npov',
	'दृष्टिकोण',
	'दृष्टिकोण जाँच',
	'pov-check',
	'प्राथमिक स्रोत',
	'primarysources',
	'prose',
	'गद्य',
	'recent',
	'recentism',
	'हालही झुकाव',
	'moreref',
	'morerefs',
	'morereferences',
	'refimprove',
	'स्रोत कम',
	'sections',
	'भाग',
	'self-published',
	'स्वयं प्रकाशित स्रोत',
	'story',
	'synthesis',
	'tone',
	'लहजा',
	'travel guide',
	'travelguide',
	'trivia',
	'unencyclopedic',
	'unreferenced',
	'unref',
	'स्रोतहीन',
	'स्रोत हीन',
	'update',
	'अद्यतन',
	'लम्बा',
	'verylong',
	'long',
	'भ्रामक',
	'weasel',
	'wikify',
	'विकिफ़ाइ',
	'विकिफाइ',
	'विकिफाई',
	'विकिफ़ाई'
];

Twinkle.tag.callbacks = {
	main: function( pageobj ) {
		var params = pageobj.getCallbackParameters(),
		    tagRe, tagText = '', summaryText = '',
		    tags = [], groupableTags = [],

		// Remove tags that become superfluous with this action
			pageText = pageobj.getPageText().replace(/\{\{\s*(नया असमीक्षित लेख|Userspace draft)\s*(\|(?:\{\{[^{}]*\}\}|[^{}])*)?\}\}\s*/ig, ""),

		    i;
		
		if( Twinkle.tag.mode !== 'redirect' ) {
			// Check for preexisting tags and separate tags into groupable and non-groupable arrays
			for( i = 0; i < params.tags.length; i++ ) {
				tagRe = new RegExp( '(\\{\\{' + params.tags[i] + '(\\||\\}\\}))', 'im' );
				if( !tagRe.exec( pageText ) ) {
					if( Twinkle.tag.groupHash.indexOf(params.tags[i]) !== -1 && 
							(params.tags[i] !== 'वैश्वीकरण' || params.globalizeSubcategory === 'वैश्वीकरण' )) {
						// don't add to multipleissues for globalize subcats
						groupableTags = groupableTags.concat( params.tags[i] );
					} else {
						tags = tags.concat( params.tags[i] );
					}
				} else {
					Morebits.status.info( 'Info', 'Found {{' + params.tags[i] +
						'}} on the article already...excluding' );
					// don't do anything else with merge tags
					if (params.tags[i] === "विलय" || params.tags[i] === "को विलय" || 
						params.tags[i] === "में विलय") {
						params.mergeTarget = params.mergeReason = params.mergeTagOther = false;
					}
				}
			}

			if( params.group && groupableTags.length >= 3 ) {
				Morebits.status.info( 'Info', 'स्वीकृत टैग {{अनेक समस्याएँ}} द्वारा वर्गीकृत किये जा रहे हैं' );

				groupableTags.sort();
				tagText += '{{अनेक समस्याएँ';
				summaryText += ' {{[[साँचा:अनेक समस्याएँ|अनेक समस्याएँ]]}} निम्न प्राचलों के साथ:';
				for( i = 0; i < groupableTags.length; i++ ) {
					tagText += '|' + groupableTags[i] +
						'={{subst:CURRENTMONTHNAME}} {{subst:CURRENTYEAR}}';

					if( i === (groupableTags.length - 1) ) {
						summaryText += ' और';
					} else if ( i < (groupableTags.length - 1) && i > 0 ) {
						summaryText += ',';
					}
					summaryText += ' ' + groupableTags[i];
				}
				tagText += '}}\n';
			} else {
				tags = tags.concat( groupableTags );
			}
		} else {
			// Check for pre-existing tags
			for( i = 0; i < params.tags.length; i++ ) {
				tagRe = new RegExp( '(\\{\\{' + params.tags[i] + '(\\||\\}\\}))', 'im' );
				if( !tagRe.exec( pageText ) ) {
					tags = tags.concat( params.tags[i] );
				} else {
					Morebits.status.info( 'Info', 'Found {{' + params.tags[i] +
						'}} on the redirect already...excluding' );
				}
			}
		}

		tags.sort();
		for( i = 0; i < tags.length; i++ ) {
			var currentTag = "";
			if( tags[i] === 'श्रेणीहीन' || tags[i] === 'श्रेणी कम' ) {
				pageText += '\n\n{{' + tags[i] +
					'|date={{subst:CURRENTMONTHNAME}} {{subst:CURRENTYEAR}}}}';
			} else {
				if( tags[i] === 'वैश्वीकरण' ) {
					currentTag += '{{' + params.tagParameters.globalize;
				} else {
					currentTag += ( Twinkle.tag.mode === 'redirect' ? '\n' : '' ) + '{{' + tags[i];
				}

				// prompt for other parameters, based on the tag
				switch( tags[i] ) {
					case 'सफ़ाई':
						if (params.tagParameters.cleanup) {
							currentTag += '|reason=' + params.tagParameters.cleanup;
						}
						break;
					case "प्रतिलिपि सम्पादन":
						if (params.tagParameters.copyEdit) {
							currentTag += '|for=' + params.tagParameters.copyEdit;
						}
						break;
					case 'कॉपी पेस्ट':
						if (params.tagParameters.copypaste) {
							currentTag += '|url=' + params.tagParameters.copypaste;
						}
						break;
					case 'हिन्दी नहीं':
						if (params.translationLanguage) {
							currentTag += '|1=' + params.translationLanguage;
						}
						break;
					case 'खराब अनुवाद':
						if (params.translationLanguage) {
							currentTag += '|1=' + params.translationLanguage;
						}
						break;
					case 'विशेषज्ञ':
						if (params.tagParameters.expertSubject) {
							currentTag += '|1=' + params.tagParameters.expertSubject;
						}
						break;
					case 'विलय':
					case 'को विलय':
					case 'में विलय':
						if (params.mergeTarget) {
							params.mergeTarget = Morebits.string.toUpperCaseFirstChar(params.mergeTarget.replace(/_/g, ' '));

							currentTag += '|' + params.mergeTarget;

							// link to the correct section on the talk page, for article space only
							if (mw.config.get('wgNamespaceNumber') === 0 && (params.mergeReason || params.discussArticle)) {
								if (!params.discussArticle) {
									// discussArticle is the article whose talk page will contain the discussion
									params.discussArticle = (tags[i] === "को विलय" ? params.mergeTarget : mw.config.get('wgTitle'));
									// nonDiscussArticle is the article which won't have the discussion
									params.nonDiscussArticle = (tags[i] === "को विलय" ? mw.config.get('wgTitle') : params.mergeTarget)
									params.talkDiscussionTitle = params.nonDiscussArticle + ' के साथ प्रस्तावित विलय';
								}
								currentTag += '|discuss=वार्ता:' + params.discussArticle + '#' + params.talkDiscussionTitle;
							}
						}
//						var param = prompt('कृपया विलय में शामिल अन्य लेखों के नाम बताएँ।  \n' +
//							"एक से अधिक लेखों के नाम डालने के लिये उनके बीच में वर्टिकल पाइप (|) का प्रयोग करें।  \n" +
//							"यह जानकारी आवश्यक है। नाम डालने के बाद OK दबाएँ, विलय टैग छोड़ने के लिये Cancel दबाएँ।", "");
//						if (param === null) {
//							continue;
//						} else if (param !== "") {
//							currentTag += '|' + param;
//						}
						break;
					default:
						break;
				}

				currentTag += Twinkle.tag.mode === 'redirect' ? '}}' : '|date={{subst:CURRENTMONTHNAME}} {{subst:CURRENTYEAR}}}}\n';
				tagText += currentTag;
			}

			if ( i > 0 || groupableTags.length > 3 ) {
				if( i === (tags.length - 1) ) {
					summaryText += ' और';
				} else if ( i < (tags.length - 1) ) {
					summaryText += ',';
				}
			}

			summaryText += ' {{[[';
			if( tags[i] === 'वैश्वीकरण' ) {
				summaryText += "साँचा:" + params.tagParameters.globalize + '|' + params.tagParameters.globalize;
			} else {
				summaryText += (tags[i].indexOf(":") !== -1 ? tags[i] : ("साँचा:" + tags[i] + "|" + tags[i]));
			}
			summaryText += ']]}} जोड़े';
		}

		if( Twinkle.tag.mode === 'redirect' ) {
			pageText += tagText;
		} else {
			// smartly insert the new tags after any hatnotes. Regex is a bit more
			// complicated than it'd need to be, to allow templates as parameters,
			// and to handle whitespace properly.
			pageText = pageText.replace(/^\s*(?:((?:\s*\{\{\s*(?:about|correct title|dablink|distinguish|for|other\s?(?:hurricaneuses|people|persons|places|uses(?:of)?)|redirect(?:-acronym)?|see\s?(?:also|wiktionary)|selfref|the)\d*\s*(\|(?:\{\{[^{}]*\}\}|[^{}])*)?\}\})+(?:\s*\n)?)\s*)?/i,
				"$1" + tagText);
		}
		// avoid truncated summaries
		if (summaryText.length > (254 - Twinkle.getPref('summaryAd').length)) {
			summaryText = summaryText.replace(/\[\[[^\|]+\|([^\]]+)\]\]/g, "$1");
		}

		pageobj.setPageText(pageText);
		pageobj.setEditSummary(summaryText + Twinkle.getPref('summaryAd'));
		pageobj.setWatchlist(Twinkle.getFriendlyPref('watchTaggedPages'));
		pageobj.setMinorEdit(Twinkle.getFriendlyPref('markTaggedPagesAsMinor'));
		pageobj.setCreateOption('nocreate');
		pageobj.save(function() {
			// special functions for merge tags
			if (params.mergeReason) {
				// post the rationale on the talk page (only operates in main namespace)
				var talkpageText = "\n\n== [[" + params.nonDiscussArticle + "]] के साथ प्रस्तावित विलय ==\n\n";
				talkpageText += params.mergeReason.trim() + " ~~~~";
				
				var talkpage = new Morebits.wiki.page("वार्ता:" + params.discussArticle, "वार्ता पृष्ठ पर कारण जोड़ा जा रहा है");
				talkpage.setAppendText(talkpageText);
				talkpage.setEditSummary('[[' + params.discussArticle +
					']] और [[' + params.nonDiscussArticle + ']] को विलय करने का प्रस्ताव' + Twinkle.getPref('summaryAd'));
				talkpage.setCreateOption('recreate');
				talkpage.append();
			}
			if (params.mergeTagOther) {
				// tag the target page if requested
				var otherTagName = "विलय";
				if (tags.indexOf("में विलय") !== -1) {
					otherTagName = "को विलय";
				} else if (tags.indexOf("को विलय") !== -1) {
					otherTagName = "में विलय";
				}
				var newParams = { 
					tags: [otherTagName],
					mergeTarget: mw.config.get("wgPageName"),
					discussArticle: params.discussArticle,
					talkDiscussionTitle: params.talkDiscussionTitle
				};
				var otherpage = new Morebits.wiki.page(params.mergeTarget, "अन्य पृष्ठ चिन्हित किया जा रहा है (" +
					params.mergeTarget + ")");
				otherpage.setCallbackParameters(newParams);
				otherpage.load(Twinkle.tag.callbacks.main);
			}
		});

		if( Twinkle.getFriendlyPref('markTaggedPagesAsPatrolled') ) {
			pageobj.patrol();
		}
	},

	file: function friendlytagCallbacksFile(pageobj) {
		var text = pageobj.getPageText();
		var params = pageobj.getCallbackParameters();
		var summary = "Adding ";

		// Add maintenance tags
		if (params.tags.length) {

			var tagtext = "", currentTag;
			$.each(params.tags, function(k, tag) {
				// when other commons-related tags are placed, remove "move to Commons" tag
				if (["subst:ncd", "Do not move to Commons_reason", "Do not move to Commons",
					"Now Commons"].indexOf(tag) !== -1) {
					text = text.replace(/\{\{(mtc|(copy |move )?to ?commons|move to wikimedia commons|copy to wikimedia commons)[^}]*\}\}/gi, "");
				}

				currentTag = "{{" + (tag === "Do not move to Commons_reason" ? "Do not move to Commons" : tag);

				var input;
				switch (tag) {
					case "subst:ncd":
						input = prompt( "{{" + (tag === "subst:ncd" ? "Now Commons" : tag) +
							"}} - Enter the name of the image on Commons (if different from local name), excluding the File: prefix:", "" );
						if (input === null) {
							return true;  // continue
						} else if (input !== "") {
							currentTag += '|1=' + input;
						}
						break;
					case "Do not move to Commons_reason":
						input = prompt( "{{Do not move to Commons}} - Enter the reason why this image should not be moved to Commons (required). To skip the tag, click Cancel:", "" );
						if (input === null) {
							return true;  // continue
						} else if (input !== "") {
							currentTag += "|reason=" + input;
						}
						break;
					case "Non-free reduced":
						//remove {{non-free reduce}} and redirects
						text = text.replace(/\{\{\s*(Template\s*:\s*)?(Non-free reduce|Nfr|Nonfree reduce)\s*(\|(?:\{\{[^{}]*\}\}|[^{}])*)?\}\}\s*/ig, "");
						currentTag += "|date={{subst:date}}";
						break;
					default:
						break;  // don't care
				}

				if (tag === "Should be SVG") {
					currentTag += "|" + params.svgSubcategory;
				}

				currentTag += "}}\n";

				tagtext += currentTag;
				summary += "{{" + tag + "}}, ";

				return true;  // continue
			});

			if (!tagtext) {
				pageobj.getStatusElement().warn("User canceled operation; nothing to do");
				return;
			}

			text = tagtext + text;
		}

		pageobj.setPageText(text);
		pageobj.setEditSummary(summary.substring(0, summary.length - 2) + Twinkle.getPref('summaryAd'));
		pageobj.setWatchlist(Twinkle.getFriendlyPref('watchTaggedPages'));
		pageobj.setMinorEdit(Twinkle.getFriendlyPref('markTaggedPagesAsMinor'));
		pageobj.setCreateOption('nocreate');
		pageobj.save();

		if( Twinkle.getFriendlyPref('markTaggedPagesAsPatrolled') ) {
			pageobj.patrol();
		}
	}
};

Twinkle.tag.callback.evaluate = function friendlytagCallbackEvaluate(e) {
	mw.config.set('wgPageName', mw.config.get('wgPageName').replace(/_/g, ' '));  // for queen/king/whatever and country!

	var form = e.target;
	var params = {};

	switch (Twinkle.tag.mode) {
		case 'article':
			params.tags = form.getChecked( 'articleTags' );
			params.group = form.group.checked;
			params.tagParameters = {
				cleanup: form["articleTags.cleanup"] ? form["articleTags.cleanup"].value : null,
				copyEdit: form["articleTags.copyEdit"] ? form["articleTags.copyEdit"].value : null,
				copypaste: form["articleTags.copypaste"] ? form["articleTags.copypaste"].value : null,
				expertSubject: form["articleTags.expertSubject"] ? form["articleTags.expertSubject"].value : null,
				globalize: form["articleTags.globalize"] ? form["articleTags.globalize"].value : null,
			};
			// common to {{merge}}, {{merge from}}, {{merge to}}
			params.mergeTarget = form["articleTags.mergeTarget"] ? form["articleTags.mergeTarget"].value : null;
			params.mergeReason = form["articleTags.mergeReason"] ? form["articleTags.mergeReason"].value : null;
			params.mergeTagOther = form["articleTags.mergeTagOther"] ? form["articleTags.mergeTagOther"].checked : false;
			// common to {{not English}}, {{rough translation}}
			params.translationLanguage = form["articleTags.translationLanguage"] ? form["articleTags.translationLanguage"].value : null;
			break;
		case 'file':
			params.svgSubcategory = form["imageTags.svgCategory"] ? form["imageTags.svgCategory"].value : null;
			params.tags = form.getChecked( 'imageTags' );
			break;
		case 'redirect':
			params.tags = form.getChecked( 'redirectTags' );
			break;
		default:
			alert("Twinkle.tag: unknown mode " + Twinkle.tag.mode);
			break;
	}

	// form validation
	if( !params.tags.length ) {
		alert( 'You must select at least one tag!' );
		return;
	}
	if( ((params.tags.indexOf("विलय") !== -1) + (params.tags.indexOf("में विलय") !== -1) +
		(params.tags.indexOf("को विलय") !== -1)) > 1 ) {
		alert( 'कृपया {{विलय}}, {{में विलय}} और {{को विलय}} में से एक ही चुनें। यदि अनेक पृष्ठों को विलय करना है तो कृपया {{विलय}} का प्रयोग करें और लेखों के नाम के बीच में पाइप का प्रयोग करें। ध्यान रखें कि अनेक लेखों को विलय के लिए चिन्हित करते समय ट्विंकल अन्य पृष्ठों को स्वचालित रूप से चिन्हित नहीं कर सकता है।' );
		return;
	}
	if( (params.tags.indexOf("हिन्दी नहीं") !== -1) && (params.tags.indexOf("खराब अनुवाद") !== -1) ) {
		alert( 'कृपया {{हिन्दी नहीं}} और {{खराब अनुवाद}} में से एक ही चुनें।' );
		return;
	}
	if( (params.mergeTagOther || params.mergeReason) && params.mergeTarget.indexOf('|') !== -1 ) {
		alert( 'विलय के लिए चिन्हित करते समय अनेक अन्य लेखों को चिन्हित करना, और अनेक लेखों के लिए चर्चा शुरू करना अभी संभव नहीं है। कृपया दूसरे लेख को चिन्हित करने के विकल्प को अनचेक कर के और कारण में इनपुट खाली कर के पुनः यत्न करें।' );
		return;
	}
	if( params.tags.indexOf('सफ़ाई') !== -1 && params.tagParameters.cleanup.trim && params.tagParameters.cleanup.trim() === "") {
		alert( 'आपको {{सफ़ाई}} साँचे के लिए एक कारण बताना होगा।' );
		return;
	}

	Morebits.simpleWindow.setButtonsEnabled( false );
	Morebits.status.init( form );

	Morebits.wiki.actionCompleted.redirect = mw.config.get('wgPageName');
	Morebits.wiki.actionCompleted.notice = "टैगिंग संपूर्ण, पन्ना कुछ ही क्षणों में रीलोड होगा";
	if (Twinkle.tag.mode === 'redirect') {
		Morebits.wiki.actionCompleted.followRedirect = false;
	}

	var wikipedia_page = new Morebits.wiki.page(mw.config.get('wgPageName'), "Tagging " + Twinkle.tag.mode);
	wikipedia_page.setCallbackParameters(params);
	switch (Twinkle.tag.mode) {
		case 'article':
			/* falls through */
		case 'redirect':
			wikipedia_page.load(Twinkle.tag.callbacks.main);
			return;
		case 'file':
			wikipedia_page.load(Twinkle.tag.callbacks.file);
			return;
		default:
			alert("Twinkle.tag: unknown mode " + Twinkle.tag.mode);
			break;
	}
};
