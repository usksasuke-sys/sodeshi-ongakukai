var SAVE_KEY = "happyoukai-game";
var LOCK = {
  closeA: "134ce864a779e62e556fe5bef1654f1e539eedbb49bcb6585108379fa29eff2b",
  closeB: "886bb208da84799a42fbf9894b56f8e7b376913c3b17f2b6b92ff70796a2c1ab",
  open: "86531f1a180c672198015a0645d0d8264a58c081ae49d1aaa70fbcb2512c651b"
};
var SOLUTION = "缶は太一に当たっていません。へこんだのは缶で、夏希が太一の家の外に忘れたものです。正樹が、それを持ち帰っています。店長に勧められた、は嘘です。持ち帰ったことは覚えています。缶は、夏希に見せかけるためのものではありません。柱に残っているのは当たり跡です。太一はつまずいて塀に意識を失い、心臓は動いたままでした。通話は20時48分から20分で、21時08分に終わっています。夏希が家の外にいるのは、そのあとです。この通話では、来ていたとは聞けません。絵里香は、帰ってきてから、夏希さんが来てたらしい、とだけ言っていたと話しています。Cさんは、21時20分には、太一がまだ一人で寝ていて、指はみんな曲がっていたと見ています。21時55分には、塀にもたれていました。人差し指だけ、ほかの指より汚れが落ちているのは、そのあとです。聞いたのも、触ったのも、このあいだです。起こしたら太一のほうからつかんできて、いつものように酔った勢いで口論になり、つかみ合って顔を殴り、押しました。頭のうしろが同じ塀に強く当たり、それが死因です。顔のあざは、このパンチです。正樹は、押したあと死んだと分かっていて、隠しました。殺したことは覚えています。太一がその夜、夏希が来ていたと言ったので、人差し指を団地の方へ向けました。夏希のしわざに見せるためです。";
var CORE = ["chihiro", "natsu", "masaki"];
var REFS = ["yusuke", "rina", "shinji", "yuko"];
var MISSIONS = [
  { id: "refs", title: "参考人を呼ぶ", text: "打ち上げにいた祐介、莉奈、慎司、裕子を署に呼ぶ。" },
  { id: "check", title: "話を確かめる", text: "夏希の話を、冬美に確かめる。" },
  { id: "neighbors", title: "近所を回る", text: "太一の家の近所で、前夜のことを聞く。" }
];
var FILE_ORDER = [
  "family", "map", "taichi-recent", "taichi-chiharu", "wives", "taichi-past",
  "fuyumi-line", "ogita-home", "grade", "rina-chihiro", "sit", "past",
  "masaki-old", "tanaka-home", "autopsy"
];

function sha256(str) {
  function rightRotate(value, amount) {
    return (value >>> amount) | (value << (32 - amount));
  }
  var maxWord = Math.pow(2, 32);
  var i, j;
  var result = "";
  var words = [];
  var asciiBitLength = str.length * 8;
  var hash = [];
  var k = [];
  var primeCounter = 0;
  var isComposite = {};
  for (var candidate = 2; primeCounter < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (i = 0; i < 313; i += candidate) isComposite[i] = candidate;
      hash[primeCounter] = (Math.pow(candidate, 0.5) * maxWord) | 0;
      k[primeCounter++] = (Math.pow(candidate, 1 / 3) * maxWord) | 0;
    }
  }
  str += "\x80";
  while ((str.length % 64) - 56) str += "\x00";
  for (i = 0; i < str.length; i++) {
    j = str.charCodeAt(i);
    words[i >> 2] |= j << (((3 - i) % 4) * 8);
  }
  words[words.length] = (asciiBitLength / maxWord) | 0;
  words[words.length] = asciiBitLength;
  for (j = 0; j < words.length;) {
    var w = words.slice(j, (j += 16));
    var oldHash = hash.slice(0);
    hash = hash.slice(0, 8);
    for (i = 0; i < 64; i++) {
      var w15 = w[i - 15];
      var w2 = w[i - 2];
      var a = hash[0];
      var e = hash[4];
      var temp1 = hash[7]
        + (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25))
        + ((e & hash[5]) ^ (~e & hash[6]))
        + k[i]
        + (w[i] = i < 16
          ? w[i]
          : (w[i - 16]
            + (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3))
            + w[i - 7]
            + (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))) | 0);
      var temp2 = (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22))
        + ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));
      hash = [(temp1 + temp2) | 0].concat(hash);
      hash[4] = (hash[4] + temp1) | 0;
    }
    for (i = 0; i < 8; i++) hash[i] = (hash[i] + oldHash[i]) | 0;
  }
  for (i = 0; i < 8; i++) {
    for (j = 3; j + 1; j--) {
      var b = (hash[i] >> (j * 8)) & 255;
      result += (b < 16 ? "0" : "") + b.toString(16);
    }
  }
  return result;
}

function fresh() {
  return {
    started: false,
    phase: "night",
    view: "night",
    viewId: "",
    round: 1,
    seen: {},
    marks: {},
    memo: "",
    hints: 0,
    log: [],
    queue: [],
    banner: "",
    closed: false,
    solved: false,
    lastSpot: "",
    ink: [],
    admin: false
  };
}

