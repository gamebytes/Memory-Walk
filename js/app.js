define([

	"G5",
	"jquery",
	"underscore",

	"modules/router",
	"modules/game",
	"modules/editor",
	"modules/audio",
	"modules/images",
	"modules/achievements",
	"modules/utils",

	"fastclick",
	//"jquery-transit"

], function(G5, $, _, Router, Game, Editor, Audio, Images, Achievements, Utils, fastclick) {

	var App = {

		G5: G5,
		$: $,
		_: _,

		Router: Router,
		Game: Game,
		Editor: Editor,

		Audio: Audio,
		Images: Images,

		Achievements: Achievements,
		Utils: Utils,

		unlocks: Utils.localStorage("unlocks") || {
			achievements: ["Downloaded The Game"],
			levels: {
				beginner: 1,
				advanced: 1,
				hardcore: 1
			}
		},

		isMobile: /Android|webOS|iPhone|iPod|BlackBerry/i.test(navigator.userAgent),
		isPhoneGap: (document.location.protocol == "file:"),

		baseDir: "",
		arguments: [].map.call(arguments, function(v) { return v; })
	};

	App.initialize = function() {

		// canvas.toDataURL fix
		if (!G5.Support.toDataURL()) { return require(["toDataURL"], App.initialize); }

		// Setup the cache first
		if (!localStorage.cache) { return App.setupCache(); }

		// Translates click events into touch events
		fastclick.attach(document.body);

		// Only show the intro in the main menu
		if (!App.Router.routes[window.location.hash.substr(1).split(":")[0]]) { App.intro = true; }

		// Set the base directory
		if (App.isPhoneGap) { App.baseDir = "/android_asset/www/"; }

		// Prepare for mobile devices
		$("body").addClass(App.isMobile ? "mobile" : "desktop");

		// Implement button sounds
		$("a[href]").on("click", function(e) {
			App.Audio.sfx.select.play();
		});

		// Try to disable selection
		document.addEventListener("selectstart", function(e) {
			e.preventDefault();
			return false;
		});

		// Load user settings
		App.loadSettings();

		// Initalize all sub modules
		App.arguments = App.arguments.sort(function(a, b) { return (b.initOrder || 0) - (a.initOrder || 0); });
		App.arguments.forEach(function(v) {
			if (v && v.initialize) { v.initialize(); }
		});

		App.Router.initializeFinal();

		// Intro fadeIn/fadeOut
		if (App.intro) {
			$("#intro").fadeIn(function() {

				$("body").removeClass("intro");
				$("#menuItems > div").hide();
				$("#menu-main").show();
				$("#menu").show();

				$(this).delay(1000).fadeOut(function() { App.intro = false; });
			});
		} else { $("body").removeClass("intro"); }

		// Start the background music if enabled
		if (App.settings.music) { window.setTimeout(App.Audio.cycleBGM, App.intro ? 2000 : 100); }

		// Close button logic
		$("a[href=#exit]").on("click", function() {
			if (App.isPhoneGap)
			{ navigator.app.exitApp(); }
			else
			{ window.open("", "_self", "").close(); }
		});

		// Enable keyboard navigation
		if (!App.isMobile)
		{ $(document).on("keydown", App.keyBoardNavigation); }
	};

	App.keyBoardNavigation = function(e) {

		if ([37, 38, 39, 40].indexOf(e.keyCode) == -1) { return true; }

		var prev = [37, 38].indexOf(e.keyCode) != -1,
		    next = [39, 40].indexOf(e.keyCode) != -1,
		    dir = prev ? -1 : next ? 1 : 0,

		    $links = $("a[href]:visible:not(.locked)"),
			$elem = $("a[href]:focus:not(.locked)"),
			index = 0;

		$links.each(function(i) {
			if ($elem[0] === this) { index = i; }
		});

		if (!$elem.length) { $links.eq(0).focus(); return; }
		$links.eq((index + dir) % $links.length).focus();
	};

	App.setupCache = function() {
		localStorage.cache = "{}";
		$("#first_launch").show(function() { window.setTimeout(App.initialize, 100); });
	};

	App.loadSettings = function() {
		if (!window.localStorage.settings) {

			// Default settings
			App.Utils.localStorage("settings", {
				"music": true,
				"sound-effects": true,
				"ads": true
			});
		}

		App.settings = App.Utils.localStorage("settings");
	};

	return App;
});