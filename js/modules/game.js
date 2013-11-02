define([

	"modules/level",
	"modules/player",

], function(Level, Player) {

	var Game = {

		Level: Level,
		Player: Player,

		animations: {},

		focused: true,
		ctx: undefined

	}, App, Utils, Game, Player, ctx, gl, $, G5, _, THREE;

	/* ======================== */
	/* ====== INITIALIZE ====== */
	/* ======================== */

	Game.initialize = function(namespace) {

		App = require("app");
		Utils = App.Utils;
		Player = App.Game.Player;

		$ = App.$;
		G5 = App.G5;
		_ = App._;
		ctx = Game.ctx = new G5.Scene(0, 0, "2d", { parent: $("#two_d")[0] });

		// THREE = App.THREE;
		// gl = Game.gl = new THREE.WebGLRenderer({ canvas: $("#three_d canvas")[0] });

		Game.animations = {
			idle: new G5.Animation(1000, "linear")
		};

		Level.initialize();
		Player.initialize();

		// Register drawing functions
		G5.draw(Level.draw);
		G5.draw(Player.draw);
		
		// Register event listeners
		$(window).on("resize", this.resize);
		$(window).on("focus blur", this.toggleFocus);
	};

	/* ========================= */
	/* ====== TOGGLEFOCUS ====== */
	/* ========================= */

	Game.toggleFocus = function(e) {
		window.setTimeout(function() {
			Game.focused = e.originalEvent.type == "focus";
			$("#note_begin").toggle(Game.focused && !Level.memorized); 
			$("#note_focus").toggle(!Game.focused); 
		}, 100);
	};

	/* ==================== */
	/* ====== RESIZE ====== */
	/* ==================== */

	Game.resize = function() {

		if (Level.state == -1) { return; }

		// Determine optimal tile size
		Level.tileSize = Math.min(
			$(window).width() / Level.fieldSize.x,
			$(window).height() / Level.fieldSize.y
		) - Level.tileMargin | 0;

		// Shrink tile size a little bit
		Level.tileSize = Level.tileSize / 1.2 | 0;
		Level.tileSpace = Level.tileSize + Level.tileMargin;

		_.flatten(Level.tiles).forEach(function(v) { v.size = Level.tileSize; });

		// Update canvas' size and position
		ctx.canvas.width = Level.fieldSize.x * (Level.tileSpace) - Level.tileMargin;
		ctx.canvas.height = Level.fieldSize.y * (Level.tileSpace) - Level.tileMargin;
		ctx.canvas.style.top = (($(window).height() - ctx.canvas.height) >> 1) + "px";

		// $("#three_d canvas").css({
		// 	top: (($(window).height() - ctx.canvas.height) >> 1) + 10,
		// 	left: $("#two_d canvas").offset().left + 10
		// });

		// gl.setSize(ctx.canvas.width, ctx.canvas.height);
		// gl.camera.aspect = ctx.canvas.width/ctx.canvas.height;
		// gl.camera.updateProjectionMatrix();

		// Position notifications in the center
		$(".note").each(function() {
			$(this).css({
				left: ($(window).width() >> 1) - ($(this).width() >> 1),
				top: ($(window).height() >> 1) - ($(this).height() >> 1)
			})
		});
	};

	/* =================== */
	/* ====== RESET ====== */
	/* =================== */

	Game.reset = function(reset_state) {

		if (!Player.dead) {
			Level.reset(reset_state);
			Player.reset(reset_state);
			Game.updateStats();
			return;
		}

		if (reset_state === 1) { Player.lives = Player.livePresets[Level.section]; }
		Game.updateStats();

		G5.animate(_.flatten(Level.tiles), {

			easing: "linear",
			duration: 500,
			backwards: true,

			step: function(elem, defaults, p) {
				if (elem.visited || elem.visible) { elem.opacity = p; }
			},

			callback: function() {
				Level.reset(reset_state);
				Player.reset(reset_state);
			}
		});
	};

	Game.updateStats = function() {
		$("#stats-level").html(Level.num + "-" + Level.part);
		$("#stats-lives").html(Level.section == "random" ? "∞" : Player.lives);
	};

	return Game;
});