function scrubLine(text) {
  return String(text || "")
    .replace("写真には顔が写っていない。", "")
    .replace("爪の欠けもない。", "")
    .replace("血も髪も付いていない。その夜に折れたものではない。", "")
    .replace("頭髪や皮膚の付着は、調べられていない。", "")
    .replace(/\s+/g, " ")
    .trim();
}

function load() {
  try {
    var saved = JSON.parse(localStorage.getItem(SAVE_KEY) || "");
    if (saved && saved.seen && saved.log) {
      delete saved.seen["spot:ground"];
      delete saved.seen["spot:ground:2"];
      delete saved.seen["note:spot:ground"];
      delete saved.seen["note:spot2:ground"];
      saved.log = saved.log.map(function (line) {
        if (line === "正樹は、顔を殴り、押して頭のうしろを塀に打ったと話した。部屋に、へこんだ缶がある。") {
          return "正樹は、利き手の拳が腫れていたことと、部屋にへこんだ缶があることを話した。店長に勧められたような気がする、と言った。";
        }
        if (line === "絵里香は、電話のあと玄関が開き、帰ったとき利き手の拳が腫れていたと話した。") {
          return "絵里香は、電話のあと玄関が開き、帰ったとき利き手の拳が腫れていたと話した。正樹は、夏希さんが来てたらしい、とだけ言っていた。";
        }
        if (line === "二十一時十五分ごろに女の「やめて」。二十一時二十分ごろ玄関で寝ている太一。二十一時五十五分ごろ、塀にもたれていた。") {
          return "Aは二十一時十五分ごろの「やめて」。Bは、大きな人が小さな人につかみかかっているように見えた。Cは、二十一時二十分には指がみんな曲がって寝ていて、二十一時五十五分には塀にもたれていた、と話した。";
        }
        if (line === "正樹は、昨日のことは覚えていない、家には行っていないと思う、指には触っていない、と話した。") {
          return "正樹は、昨日のことは覚えていない、家には行っていないと思う、と話した。";
        }
        if (line === "冬美と絵里香に、話を確かめる。") return "冬美に、話を確かめる。";
        if (line === "絵里香の話と検視が揃った。正樹をもう一度呼べる。") return "";
        return scrubLine(line);
      }).filter(function (line) {
        return line && line !== "現場に、瓶も缶もない。" && line !== "こぼれたビールの跡も、柱の根元にはない。缶は現場に残っていない。";
      });
      if (saved.lastSpot === "ground") saved.lastSpot = "";
      if (!saved.ink) saved.ink = [];
      saved.admin = !!saved.admin;
      saved.banner = "";
      saved.queue = [];
      return saved;
    }
  } catch (e) {}
  return fresh();
}

var state = load();
var inkTool = "look";
var INK_COLORS = [
  { id: "#e23b3b", label: "赤" },
  { id: "#f0c84a", label: "黄" },
  { id: "#4aa3ff", label: "青" },
  { id: "#ffffff", label: "白" }
];
var pick = { who: [], none: false, when: "", cause: "", factors: [], why: "" };
var step = "who";
var answerSteps = ["who", "when", "cause", "why", "confirm", "result"];

function save() {
  localStorage.setItem(SAVE_KEY, JSON.stringify(state));
}

function personById(id) {
  return STORY.people.filter(function (person) { return person.id === id; })[0];
}

function fileById(id) {
  return STORY.files.filter(function (file) { return file.id === id; })[0];
}

function spotById(id) {
  return STORY.spots.filter(function (spot) { return spot.id === id; })[0];
}

function heard(id, round) {
  return !!state.seen["talk:" + id + ":" + round];
}

function phoneOpened() {
  return !!state.seen["spot:phone"];
}

function autopsyRead() {
  return !!state.seen["file:autopsy"];
}

function coreDone() {
  return CORE.every(function (id) { return heard(id, 1); });
}

function missionOn(id) {
  return !!state.seen["mission:" + id];
}

function openMissions() {
  if (!coreDone()) return [];
  return MISSIONS.filter(function (mission) { return !missionOn(mission.id); });
}

function fieldDone() {
  return coreDone()
    && REFS.every(function (id) { return heard(id, 1); })
    && heard("fuyumi", 1)
    && heard("natsu", 2)
    && heard("neighbors", 1);
}

function availablePeople() {
  if (state.phase !== "day") return [];
  var ids = ["chihiro"];
  if (phoneOpened()) ids.push("natsu", "masaki");
  if (missionOn("refs")) ids.push("yusuke", "rina", "shinji", "yuko");
  if (missionOn("check")) ids.push("fuyumi");
  if (heard("natsu", 2) && autopsyRead()) ids.push("erika");
  if (missionOn("neighbors")) ids.push("neighbors");
  return ids.map(personById);
}

function availableRounds(person) {
  var rounds = [1];
  var id = person.id;
  if (id === "natsu" && heard("fuyumi", 1)) rounds.push(2);
  if (id === "masaki" && heard("erika", 1) && autopsyRead()) rounds.push(2);
  if (["chihiro", "yusuke", "rina", "shinji", "yuko"].indexOf(id) !== -1 && heard(id, 1) && autopsyRead()) rounds.push(2);
  return rounds;
}

