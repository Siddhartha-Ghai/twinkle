//<nowiki>


(function($){


/*
 ****************************************
 *** twinklefluff.js: Revert/rollback module
 ****************************************
 * Mode of invocation:     Links on history, contributions, and diff pages
 * Active on:              Diff pages, history pages, contributions pages
 * Config directives in:   TwinkleConfig
 */

/**
 Twinklefluff revert and antivandalism utility
 */

Twinkle.fluff = {
	auto: function() {
		if( parseInt( Morebits.queryString.get('oldid'), 10) !== mw.config.get('wgCurRevisionId') ) {
			// not latest revision
			alert("रोलबैक नहीं किया जा सकता। पृष्ठ बदला जा चुका है।");
			return;
		}

		var vandal = $("#mw-diff-ntitle2").find("a.mw-userlink").text();

		Twinkle.fluff.revert( Morebits.queryString.get( 'twinklerevert' ), vandal, true );
	},
	normal: function() {

		var spanTag = function( color, content ) {
			var span = document.createElement( 'span' );
			span.style.color = color;
			span.appendChild( document.createTextNode( content ) );
			return span;
		};

		if( mw.config.get('wgNamespaceNumber') === -1 && mw.config.get('wgCanonicalSpecialPageName') === "Contributions" ) {
			//Get the username these contributions are for
			var logLink = $('#contentSub').find('a[title^="विशेष:लॉग"]').last();
			if (logLink.length>0) //#215 -- there is no log link on Special:Contributions with no user
			{
				var username = decodeURIComponent(/wiki\/%E0%A4%B5%E0%A4%BF%E0%A4%B6%E0%A5%87%E0%A4%B7:%E0%A4%B2%E0%A5%89%E0%A4%97\/(.+)$/.exec(logLink.attr("href").replace(/_/g, "%20"))[1]);
				if( Twinkle.getPref('showRollbackLinks').indexOf('contribs') !== -1 ||
					( mw.config.get('wgUserName') !== username && Twinkle.getPref('showRollbackLinks').indexOf('others') !== -1 ) ||
					( mw.config.get('wgUserName') === username && Twinkle.getPref('showRollbackLinks').indexOf('mine') !== -1 ) ) {
					var list = $("#mw-content-text").find("ul li:has(span.mw-uctop)");

					var revNode = document.createElement('strong');
					var revLink = document.createElement('a');
					revLink.appendChild( spanTag( 'Black', '[' ) );
					revLink.appendChild( spanTag( 'SteelBlue', 'रोलबैक' ) );
					revLink.appendChild( spanTag( 'Black', ']' ) );
					revNode.appendChild(revLink);

					var revVandNode = document.createElement('strong');
					var revVandLink = document.createElement('a');
					revVandLink.appendChild( spanTag( 'Black', '[' ) );
					revVandLink.appendChild( spanTag( 'Red', 'बर्बरता' ) );
					revVandLink.appendChild( spanTag( 'Black', ']' ) );
					revVandNode.appendChild(revVandLink);

					list.each(function(key, current) {
						var href = $(current).children("a:eq(1)").attr("href");
						current.appendChild( document.createTextNode(' ') );
						var tmpNode = revNode.cloneNode( true );
						tmpNode.firstChild.setAttribute( 'href', href + '&' + Morebits.queryString.create( { 'twinklerevert': 'norm' } ) );
						current.appendChild( tmpNode );
						current.appendChild( document.createTextNode(' ') );
						tmpNode = revVandNode.cloneNode( true );
						tmpNode.firstChild.setAttribute( 'href', href + '&' + Morebits.queryString.create( { 'twinklerevert': 'vand' } ) );
						current.appendChild( tmpNode );
					});
				}
			}
		} else {

			if( mw.config.get('wgCanonicalSpecialPageName') === "Undelete" ) {
				//You can't rollback deleted pages!
				return;
			}

			var firstRev = $("div.firstrevisionheader").length;
			if( firstRev ) {
				// we have first revision here, nothing to do.
				return;
			}

			var otitle, ntitle;
			try {
				var otitle1 = document.getElementById('mw-diff-otitle1');
				var ntitle1 = document.getElementById('mw-diff-ntitle1');
				if (!otitle1 || !ntitle1) {
					return;
				}
				otitle = otitle1.parentNode;
				ntitle = ntitle1.parentNode;
			} catch( e ) {
				// no old, nor new title, nothing to do really, return;
				return;
			}

			var old_rev_url = $("#mw-diff-otitle1").find("strong a").attr("href");

			// Lets first add a [edit this revision] link
			var query = new Morebits.queryString( old_rev_url.split( '?', 2 )[1] );

			var oldrev = query.get('oldid');

			var revertToRevision = document.createElement('div');
			revertToRevision.setAttribute( 'id', 'tw-revert-to-orevision' );
			revertToRevision.style.fontWeight = 'bold';

			var revertToRevisionLink = revertToRevision.appendChild( document.createElement('a') );
			revertToRevisionLink.href = "#";
			$(revertToRevisionLink).click(function(){
				Twinkle.fluff.revertToRevision(oldrev);
			});
			revertToRevisionLink.appendChild( spanTag( 'Black', '[' ) );
			revertToRevisionLink.appendChild( spanTag( 'SaddleBrown', 'यह संस्करण पुनर्स्थापित करें' ) );
			revertToRevisionLink.appendChild( spanTag( 'Black', ']' ) );

			otitle.insertBefore( revertToRevision, otitle.firstChild );

			if( document.getElementById('differences-nextlink') ) {
				// Not latest revision
				var new_rev_url = $("#mw-diff-ntitle1").find("strong a").attr("href");
				query = new Morebits.queryString( new_rev_url.split( '?', 2 )[1] );
				var newrev = query.get('oldid');
				revertToRevision = document.createElement('div');
				revertToRevision.setAttribute( 'id', 'tw-revert-to-nrevision' );
				revertToRevision.style.fontWeight = 'bold';
				revertToRevisionLink = revertToRevision.appendChild( document.createElement('a') );
				revertToRevisionLink.href = "#";
				$(revertToRevisionLink).click(function(){
					Twinkle.fluff.revertToRevision(newrev);
				});
				revertToRevisionLink.appendChild( spanTag( 'Black', '[' ) );
				revertToRevisionLink.appendChild( spanTag( 'SaddleBrown', 'यह संस्करण पुनर्स्थापित करें' ) );
				revertToRevisionLink.appendChild( spanTag( 'Black', ']' ) );
				ntitle.insertBefore( revertToRevision, ntitle.firstChild );

				return;
			}
			if( Twinkle.getPref('showRollbackLinks').indexOf('diff') !== -1 ) {
				var vandal = $("#mw-diff-ntitle2").find("a").first().text();

				var revertNode = document.createElement('div');
				revertNode.setAttribute( 'id', 'tw-revert' );

				var agfNode = document.createElement('strong');
				var vandNode = document.createElement('strong');
				var normNode = document.createElement('strong');

				var agfLink = document.createElement('a');
				var vandLink = document.createElement('a');
				var normLink = document.createElement('a');

				agfLink.href = "#";
				vandLink.href = "#";
				normLink.href = "#";
				$(agfLink).click(function(){
					Twinkle.fluff.revert('agf', vandal);
				});
				$(vandLink).click(function(){
					Twinkle.fluff.revert('vand', vandal);
				});
				$(normLink).click(function(){
					Twinkle.fluff.revert('norm', vandal);
				});

				agfLink.appendChild( spanTag( 'Black', '[' ) );
				agfLink.appendChild( spanTag( 'DarkOliveGreen', 'रोलबैक (अच्छी नीयत)' ) );
				agfLink.appendChild( spanTag( 'Black', ']' ) );

				vandLink.appendChild( spanTag( 'Black', '[' ) );
				vandLink.appendChild( spanTag( 'Red', 'रोलबैक (बर्बरता)' ) );
				vandLink.appendChild( spanTag( 'Black', ']' ) );

				normLink.appendChild( spanTag( 'Black', '[' ) );
				normLink.appendChild( spanTag( 'SteelBlue', 'रोलबैक' ) );
				normLink.appendChild( spanTag( 'Black', ']' ) );

				agfNode.appendChild(agfLink);
				vandNode.appendChild(vandLink);
				normNode.appendChild(normLink);

				revertNode.appendChild( agfNode );
				revertNode.appendChild( document.createTextNode(' || ') );
				revertNode.appendChild( normNode );
				revertNode.appendChild( document.createTextNode(' || ') );
				revertNode.appendChild( vandNode );

				ntitle.insertBefore( revertNode, ntitle.firstChild );
			}
		}
	}
};

Twinkle.fluff.revert = function revertPage( type, vandal, autoRevert, rev, page ) {
	if (mw.util.isIPv6Address(vandal)) {
		vandal = Morebits.sanitizeIPv6(vandal);
	}

	var pagename = page || mw.config.get('wgPageName');
	var revid = rev || mw.config.get('wgCurRevisionId');

	Morebits.status.init( document.getElementById('mw-content-text') );
	$( '#catlinks' ).remove();

	var params = {
		type: type,
		user: vandal,
		pagename: pagename,
		revid: revid,
		autoRevert: !!autoRevert
	};
	var query = {
		'action': 'query',
		'prop': ['info', 'revisions', 'flagged'],
		'titles': pagename,
		'rvlimit': 50, // max possible
		'rvprop': [ 'ids', 'timestamp', 'user', 'comment' ],
		'intoken': 'edit'
	};
	var wikipedia_api = new Morebits.wiki.api( 'पुराने अवतरणों का डाटा प्राप्त किया जा रहा है', query, Twinkle.fluff.callbacks.main );
	wikipedia_api.params = params;
	wikipedia_api.post();
};

Twinkle.fluff.revertToRevision = function revertToRevision( oldrev ) {

	Morebits.status.init( document.getElementById('mw-content-text') );

	var query = {
		'action': 'query',
		'prop': ['info',  'revisions'],
		'titles': mw.config.get('wgPageName'),
		'rvlimit': 1,
		'rvstartid': oldrev,
		'rvprop': [ 'ids', 'timestamp', 'user', 'comment' ],
		'intoken': 'edit',
		'format': 'xml'
	};
	var wikipedia_api = new Morebits.wiki.api( 'पुराने अवतरणों का डाटा प्राप्त किया जा रहा है', query, Twinkle.fluff.callbacks.toRevision.main );
	wikipedia_api.params = { rev: oldrev };
	wikipedia_api.post();
};

Twinkle.fluff.userIpLink = function( user ) {
	return (mw.util.isIPAddress(user) ? "[[Special:Contributions/" : "[[User:" ) + user + "|" + user + "]]";
};

Twinkle.fluff.callbacks = {
	toRevision: {
		main: function( self ) {
			var xmlDoc = self.responseXML;

			var lastrevid = parseInt( $(xmlDoc).find('page').attr('lastrevid'), 10);
			var touched = $(xmlDoc).find('page').attr('touched');
			var starttimestamp = $(xmlDoc).find('page').attr('starttimestamp');
			var edittoken = $(xmlDoc).find('page').attr('edittoken');
			var revertToRevID = $(xmlDoc).find('rev').attr('revid');
			var revertToUser = $(xmlDoc).find('rev').attr('user');

			if (revertToRevID !== self.params.rev) {
				self.statitem.error( 'प्राप्त संस्करण वांछित संस्करण से मेल नहीं खाता। कार्य रद्द।' );
				return;
			}

			var optional_summary = prompt( "वापस लेने के लिये कोई कारण बताएँ:", "" );
			if (optional_summary === null)
			{
				self.statelem.error( 'सदस्य द्वारा रद्द' );
				return;
			}
			var summary = Twinkle.fluff.formatSummary("$USER द्वारा सम्पादित संस्करण " + revertToRevID + " पर पूर्ववत किया", revertToUser, optional_summary);

			var query = {
				'action': 'edit',
				'title': mw.config.get('wgPageName'),
				'summary': summary,
				'token': edittoken,
				'undo': lastrevid,
				'undoafter': revertToRevID,
				'basetimestamp': touched,
				'starttimestamp': starttimestamp,
				'watchlist': Twinkle.getPref('watchRevertedPages').indexOf( 'torev' ) !== -1 ? 'watch' : undefined,
				'minor': Twinkle.getPref('markRevertedPagesAsMinor').indexOf( 'torev' ) !== -1  ? true : undefined
			};

			Morebits.wiki.actionCompleted.redirect = mw.config.get('wgPageName');
			Morebits.wiki.actionCompleted.notice = "प्रत्यावर्तन पूर्ण";

			var wikipedia_api = new Morebits.wiki.api( 'पूर्ववत सामग्री सहेजी जा रही है', query, Twinkle.fluff.callbacks.complete, self.statelem);
			wikipedia_api.params = self.params;
			wikipedia_api.post();

		}
	},
	main: function( self ) {
		var xmlDoc = self.responseXML;

		var lastrevid = parseInt( $(xmlDoc).find('page').attr('lastrevid'), 10);
		var touched = $(xmlDoc).find('page').attr('touched');
		var starttimestamp = $(xmlDoc).find('page').attr('starttimestamp');
		var edittoken = $(xmlDoc).find('page').attr('edittoken');
		var lastuser = $(xmlDoc).find('rev').attr('user');

		var revs = $(xmlDoc).find('rev');

		if( revs.length < 1 ) {
			self.statelem.error( 'हमारे पास एक से कम संस्करण हैं, अतः इनको पूर्ववत करना असम्भव है' );
			return;
		}
		var top = revs[0];
		if( lastrevid < self.params.revid ) {
			Morebits.status.error( 'Error', [ 'सर्वर से प्राप्त नवीनतम संस्करण आई.डी. ', Morebits.htmlNode( 'strong', lastrevid ), ' दर्शाए गए संस्करण की आई.डी. से कम है। संभव है कि वर्तमान संस्करण हटा दिया गया है, अथवा सर्वर धीमा चल रहा है, अथवा सर्वर से गलत डाटा प्राप्त हुआ है। आगे कार्यवाही नहीं की जाएगी।' ] );
			return;
		}
		var index = 1;
		if( self.params.revid !== lastrevid  ) {
			Morebits.status.warn( 'Warning', [ 'नवीनतम संस्करण: ', Morebits.htmlNode( 'strong', lastrevid ), ' हमारे संस्करण से मेल नहीं खाता है: ', Morebits.htmlNode( 'strong', self.params.revid ) ] );
			if( lastuser === self.params.user ) {
				switch( self.params.type ) {
				case 'vand':
					Morebits.status.info( 'Info', [ 'नवीनतम सम्पादन ', Morebits.htmlNode( 'strong', self.params.user ) , ' द्वारा किया गया था। चूँकि हम इसे बर्बरता मान रहे हैं, इसे भी रोलबैक किया जायेगा।' ]);
					break;
				case 'agf':
					Morebits.status.warn( 'Warning', [ 'नवीनतम सम्पादन ', Morebits.htmlNode( 'strong', self.params.user ) , ' द्वारा किया गया था। चूँकि यह सदस्य अच्छी नीयत से सम्पादन कर रहा है, रोलबैक नहीं किया जायेगा। संभव है कि सदस्य ने समस्या ठीक कर दी हो।' ]);
					return;
				default:
					Morebits.status.warn( 'Notice', [ 'नवीनतम सम्पादन ', Morebits.htmlNode( 'strong', self.params.user ) , ' द्वारा किया गया था। रोलबैक नहीं किया जायेगा।' ] );
					return;
				}
			}
			else if(self.params.type === 'vand' && 
					Twinkle.fluff.whiteList.indexOf( top.getAttribute( 'user' ) ) !== -1 && revs.length > 1 &&
					revs[1].getAttribute( 'pageId' ) === self.params.revid) {
				Morebits.status.info( 'Info', [ 'नवीनतम सम्पादन ', Morebits.htmlNode( 'strong', lastuser ), ' द्वारा किया गया था, जो एक विश्वसनीय बॉट है। इससे पिछला सम्पादन बर्बरता था, अतः रोलबैक किया जायेगा।' ] );
				index = 2;
			} else {
				Morebits.status.error( 'Error', [ 'नवीनतम सम्पादन ', Morebits.htmlNode( 'strong', lastuser ), ' द्वारा किया गया था। संभव है कि रोलबैक पहले ही किया जा चूका हो, अतः रोलबैक नहीं किया जायेगा।'] );
				return;
			}

		}

		if( Twinkle.fluff.whiteList.indexOf( self.params.user ) !== -1  ) {
			switch( self.params.type ) {
			case 'vand':
				Morebits.status.info( 'Info', [ 'बर्बरता रोलबैक ', Morebits.htmlNode( 'strong', self.params.user ), ' पर चुना गया था। चूँकि यह एक विश्वसनीय बॉट है, हम ये मान रहे हैं कि आप इससे पिछले सदस्य के सम्पादन को रोलबैक करना चाहते हैं।' ] );
				index = 2;
				self.params.user = revs[1].getAttribute( 'user' );
				break;
			case 'agf':
				Morebits.status.warn( 'Notice', [ 'आप ', Morebits.htmlNode( 'strong', self.params.user ), ' के सम्पादन को अच्छी नीयत मानते हुए रोलबैक करना चाहते हैं। यह सदस्य एक विश्वसनीय बॉट है। चूँकि बॉट की कोई नीयत नहीं होती, रोलबैक नहीं किया जायेगा।' ] );
				return;
			case 'norm':
				/* falls through */
			default:
				var cont = confirm( 'सामान्य रोलबैक चुना गया है। परन्तु नवीनतम सम्पादन एक विश्वसनीय बॉट  (' + self.params.user + ') द्वारा किया गया था। क्या आप उससे पिछले सम्पादन को रोलबैक करना चाहते हैं?' );
				if( cont ) {
					Morebits.status.info( 'Info', [ 'सामान्य रोलबैक चुना गया है। नवीनतम सम्पादन ', Morebits.htmlNode( 'strong', self.params.user ), ' द्वारा किया गया है जो एक विश्वसनीय बॉट है। आपके निर्देशानुसार इससे पिछले सम्पादन को रोलबैक किया जाएगा।' ] );
					index = 2;
					self.params.user = revs[1].getAttribute( 'user' );
				} else {
					Morebits.status.warn( 'Notice', [ 'सामान्य रोलबैक चुना गया है। नवीनतम सम्पादन ', Morebits.htmlNode( 'strong', self.params.user ), ' द्वारा किया गया है जो एक विश्वसनीय बॉट है। आपके निर्देशानुसार इसे रोलबैक किया जायेगा।' ] );
				}
				break;
			}
		}
		var found = false;
		var count = 0;

		for( var i = index; i < revs.length; ++i ) {
			++count;
			if( revs[i].getAttribute( 'user' ) !== self.params.user ) {
				found = i;
				break;
			}
		}

		if( ! found ) {
			self.statelem.error( [ 'कोई पूर्व संस्करण नहीं पाया गया। संभवतः ', Morebits.htmlNode( 'strong', self.params.user ), ' इस पृष्ठ के इकलौते सम्पादक हैं, अथवा उन्होंने एक साथ ' + Twinkle.getPref('revertMaxRevisions') + ' से अधिक सम्पादन किये हैं।' ] );
			return;
		}

		if( ! count ) {
			Morebits.status.error( 'Error', "शून्य संस्करणों को रोलबैक करने का प्रयत्न किया गया जो संभव नहीं है। संभवतः सम्पादन को रोलबैक किया जा चूका है।" );
			return;
		}

		var good_revision = revs[ found ];
		var userHasAlreadyConfirmedAction = false;
		if (self.params.type !== 'vand' && count > 1) {
			if ( !confirm( self.params.user + ' ने एक साथ ' + count + ' सम्पादन किये हैं। क्या आप उन सब को रोलबैक करना चाहते हैं?') ) {//note: need to check gender of the user here for proper grammar?
				Morebits.status.info( 'Notice', 'आपके निर्देशानुसार रोलबैक रोक दिया गया है।' );
				return;
			}
			userHasAlreadyConfirmedAction = true;
		}

		self.params.count = count;

		self.params.goodid = good_revision.getAttribute( 'revid' );
		self.params.gooduser = good_revision.getAttribute( 'user' );

		self.statelem.status( [ ' संस्करण ', Morebits.htmlNode( 'strong', self.params.goodid ), ' जो ', Morebits.htmlNode( 'strong', self.params.gooduser ), ' द्वारा ', Morebits.htmlNode( 'strong', count ), ' संस्करण पूर्व बनाया गया था' ] );

		var summary, extra_summary;
		switch( self.params.type ) {
		case 'agf':
			extra_summary = prompt( "सम्पादन समरी के लिए वैकल्पिक टिप्पणी:", "" );
			if (extra_summary === null)
			{
				self.statelem.error( 'सदस्य द्वारा रद्द' );
				return;
			}
			userHasAlreadyConfirmedAction = true;

			summary = Twinkle.fluff.formatSummary("$USER द्वारा अच्छी नीयत से किये बदलाव पूर्ववत किये", self.params.user, extra_summary);
			break;

		case 'vand':

			summary = Twinkle.fluff.formatSummary("$USER द्वारा किये गये " + self.params.count + " सम्पादन पूर्ववत किये। (बर्बरता)", self.params.user);
//			self.params.gooduser + " द्वारा सम्पादित संस्करण पुनर्स्थापित किया।"; Removed because of editsummary length limit
			break;

		case 'norm':
			/* falls through */
		default:
			if( Twinkle.getPref('offerReasonOnNormalRevert') ) {
				extra_summary = prompt( "सम्पादन समरी के लिए वैकल्पिक टिप्पणी:", "" );
				if (extra_summary === null)
				{
					self.statelem.error( 'सदस्य द्वारा रद्द' );
					return;
				}
				userHasAlreadyConfirmedAction = true;
			}

			summary = Twinkle.fluff.formatSummary("$USER द्वारा किये गए " + self.params.count + ' सम्पादन पूर्ववत किये',
			self.params.user, extra_summary);
			break;
		}

		if (Twinkle.getPref('confirmOnFluff') && !userHasAlreadyConfirmedAction && !confirm("कृपया पुष्टि करें कि रोलबैक किया जाना है अथवा नहीं।")) {
			self.statelem.error( 'सदस्य द्वारा रद्द' );
			return;
		}

		var query;
		if( (!self.params.autoRevert || Twinkle.getPref('openTalkPageOnAutoRevert')) && 
				Twinkle.getPref('openTalkPage').indexOf( self.params.type ) !== -1 &&
				mw.config.get('wgUserName') !== self.params.user ) {
			Morebits.status.info( 'Info', [ 'सदस्य वार्ता पृष्ठ सम्पादन हेतु खोला जा रहा है ', Morebits.htmlNode( 'strong', self.params.user ) ] );
			
			query = {
				'title': 'User talk:' + self.params.user,
				'action': 'edit',
				'preview': 'yes',
				'vanarticle': self.params.pagename.replace(/_/g, ' '),
				'vanarticlerevid': self.params.revid,
				'vanarticlegoodrevid': self.params.goodid,
				'type': self.params.type,
				'count': self.params.count
			};

			switch( Twinkle.getPref('userTalkPageMode') ) {
			case 'tab':
				window.open( mw.util.wikiScript('index') + '?' + Morebits.queryString.create( query ), '_blank' );
				break;
			case 'blank':
				window.open( mw.util.wikiScript('index') + '?' + Morebits.queryString.create( query ), '_blank',
					'location=no,toolbar=no,status=no,directories=no,scrollbars=yes,width=1200,height=800' );
				break;
			case 'window':
				/* falls through */
			default:
				window.open( mw.util.wikiScript('index') + '?' + Morebits.queryString.create( query ), 
					( window.name === 'twinklewarnwindow' ? '_blank' : 'twinklewarnwindow' ),
					'location=no,toolbar=no,status=no,directories=no,scrollbars=yes,width=1200,height=800' );
				break;
			}
		}

		// figure out whether we need to/can review the edit
		var $flagged = $(xmlDoc).find('flagged');
		if ((Morebits.userIsInGroup('reviewer') || Morebits.userIsInGroup('sysop')) &&
				$flagged.length &&
				$flagged.attr("stable_revid") >= self.params.goodid &&
				$flagged.attr("pending_since")) {
			self.params.reviewRevert = true;
			self.params.edittoken = edittoken;
		}

		query = {
			'action': 'edit',
			'title': self.params.pagename,
			'summary': summary,
			'token': edittoken,
			'undo': lastrevid,
			'undoafter': self.params.goodid,
			'basetimestamp': touched,
			'starttimestamp': starttimestamp,
			'watchlist' :  Twinkle.getPref('watchRevertedPages').indexOf( self.params.type ) !== -1 ? 'watch' : undefined,
			'minor': Twinkle.getPref('markRevertedPagesAsMinor').indexOf( self.params.type ) !== -1 ? true : undefined
		};

		Morebits.wiki.actionCompleted.redirect = self.params.pagename;
		Morebits.wiki.actionCompleted.notice = "प्रत्यावर्तन पूर्ण";

		var wikipedia_api = new Morebits.wiki.api( 'पूर्ववत सामग्री सहेजी जा रहा है', query, Twinkle.fluff.callbacks.complete, self.statelem);
		wikipedia_api.params = self.params;
		wikipedia_api.post();

	},
	complete: function (apiobj) {
		var $edit = $(apiobj.getXML()).find('edit');
		var blacklist = $edit.attr('spamblacklist');
		if (blacklist) {
			var code = document.createElement('code');
			code.style.fontFamily = "monospace";
			code.appendChild(document.createTextNode(blacklist));
			apiobj.statelem.error(['रोलबैक नहीं किया जा सका क्योंकि यू.आर.एल. ', code, ' ब्लैकलिस्ट में है।']);
		} else if ($edit.attr('nochange') === '') {
			apiobj.statelem.warn("रोलबैक उपरान्त पृष्ठ रोलबैक से पूर्व के सामान है। कुछ करने की आवश्यकता नहीं है।");
		} else {
			apiobj.statelem.info("पूर्ण हुआ");

			// review the revert, if needed
			if (apiobj.params.reviewRevert) {
				var query = {
					'action': 'review',
					'revid': $edit.attr('newrevid'),
					'token': apiobj.params.edittoken,
					'comment': Twinkle.getPref('summaryAd').trim()
				};
				var wikipedia_api = new Morebits.wiki.api('आपके बदलाव स्वीकार किये जा रहे हैं', query);
				wikipedia_api.post();
			}
		}
	}
};

// builtInString should contain the string "$USER", which will be replaced
// by an appropriate user link
Twinkle.fluff.formatSummary = function(builtInString, userName, userString) {
	var result = builtInString;

	// append user's custom reason with requisite punctuation
	if (userString) {
		result += ': ' + Morebits.string.toUpperCaseFirstChar(userString);
		if (userString.search(/[।.?!;]$/) === -1) {
			result += '।';
		}
	} else {
		result += '।';
	}
	result += Twinkle.getPref('summaryAd');

	// find number of UTF-8 bytes the resulting string takes up, and possibly add
	// a contributions or contributions+talk link if it doesn't push the edit summary
	// over the 255-byte limit
	var resultLen = unescape(encodeURIComponent(result.replace("$USER", ""))).length;
	var contribsLink = "[[Special:Contributions/" + userName + "|" + userName + "]]";
	var contribsLen = unescape(encodeURIComponent(contribsLink)).length;
	if (resultLen + contribsLen <= 255) {
		var talkLink = " ([[User talk:" + userName + "|वार्ता]])";
		if (resultLen + contribsLen + unescape(encodeURIComponent(talkLink)).length <= 255) {
			result = result.replace("$USER", contribsLink + talkLink);
		} else {
			result = result.replace("$USER", contribsLink);
		}
	} else {
		result = result.replace("$USER", userName);
	}

	return result;
};

Twinkle.fluff.init = function twinklefluffinit() {
	if (Twinkle.userAuthorized)
	{
		// A list of usernames, usually only bots, that vandalism revert is jumped over; that is,
		// if vandalism revert was chosen on such username, then its target is on the revision before.
		// This is for handling quick bots that makes edits seconds after the original edit is made.
		// This only affects vandalism rollback; for good faith rollback, it will stop, indicating a bot
		// has no faith, and for normal rollback, it will rollback that edit.
		Twinkle.fluff.whiteList = [
		];

		if ( Morebits.queryString.exists( 'twinklerevert' ) ) {
			Twinkle.fluff.auto();
		} else {
			Twinkle.fluff.normal();
		}
	}
};
})(jQuery);


//</nowiki>
