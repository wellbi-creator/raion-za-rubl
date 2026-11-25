
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const balanceElement = document.getElementById("balance");
const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modalTitle");
const modalText = document.getElementById("modalText");
const modalClose = document.getElementById("modalClose");
const modalAction = document.getElementById("modalAction");
const panelHeading = document.getElementById("panelHeading");
const panelContent = document.getElementById("panelContent");

const state = {
  balance: 1000000,
  reputation: 0,
  chapter: 1
};

let scale = 1;
let offsetX = 0;
let offsetY = 0;

function loadGame() {
  try {
    const saved = JSON.parse(localStorage.getItem("raion-save"));
    if (saved) Object.assign(state, saved);
  } catch (e) {
    console.log("Новое сохранение");
  }
  updateInterface();
}

function saveGame() {
  localStorage.setItem("raion-save", JSON.stringify(state));
}

function updateInterface() {
  balanceElement.textContent =
    state.balance.toLocaleString("ru-RU") + " ₽";
}

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;

  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  drawWorld();
}

function iso(x, y) {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;

  return {
    x: w / 2 + (x - y) * 38 * scale + offsetX,
    y: h / 2 + (x + y) * 19 * scale + offsetY
  };
}

function polygon(points, color, stroke) {
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);

  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }

  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();

  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

function tile(x, y, color) {
  const p = iso(x, y);
  const s = scale;

  polygon([
    { x: p.x, y: p.y - 19 * s },
    { x: p.x + 38 * s, y: p.y },
    { x: p.x, y: p.y + 19 * s },
    { x: p.x - 38 * s, y: p.y }
  ], color, "#ffffff12");
}

function drawRoad() {
  const a = iso(-7, 3);
  const b = iso(7, 3);
  const c = iso(7, 4.2);
  const d = iso(-7, 4.2);

  polygon([a, b, c, d], "#626b68", "#515956");

  ctx.strokeStyle = "#d6c99c";
  ctx.lineWidth = 2;
  ctx.setLineDash([12, 12]);

  ctx.beginPath();
  ctx.moveTo(a.x, a.y + 11);
  ctx.lineTo(b.x, b.y + 11);
  ctx.stroke();

  ctx.setLineDash([]);
}

function drawPath() {
  const points = [
    iso(-1, 1),
    iso(1, 1),
    iso(1, 3),
    iso(-1, 3)
  ];

  polygon(points, "#c3ad85", "#a18d6c");
}

function drawHouse(x, y) {
  const p = iso(x, y);
  const s = scale;

  // Тень
  ctx.fillStyle = "#00000022";
  ctx.beginPath();
  ctx.ellipse(p.x, p.y, 52 * s, 23 * s, 0, 0, Math.PI * 2);
  ctx.fill();

  // Боковые стены
  polygon([
    { x: p.x, y: p.y - 65 * s },
    { x: p.x + 43 * s, y: p.y - 88 * s },
    { x: p.x + 43 * s, y: p.y - 28 * s },
    { x: p.x, y: p.y - 7 * s }
  ], "#b69d7e");

  polygon([
    { x: p.x - 43 * s, y: p.y - 88 * s },
    { x: p.x, y: p.y - 65 * s },
    { x: p.x, y: p.y - 7 * s },
    { x: p.x - 43 * s, y: p.y - 30 * s }
  ], "#d6c2a1");

  // Крыша
  polygon([
    { x: p.x - 51 * s, y: p.y - 88 * s },
    { x: p.x, y: p.y - 119 * s },
    { x: p.x + 51 * s, y: p.y - 88 * s },
    { x: p.x, y: p.y - 59 * s }
  ], "#874b3f", "#63372f");

  // Дверь
  ctx.fillStyle = "#65432e";
  ctx.fillRect(p.x - 12 * s, p.y - 38 * s, 17 * s, 31 * s);

  // Окна
  ctx.fillStyle = "#8cc9d7";
  ctx.fillRect(p.x - 35 * s, p.y - 77 * s, 16 * s, 15 * s);
  ctx.fillRect(p.x + 16 * s, p.y - 77 * s, 16 * s, 15 * s);

  ctx.strokeStyle = "#eee0c5";
  ctx.lineWidth = 2;
  ctx.strokeRect(p.x - 35 * s, p.y - 77 * s, 16 * s, 15 * s);
  ctx.strokeRect(p.x + 16 * s, p.y - 77 * s, 16 * s, 15 * s);
}