function availableFileIds() {
  if (state.phase !== "day") return [];
  var ids = ["family", "map"];
  if (phoneOpened()) ids.push("taichi-recent");
  if (heard("chihiro", 1)) ids.push("taichi-chiharu");
  if (heard("yuko", 1)) ids.push("wives");
  if (heard("natsu", 2)) ids.push("taichi-past", "fuyumi-line", "ogita-home");
  if (heard("rina", 1)) ids.push("grade", "rina-chihiro");
  if (heard("yusuke", 1) && heard("shinji", 1)) ids.push("sit");
  if (heard("yusuke", 1) && heard("shinji", 1) && heard("rina", 1)) ids.push("past");
  if (heard("masaki", 2)) ids.push("masaki-old", "tanaka-home");
  if (fieldDone()) ids.push("autopsy");
  return FILE_ORDER.filter(function (id) { return ids.indexOf(id) !== -1; });
}

function pendingPeople() {
  return availablePeople().filter(function (person) {
    return availableRounds(person).some(function (round) { return !heard(person.id, round); });
  });
}

function unreadFiles() {
  return availableFileIds().filter(function (id) { return !state.seen["file:" + id]; });
}

function supplementLeft() {
  if (!autopsyRead()) return false;
  return STORY.spots.some(function (spot) {
    return spot.later && state.seen["spot:" + spot.id] && !state.seen["spot:" + spot.id + ":2"];
  });
}

function lead() {
  if (state.phase !== "day") return "玄関の外で千春の話を聞き、翌朝の現場へ進む。";
  if (!heard("chihiro", 1)) return "第一発見者の千春から、話を聞ける。";
  if (!phoneOpened()) return "倒れている太一の上着あたりを触ると、回収した携帯が開く。";
  if (!coreDone() && pendingPeople().length) return "名簿に、まだ話を聞いていない人がいる。";
  if (openMissions().length) return "次の捜査を、署で選べる。";
  if (pendingPeople().length) return "名簿に、まだ話を聞いていない人がいる。";
  if (fieldDone() && !autopsyRead()) return "鑑識から、検視の結果が届いた。";
  if (supplementLeft()) return "検視を踏まえて、現場の同じ箇所をもう一度見られる。";
  if (unreadFiles().length) return "まだ開いていない資料がある。";
  return "告発は、署の机から出せる。";
}

function addLog(id, text, banner) {
  if (!text || state.seen["note:" + id]) return;
  state.seen["note:" + id] = true;
  state.log.push(text);
  if (banner) state.queue.push(text);
}

function sync() {
  if (!state.started) return;
  if (state.phase === "day") addLog("day", "翌日、明るくなった現場へ戻った。");
  STORY.spots.forEach(function (spot) {
    if (state.seen["spot:" + spot.id]) addLog("spot:" + spot.id, spot.first, false);
    if (state.seen["spot:" + spot.id + ":2"] && spot.later) addLog("spot2:" + spot.id, spot.later, false);
  });
  Object.keys(STORY.briefs).forEach(function (key) {
    var seen = key.indexOf("file:") === 0 ? state.seen[key] : state.seen["talk:" + key];
    if (seen) addLog(key, STORY.briefs[key]);
  });
  if (coreDone()) addLog("ev-missions", "三人の話が揃った。次の捜査を、署で選べる。");
  if (fieldDone()) addLog("ev-autopsy", "鑑識から、検視の結果が届いた。");
  if (autopsyRead()) addLog("ev-scene2", "現場へ戻って、同じ箇所をもう一度見られる。");
  if (!state.banner && state.queue.length) state.banner = state.queue.shift();
}

function setView(view, id) {
  state.view = view;
  state.viewId = id || "";
  save();
  render();
}

function render() {
  var title = document.getElementById("title");
  var app = document.getElementById("app");
  title.hidden = !!state.started;
  app.hidden = !state.started;
  if (!state.started) return;
  if (state.view === "file" && state.viewId) state.seen["file:" + state.viewId] = true;
  sync();
  document.getElementById("phase").textContent = state.phase === "day" ? "翌日" : "当夜";
  document.getElementById("go-scene").disabled = state.phase !== "day";
  document.getElementById("go-files").disabled = state.phase !== "day";
  var charge = document.getElementById("go-charge");
  charge.disabled = !autopsyRead();
  document.getElementById("go-solution").hidden = !state.admin;
  var unread = unreadFiles().length;
  document.getElementById("go-files").textContent = unread ? "資料（" + unread + "）" : "資料";
  var banner = document.getElementById("banner");
  banner.hidden = !state.banner;
  document.getElementById("banner-text").textContent = state.banner || "";
  renderRoster();
  renderStage();
  renderNotes();
  save();
}

