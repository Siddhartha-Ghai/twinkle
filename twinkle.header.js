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

( function ( window, document, $, undefined ) { // Wrap with anonymous function

var Twinkle = {};
window.Twinkle = Twinkle;  // allow global access

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
	summaryAd: " ([[WP:TW|TW]])",
	deletionSummaryAd: " ([[WP:TW|TW]])",
	protectionSummaryAd: " ([[WP:TW|TW]])",
	userTalkPageMode: "window",
	dialogLargeFont: false,
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
	notifyUserOnSpeedyDeletionNomination: [ "शीह", "व1", "व2", "व3", "व4", "व5", "व6", "ल1", "ल2", "ल4", "व6ल", "फ़1", "फ़2", "फ़3", "फ़4", "फ़5", "फ़6", "व6फ़", "सा1", "स2", "व6स" ],
	welcomeUserOnSpeedyDeletionNotification: [ "शीह", "व1", "व2", "व3", "व4", "व5", "व6", "ल1", "ल2", "ल4", "व6ल", "फ़1", "फ़2", "फ़3", "फ़4", "फ़5", "फ़6", "व6फ़", "सा1", "स2", "व6स" ],
	openUserTalkPageOnSpeedyDelete: [ "शीह", "व1", "व2", "व3", "व4", "व5", "व6", "ल1", "ल2", "ल4", "व6ल", "फ़1", "फ़2", "फ़3", "फ़4", "फ़5", "फ़6", "व6फ़", "सा1", "स2", "व6स" ],
	deleteTalkPageOnDelete: false,
	deleteRedirectsOnDelete: true,
	deleteSysopDefaultToTag: false,
	speedyWindowHeight: 500,
	speedyWindowWidth: 800,
	logSpeedyNominations: false,
	speedyLogPageName: "शीह लॉग",
	noLogOnSpeedyNomination: [ "स1" ],
	 // Unlink
	unlinkNamespaces: [ "0", "100" ],
	 // Warn
	defaultWarningGroup: "1",
	showSharedIPNotice: true,
	watchWarnings: true,
	blankTalkpageOnIndefBlock: false,
	customWarningList: [],
	 // XfD
	xfdWatchDiscussion: "default",
	xfdWatchList: "no",
	xfdWatchPage: "default",
	xfdWatchUser: "default",
	 // Hidden preferences
	revertMaxRevisions: 50,
	batchdeleteChunks: 50,
	batchDeleteMinCutOff: 5,
	batchMax: 5000,
	batchProtectChunks: 50,
	batchProtectMinCutOff: 5,
	batchundeleteChunks: 50,
	batchUndeleteMinCutOff: 5,
	deliChunks: 500,
	deliMax: 5000,
};

// now some skin dependent config.
if ( mw.config.get( "skin" ) === "vector" ) {
	Twinkle.defaultConfig.twinkle.portletArea = "right-navigation";
	Twinkle.defaultConfig.twinkle.portletId   = "p-twinkle";
	Twinkle.defaultConfig.twinkle.portletName = "TW";
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
 * **************** twAddPortlet() ****************
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
function twAddPortlet( navigation, id, text, type, nextnodeid )
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
	type = ( skin === "vector" && type === "menu" && ( navigation === "left-navigation" || navigation === "right-navigation" )) ? "menu" : "";
	var outerDivClass;
	var innerDivClass;
	switch ( skin )
	{
		case "vector":
			if ( navigation !== "portal" && navigation !== "left-navigation" && navigation !== "right-navigation" ) {
				navigation = "mw-panel";
			}
			outerDivClass = ( navigation === "mw-panel" ) ? "portal" : ( type === "menu" ? "vectorMenu extraMenu" : "vectorTabs extraMenu" );
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
	if ( type === "menu" ) {
		// Fix drop-down arrow image in Vector skin
		outerDiv.style.backgroundImage = 'url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABYAAAAQCAMAAAAlM38UAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAA9QTFRFsbGxmpqa3d3deXl58/n79CzHcQAAAAV0Uk5T/////wD7tg5TAAAAMklEQVR42mJgwQoYBkqYiZEZAhiZUFRDxWGicEPA4nBRhNlAcYQokpVMDEwD6kuAAAMAyGMFQVv5ldcAAAAASUVORK5CYII=")';
		outerDiv.style.backgroundPosition = "right 60%";
	}
	if ( nextnode && nextnode.parentNode === root ) {
		root.insertBefore( outerDiv, nextnode );
	} else {
		root.appendChild( outerDiv );
	}

	var h5 = document.createElement( "h5" );
	if ( type === "menu" ) {
		var span = document.createElement( "span" );
		span.appendChild( document.createTextNode( text ) );
		h5.appendChild( span );

		var a = document.createElement( "a" );
		a.href = "#";

		$( a ).click(function ( e ) {
			e.preventDefault();
		});

		span = document.createElement( "span" );
		span.appendChild( document.createTextNode( text ) );
		a.appendChild( span );
		h5.appendChild( a );
	} else {
		h5.appendChild( document.createTextNode( text ) );
	}
	outerDiv.appendChild( h5 );

	var innerDiv = document.createElement( "div" ); // Not strictly necessary with type vectorTabs, or other skins.
	innerDiv.className = innerDivClass;
	outerDiv.appendChild(innerDiv);

	var ul = document.createElement( "ul" );
	innerDiv.appendChild( ul );

	return outerDiv;
}


/**
 * **************** twAddPortletLink() ****************
 * Builds a portlet menu if it doesn't exist yet, and add the portlet link.
 * @param task: Either a URL for the portlet link or a function to execute.
 */
function twAddPortletLink( task, text, id, tooltip )
{
	if ( Twinkle.getPref("portletArea") !== null ) {
		twAddPortlet( Twinkle.getPref( "portletArea" ), Twinkle.getPref( "portletId" ), Twinkle.getPref( "portletName" ), Twinkle.getPref( "portletType" ), Twinkle.getPref( "portletNext" ));
	}
	var link = mw.util.addPortletLink( Twinkle.getPref( "portletId" ), typeof task === "string" ? task : "#", text, id, tooltip );
	if ( $.isFunction( task ) ) {
		$( link ).click(function ( ev ) {
			task();
			ev.preventDefault();
		});
	}
	return link;
}

// Check if account is experienced enough to use Twinkle
var twinkleUserAuthorized = Morebits.userIsInGroup( "autoconfirmed" ) || Morebits.userIsInGroup( "confirmed" );
