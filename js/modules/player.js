define(function() {

	var Player = {

		pos: {},

		size: 1,
		color: "#94ec16",
		color_dead: "#F00",
		
		lives: 0,
		livePresets: {
			beginner: 3,
			advanced: 2,
			hardcore: 1
		},

		retries: 0,
		directions: [0, 1, 0, 0],
		directionArrows: {}

	}, App, Utils, Game, Level, ctx, gl, $, G5, THREE;

	/* ======================== */
	/* ====== INITIALIZE ====== */
	/* ======================== */

	Player.initialize = function() {

		App = require("app");
		Utils = App.Utils;
		Game = App.Game;
		Level = App.Game.Level;

		$ = App.$;
		G5 = App.G5;
		ctx = App.Game.ctx;

		//THREE = App.THREE;
		// gl = App.Game.gl;

		document.addEventListener(App.isMobile ? "touchstart" : "mousedown", Player.move, false);
		document.addEventListener("keydown", Player.move, false);
	};

	/* =================== */
	/* ====== RESET ====== */
	/* =================== */

	Player.reset = function(reset_state) {
		Player.dead = false;
		Player.size = 1;

		// Fullreset
		if (reset_state === 1) {
			Player.lives = Player.livePresets[Level.section];
			Player.retries = 0;
		}
	};

	/* ================== */
	/* ====== MOVE ====== */
	/* ================== */

	Player.move = function(e) {

		if (!G5.running()) { return; }

		var keyCodes = [65, 87, 68, 83, 13, 32, 37, 38, 39, 40];
		if (keyCodes.indexOf(e.keyCode) != -1) { e.preventDefault(); }

		// Disable movement if the intro is playing or the game is unfocused
		if ([-1, 0, 2].indexOf(Level.state) != -1 || Level.complete) { return; }
		// Prevent default actions
		else if (e.type == "touchstart") { e.preventDefault(); }

		// Unlocks movement; hides the path
		if (Level.state == 1 && Game.focused && !Level.memorized && (e.type == "touchstart" || e.type == "mousedown" || keyCodes.indexOf(e.keyCode) != -1)) {

			Level.state = 2;
			Level.memorized = true;
			Level.intro();

			Game.animations.idle.reset().start();

			$("#note_begin").hide();
			App.Audio.sfx.intro.play();
			Player.checkDirections();
			return;
		}

		// Disable movement if the level is not memorized yet
		// or the player has made a wrong move
		if (!Level.memorized || Player.dead) { return; }

		var steps = { x: 0, y: 0 },

		    pos,             // touch/mouse coordinates
		    nextPos,         // next potential position
		    nextTile,        // next potential tile
		    currentTile,     // current tile
		    playerCenter,    // player position relative to the canvas
		    check_enter,     // tile function on enter
		    check_exit,      // tile function on exit
		    diff;            // touch/mouse difference to the player position

		// Keyboard movement
		if (e.type == "keydown") {

			if      ([37, 65].indexOf(e.keyCode) != -1) { steps.x = -1; }
			else if ([38, 87].indexOf(e.keyCode) != -1) { steps.y = -1; }			
			else if ([39, 68].indexOf(e.keyCode) != -1) { steps.x = 1; }
			else if ([40, 83].indexOf(e.keyCode) != -1) { steps.y = 1; }

		// Touch/mouse movement
		} else {

			pos = {
				x: e.touches ? e.touches[0].pageX : e.pageX,
				y: e.touches ? e.touches[0].pageY : e.pageY
			};
	
			pos.x -= $("canvas").offset().left;
			pos.y -= $("canvas").offset().top;

			playerCenter = {
				x: Player.pos.x * (Level.tileSpace) + (Level.tileSize >> 1),
				y: Player.pos.y * (Level.tileSpace) + (Level.tileSize >> 1)
			};

			diff = {
				x: playerCenter.x - pos.x,
				y: playerCenter.y - pos.y
			};
	
			// Best guess for the direction
			if (Math.abs(diff.x) > Math.abs(diff.y))
			{ steps.x = diff.x > 0 ? -1 : 1; }
			else
			{ steps.y = diff.y > 0 ? -1 : 1; }
		}
		
		nextPos = {
			x: Player.pos.x + steps.x,
			y: Player.pos.y + steps.y
		};

		currentTile = Level.tiles[Player.pos.y][Player.pos.x];
		nextTile = Level.tiles[nextPos.y] && Level.tiles[nextPos.y][nextPos.x];

		// Translate through the wall
		if (!nextTile) {
			if (nextPos.x < 0) { nextPos.x = Level.fieldSize.x-1; }
			else if (nextPos.x > Level.fieldSize.x-1) { nextPos.x = 0; }
			if (nextPos.y < 0) { nextPos.y = Level.fieldSize.y-1; }
			else if (nextPos.y > Level.fieldSize.y-1) { nextPos.y = 0; }

			nextTile = Level.tiles[nextPos.y][nextPos.x];
		}

		// Perform specific tile test
		check_enter = nextTile.template.enter(nextPos, true);

		// Check allows movement:
		// Play tile sound and update idle timestamp
		if (check_enter) {

			// Execute exit function if defined
			if (currentTile.template.exit) {
				
				check_exit = currentTile.template.exit(nextPos);
				if (!check_exit) { return; }
				
				if (currentTile.template.audio_exit) {
					if (typeof currentTile.template.audio_exit == "object") {
						App.Audio.sfx[_.shuffle(currentTile.template.audio_exit)[0]].play();
					} else {
						App.Audio.sfx[currentTile.template.audio_exit].play();
					}
				}
			}

			if (nextTile.template.audio_enter) {
				if (typeof nextTile.template.audio_enter == "object") {
					App.Audio.sfx[_.shuffle(nextTile.template.audio_enter)[0]].play();
				} else {
					App.Audio.sfx[nextTile.template.audio_enter].play();
				}
			}

			Game.animations.idle.reset();

		} else if (!nextTile.visible && !nextTile.visited) {
			nextTile.visible = new G5.Animation(500, "ease-in-out", { alternate: 1, loops: 2 }, function() {
				delete nextTile.visible;
			}).start();

			Player.checkDirections();
		}

		check_enter = nextTile.template.enter(nextPos);

		// Check allows movement
		if (check_enter === true) {

			nextTile.visited = true;
			Player.pos = nextPos;
			Player.checkDirections();

		// Check defines new position
		} else if (typeof check_enter == "object") {

			nextTile.visited = true;
			nextTile = Level.tiles[check_enter.y][check_enter.x];
			nextTile.visited = true;

			Player.pos = check_enter;
			Player.checkDirections();
		}
	};

	/* ================== */
	/* ====== DRAW ====== */
	/* ================== */

	Player.draw = function() {

		var l = Level,
		    ts = l.tileSize,
		    tm = l.tileMargin,
		    ts = l.tileSize,
		    tsp = ts+tm,
		    
		    p = Player,
		    a = Game.animations,
		    t = new Date().getTime();
		    to = 0;

		// Wrong move; "die" animation
		if (p.dead) {
			to = (ts - ts*p.size) >> 1;
			ctx.fillStyle = p.color_dead;
			ctx.fillRect(p.pos.x*tsp+to, p.pos.y*tsp+to, p.size*ts, p.size*ts);
		}

		// Direction arrows animation
		if (a.idle >= 0.5 && !p.dead && l.memorized && !Level.complete) {

			// Calculate arrow animation offset and opacity
			Player.directionArrows.offset = Math.sin(t/4*G5.DEG2RAD);
			ctx.globalAlpha = (a.idle-0.5)*2;
			ctx.globalCompositeOperation = "lighter";

		 	// Display arrows
			if (p.directions[0]) Utils.drawPattern(ctx, "arrow", p.pos.x*tsp, (p.pos.y-1)*tsp - Player.directionArrows.offset*(ts/8), ts, -90);
			if (p.directions[1]) Utils.drawPattern(ctx, "arrow", p.pos.x*tsp, (p.pos.y+1)*tsp + Player.directionArrows.offset*(ts/8), ts, 90);
			if (p.directions[2]) Utils.drawPattern(ctx, "arrow", (p.pos.x-1)*tsp - Player.directionArrows.offset*(ts/8), p.pos.y*tsp, ts, 180);
			if (p.directions[3]) Utils.drawPattern(ctx, "arrow", (p.pos.x+1)*tsp + Player.directionArrows.offset*(ts/8), p.pos.y*tsp, ts);

			if (p.directions[0] == -1) Utils.drawPattern(ctx, "arrow", p.pos.x*tsp, p.pos.y*tsp - Player.directionArrows.offset*(ts/8), ts, -90);
			if (p.directions[1] == -1) Utils.drawPattern(ctx, "arrow", p.pos.x*tsp, p.pos.y*tsp + Player.directionArrows.offset*(ts/8), ts, 90);
			if (p.directions[2] == -1) Utils.drawPattern(ctx, "arrow", p.pos.x*tsp - Player.directionArrows.offset*(ts/8), p.pos.y*tsp, ts, 180);
			if (p.directions[3] == -1) Utils.drawPattern(ctx, "arrow", p.pos.x*tsp + Player.directionArrows.offset*(ts/8), p.pos.y*tsp, ts);

			if (a.idle == 1 && p.stuck) {
				p.stuck = false;
				p.dead = true;
				p.retries++;
				App.Audio.sfx.wrong.play();
				Player.animateDeath();
			}

			ctx.globalAlpha = 1;
			ctx.globalCompositeOperation = "source-over";
		}
	};

	/* =========================== */
	/* ====== ANIMATE DEATH ====== */
	/* =========================== */

	Player.animateDeath = function() {
		G5.animate(Player, { size: 0 }, "linear", function() {

			if (Player.lives < 1) {
				window.location.hash = "level-selection:" + Level.section;
				return;
			}

			Game.reset();
		});
	};

	/* ============================== */
	/* ====== CHECK DIRECTIONS ====== */
	/* ============================== */

	Player.checkDirections = function() {

		var

		p = Player,
		t = Level.tiles,
		l = Level,
		fs = Level.fieldSize,

		ct = t[p.pos.y][p.pos.x],

		stp = [
			{ x: p.pos.x,   y: p.pos.y-1 },
			{ x: p.pos.x,   y: p.pos.y+1 },
			{ x: p.pos.x-1, y: p.pos.y   },
			{ x: p.pos.x+1, y: p.pos.y   }
		],

		st = [
			t[p.pos.y-1] && t[p.pos.y-1][p.pos.x],
			t[p.pos.y+1] && t[p.pos.y+1][p.pos.x],
			t[p.pos.y][p.pos.x-1],
			t[p.pos.y][p.pos.x+1]
		],

		etp = [
			{ x: p.pos.x, y: 0       },
			{ x: p.pos.x, y: fs.y-1  },
			{ x: 0,       y: p.pos.y },
			{ x: fs.x-1,  y: p.pos.y }
		],

		et = [
			t[0      ][p.pos.x],
			t[fs.y-1 ][p.pos.x],
			t[p.pos.y][0      ],
			t[p.pos.y][fs.x-1 ]
		];

		st.forEach(function(v, i) {
			if (!v)
			p.directions[i] = et[i%2?i-1:i+1].template.enter(etp[i%2?i-1:i+1], true) && (!ct.template.exit || ct.template.exit(etp[i%2?i-1:i+1], true)) && -1;
			else
			p.directions[i] = (!v.visible && !v.visited) || (v.template.enter(stp[i], true) && (!ct.template.exit || ct.template.exit(stp[i], true)));
		});

		if (!p.directions.filter(function(v) { return v; }).length) { p.stuck = true; }
	};

	/* ================================= */
	/* ====== GOT ALL CHECKPOINTS ====== */
	/* ================================= */

	Player.gotAllCheckpoints = function() { return Level.checkpoints.activated == Level.checkpoints.total; };

	return Player;
});;