function renderRoster() {
  var roster = document.getElementById("roster");
  var people = availablePeople();
  roster.hidden = !people.length;
  roster.innerHTML = "";
  if (!people.length) return;
  var heading = document.createElement("h2");
  heading.textContent = "話を聞ける人";
  roster.appendChild(heading);
  people.forEach(function (person) {
    var button = document.createElement("button");
    button.type = "button";
    var rounds = availableRounds(person);
    var waiting = rounds.some(function (round) { return !heard(person.id, round); });
    var again = rounds.indexOf(2) !== -1 && !heard(person.id, 2);
    button.className = "person-btn" + (state.view === "person" && state.viewId === person.id ? " on" : "") + (waiting ? " wait" : "");
    button.innerHTML = "<span>" + person.name + (again ? " ・再" : "") + "</span><small>" + person.role + "</small>";
    button.addEventListener("click", function () { openPerson(person.id); });
    roster.appendChild(button);
  });
}

function openPerson(id) {
  var person = personById(id);
  var rounds = availableRounds(person);
  var pending = rounds.filter(function (round) { return !heard(id, round); });
  state.view = "person";
  state.viewId = id;
  state.round = pending.length ? pending[0] : rounds[rounds.length - 1];
  save();
  render();
}

function renderStage() {
  var stage = document.getElementById("stage");
  if (state.view === "night") {
    stage.innerHTML = nightHtml();
    document.getElementById("to-morning").addEventListener("click", toMorning);
    return;
  }
  if (state.view === "scene") {
    stage.innerHTML = sceneHtml();
    stage.querySelectorAll("[data-spot]").forEach(function (button) {
      button.addEventListener("click", function () { inspect(button.dataset.spot); });
    });
    bindInk(stage);
    return;
  }
  if (state.view === "files") {
    stage.innerHTML = filesHtml();
    stage.querySelectorAll("[data-file]").forEach(function (button) {
      button.addEventListener("click", function () { setView("file", button.dataset.file); });
    });
    return;
  }
  if (state.view === "file") {
    var file = fileById(state.viewId);
    stage.innerHTML = "<article class=\"paper\"><h2>" + file.title + "</h2>" + file.html + "<button type=\"button\" id=\"back-files\">資料の一覧へ</button></article>";
    document.getElementById("back-files").addEventListener("click", function () { setView("files"); });
    return;
  }
  if (state.view === "person") {
    renderPerson(stage);
    return;
  }
  stage.innerHTML = deskHtml();
  var deskScene = document.getElementById("desk-scene");
  if (deskScene) deskScene.addEventListener("click", function () { setView("scene"); });
  stage.querySelectorAll("[data-mission]").forEach(function (button) {
    button.addEventListener("click", function () { startMission(button.dataset.mission); });
  });
}

function nightHtml() {
  return "<div class=\"scene night\"><img src=\"資料/犯行現場.jpg\" alt=\"夜の玄関。塀に寄りかかった人の姿がある。\"><p class=\"scene-caption\">二十二時四十八分。鈴木家の玄関の外。</p></div><article class=\"paper\"><h2>当夜</h2><p>あなたは新米刑事だ。音楽発表会の夜、鈴木太一の妻、千春から通報が入った。先輩と、玄関の外に着く。</p><p>千春は、一度開けたときは、いつものように夫がいた、と言った。戻ってこないので、もう一度開けた。明日は粗大ごみの日なので、壊れた椅子を出そうとして開けた、とも言った。段の上で倒れていて、酔って寝ているのだと思った。血を見て、死んでいると分かった。</p><p>先輩が、今夜は確保だけだ、と言った。端末は回収したが、中身は明日だ。現場は、明るくなってからもう一度見ろ。</p><button type=\"button\" id=\"to-morning\">翌朝、現場へ</button></article>";
}

function toMorning() {
  state.phase = "day";
  state.view = "scene";
  state.viewId = "";
  save();
  render();
}

function sceneHtml() {
  var html = "<div class=\"ink-bar\"><button type=\"button\" class=\"ink-mode" + (inkTool === "look" ? " on" : "") + "\" data-ink=\"look\">見る</button>";
  INK_COLORS.forEach(function (color) {
    html += "<button type=\"button\" class=\"ink-swatch" + (inkTool === color.id ? " on" : "") + "\" data-ink=\"" + color.id + "\" style=\"background:" + color.id + "\" aria-label=\"" + color.label + "\"></button>";
  });
  html += "<button type=\"button\" class=\"ink-mode" + (inkTool === "erase" ? " on" : "") + "\" data-ink=\"erase\">消す</button>";
  html += "<button type=\"button\" class=\"ink-mode\" data-ink=\"clear\">全部消す</button></div>";
  html += "<div class=\"scene" + (inkTool === "look" ? "" : " inking") + "\"><div class=\"scene-frame\"><img src=\"資料/犯行現場_昼.jpg\" alt=\"翌朝の玄関の外。気になるところを触って確かめられる。\">";
  html += "<canvas class=\"scene-ink\" aria-hidden=\"true\"></canvas>";
  var areas = STORY.spots.filter(function (spot) { return spot.width || spot.height; });
  var points = STORY.spots.filter(function (spot) { return !(spot.width || spot.height); });
  areas.concat(points).forEach(function (spot) {
    var box = "left:" + spot.left + ";top:" + spot.top + ";";
    if (spot.width) box += "width:" + spot.width + ";";
    if (spot.height) box += "height:" + spot.height + ";";
    var wide = spot.width || spot.height ? " area" : "";
    html += "<button type=\"button\" class=\"pin" + wide + "\" style=\"" + box + "\" data-spot=\"" + spot.id + "\" aria-label=\"" + spot.label + "\"></button>";
  });
  html += "<p class=\"scene-caption\">翌日。明るくなった玄関の外。</p></div></div>";
  if (state.lastSpot) {
    var spot = spotById(state.lastSpot);
    var text = state.seen["spot:" + spot.id + ":2"] && spot.later ? spot.later : spot.first;
    html += "<article class=\"paper slim\"><h2>" + spot.label + "</h2><p>" + text + "</p></article>";
  }
  return html;
}

