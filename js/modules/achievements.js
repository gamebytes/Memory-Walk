define(function() {

	var Achievements = {},
	    App, Utils, Game, Editor, Player, Level, ctx, G5, $, _;

	Achievements.collection = [
		{
			icon: "icon-thumbs-up",
			title: "Downloaded The Game",
			desc: "Now that was easy, wasn't it?"
		},
		{
			icon: "icon-github-alt",
			title: "Too Easy",
			desc: "Complete all beginner levels.",

			event: "levelComplete",
			check: function() { return App.unlocks.levels.beginner > 6; }
		},
		{
			icon: "icon-puzzle-piece",
			title: "Slightly Challenging",
			desc: "Complete all advanced levels.",

			event: "levelComplete",
			check: function() { return App.unlocks.levels.advanced > 4; }
		},
		{
			icon: "icon-skull",
			title: "Crazy Mind",
			desc: "Complete all hardcore levels.",

			event: "levelComplete",
			check: function() { return App.unlocks.levels.hardcore > 2; }
		},
		{
			icon: "icon-th-list",
			title: "Level Creator",
			desc: "Create three or more levels.",

			event: "levelCreate",
			check: function() { return Object.keys(Editor.levels).length > 2; }
		}

		// {
		// 	icon: "icon-time",
		// 	title: "Time Traveler",
		// 	desc: "Complete 20 random levels in 5 minutes."
		// },
		// {
		// 	icon: "icon-lightbulb",
		// 	title: "Quick Thinker",
		// 	desc: "Complete a level in under 5 seconds."
		// },
		// {
		// 	icon: "icon-eye-open",
		// 	title: "Photogenic Memory",
		// 	desc: "Memorize a level in under 2 seconds and complete it on the first try."
		// },
		// {
		// 	icon: "icon-heart",
		// 	title: "Supporter",
		// 	desc: "Support the developer by clicking on one of the ads."
		// }
	];

	/* ======================== */
	/* ====== INITIALIZE ====== */
	/* ======================== */

	Achievements.initialize = function() {

		App = require("app");
		Utils = App.Utils;
		Game = App.Game;
		Editor = App.Editor;
		Player = App.Game.Player;
		Level = App.Game.Level;

		ctx = App.Game.ctx;
		G5 = App.G5;
		$ = App.$;
		_ = App._;

		var fragment = document.createDocumentFragment(),
		    $icon, $content, $div;

		Achievements.collection.forEach(function(v, i) {
			$icon = $("<div class='icon " + v.icon + "'></div>");
			
			$div = $("<div class='achievement'>");
			$content = $("<div>");
			$content.append("<span class='title'>" + v.title + "</span>");
			$content.append("<span class='desc'>" + v.desc + "</span>");

			$div.append($icon, $content);

			if (App.unlocks.achievements.indexOf(v.title) != -1) { $div.addClass("unlocked"); }
			$(fragment).append($div);
		});

		$("#achievements").append(fragment);
	};

	/* ==================== */
	/* ====== UNLOCK ====== */
	/* ==================== */

	Achievements.unlock = function(id) {

		var achievement = Achievements.collection[id],
		    $icon = $("<div class='icon " + achievement.icon + "'></div>"),
		    $content = $("<div>");

		$content.append("<span class='title'>" + achievement.title + "</span>");
		$content.append("<span class='desc'>" + achievement.desc + "</span>");

		$("#achievements > div").eq(id).addClass("unlocked");

		window.setTimeout(function() {
			if (!$("#modal").length) { $("body").append("<div id='modal'></div>"); }
			$("#modal").fadeIn().delay(3000).fadeOut();

			$("body > .achievement").html("").append($icon, $content).css({
				opacity: 0,
				display: "table",
				left: -$("body > .achievement").width()
			}).animate({
				left: 0,
				opacity: 1
			}).delay(3000).animate({
				left: -$("body > .achievement").width(),
				opacity: 0
			});

			App.unlocks.achievements.push(Achievements.collection[id].title);
			Utils.localStorage("unlocks", App.unlocks);
		}, 100);
	};

	/* =================== */
	/* ====== CHECK ====== */
	/* =================== */

	Achievements.check = function(event) {

		Achievements.collection.forEach(function(v, i) {
			if (v.event == event) {
				if (App.unlocks.achievements.filter(function(a) { return a == v.title; }).length) { return; }
				if (v.check()) { Achievements.unlock(i); }
			}
		});
	};

	return Achievements;
});