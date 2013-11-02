define(function() {

	var Router = {

		initOrder: 1,

		routes: {

			"level-select": function() {
				$("#menu-main").hide();
				$("#menu").show();
				$("#menu-level-select").show();
			},

			"level-selection": function(section) {

				$("#back").attr("href", "#level-select");

				if (section == "random") {
					var available_tiles = ["F", "T"], img, color;

					App.Utils.localStorage("level-random-tiles", []);
					$("#level-random-select img").removeClass("selected");

					$("#menubar h1").html("Random Levels");
					$("#level-random-select").show();
					$("#menubar").show();

					available_tiles.forEach(function(v) {

						color = Level.TileTemplates[v].color;
						img = App.Images[Level.TileTemplates[v].pattern];
						img.style.backgroundColor = color;

						$(img).attr("data-type", Level.TileTemplates[v].pattern);
						$("#level-random-select .tiles").append(img);

					});

					return;
				}

				$("#menubar h1").html((section == "editor" ? "Your" : section.capitalize()) + " Levels");
				$("#level-" + section + "-select").show();
				$("#menubar").show();
			},

			"level-editor": function(name) {
				$("#menubar h1").html("Level Editor");
				$("#back").attr("href", "#level-selection:editor");
				$("#menubar").show();
				$("#editor-level-save").css("display", "table-cell");
				$("#level-editor").show();
				
				if (name) { Editor.edit(name); }
				else { Editor.reset(); }
			},

			"level": function(section, name) {

				$("#stats").show();

				if (section == "random") {
					var tiles = App.Utils.localStorage("level-random-tiles");

					$("#game").css("visibility", "hidden");
					$("#game").show();

					Level.section = "random";
					Level.generate();
					return;
				}

				if (section == "editor") {

					$("#stats").hide();

					Level.section = "editor";
					Level.parse(Editor.levels[name]);
					Game.reset(true);

					// Show and start the game
					$("#game").show().css("visibility", "visible");
					G5.start();

					return;
				}

				var progress = App.unlocks.levels[section];
				if (progress < name) { Router.routes["level-selection"](section); return; }

				$("#game").css("visibility", "hidden");
				$("#game").show();

				Level.load(section, name, 1, function() {
					$("#game").show().css("visibility", "visible");
					G5.start();
				});
			},

			"achievements": function() {
				$("#back").attr("href", "#");
				$("#menubar h1").html("Achievements");
				$("#menubar").show();
				$("#achievements").show();
			},			

			"settings": function() {

				var state;

				$("#back").attr("href", "#");
				$("#menubar h1").html("Settings");

				$("#settings a > span").each(function() {
					if ($(this).attr("class").match("icon-check|icon-check-empty")) {
						state = App.settings[$(this).parent().attr("href").substr(12)];
						$(this).toggleClass("icon-check", state);
						$(this).toggleClass("icon-check-empty", !state);
					}
				});

				$("#menubar").show();
				$("#settings").show();
			},

			"set": function(setting) {

				switch(setting) {
					case "toggle-music":
						App.settings.music = !App.settings.music;
						window.location.href = "#settings";
						window.location.reload();
						break;

					case "toggle-sound-effects":
						App.settings["sound-effects"] = !App.settings["sound-effects"];
						break;

					case "toggle-ads":
						App.settings.ads = !App.settings.ads;
						alert(App.settings.ads ? "Thanks! ;)" : "I know ads can be annoying, but if you feel like supporting small one man productions, please consider leaving them enabled.");
						break;

					case "delete-progress":
						if (confirm("This will delete your entire progress including your unlocked levels and achievements. Are you sure?")) {
							delete window.localStorage.unlocks;
							window.location.href = "#settings";
							window.location.reload();
						}
						break;

					case "rebuild-cache":
						delete window.localStorage.cache;
						window.location.href = "#settings";
						window.location.reload();
						break;

					case "rate-app":
						window.location.href = "https://play.google.com/store/apps/details?id=de.elias_schuett.memory_walk";
						break;
				}

				if ($("a[href='#set:" + setting + "'] span").attr("class").match("icon-check|icon-check-empty")) {
					$("a[href='#set:" + setting + "'] span").toggleClass("icon-check-empty icon-check");
				}

				Utils.localStorage("settings", App.settings);
				window.location.hash = "#settings";
			},

			"credits": function() {
				$("#back").attr("href", "#");
				$("#menubar h1").html("Credits");
				$("#credits").show();
				$("#menubar").show();
			},

			"default": function() {
				if (App.intro) { return; }
				$("#menuItems > div").hide();
				$("#menu-main").show();
				$("#menu").show();
			}
		}
	}, App, Utils, Game, Editor, Level, Player, ctx, G5, $, _;

	Router.initializeFinal = function() {

		App = require("app");
		Utils = App.Utils;
		Game = App.Game;
		Editor = App.Editor;
		Level = App.Game.Level;
		Player = App.Game.Player;

		ctx = App.Game.ctx;
		G5 = App.G5;
		$ = App.$;
		_ = App._;

		window.addEventListener("hashchange", Router.route, false);
		Router.route();
	};

	Router.route = function(e) {
		
		var hash = window.location.hash.substr(1).split(":"),
			action = hash.shift(),
		    oldClass = $("body").attr("class").match(/page-[^ ]+/)[0];

		$("body").removeClass(oldClass);
		$("body").addClass("page-" + (action || "menu"));

		$("#editor-level-save").hide();
		if (action != "set") { $("body > div:not(#now_playing, body > .achievement, #modal)").hide(); }

		G5.stop();

		if (Router.routes.hasOwnProperty(action)) {
			Router.routes[action].apply(this, hash);
		} else {
			Router.routes["default"]();
		}
	};

	return Router;
});;