function drawStroke(ctx, stroke, width, height) {
  if (!stroke.points.length) return;
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = (stroke.erase ? 0.05 : 0.018) * width;
  if (stroke.erase) {
    ctx.globalCompositeOperation = "destination-out";
    ctx.strokeStyle = "#000";
  } else {
    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = stroke.color;
    ctx.globalAlpha = 0.9;
  }
  ctx.beginPath();
  stroke.points.forEach(function (point, index) {
    var x = point[0] * width;
    var y = point[1] * height;
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  if (stroke.points.length === 1) ctx.lineTo(stroke.points[0][0] * width + 0.2, stroke.points[0][1] * height);
  ctx.stroke();
  ctx.restore();
}

function bindInk(root) {
  var canvas = root.querySelector(".scene-ink");
  var img = root.querySelector(".scene img");
  if (!canvas || !img) return;
  var drawing = null;

  function paint() {
    var ctx = canvas.getContext("2d");
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    (state.ink || []).forEach(function (stroke) {
      drawStroke(ctx, stroke, canvas.width, canvas.height);
    });
    if (drawing) drawStroke(ctx, drawing, canvas.width, canvas.height);
  }

  function fit() {
    var width = img.clientWidth;
    var height = img.clientHeight;
    if (!width || !height) return;
    var ratio = window.devicePixelRatio || 1;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    paint();
  }

  function point(event) {
    var rect = canvas.getBoundingClientRect();
    return [
      Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)),
      Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height))
    ];
  }

  root.querySelectorAll("[data-ink]").forEach(function (button) {
    button.addEventListener("click", function () {
      if (button.dataset.ink === "clear") {
        state.ink = [];
        save();
        paint();
        return;
      }
      inkTool = button.dataset.ink;
      var scene = root.querySelector(".scene");
      if (scene) scene.classList.toggle("inking", inkTool !== "look");
      root.querySelectorAll("[data-ink]").forEach(function (item) {
        item.classList.toggle("on", item.dataset.ink === inkTool);
      });
    });
  });

  canvas.addEventListener("pointerdown", function (event) {
    if (inkTool === "look") return;
    canvas.setPointerCapture(event.pointerId);
    drawing = { color: inkTool, erase: inkTool === "erase", points: [point(event)] };
    paint();
    event.preventDefault();
  }, { passive: false });
  canvas.addEventListener("pointermove", function (event) {
    if (!drawing) return;
    drawing.points.push(point(event));
    paint();
    event.preventDefault();
  }, { passive: false });
  function finish(event) {
    if (!drawing) return;
    if (event) drawing.points.push(point(event));
    state.ink.push(drawing);
    drawing = null;
    save();
    paint();
  }
  canvas.addEventListener("pointerup", finish);
  canvas.addEventListener("pointercancel", function () { finish(); });

  if (img.complete && img.naturalWidth) fit();
  else img.addEventListener("load", fit);
  if (window.inkResize) window.removeEventListener("resize", window.inkResize);
  window.inkResize = function () {
    if (!document.body.contains(canvas)) return;
    fit();
  };
  window.addEventListener("resize", window.inkResize);
}

function inspect(id) {
  var spot = spotById(id);
  if (!state.seen["spot:" + id]) state.seen["spot:" + id] = true;
  else if (spot.later && autopsyRead() && !state.seen["spot:" + id + ":2"]) state.seen["spot:" + id + ":2"] = true;
  state.lastSpot = id;
  if (id === "phone") {
    state.view = "file";
    state.viewId = "taichi-recent";
  }
  save();
  render();
}

function filesHtml() {
  var html = "<article class=\"paper\"><h2>資料</h2><div class=\"file-list\">";
  availableFileIds().forEach(function (id) {
    var file = fileById(id);
    var fresh = state.seen["file:" + id] ? "" : " wait";
    html += "<button type=\"button\" class=\"file-btn" + fresh + "\" data-file=\"" + id + "\">" + file.title + "</button>";
  });
  html += "</div></article>";
  return html;
}

function deskHtml() {
  var missions = openMissions();
  if (missions.length) {
    var html = "<article class=\"paper\"><h2>次の捜査</h2><p>千春、夏希、正樹の話が揃った。次に何をするか、ここから選ぶ。</p><div class=\"file-list\">";
    missions.forEach(function (mission) {
      html += "<button type=\"button\" class=\"file-btn wait\" data-mission=\"" + mission.id + "\"><span>" + mission.title + "</span><small>" + mission.text + "</small></button>";
    });
    html += "</div></article>";
    return html;
  }
  return "<article class=\"paper\"><h2>署</h2><p>" + (state.phase === "day" ? "翌日の朝。鈴木太一の死を、ここから調べる。" : "当夜の確保が終わっていない。") + "</p><button type=\"button\" id=\"desk-scene\">現場へ</button></article>";
}

