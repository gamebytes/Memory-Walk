define(function() {

	var Tiles = {}, _Tiles, App, Utils, Game, Level, Player, ctx, G5, $, _;

	/* ======================== */
	/* ====== INITIALIZE ====== */
	/* ======================== */

	Tiles.initialize = function() {

		App = require("app");
		Utils = App.Utils;
		Game = App.Game;
		Level = App.Game.Level;
		Player = App.Game.Player;

		ctx = App.Game.ctx;
		G5 = App.G5;
		$ = App.$;
		_ = App._;

		return _Tiles;
	};

	_Tiles = {

		/**
		 * S = Start
		 * E = End
		 * 0 = Empty
		 * 1 = Path
		 * T = Teleport
		 * F = Flash
		 * c = Checkpoint
		 * C = Checkpoint activated
		 * ↔ = Horinzontal bridge
		 * ↕ = Vertical bridge
		 */

		"S": {
			color: "#333",
			visible: true,

			enter: function() { return false; }
		},

		"E": {
			color: "#168fec",
			audio_enter: ["partComplete01", "partComplete02"],
			visible: true,

			enter: function(nextPos, check) {

				if (check) { return Player.gotAllCheckpoints(); }

				// Part complete
				if (Player.gotAllCheckpoints()) {

					Level.complete = true;

					window.setTimeout(function() {
						// Load the next part
						if (Level.section == "random") { Level.generate(); }

						// Generate a new level
						else { Level.load(Level.section, Level.num, ++Level.part); }
					}, 500);

					return true;
				}

				return false;
			}
		},

		"0": {
			color: "#191919",
			audio_enter: "wrong",

			enter: function(nextPos, check) {

				if (check) { return true; }

				Player.dead = true;
				Player.retries++;
				Player.lives--;
				Player.animateDeath();
				
				return true;
			}
		},
		
		"1": {
			color: "#444",
			audio_enter: "step",

			enter: function(nextPos) { return !Level.tileVisited(nextPos); }
		},

		"F": {
			color: "#CCC",
			pattern: "flash",
			audio_enter: "flash",

			enter: function(nextPos, check) {

				if (check) { return !Level.tileVisited(nextPos); }

				if (!Level.tileVisited(nextPos)) {
					Level.flash = true;
					window.setTimeout(function() { Level.flash = false; }, 500);
					return true;
				}

				return false;
			}
		},

		"c": {
			color: "#0F9",
			pattern: "checkpoint",
			audio_enter: "click",
			visible: true,

			enter: function(nextPos, check) {

				if (check) { return true; }

				Level.checkpoints.activated++;
				Level.tiles[nextPos.y][nextPos.x].symbol = "C";
				Level.tiles[nextPos.y][nextPos.x].template = _Tiles["C"];

				return true;
			}
		},

		"C": {
			color: "#0F9",
			pattern: "checkpoint_active",
			audio_enter: "click",
			visible: true,

			enter: function() { return false; }
		},

		"↔": {
			color: "#ff6600",
			pattern: "bridge_horizontal",

			audio_exit: "click",
			audio_enter: "step",

			enter: function(nextPos) { return nextPos.x != Player.pos.x; },

			exit: function(nextPos, check) {

				if (check) { return nextPos.y == Player.pos.y; }

				if (nextPos.y == Player.pos.y) {
					Level.tiles[Player.pos.y][Player.pos.x].symbol = "↕";
					Level.tiles[Player.pos.y][Player.pos.x].template = _Tiles["↕"];
					return true;
				}
			}
		},

		"↕": {
			color: "#ff6600",
			pattern: "bridge_vertical",
			audio_exit: "click",
			audio_enter: "step",

			enter: function(nextPos) { return nextPos.y != Player.pos.y; },
			exit: function(nextPos, check) {

				if (check) { return nextPos.x == Player.pos.x; }

				if (nextPos.x == Player.pos.x) {
					Level.tiles[Player.pos.y][Player.pos.x].symbol = "↔";
					Level.tiles[Player.pos.y][Player.pos.x].template = _Tiles["↔"];
					return true;
				}
			}
		},

		"┼": {
			color: "#E8E83F",
			audio_enter: "step",
			pattern: "overlap",

			enter: function() { return true; }
		},

		"t": {
			color: "#991131",
			pattern: "teleport",
			enter: function(nextPos, check) { return false; }
		},

		"T": {
			color: "#ec1649",
			pattern: "teleport",
			audio_enter: "teleport",

			enter: function(nextPos, check) {

				if (check) { return !Level.tileVisited(nextPos); }

				var tel_tiles  = [], telPos, index;

				// Find all possible teleport tiles
				Level.tiles.forEach(function(row, y) {
					row.forEach(function(tile, x) {
						if (tile.symbol == "T" && !(nextPos.x == x && nextPos.y == y)) {

							tel_tiles.push({
								x: x,
								y: y
							});
						}
					});
				});

				telPos = _.shuffle(tel_tiles).pop();

				Level.tiles[nextPos.y][nextPos.x].symbol = "t";
				Level.tiles[nextPos.y][nextPos.x].template = _Tiles["t"];

				App.Audio.sfx.teleport.play();

				Level.tiles[telPos.y][telPos.x].symbol = "t";
				Level.tiles[telPos.y][telPos.x].template = _Tiles["t"];

				// Select a random teleport tile
				return telPos;
			}
		}
	};

	return Tiles;
});