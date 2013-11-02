define(["modules/tiles"], function(TileTemplates) {

	var Level = {

		section: "beginner",
		num: 1,
		part: 1,
		state: -1,

		tiles: [],
		tileMargin: 2,
		tileSize: undefined
	},

	TileTemplate = function(type, x, y) {

		this.symbol = type;
		this.template = TileTemplates[type];

		this.size = Level.screenshot.pending ? Level.tileSize : 0;
		this.offset = 0;

		this.pos = new G5.Vector2(x, y);
		this.opacity = 1;

		this.visible = TileTemplates[type].visible;
		this.visited = false;
	},

	LevelTemplate = function() {
		
		this.tiles = [];
		this.reseted = false;
		this.memorized = false;

		this.checkpoints = {
			activated: 0,
			total: 0
		};

	}, App, Utils, Game, Player, ctx, G5, $, _;

	/* ======================== */
	/* ====== INITIALIZE ====== */
	/* ======================== */

	Level.initialize = function() {

		App = require("app");
		Utils = App.Utils;
		Game = App.Game;
		Player = App.Game.Player;

		ctx = App.Game.ctx;
		G5 = App.G5;
		$ = App.$;
		_ = App._;

		TileTemplates = TileTemplates.initialize();
		Level.TileTemplates = TileTemplates;

		$(".level-selection").each(function() {

			var section = $(this).attr("data-section");

			$(this).find(".level").each(function(i) {

				if (App.unlocks.levels[section]-1 < i)
				{ $(this).addClass("locked"); }

				if ($(this).css("background-image") == "none")
				{ Level.screenshot(section, i+1); }
			});
		});

		$("body").on("click", "#level-random-select img", function(e) {
			var tiles = App.Utils.localStorage("level-random-tiles"),
			    type = $(this).attr("data-type");

			$(this).siblings().removeClass("selected");
			$(this).addClass("selected");

			if ($(this).hasClass("selected")) { tiles = [type]; }
			else { tiles = App._.without(tiles, type); }

			tiles = App._.unique(tiles);
			App.Utils.localStorage("level-random-tiles", tiles);
		});
	};

	/* =================== */
	/* ====== INTRO ====== */
	/* =================== */

	Level.intro = function() {

		G5.animate(_.flatten(this.tiles), {

			duration: [1000, 0, 500][Level.state],
			easing: "linear",

			step: function(elem, defaults, p) {

				if (Level.state == 0) {

					// Expand equally
					if (Level.reseted && !elem.visited) { elem.size = Level.tileSize * Math.min(1, 2*p); }

					// Expand diagonal
					else {
						elem.size = G5.clamp(
							Level.tileSize*(Level.fieldSize.x+Level.fieldSize.y)*p -
							Level.tileSize*(elem.pos.x+elem.pos.y),
							0, Level.tileSize
						);
					}

					// Calculate tile offset
					elem.offset = Level.tileSize - elem.size >> 1;
					elem.opacity = p;

				} else if (Level.state == 2 && !elem.visible) {
					elem.opacity = 1-p;
				}
			},

			callback: function() {

				// Reset opacity
				if (Level.state == 0 && Game.focused) { $("#note_begin").show(); }
				else if (Level.state == 2) { _.flatten(Level.tiles).forEach(function(v) { v.opacity = 1; }); }
				
				Level.state++;
			}
		});
	};

	/* =================== */
	/* ====== PARSE ====== */
	/* =================== */

	Level.parse = function(data) {

		$.extend(Level, new LevelTemplate())
		Level.checkpoints.total = (data.match(/c/g) || []).length;
		Level.raw = data;
		Level.complete = false;

		data = data.split("\n");

		Level.fieldSize = {
			x: data[0].length,
			y: data.length
		};

		Level.state = 0;
		Game.resize();

		// Find the start position
		data.forEach(function(row, y) {
			Level.tiles[y] = [];
			row.split("").forEach(function(tile, x) {
				if (tile == "S") {
					Player.pos.x = x;
					Player.pos.y = y;
				}

				Level.tiles[y].push(new TileTemplate(tile, x, y));
			});
		});
	};

	/* ================== */
	/* ====== LOAD ====== */
	/* ================== */

	Level.load = function(section, levelNum, part, callback) {

		$.ajax({
			url: "levels/" + section + "/" + levelNum + "-" + part + ".lvl",
			type: "GET",

			error: function() {

				if (Level.section == "editor") {
					window.location.hash = "level-selection:editor";
					return;
				}

				if (Level.num == App.unlocks.levels[Level.section]) {
					App.unlocks.levels[Level.section]++;
					Utils.localStorage("unlocks", App.unlocks);
				}

				window.location.hash = "level-selection:" + Level.section;

				$(".level-selection[data-section=" + section + "]").find(".level").eq(levelNum).removeClass("locked");

				App.Achievements.check("levelComplete");
				App.Audio.sfx["levelComplete0" + G5.rand(1, 2)].play();
			},

			success: function(data) {
				Level.section = section;
				Level.num = +levelNum;
				Level.part = +part;
				Level.parse(data);

				if (!Level.screenshot.pending) { Game.reset(Level.part); }

				// Execute the callback if defined
				if (typeof callback == "function") { callback(); }
			}
		});
	};

	/* =================== */
	/* ====== RESET ====== */
	/* =================== */

	Level.reset = function(fullreset) {

		this.state = 0;
		this.memorized = false;
		this.checkpoints.activated = 0;

		if (!fullreset) {
			this.reseted = true;
			this.raw.split("\n").forEach(function(row, y) {
				Level.tiles[y] = [];
				row.split("").forEach(function(tile, x) {
					if (tile == "S") {
						Player.pos.x = x;
						Player.pos.y = y;
						Player._pos = $.extend({}, Player.pos);
					}

					Level.tiles[y].push(new TileTemplate(tile));
				});
			});
		}

		this.intro();
	};

	/* ====================== */
	/* ====== GENERATE ====== */
	/* ====================== */

	Level.generate = function(difficulty) {

		var

		fieldSize = {
			x: G5.rand(6, 12),
			y: G5.rand(6, 12)
		},
		
		tiles = App.Utils.localStorage("level-random-tiles") || [],

		x      = fieldSize.x,
		y      = fieldSize.y,
		d      = G5.rand(0, 3),
		vx     = 0,
		vy     = 0,
		steps  = 0,
		resets = 0,
		data   = [],
		path   = [],
		end    = false,
		dirs   = _.shuffle([0, 1, 2, 3]),
		nt, nst, nx, ny;

		// Create and fill multidimensional array
		while (y--) {
			x = fieldSize.x; data[y] = [];
			while(x--) { data[y][x] = "0"; }
		}

		// Set start position
		x = G5.rand(1, fieldSize.x-2);
		y = G5.rand(1, fieldSize.y-2);

		data[y][x] = "S";

		// Generate path
		while (!end) {

			if (resets > 100) {
				end = true;
				data[y][x] = "E";
				break;
			}

			// Next potential tile
			nx = G5.shift(x+vx, 0, fieldSize.x-1);
			ny = G5.shift(y+vy, 0, fieldSize.y-1);
			nt = data[ny][nx];

			// Next surrounded tiles and obstacles
			nst = Level.getSurroundedTiles(data, nx, ny);
			nst.obs = (nst.join("").match(/[^0]/g) || []).length;

			if (Level.isEdgeTile(data, nx, ny) || steps < 0 || nt != "0" || nst.obs > 1) {

				// Pick a new direction
				d = dirs.pop();
				if (!dirs.length) { dirs = _.shuffle([0, 1, 2, 3]); }

				// Set the velocity
				vx = [ 0,  1,  0, -1][d];
				vy = [-1,  0,  1,  0][d];

				// Calculate new step value
				steps = G5.rand(1, [fieldSize.y>>2, fieldSize.x>>2][d%2]);
				resets++;

				continue;
			}

			steps--;
			resets = 0;
			data[y=ny][x=nx] = "1";
			path.push({ x: x, y: y });
		}

		if (path.length <= 4) {
			Level.generate.apply(arguments);
			return;
		}

		tiles.forEach(function(v) {
			if (Level.generate[v]) {
				Level.generate[v](data, path);
			}
		});

		// Convert level data into a string and parse it
		data = data.map(function(v) { return v.join(""); }).join("\n");
		Level.parse(data);
		Game.reset(true);

		// Show and start the game
		$("#game").show().css("visibility", "visible");
		G5.start();
	};

		Level.generate.teleport = function(data, path) {
			var first = path[path.length >> 1],
			    second = path[path.length-1 - (path.length >> 2)],
			    remove = false;

			data[first.y][first.x] = "T";
			data[second.y][second.x] = "T";

			path.forEach(function(v) {
				if (data[v.y][v.x] == "T") { remove = !remove; return true; }
				if (remove) { data[v.y][v.x] = "0"; }
			});
		};

		Level.generate.flash = function(data, path) {
			var middle = path[path.length >> 1];
			data[middle.y][middle.x] = "F";
		};

	/* ======================== */
	/* ====== SCREENSHOT ====== */
	/* ======================== */

	Level.screenshot = function(section, levelNum) {

		var cache = Utils.localStorage("cache");

		if (cache["screenshot-" + section + "-" + levelNum]) {
			$(".level-selection[data-section=" + section + "]").find(".level").eq(levelNum-1)
			.css("background-image", "url(" + cache["screenshot-" + section + "-" + levelNum] + ")");
			return;
		}

		if (!Level.screenshot.pending) { Level.screenshot.pending = 0; }

		Level.screenshot.pending++;
		Level.state = 2;

		Level.load(section, levelNum, 1, function() {

			var bfr = new G5.Buffer(ctx.canvas.width/3, ctx.canvas.height/3);

			Level.draw();

			bfr.drawImage(ctx.canvas, 0, 0, bfr.canvas.width, bfr.canvas.height);
			
			cache = Utils.localStorage("cache");
			cache["screenshot-" + section + "-" + levelNum] = bfr.canvas.toDataURL();

			Utils.localStorage("cache", cache);

			$(".level-selection[data-section=" + section + "]").find(".level").eq(levelNum-1)
			.css("background-image", "url(" + cache["screenshot-" + section + "-" + levelNum] + ")");

			Level.screenshot.pending--;
		});
	};

	/* ================== */
	/* ====== DRAW ====== */
	/* ================== */

	Level.draw = function() {

		var

		// For loop variables
		l     = Level,
		x, xl = l.fieldSize.x,
		y, yl = l.fieldSize.y,
		tm    = l.tileMargin,
		fs    = l.fieldSize,
		t     = new Date().getTime(),

		tx, ty,
		ts, to,
		tile,
		beat_max_offset = Level.tileSize>>4,
		beat = G5.clamp(Math.sin(t/100), -1, 1)*beat_max_offset,
		isPlayerTile;

		// The flash animation uses opacity, the canvas needs to be cleared entirely
		ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

		// Loop through the entire field
		for (y = 0; y < yl; y++) {;
			for (x = 0; x < xl; x++) {

				// Current tile
				tile = l.tiles[y][x];

				if (!tile) { continue; }

				// Tile properties
				tx = x*(l.tileSize+tm);
				ty = y*(l.tileSize+tm);

				if ((l.state == 0 && l.reseted) || l.state == 2) {
					ts = l.tileSize;
					to = 0;
					ctx.fillStyle = l.TileTemplates["0"].color;
					ctx.fillRect(tx+to, ty+to, ts, ts);
				}

				ts = tile.size;
				to = tile.offset;

				isPlayerTile = Player.pos.x == x && Player.pos.y == y;

				// Draw default tile
				if (l.state == 3) {
					if (tile.symbol != "0" && (!l.memorized || tile.visited || tile.visible)) {
						ts += beat*Math.sin(x^y);
						to = l.tileSize - ts >> 1;
					}

					ctx.fillStyle = TileTemplates["0"].color;
					ctx.fillRect(tx+to, ty+to, ts, ts);
				}

				// Hide non-memorized/visted tiles
				if (l.memorized && !l.flash && !tile.visited && !tile.visible && l.state != 2) { continue; }

				// Opacity
				if (tile.symbol != "0") { ctx.globalAlpha = tile.opacity; }

					// Flash animaition
					if (l.flash && !tile.visited && !tile.visible) { ctx.globalAlpha = G5.clamp(Math.sin(t*(x+1)*(y+1)), 0, 1); }

				// Fill style 
				ctx.fillStyle = isPlayerTile && !Player.dead ? Player.color : tile.template.color;
				ctx.strokeStyle = "#111";
				ctx.lineWidth = 2;

					// Reduce end tile color when not all checkpoints have been activated
					if (tile.symbol == "E" && !Player.gotAllCheckpoints()) { ctx.fillStyle = "#0d5084"; }
					if (tile.symbol == "E" && isPlayerTile) { ctx.fillStyle = "#00ffff"; }

				// Draw tile
				ctx.fillRect(tx+to, ty+to, ts, ts);
				if (tile.symbol != "0" && l.state == 3) { ctx.strokeRect(tx+to, ty+to, ts, ts); }

					// Draw pattern
					if (tile.template.pattern && App.Images[tile.template.pattern]) {
						Utils.drawPattern(ctx, tile.template.pattern, tx+to, ty+to, ts);
					}

				// Change opacity if flash animation is active
				ctx.globalAlpha = 1;
			}
		}
	};

	/* ========================== */
	/* ====== TILE VISITED ====== */
	/* ========================== */

	Level.tileVisited = function(pos) {
		var tile = this.tiles[pos.y][pos.x];
		return tile.visited;
	};

	/* ================================== */
	/* ====== GET SURROUNDED TILES ====== */
	/* ================================== */

	Level.getSurroundedTiles = function(data, x, y) {
		return [
			data[y-1] && data[y-1][x], // up
			data[y][x+1],              // right
			data[y+1] && data[y+1][x], // down
			data[y][x-1]               // left
		];
	};

	/* ========================== */
	/* ====== IS EDGE TILE ====== */
	/* ========================== */

	Level.isEdgeTile = function(data, x, y) {
		var fieldSize = {
			x: data[0].length,
			y: data.length,
		};

		return x == 0 || y == 0 || x == fieldSize.x-1 || y == fieldSize.y -1;
	};

	return Level;
});