function startMission(id) {
  state.seen["mission:" + id] = true;
  if (id === "neighbors") {
    openPerson("neighbors");
    return;
  }
  var note = id === "refs"
    ? "祐介、莉奈、慎司、裕子を署に呼んだ。"
    : "冬美に、話を確かめる。";
  addLog("mission:" + id, note);
  save();
  render();
}

function renderPerson(stage) {
  var person = personById(state.viewId);
  var rounds = availableRounds(person);
  if (rounds.indexOf(state.round) === -1) state.round = rounds[0];
  var known = heard(person.id, state.round);
  var html = "<article class=\"paper\"><p class=\"role\">" + person.role + "</p><h2>" + person.name + "</h2>";
  if (rounds.length > 1) {
    html += "<div class=\"rounds\">";
    rounds.forEach(function (round) {
      html += "<button type=\"button\" class=\"round" + (round === state.round ? " on" : "") + "\" data-round=\"" + round + "\">" + (round === 1 ? "一回目" : "二回目") + "</button>";
    });
    html += "</div>";
  }
  html += person.rounds[state.round];
  if (!known) html += "<button type=\"button\" id=\"keep-talk\">この話をメモに残す</button>";
  else html += "<p class=\"kept\">この話は、メモに残してある。</p>";
  html += "<button type=\"button\" id=\"back-desk\">署へ戻る</button></article>";
  stage.innerHTML = html;
  stage.querySelectorAll("[data-round]").forEach(function (button) {
    button.addEventListener("click", function () {
      state.round = Number(button.dataset.round);
      save();
      render();
    });
  });
  var keep = document.getElementById("keep-talk");
  if (keep) keep.addEventListener("click", keepTalk);
  document.getElementById("back-desk").addEventListener("click", function () { setView("desk"); });
}

function keepTalk() {
  var before = coreDone();
  state.seen["talk:" + state.viewId + ":" + state.round] = true;
  if (!before && coreDone()) {
    state.view = "desk";
    state.viewId = "";
  }
  save();
  render();
}

function renderNotes() {
  var notes = document.getElementById("notes");
  var memo = document.getElementById("memo");
  var focused = memo && document.activeElement === memo;
  var start = focused ? memo.selectionStart : 0;
  var end = focused ? memo.selectionEnd : 0;
  var html = "<h2>わかったこと</h2>";
  if (!state.log.length) html += "<p class=\"empty\">まだ、何も書いていない。</p>";
  else {
    html += "<div class=\"log-list\">";
    state.log.forEach(function (line) { html += "<p>" + line + "</p>"; });
    html += "</div>";
  }
  html += "<h2>見立て</h2>";
  var marked = STORY.people.filter(function (person) { return person.suspect && heard(person.id, 1); });
  if (!marked.length) html += "<p class=\"empty\">話を聞くと、名前が並ぶ。</p>";
  else {
    marked.forEach(function (person) {
      html += "<div class=\"mark-row\"><span>" + person.name + "</span><span class=\"marks\">";
      ["シロ", "保留", "クロ"].forEach(function (label) {
        var on = state.marks[person.suspect] === label ? " on" : "";
        html += "<button type=\"button\" class=\"mark" + on + "\" data-who=\"" + person.suspect + "\" data-mark=\"" + label + "\">" + label + "</button>";
      });
      html += "</span></div>";
    });
  }
  html += "<label for=\"memo\">メモ</label><textarea id=\"memo\"></textarea>";
  notes.innerHTML = html;
  var field = document.getElementById("memo");
  field.value = state.memo || "";
  field.addEventListener("input", function () {
    state.memo = field.value;
    save();
  });
  if (focused) {
    field.focus();
    field.selectionStart = start;
    field.selectionEnd = end;
  }
  notes.querySelectorAll(".mark").forEach(function (button) {
    button.addEventListener("click", function () {
      state.marks[button.dataset.who] = button.dataset.mark;
      save();
      renderNotes();
    });
  });
}

function itemLabel(list, id) {
  var found = list.filter(function (item) { return item.id === id; })[0];
  return found ? found.label : "";
}

function chosenPeople() {
  return STORY.suspects.filter(function (person) { return pick.who.indexOf(person.id) !== -1; });
}

function whoKey() {
  if (pick.none) return "none";
  var ids = chosenPeople().map(function (person) { return person.id; });
  return ids.length === 1 ? ids[0] : ids.join("+");
}

function whoNames() {
  return chosenPeople().map(function (person) { return person.name; }).join("、");
}

function whoSummary() {
  if (pick.none) return "犯人はいない。事故";
  if (pick.who.length === 1) return "一人：" + whoNames();
  if (pick.who.length > 1) return "複数：" + whoNames();
  return "";
}

function whoCountText() {
  if (pick.none) return "犯人はいない。事故です";
  if (!pick.who.length) return "まだ選んでいません";
  if (pick.who.length === 1) return "一人です";
  return "複数です（" + pick.who.length + "人）";
}