function drawTree(x, y) {
  const p = iso(x, y);
  const s = scale;

  ctx.fillStyle = "#765036";
  ctx.fillRect(p.x - 4 * s, p.y - 25 * s, 8 * s, 28 * s);

  ctx.fillStyle = "#28613a";
  ctx.beginPath();
  ctx.arc(p.x, p.y - 37 * s, 19 * s, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#43894d";
  ctx.beginPath();
  ctx.arc(p.x - 8 * s, p.y - 44 * s, 11 * s, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#5b9d5b";
  ctx.beginPath();
  ctx.arc(p.x + 8 * s, p.y - 40 * s, 10 * s, 0, Math.PI * 2);
  ctx.fill();
}

function drawFence(x, y) {
  const p = iso(x, y);
  const s = scale;

  ctx.strokeStyle = "#d8c39b";
  ctx.lineWidth = 3 * s;

  ctx.beginPath();
  ctx.moveTo(p.x - 30 * s, p.y);
  ctx.lineTo(p.x + 30 * s, p.y + 15 * s);
  ctx.stroke();

  for (let i = -1; i <= 1; i++) {
    ctx.fillStyle = "#d8c39b";
    ctx.fillRect(
      p.x + i * 25 * s,
      p.y - 7 * s,
      4 * s,
      18 * s
    );
  }
}

function drawPerson(x, y, color, label, hat) {
  const p = iso(x, y);
  const s = scale;

  ctx.fillStyle = "#00000025";
  ctx.beginPath();
  ctx.ellipse(p.x, p.y, 11 * s, 5 * s, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = color;
  ctx.fillRect(p.x - 8 * s, p.y - 22 * s, 16 * s, 21 * s);

  ctx.fillStyle = "#e6b58e";
  ctx.beginPath();
  ctx.arc(p.x, p.y - 29 * s, 8 * s, 0, Math.PI * 2);
  ctx.fill();

  if (hat) {
    ctx.fillStyle = hat;
    ctx.fillRect(p.x - 10 * s, p.y - 38 * s, 20 * s, 5 * s);
    ctx.fillRect(p.x - 6 * s, p.y - 44 * s, 12 * s, 7 * s);
  }

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 11px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(label, p.x, p.y - 49 * s);
}

function drawWorld() {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;

  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "#87ad76";
  ctx.fillRect(0, 0, w, h);

  // Поле с травой
  for (let x = -7; x <= 7; x++) {
    for (let y = -7; y <= 7; y++) {
      const color = (x + y) % 2 === 0 ? "#91b77e" : "#86ad73";
      tile(x, y, color);
    }
  }

  drawRoad();
  drawPath();

  // Двор
  tile(-1, 0, "#b9a17b");
  tile(0, 0, "#b9a17b");
  tile(1, 0, "#b9a17b");

  // Объекты района
  drawTree(-3, -2);
  drawTree(3, -2);
  drawTree(-3, 1);
  drawTree(3, 1);
  drawTree(-4, 3);

  drawFence(-1, 1);
  drawFence(1, 1);

  drawHouse(0, 0);

  drawPerson(-1, 2, "#456e9b", "Вы");
  drawPerson(1, 2, "#a94d45", "Баба Зина", "#e1c48a");

  ctx.fillStyle = "#263b2b";
  ctx.font = "bold 12px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("НАШ РАЙОН", w / 2, 24);
}

function openDialog(title, message) {
  modalTitle.textContent = title;
  modalText.textContent = message;
  modal.classList.remove("hidden");
}

function closeDialog() {
  modal.classList.add("hidden");
}

modalClose.addEventListener("click", closeDialog);
modalAction.addEventListener("click", closeDialog);

modal.addEventListener("click", (event) => {
  if (event.target === modal) closeDialog();
});

function showPanel(name) {
  const panels = {
    district: {
      title: "Район",
      html: `
        <div class="info-card">
          <h3>Заброшенный район</h3>
          <p>Ты купил этот район всего за один рубль. Теперь предстоит вернуть ему жизнь.</p>
        </div>
        <div class="info-card">
          <h3>Состояние района</h3>
          <p>Электричество: отключено</p>
          <p>Водоснабжение: отключено</p>
          <p>Отопление: отключено</p>
        </div>`
    },
    quests: {
      title: "Тетрадка",
      html: `
        <div class="info-card">
          <h3>Задание №1. Новый хозяин</h3>
          <p>Познакомься с Бабой Зиной и осмотри старый дом.</p>
        </div>`
    },
    houses: {
      title: "Дома",
      html: `
        <div class="info-card">
          <h3>Старый дом</h3>
          <p>Первый дом района. Требует капитального ремонта.</p>
        </div>`
    },
    finance: {
      title: "Финансы",
      html: `
        <div class="info-card">
          <h3>Бюджет района</h3>
          <p>Доступно: ${state.balance.toLocaleString("ru-RU")} ₽</p>
        </div>`
    },
    residents: {
      title: "Жители",
      html: `
        <div class="info-card">
          <h3>Баба Зина</h3>
          <p>Первая и пока единственная жительница района.</p>
          <p>Настроение: ждёт перемен</p>
        </div>`
    }
  };

  const panel = panels[name];
  if (!panel) return;

  panelHeading.textContent = panel.title;
  panelContent.innerHTML = panel.html;

  document.querySelectorAll(".nav-item").forEach(button => {
    button.classList.toggle(
      "active",
      button.dataset.panel === name
    );
  });
}

function handleCanvasClick(event) {
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  const house = iso(0, 0);
  const baba = iso(1, 2);

  if (
    Math.abs(x - house.x) < 55 &&
    Math.abs(y - (house.y - 75 * scale)) < 65
  ) {
    openDialog(
      "Старый дом",
      "Это первый дом района. Крыша протекает, стены требуют ремонта. Нужно восстановить электричество, воду, отопление и канализацию."
    );
    return;
  }

  if (
    Math.abs(x - baba.x) < 30 &&
    Math.abs(y - (baba.y - 25 * scale)) < 35
  ) {
    openDialog(
      "Баба Зина",
      "Ой, здравствуй, хозяин! Я тут всю жизнь прожила. Помоги вернуть нашему району нормальную жизнь!"
    );
    return;
  }
}

document.querySelectorAll(".nav-item").forEach(button => {
  button.addEventListener("click", () => {
    showPanel(button.dataset.panel);
  });
});

document.getElementById("homeView").addEventListener("click", () => {
  scale = 1;
  offsetX = 0;
  offsetY = 0;
  drawWorld();
});

canvas.addEventListener("click", handleCanvasClick);
window.addEventListener("resize", resizeCanvas);

loadGame();
showPanel("district");
resizeCanvas();

setTimeout(() => {
  openDialog(
    "Баба Зина",
    "Ну здравствуй, новый хозяин! Купил наш район за рубль? Теперь помоги вернуть ему жизнь!"
  );
}, 700);
