define(["modules/tiles"], function(TileTemplates) {

	var Editor = {

		fieldSize: {
			x: 8,
			y: 6
		},

		tiles: [],
		tileMargin: 2,
		selection: "1",
		tileSize: undefined,

		editName: undefined

	}, App, Utils, Game, Level, Player, ctx, G5, $, _,

	$levelEditor,
	$resizeTop, $resizeBottom,
	$resizeRight, $resizeLeft;

	/* ======================== */
	/* ====== INITIALIZE ====== */
	/* ======================== */

	Editor.initialize = function() {

		App = require("app");
		Utils = App.Utils;
		Game = App.Game;
		Level = App.Game.Level;
		Player = App.Game.Player;

		G5 = App.G5;
		$ = App.$;
		_ = App._;

		$levelEditor = $levelEditor = $("#level-editor");
		$resizeTop = $levelEditor.find(".top");
		$resizeBottom = $levelEditor.find(".bottom");
		$resizeRight = $levelEditor.find(".right");
		$resizeLeft = $levelEditor.find(".left");

		TileTemplates = TileTemplates.initialize();
		ctx = new G5.Scene(0, 0, "2d", { parent: $("#level-editor")[0] });
		Editor.levels = Utils.localStorage("editor-levels") || {};

		var tile, color, div, tile;

		Editor.loadLevels();

		// Load available tiles
		["S", "E", "0", "1", "F", "T", "c", "↔", "↕", "┼"].forEach(function(v) {
			tile = TileTemplates[v];
			div = document.createElement("div");
			color = v == "S" ? Player.color : tile.color;

			if (tile.pattern)
			{ div.style.backgroundImage = "url(" + App.Images[tile.pattern].src + ")"; }

			div.style.backgroundColor = color;

			$(div).attr("data-type", v);
			$("#level-editor .toolbar").append(div);
		});

		// Register event listeners
		$("#level-editor canvas").on("click mousedown mousemove touchmove", Editor.draw);
		$(document).on("mouseup", function() { Editor.mousedown = false; });
		$(window).on("resize", function() {
			if (window.location.hash == "#level-editor") {
				Editor.resize();
				Editor.drawLevel();
			}
		});

		// Save level
		$("#editor-level-save").on("click", Editor.saveLevel);

		// Select tile
		$("#level-editor .toolbar div").on("click", Editor.selectTile);

		// Remove/Rename/Play level
		$("#level-editor-select").on("click", ".levels .icon", Editor.levelAction);

		// Resize top
		$resizeTop.on("click", function() {
			if (Editor.fieldSize.y < 5) { return; }

			Editor.fieldSize.y--;
			Editor.tiles.pop();
			Editor.resize();
			Editor.drawLevel();
		});

		// Resize bottom
		$resizeBottom.on("click", function() {
			Editor.fieldSize.y++;
			Editor.tiles.push(new Array(Editor.fieldSize.x+1).join("0").split(""));
			Editor.resize();
			Editor.drawLevel();
		});

		// Resize left
		$resizeLeft.on("click", function() {
			if (Editor.fieldSize.x < 5) { return; }

			Editor.fieldSize.x--;
			Editor.tiles.forEach(function(v) { v.pop(); });
			Editor.resize();
			Editor.drawLevel();
		});

		// Resize right
		$resizeRight.on("click", function() {
			Editor.fieldSize.x++;
			Editor.tiles.forEach(function(v) { v.push("0"); });
			Editor.resize();
			Editor.drawLevel();
		});
	};

	/* ======================== */
	/* ====== SAVE LEVEL ====== */
	/* ======================== */

	Editor.saveLevel = function() {
		Utils.prompt("Level Name", "Please enter a name", Editor.editName || "", function(name) {
			if (!name) { return; }
			Editor.levels[name] = Editor.tiles.map(function(v) { return v.join(""); }).join("\n");;

			Utils.localStorage("editor-levels", Editor.levels);
			Editor.loadLevels();
			App.Achievements.check("levelCreate");

			window.location.hash = "level-selection:editor";
		});
	};

	/* ========================== */
	/* ====== LEVEL ACTION ====== */
	/* ========================== */

	Editor.levelAction = function(e) {
		var levelName = $(e.currentTarget).siblings(".name").html();

		if ($(e.currentTarget).hasClass("icon-play")) {
			window.location.hash = "level:editor:" + levelName;
			return;
		}

		if ($(e.currentTarget).hasClass("icon-edit")) {
			window.location.hash = "level-editor:" + levelName;
			return;
		}

		if ($(e.currentTarget).hasClass("icon-remove")) {
			if (confirm("Remove " + levelName + "?")) {
				delete Editor.levels[levelName];
				Utils.localStorage("editor-levels", Editor.levels);
				$(e.currentTarget).parent().remove();
			}

			return;
		}
	};

	/* ========================= */
	/* ====== SELECT TILE ====== */
	/* ========================= */

	Editor.selectTile = function(e) {
		var type = $(this).attr("data-type");

		$(this).siblings().removeClass("selected");
		$(this).addClass("selected");

		Editor.selection = type;
	};

	/* ========================= */
	/* ====== LOAD LEVELS ====== */
	/* ========================= */

	Editor.loadLevels = function() {
		var level, $level,
		    $remove = $("<span class='icon icon-remove'>"),
		    $edit = $("<span class='icon icon-edit'>"),
		    $play = $("<span class='icon icon-play'>"),
		    fragment = document.createDocumentFragment();

		for (level in Editor.levels) {
			$level = $("<div>");
			$level.html("<span class='name'>" + level + "</span>");
			$level.append($play.clone(), $edit.clone(), $remove.clone());
			$(fragment).append($level);
		}

		$("#level-editor-select .levels").html("").append(fragment);
	};

	/* ==================== */
	/* ====== RESIZE ====== */
	/* ==================== */

	Editor.resize = function() {

		// Determine optimal tile size
		Editor.tileSize = Math.min(
			$(window).width() / Editor.fieldSize.x,
			($(window).height()-$(ctx.canvas).offset().top) / Editor.fieldSize.y
		) - Editor.tileMargin | 0;

		// Shrink tile size a little bit
		Editor.tileSize = Editor.tileSize / 1.2 | 0;
		Editor.tileSpace = Editor.tileSize + Editor.tileMargin;

		// Update canvas' size and position
		ctx.canvas.width = Editor.fieldSize.x * (Editor.tileSpace) - Editor.tileMargin;
		ctx.canvas.height = Editor.fieldSize.y * (Editor.tileSpace) - Editor.tileMargin;

		var offset = $(ctx.canvas).offset();

		$resizeTop.css({ left: offset.left + (ctx.canvas.width / 2), top: offset.top - $resizeTop.height()/2 });
		$resizeBottom.css({ left: offset.left + (ctx.canvas.width / 2), top: offset.top + ctx.canvas.height - 10 });

		$resizeRight.css({ left: offset.left + ctx.canvas.width - $resizeRight.width()/2, top: offset.top + ctx.canvas.height/2 });
		$resizeLeft.css({ left: offset.left - $resizeLeft.width()/2 - 10, top: offset.top + ctx.canvas.height/2 });
	};

	/* =================== */
	/* ====== RESET ====== */
	/* =================== */

	Editor.reset = function() {

		var data = new Array(Editor.fieldSize.y+1).join(new Array(Editor.fieldSize.x+1).join("0")+"\n").split("\n");
		data.pop();

		delete Editor.editName;

		data.forEach(function(row, y) {
			Editor.tiles[y] = [];
			row.split("").forEach(function(tile, x) {
				Editor.tiles[y].push(tile);
			});
		});

		Editor.resize();
		Editor.drawLevel();
	};

	/* ================== */
	/* ====== EDIT ====== */
	/* ================== */

	Editor.edit = function(which) {

		var data = Editor.levels[which].split("\n");
		
		Editor.editName = which;
		Editor.tiles = [];

		data.forEach(function(row, y) {
			Editor.tiles[y] = [];
			row.split("").forEach(function(tile, x) {
				Editor.tiles[y].push(tile);
			});
		});

		Editor.fieldSize.x = data[0].length;
		Editor.fieldSize.y = data.length;

		Editor.resize();
		Editor.drawLevel();
	};

	/* ================== */
	/* ====== DRAW ====== */
	/* ================== */

	Editor.draw = function(e) {

		e.preventDefault();

		if (e.type == "mousedown" || App.isMobile) { Editor.mousedown = true; }
		if (!Editor.mousedown) { return; }

		var offset = $(this).offset(), x, y;

		x = e.originalEvent.changedTouches && e.originalEvent.changedTouches[0] ? e.originalEvent.changedTouches[0].pageX : e.pageX;
		y = e.originalEvent.changedTouches && e.originalEvent.changedTouches[0] ? e.originalEvent.changedTouches[0].pageY : e.pageY;
		
		x = x - offset.left - 10;
		y = y - offset.top - 10;

		x = x / (Editor.tileSize + Editor.tileMargin) | 0;
		y = y / (Editor.tileSize + Editor.tileMargin) | 0;

		if (x > Editor.fieldSize.x-1 || y > Editor.fieldSize.y-1) { return; }

		Editor.tiles[y][x] = Editor.selection;
		Editor.drawLevel();
	};

	/* ======================== */
	/* ====== DRAW LEVEL ====== */
	/* ======================== */

	Editor.drawLevel = function() {

		var

		// For loop variables
		e     = Editor,
		x, xl = e.fieldSize.x,
		y, yl = e.fieldSize.y,
		tm    = e.tileMargin,
		tx, ty,ts, tile, isPlayerTile;

		ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

		// Loop through the entire field
		for (y = 0; y < yl; y++) {;
			for (x = 0; x < xl; x++) {

				// Current tile
				tile = e.tiles[y][x];
				isPlayerTile = tile == "S";
				tile = TileTemplates[tile];

				if (!tile) { continue; }

				// Tile properties
				tx = x*(e.tileSize+tm);
				ty = y*(e.tileSize+tm);
				ts = e.tileSize;

				// Draw tile
				ctx.fillStyle = isPlayerTile ? Player.color : tile.color;
				ctx.fillRect(tx, ty, ts, ts);

				if (tile.pattern && App.Images[tile.pattern]) {
					Utils.drawPattern(ctx, tile.pattern, tx, ty, ts);
				}
			}
		}
	};

	return Editor;
});