function causeSummary() {
  if (pick.cause !== "accident") return itemLabel(STORY.causes, pick.cause);
  return STORY.accidents.filter(function (item) {
    return pick.factors.indexOf(item.id) !== -1;
  }).map(function (item) { return item.label; }).join("、");
}

function openAnswer() {
  if (!autopsyRead()) return;
  pick = { who: [], none: false, when: "", cause: "", factors: [], why: "" };
  step = "who";
  document.getElementById("modal").hidden = false;
  renderAnswer();
}

function closeModal() {
  document.getElementById("modal").hidden = true;
  document.getElementById("modal").innerHTML = "";
}

function moveStep(next) {
  step = next;
  renderAnswer();
}

function renderAnswer() {
  var modal = document.getElementById("modal");
  modal.hidden = false;
  var title = "人";
  var body = "";
  if (step === "result") {
    renderResult(modal);
    return;
  }
  if (step === "confirm") {
    title = "これでよろしいですか？";
    body = summaryBlock("人", whoSummary()) + summaryBlock("死亡に関わる時刻", itemLabel(STORY.times, pick.when)) + summaryBlock("死亡原因", causeSummary());
    if (!pick.none) body += summaryBlock("決め手", itemLabel(STORY.points, pick.why));
  } else if (step === "cause") {
    title = "死亡原因";
  } else if (step === "when") {
    title = "死亡に関わる時刻";
  } else if (step === "why") {
    title = "決め手";
  }
  modal.innerHTML = "<div class=\"modal-card\"><h2>" + title + "</h2><div id=\"modal-body\"></div><div id=\"modal-actions\" class=\"modal-actions\"></div></div>";
  var box = document.getElementById("modal-body");
  var actions = document.getElementById("modal-actions");
  if (step === "confirm") {
    box.className = "summary";
    box.innerHTML = body;
    actions.appendChild(actionButton("はい", function () { moveStep("result"); }));
    actions.appendChild(actionButton("戻る", function () { moveStep(pick.none ? "cause" : "why"); }));
    return;
  }
  if (step === "cause") {
    renderCause(box, actions);
    return;
  }
  if (step === "who") {
    STORY.suspects.forEach(function (person) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "choice" + (pick.who.indexOf(person.id) !== -1 ? " on" : "");
      button.textContent = person.name;
      button.addEventListener("click", function () {
        pick.none = false;
        var at = pick.who.indexOf(person.id);
        if (at === -1) pick.who.push(person.id);
        else pick.who.splice(at, 1);
        renderAnswer();
      });
      box.appendChild(button);
    });
    var count = document.createElement("p");
    count.className = "who-count";
    count.textContent = whoCountText();
    box.appendChild(count);
    var none = document.createElement("button");
    none.type = "button";
    none.className = "choice" + (pick.none ? " on" : "");
    none.textContent = "犯人はいない。事故";
    none.addEventListener("click", function () {
      pick.none = !pick.none;
      if (pick.none) pick.who = [];
      renderAnswer();
    });
    box.appendChild(none);
    actions.appendChild(actionButton("次へ", function () {
      if (!pick.none && !pick.who.length) return;
      moveStep("when");
    }));
    actions.appendChild(actionButton("署へ戻る", closeModal));
    return;
  }
  var list = step === "when" ? STORY.times : STORY.points;
  list.forEach(function (item) {
    var button = document.createElement("button");
    button.type = "button";
    button.className = "choice";
    button.textContent = item.label;
    button.addEventListener("click", function () {
      pick[step] = item.id;
      moveStep(answerSteps[answerSteps.indexOf(step) + 1]);
    });
    box.appendChild(button);
  });
  actions.appendChild(actionButton("戻る", function () {
    moveStep(answerSteps[answerSteps.indexOf(step) - 1]);
  }));
}

function renderCause(box, actions) {
  STORY.causes.forEach(function (item) {
    if (item.id === "d14") return;
    var button = document.createElement("button");
    button.type = "button";
    button.className = "choice";
    button.textContent = item.label;
    button.addEventListener("click", function () {
      pick.cause = item.id;
      pick.factors = [];
      moveStep(pick.none ? "confirm" : "why");
    });
    box.appendChild(button);
  });
  var accident = document.createElement("button");
  accident.type = "button";
  accident.className = "choice" + (pick.cause === "accident" ? " on" : "");
  accident.textContent = "事故";
  accident.addEventListener("click", function () {
    pick.cause = "accident";
    renderAnswer();
  });
  box.appendChild(accident);
  if (pick.cause === "accident") {
    STORY.accidents.forEach(function (item) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "choice" + (pick.factors.indexOf(item.id) !== -1 ? " on" : "");
      button.textContent = item.label;
      button.addEventListener("click", function () {
        var at = pick.factors.indexOf(item.id);
        if (at === -1) pick.factors.push(item.id);
        else pick.factors.splice(at, 1);
        renderAnswer();
      });
      box.appendChild(button);
    });
  }
  var drink = STORY.causes.filter(function (item) { return item.id === "d14"; })[0];
  var alcohol = document.createElement("button");
  alcohol.type = "button";
  alcohol.className = "choice";
  alcohol.textContent = drink.label;
  alcohol.addEventListener("click", function () {
    pick.cause = drink.id;
    pick.factors = [];
    moveStep(pick.none ? "confirm" : "why");
  });
  box.appendChild(alcohol);
  if (pick.cause === "accident") {
    actions.appendChild(actionButton("次へ", function () {
      if (!pick.factors.length) return;
      moveStep(pick.none ? "confirm" : "why");
    }));
  }
  actions.appendChild(actionButton("戻る", function () { moveStep("when"); }));
}

