/**
 * +-------------------------------------------------------------------------+
 * |                  === WARNING: GLOBAL GADGET FILE ===                    |
 * |                Changes to this page affect many users.                  |
 * |           Please discuss changes at [[WT:TW]] before editing.           |
 * +-------------------------------------------------------------------------+
 *
 * Imported from github [https://github.com/azatoth/twinkle].
 * All changes should be made in the repository, otherwise they will be lost.
 *
 * To update this script from github, you must have a local repository set up. Then
 * follow the instructions at [https://github.com/azatoth/twinkle/blob/master/README.md].
 *
 * ----------
 *
 * This is AzaToth's Twinkle, the popular script sidekick for newbies, admins, and
 * every Wikipedian in between. Visit [[WP:TW]] for more information.
 */
//<nowiki>

/* global Morebits */

( function ( window, document, $, undefined ) { // Wrap with anonymous function

var Twinkle = {};
window.Twinkle = Twinkle;  // allow global access

// Check if account is experienced enough to use Twinkle
Twinkle.userAuthorized = Morebits.userIsInGroup( "autoconfirmed" ) || Morebits.userIsInGroup( "confirmed" );

// for use by custom modules (normally empty)
Twinkle.initCallbacks = [];
Twinkle.addInitCallback = function twinkleAddInitCallback( func ) {
	Twinkle.initCallbacks.push( func );
};

Twinkle.defaultConfig = {};
/**
 * Twinkle.defaultConfig.twinkle and Twinkle.defaultConfig.friendly
 *
 * This holds the default set of preferences used by Twinkle. (The |friendly| object holds preferences stored in the FriendlyConfig object.)
 * It is important that all new preferences added here, especially admin-only ones, are also added to
 * |Twinkle.config.sections| in twinkleconfig.js, so they are configurable via the Twinkle preferences panel.
 * For help on the actual preferences, see the comments in twinkleconfig.js.
 */
Twinkle.defaultConfig.twinkle = {
	// General
	summaryAd: " ([[WP:TW|ट्विंकल]])",
	deletionSummaryAd: " ([[WP:TW|ट्विंकल]])",
	protectionSummaryAd: " ([[WP:TW|ट्विंकल]])",
	userTalkPageMode: "tab",
	dialogLargeFont: false,

	// ARV
	spiWatchReport: "yes",

	// Block
	blankTalkpageOnIndefBlock: false,

	// Fluff (revert and rollback)
	openTalkPage: [ "agf", "norm", "vand" ],
	openTalkPageOnAutoRevert: false,
	markRevertedPagesAsMinor: [ "vand" ],
	watchRevertedPages: [ "agf", "norm", "vand", "torev" ],
	offerReasonOnNormalRevert: true,
	confirmOnFluff: false,
	showRollbackLinks: [ "diff", "others" ],

	// CSD
	watchSpeedyPages: [ "व3", "व4", "व6", "व6ल", "व6स", "व6फ़" ],
	speedySelectionStyle: "buttonClick",
	markSpeedyPagesAsPatrolled: true,

	// these next two should probably be identical by default
	notifyUserOnSpeedyDeletionNomination: [ "शीह", "व1", "व2", "व3", "व4", "व5", "व6", "व7", "ल1", "ल2", "ल4", "व6ल", "फ़1", "फ़2", "फ़3", "फ़4", "फ़5", "फ़6", "व6फ़", "सा1", "स2", "स3", "व6स" ],
//	welcomeUserOnSpeedyDeletionNotification: [ "शीह", "व1", "व2", "व3", "व4", "व5", "व6", "व7", "ल1", "ल2", "ल4", "व6ल", "फ़1", "फ़2", "फ़3", "फ़4", "फ़5", "फ़6", "व6फ़", "सा1", "स2", "स3", "व6स" ],
	openUserTalkPageOnSpeedyDelete: [ "शीह", "व1", "व2", "व3", "व4", "व5", "व6", "व7", "ल1", "ल2", "ल4", "व6ल", "फ़1", "फ़2", "फ़3", "फ़4", "फ़5", "फ़6", "व6फ़", "सा1", "स2", "स3", "व6स" ],
	deleteTalkPageOnDelete: true,
	deleteRedirectsOnDelete: true,
	deleteSysopDefaultToTag: false,
	speedyWindowHeight: 500,
	speedyWindowWidth: 800,
	logSpeedyNominations: false,
	speedyLogPageName: "शीह लॉग",
	noLogOnSpeedyNomination: [ "स1" ],

	// Unlink
	unlinkNamespaces: [ "0", "10", "100" ],

	// Warn
	defaultWarningGroup: "1",
	showSharedIPNotice: true,
	watchWarnings: true,
	customWarningList: [],

	// XfD
	xfdWatchDiscussion: "default",
	xfdWatchList: "no",
	xfdWatchPage: "default",
	xfdWatchUser: "default",
	markXfdPagesAsPatrolled: true,

	// Hidden preferences
	revertMaxRevisions: 50,
	batchdeleteChunks: 50,
	batchMax: 5000,
	batchProtectChunks: 50,
	batchundeleteChunks: 50
};

// now some skin dependent config.
if ( mw.config.get( "skin" ) === "vector" ) {
	Twinkle.defaultConfig.twinkle.portletArea = "right-navigation";
	Twinkle.defaultConfig.twinkle.portletId   = "p-twinkle";
	Twinkle.defaultConfig.twinkle.portletName = "ट्विंकल";
	Twinkle.defaultConfig.twinkle.portletType = "menu";
	Twinkle.defaultConfig.twinkle.portletNext = "p-search";
} else {
	Twinkle.defaultConfig.twinkle.portletArea =  null;
	Twinkle.defaultConfig.twinkle.portletId   = "p-cactions";
	Twinkle.defaultConfig.twinkle.portletName = null;
	Twinkle.defaultConfig.twinkle.portletType = null;
	Twinkle.defaultConfig.twinkle.portletNext = null;
}

Twinkle.defaultConfig.friendly = {
	// Tag
	groupByDefault: true,
	watchTaggedPages: true,
	watchMergeDiscussions: true,
	markTaggedPagesAsMinor: false,
	markTaggedPagesAsPatrolled: true,
	tagArticleSortOrder: "cat",
	customTagList: [],

	// Welcome
	topWelcomes: false,
	watchWelcomes: true,
	welcomeHeading: "स्वागत",
	insertHeadings: true,
	insertUsername: true,
	insertSignature: true,  // sign welcome templates, where appropriate
	quickWelcomeMode: "norm",
	quickWelcomeTemplate: "welcome",
	maskTemplateInSummary: true,
	customWelcomeList: [],

	// Talkback
	markTalkbackAsMinor: true,
	insertTalkbackSignature: true,  // always sign talkback templates
	talkbackHeading: "सन्देश",
	adminNoticeHeading: "Notice",

	// Shared
	markSharedIPAsMinor: true
};

Twinkle.getPref = function twinkleGetPref( name ) {
	var result;
	if ( typeof Twinkle.prefs === "object" && typeof Twinkle.prefs.twinkle === "object" ) {
		// look in Twinkle.prefs (twinkleoptions.js)
		result = Twinkle.prefs.twinkle[name];
	} else if ( typeof window.TwinkleConfig === "object" ) {
		// look in TwinkleConfig
		result = window.TwinkleConfig[name];
	}

	if ( result === undefined ) {
		return Twinkle.defaultConfig.twinkle[name];
	}
	return result;
};

Twinkle.getFriendlyPref = function twinkleGetFriendlyPref(name) {
	var result;
	if ( typeof Twinkle.prefs === "object" && typeof Twinkle.prefs.friendly === "object" ) {
		// look in Twinkle.prefs (twinkleoptions.js)
		result = Twinkle.prefs.friendly[ name ];
	} else if ( typeof window.FriendlyConfig === "object" ) {
		// look in FriendlyConfig
		result = window.FriendlyConfig[ name ];
	}

	if ( result === undefined ) {
		return Twinkle.defaultConfig.friendly[ name ];
	}
	return result;
};



/**
 * **************** Twinkle.addPortlet() ****************
 *
 * Adds a portlet menu to one of the navigation areas on the page.
 * This is necessarily quite a hack since skins, navigation areas, and
 * portlet menu types all work slightly different.
 *
 * Available navigation areas depend on the skin used.
 * Monobook:
 *  "column-one", outer div class "portlet", inner div class "pBody". Existing portlets: "p-cactions", "p-personal", "p-logo", "p-navigation", "p-search", "p-interaction", "p-tb", "p-coll-print_export"
 *  Special layout of p-cactions and p-personal through specialized styles.
 * Vector:
 *  "mw-panel", outer div class "portal", inner div class "body". Existing portlets/elements: "p-logo", "p-navigation", "p-interaction", "p-tb", "p-coll-print_export"
 *  "left-navigation", outer div class "vectorTabs" or "vectorMenu", inner div class "" or "menu". Existing portlets: "p-namespaces", "p-variants" (menu)
 *  "right-navigation", outer div class "vectorTabs" or "vectorMenu", inner div class "" or "menu". Existing portlets: "p-views", "p-cactions" (menu), "p-search"
 *  Special layout of p-personal portlet (part of "head") through specialized styles.
 * Modern:
 *  "mw_contentwrapper" (top nav), outer div class "portlet", inner div class "pBody". Existing portlets or elements: "p-cactions", "mw_content"
 *  "mw_portlets" (sidebar), outer div class "portlet", inner div class "pBody". Existing portlets: "p-navigation", "p-search", "p-interaction", "p-tb", "p-coll-print_export"
 *
 * @param String navigation -- id of the target navigation area (skin dependant, on vector either of "left-navigation", "right-navigation", or "mw-panel")
 * @param String id -- id of the portlet menu to create, preferably start with "p-".
 * @param String text -- name of the portlet menu to create. Visibility depends on the class used.
 * @param String type -- type of portlet. Currently only used for the vector non-sidebar portlets, pass "menu" to make this portlet a drop down menu.
 * @param Node nextnodeid -- the id of the node before which the new item should be added, should be another item in the same list, or undefined to place it at the end.
 *
 * @return Node -- the DOM node of the new item (a DIV element) or null
 */
Twinkle.addPortlet = function( navigation, id, text, type, nextnodeid )
{
	//sanity checks, and get required DOM nodes
	var root = document.getElementById( navigation );
	if ( !root ) {
		return null;
	}

	var item = document.getElementById( id );
	if ( item ) {
		if ( item.parentNode && item.parentNode === root ) {
			return item;
		}
		return null;
	}

	var nextnode;
	if ( nextnodeid ) {
		nextnode = document.getElementById(nextnodeid);
	}

	//verify/normalize input
	var skin = mw.config.get("skin");
	type = ( skin === "vector" && type === "menu" && ( navigation === "left-navigation" || navigation === "right-navigation" )) ? "menu" : "";
	var outerDivClass;
	var innerDivClass;
	switch ( skin )
	{
		case "vector":
			if ( navigation !== "portal" && navigation !== "left-navigation" && navigation !== "right-navigation" ) {
				navigation = "mw-panel";
			}
			outerDivClass = ( navigation === "mw-panel" ) ? "portal" : ( type === "menu" ? "vectorMenu" : "vectorTabs" );
			innerDivClass = ( navigation === "mw-panel" ) ? "body" : ( type === "menu" ? "menu" : "" );
			break;
		case "modern":
			if ( navigation !== "mw_portlets" && navigation !== "mw_contentwrapper" ) {
				navigation = "mw_portlets";
			}
			outerDivClass = "portlet";
			innerDivClass = "pBody";
			break;
		default:
			navigation = "column-one";
			outerDivClass = "portlet";
			innerDivClass = "pBody";
			break;
	}

	// Build the DOM elements.
	var outerDiv = document.createElement( "div" );
	outerDiv.className = outerDivClass + " emptyPortlet";
	outerDiv.id = id;
	if ( nextnode && nextnode.parentNode === root ) {
		root.insertBefore( outerDiv, nextnode );
	} else {
		root.appendChild( outerDiv );
	}

	var h5 = document.createElement( "h3" );
	if ( type === "menu" ) {
		var span = document.createElement( "span" );
		span.appendChild( document.createTextNode( text ) );
		h5.appendChild( span );

		var a = document.createElement( "a" );
		a.href = "#";

		$( a ).click(function ( e ) {
			e.preventDefault();

			if ( !Twinkle.userAuthorized ) {
				alert("क्षमा करें, आपका खाता ट्विंकल प्रयोग करने के लिए बहुत नया है।");
			}
		});

		h5.appendChild( a );
	} else {
		h5.appendChild( document.createTextNode( text ) );
	}
	outerDiv.appendChild( h5 );

	var innerDiv = null;
	if ( type === "menu" ) {
		innerDiv = document.createElement( "div" );
		innerDiv.className = innerDivClass;
		outerDiv.appendChild(innerDiv);
	}

	var ul = document.createElement( "ul" );
	(innerDiv || outerDiv).appendChild( ul );

	return outerDiv;
}


/**
 * **************** Twinkle.addPortletLink() ****************
 * Builds a portlet menu if it doesn't exist yet, and add the portlet link.
 * @param task: Either a URL for the portlet link or a function to execute.
 */
Twinkle.addPortletLink = function( task, text, id, tooltip )
{
	if ( Twinkle.getPref("portletArea") !== null ) {
		Twinkle.addPortlet( Twinkle.getPref( "portletArea" ), Twinkle.getPref( "portletId" ), Twinkle.getPref( "portletName" ), Twinkle.getPref( "portletType" ), Twinkle.getPref( "portletNext" ));
	}
	var link = mw.util.addPortletLink( Twinkle.getPref( "portletId" ), typeof task === "string" ? task : "#", text, id, tooltip );
	$('.client-js .skin-vector #p-cactions').css('margin-right', 'initial');
	if ( typeof task === "function" ) {
		$( link ).click(function ( ev ) {
			task();
			ev.preventDefault();
		});
	}
	if ( $.collapsibleTabs ) {
		$.collapsibleTabs.handleResize();
	}
	return link;
};


/**
 * **************** General initialization code ****************
 */

var scriptpathbefore = mw.util.wikiScript( "index" ) + "?title=",
    scriptpathafter = "&action=raw&ctype=text/javascript&happy=yes";

// Retrieve the user's Twinkle preferences
$.ajax({
	url: scriptpathbefore + "User:" + encodeURIComponent( mw.config.get("wgUserName")) + "/twinkleoptions.js" + scriptpathafter,
	dataType: "text"
})
	.fail(function () {	mw.notify( "twinkleoptions.js लोड नहीं हो सका" ); })
	.done(function ( optionsText ) {

		// Quick pass if user has no options
		if ( optionsText === "" ) {
			return;
		}

		// Twinkle options are basically a JSON object with some comments. Strip those:
		optionsText = optionsText.replace( /(?:^(?:\/\/[^\n]*\n)*\n*|(?:\/\/[^\n]*(?:\n|$))*$)/g, "" );

		// First version of options had some boilerplate code to make it eval-able -- strip that too. This part may become obsolete down the line.
		if ( optionsText.lastIndexOf( "window.Twinkle.prefs = ", 0 ) === 0 ) {
			optionsText = optionsText.replace( /(?:^window.Twinkle.prefs = |;\n*$)/g, "" );
		}

		try {
			var options = $.parseJSON( optionsText );

			// Assuming that our options evolve, we will want to transform older versions:
			//if ( options.optionsVersion === undefined ) {
			// ...
			// options.optionsVersion = 1;
			//}
			//if ( options.optionsVersion === 1 ) {
			// ...
			// options.optionsVersion = 2;
			//}
			// At the same time, twinkleconfig.js needs to be adapted to write a higher version number into the options.

			if ( options ) {
				Twinkle.prefs = options;
			}
		}
		catch ( e ) {
			mw.notify( "twinkleoptions.js पार्स नहीं हो सका" );
		}
	})
	.always(function () {
		$( Twinkle.load );
	});

// Developers: you can import custom Twinkle modules here
// For example, mw.loader.load(scriptpathbefore + "User:UncleDouggie/morebits-test.js" + scriptpathafter);

Twinkle.load = function () {
	// Don't activate on special pages other than those on the whitelist so that
	// they load faster, especially the watchlist.
	var specialPageWhitelist = [ 'Contributions', 'DeletedContributions', 'Prefixindex' ];
	var isSpecialPage = ( mw.config.get('wgNamespaceNumber') === -1 &&
		specialPageWhitelist.indexOf( mw.config.get('wgCanonicalSpecialPageName') ) === -1 );

		// Also, Twinkle is incompatible with Internet Explorer versions 8 or lower, so don't load there either.
		var isOldIE = ( $.client.profile().name === 'msie' && $.client.profile().versionNumber < 9 );

	// Prevent users that are not autoconfirmed from loading Twinkle as well.
	if ( isSpecialPage || isOldIE || !Twinkle.userAuthorized ) {
		return;
	}

	// Prevent clickjacking
	if ( window.top !== window.self ) {
		return;
	}

	// Set custom Api-User-Agent header, for server-side logging purposes
	Morebits.wiki.api.setApiUserAgent( 'Twinkle/2.0 (' + mw.config.get( 'wgDBname' ) + ')' );

	// Load the modules in the order that the tabs should appears
	// User/user talk-related
	Twinkle.arv();
	Twinkle.warn();
	if ( Morebits.userIsInGroup('sysop') ) {
		Twinkle.block();
	}
	Twinkle.welcome();
	Twinkle.shared();
	Twinkle.talkback();
	// Deletion
	Twinkle.speedy();
	Twinkle.xfd();
	// maintenance
	Twinkle.protect();
	Twinkle.tag();
	// Misc. ones last
	Twinkle.diff();
	Twinkle.unlink();
	Twinkle.config.init();
	Twinkle.fluff.init();
	if ( Morebits.userIsInGroup('sysop') ) {
		Twinkle.batchdelete();
		Twinkle.batchprotect();
		Twinkle.batchundelete();
	}
	// Run the initialization callbacks for any custom modules
	Twinkle.initCallbacks.forEach(function ( func ) { func(); });
	Twinkle.addInitCallback = function ( func ) { func(); };

	// Increases text size in Twinkle dialogs, if so configured
	if ( Twinkle.getPref( "dialogLargeFont" ) ) {
		mw.util.addCSS( ".morebits-dialog-content, .morebits-dialog-footerlinks { font-size: 100% !important; } " +
			".morebits-dialog input, .morebits-dialog select, .morebits-dialog-content button { font-size: inherit !important; }" );
	}
};

} ( window, document, jQuery )); // End wrap with anonymous function

//</nowiki>