function summaryBlock(label, text) {
  return "<p class=\"label\">" + label + "</p><p>" + text + "</p>";
}

function actionButton(label, onClick) {
  var button = document.createElement("button");
  button.type = "button";
  button.textContent = label;
  button.addEventListener("click", onClick);
  return button;
}

function renderResult(modal) {
  var key = [whoKey(), pick.when, pick.cause, pick.why].join("|");
  var hash = sha256(key);
  var title = "不正解";
  var text = "この読みは、資料と合いません。";
  var again = false;
  if (hash === LOCK.open) {
    state.solved = true;
    state.closed = false;
    save();
    title = "正解";
    text = SOLUTION;
  } else if (hash === LOCK.closeA || hash === LOCK.closeB) {
    state.closed = true;
    save();
    text = "翌朝の調べは、ここで閉じたように見えます。荻田夏希が、買い出しの缶で鈴木太一を倒した、という読みです。現場の指も、団地の方を向いています。";
    again = true;
  } else if (whoKey() === "s1+s4") {
    text = "慎司は、裕子も莉奈も、夏希と太一の件を知っている、と言っています。二人が手を下した、という読みはここから出てきます。それでも、缶を持って家を出たのが誰か、二度目を加えられたのが誰かは、この二人だけでは決まりません。";
  } else if (whoKey() === "s5" && pick.when === "2210" && pick.why === "d3") {
    text = "千春は怪しい位置にいます。それでも、現場の指と、缶を持って抜けた人が、別の読みを作っています。";
  }
  modal.innerHTML = "<div class=\"modal-card\"><h2>" + title + "</h2><div class=\"end\"><p></p></div><div id=\"modal-actions\" class=\"modal-actions\"></div></div>";
  modal.querySelector(".end p").textContent = text;
  var actions = document.getElementById("modal-actions");
  if (again) {
    actions.appendChild(actionButton("もう一度開く", function () {
      state.closed = false;
      save();
      moveStep("who");
    }));
  }
  actions.appendChild(actionButton("署へ戻る", closeModal));
}

function choiceLabel(list, id) {
  var item = list.filter(function (entry) { return entry.id === id; })[0];
  return item ? (item.name || item.label) : "";
}

function openSolution() {
  if (!state.admin) return;
  var solved = state.solved;
  var modal = document.getElementById("modal");
  modal.hidden = false;
  modal.innerHTML = "<div class=\"modal-card\"><h2>答え</h2><div class=\"summary\">"
    + summaryBlock("人", choiceLabel(STORY.suspects, "s7"))
    + summaryBlock("死亡に関わる時刻", choiceLabel(STORY.times, "2150"))
    + summaryBlock("死亡原因", choiceLabel(STORY.causes, "d4"))
    + summaryBlock("決め手", "通話が終わったあとでなければ、夏希が来ていたとは聞けない。人差し指はそのあとで触れられている")
    + "</div><div class=\"end\"><p></p></div><div id=\"modal-actions\" class=\"modal-actions\"></div></div>";
  modal.querySelector(".end p").textContent = SOLUTION;
  document.getElementById("modal-actions").appendChild(actionButton("署へ戻る", closeModal));
  state.solved = solved;
}

function openHints() {
  var modal = document.getElementById("modal");
  modal.hidden = false;
  modal.innerHTML = "<div class=\"modal-card\"><h2>ヒント</h2><div id=\"modal-body\"></div><div id=\"modal-actions\" class=\"modal-actions\"></div></div>";
  var body = document.getElementById("modal-body");
  var p = document.createElement("p");
  p.textContent = lead();
  body.appendChild(p);
  document.getElementById("modal-actions").appendChild(actionButton("署へ戻る", closeModal));
}

document.getElementById("start").addEventListener("click", function () {
  state.started = true;
  state.admin = !!document.getElementById("admin-mode").checked;
  state.phase = "night";
  state.view = "night";
  save();
  render();
});

document.getElementById("go-desk").addEventListener("click", function () {
  setView(state.phase === "day" ? "desk" : "night");
});

document.getElementById("go-scene").addEventListener("click", function () {
  if (state.phase === "day") setView("scene");
});

document.getElementById("go-files").addEventListener("click", function () {
  if (state.phase === "day") setView("files");
});

document.getElementById("go-hint").addEventListener("click", openHints);
document.getElementById("go-charge").addEventListener("click", openAnswer);
document.getElementById("go-solution").addEventListener("click", openSolution);
document.getElementById("banner-ok").addEventListener("click", function () {
  state.banner = state.queue.shift() || "";
  save();
  render();
});

document.getElementById("go-reset").addEventListener("click", function () {
  if (!confirm("最初からやり直します。書いたメモも消えます。")) return;
  localStorage.removeItem(SAVE_KEY);
  state = fresh();
  closeModal();
  render();
});

render();
