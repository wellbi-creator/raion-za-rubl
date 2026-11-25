
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const balanceElement = document.getElementById("balance");
const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modal-title");
const modalText = document.getElementById("modal-text");

const state = {
  balance: 1000000,
  reputation: 0,
  chapter: 1,
  player: { x: 0, y: 0 },
  baba: { x: 0, y: 0 },
  selected: null
};

function saveGame() {
  localStorage.setItem("raion-save", JSON.stringify(state));
}

function loadGame() {
  const saved = localStorage.getItem("raion-save");

  if (saved) {
    try {
      const data = JSON.parse(saved);
      state.balance = data.balance ?? 1000000;
      state.reputation = data.reputation ?? 0;
      state.chapter = data.chapter ?? 1;
    } catch (error) {
      console.log("Не удалось загрузить сохранение");
    }
  }

  updateInterface();
}

function updateInterface() {
  if (balanceElement) {
    balanceElement.textContent =
      state.balance.toLocaleString("ru-RU") + " ₽";
  }
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
    x: w / 2 + (x - y) * 42,
    y: h / 2 + (x + y) * 21
  };
}

function drawDiamond(x, y, color) {
  const p = iso(x, y);

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(p.x, p.y - 21);
  ctx.lineTo(p.x + 42, p.y);
  ctx.lineTo(p.x, p.y + 21);
  ctx.lineTo(p.x - 42, p.y);
  ctx.closePath();
  ctx.fill();
}

function drawHouse(x, y) {
  const p = iso(x, y);

  // Основание
  ctx.fillStyle = "#b7a18a";
  ctx.fillRect(p.x - 39, p.y - 57, 78, 55);

  // Стены
  ctx.fillStyle = "#d7c5a7";
  ctx.beginPath();
  ctx.moveTo(p.x - 39, p.y - 57);
  ctx.lineTo(p.x, p.y - 78);
  ctx.lineTo(p.x + 39, p.y - 57);
  ctx.lineTo(p.x, p.y - 36);
  ctx.closePath();
  ctx.fill();

  // Крыша
  ctx.fillStyle = "#874b3f";
  ctx.beginPath();
  ctx.moveTo(p.x - 45, p.y - 58);
  ctx.lineTo(p.x, p.y - 91);
  ctx.lineTo(p.x + 45, p.y - 58);
  ctx.lineTo(p.x, p.y - 33);
  ctx.closePath();
  ctx.fill();

  // Дверь
  ctx.fillStyle = "#684631";
  ctx.fillRect(p.x - 8, p.y - 31, 16, 29);

  // Окна
  ctx.fillStyle = "#8fc4d1";
  ctx.fillRect(p.x - 29, p.y - 47, 14, 13);
  ctx.fillRect(p.x + 15, p.y - 47, 14, 13);
}

function drawTree(x, y) {
  const p = iso(x, y);

  ctx.fillStyle = "#76533a";
  ctx.fillRect(p.x - 4, p.y - 22, 8, 25);

  ctx.fillStyle = "#347a45";
  ctx.beginPath();
  ctx.arc(p.x, p.y - 32, 18, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#4b9855";
  ctx.beginPath();
  ctx.arc(p.x - 8, p.y - 40, 10, 0, Math.PI * 2);
  ctx.fill();
}

function drawPerson(x, y, color, label) {
  const p = iso(x, y);

  ctx.fillStyle = "rgba(0,0,0,0.15)";
  ctx.beginPath();
  ctx.ellipse(p.x, p.y + 2, 10, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = color;
  ctx.fillRect(p.x - 7, p.y - 20, 14, 19);

  ctx.fillStyle = "#e7b58b";
  ctx.beginPath();
  ctx.arc(p.x, p.y - 26, 8, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#fff";
  ctx.font = "11px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(label, p.x, p.y - 39);
}

function drawWorld() {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;

  ctx.clearRect(0, 0, w, h);

  // Земля
  ctx.fillStyle = "#83a96c";
  ctx.fillRect(0, 0, w, h);

  // Изометрическая сетка земли
  for (let x = -5; x <= 5; x++) {
    for (let y = -5; y <= 5; y++) {
      drawDiamond(x, y, (x + y) % 2 === 0 ? "#8caf75" : "#83a96c");
    }
  }

  // Дорога
  ctx.fillStyle = "#777b78";
  ctx.beginPath();

  const road1 = iso(-5, 2);
  const road2 = iso(5, 2);
  const road3 = iso(5, 3);
  const road4 = iso(-5, 3);

  ctx.moveTo(road1.x, road1.y);
  ctx.lineTo(road2.x, road2.y);
  ctx.lineTo(road3.x, road3.y);
  ctx.lineTo(road4.x, road4.y);
  ctx.closePath();
  ctx.fill();

  // Двор
  drawDiamond(-1, 0, "#b5a17c");
  drawDiamond(0, 0, "#b5a17c");
  drawDiamond(1, 0, "#b5a17c");

  // Дом
  drawHouse(0, 0);

  // Деревья
  drawTree(-2, -1);
  drawTree(2, -1);
  drawTree(-2, 1);
  drawTree(3, 0);

  // Персонажи
  drawPerson(-1, 1, "#466d9c", "Вы");
  drawPerson(1, 1, "#a94d45", "Баба Зина");

  // Подсказка
  ctx.fillStyle = "rgba(20,35,25,0.7)";
  ctx.font = "12px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Нажмите на дом или Бабу Зину", w / 2, h - 18);
}

function openDialog(title, message) {
  if (!modal) {
    alert(title + "\n\n" + message);
    return;
  }

  if (modalTitle) modalTitle.textContent = title;
  if (modalText) modalText.textContent = message;

  modal.classList.add("active");
  modal.style.display = "flex";
}

function closeDialog() {
  if (!modal) return;

  modal.classList.remove("active");
  modal.style.display = "none";
}

function handleCanvasClick(event) {
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  const w = canvas.clientWidth;
  const h = canvas.clientHeight;

  const houseX = w / 2;
  const houseY = h / 2 - 55;

  const babaX = w / 2 + 42;
  const babaY = h / 2 + 5;

  if (
    Math.abs(x - houseX) < 65 &&
    Math.abs(y - houseY) < 65
  ) {
    openDialog(
      "Старый дом",
      "Дом давно не ремонтировали. Нужно восстановить электричество, воду, отопление и канализацию."
    );
    return;
  }

  if (
    Math.abs(x - babaX) < 55 &&
    Math.abs(y - babaY) < 55
  ) {
    openDialog(
      "Баба Зина",
      "Ой, здравствуй, хозяин! Ну что, будем наш район поднимать? Тут всё разваливается, а жить хочется по-человечески!"
    );
  }
}

function showPanel(name) {
  const messages = {
    district: [
      "Район",
      "Здесь будет управление районом, строительство и благоустройство."
    ],
    notebook: [
      "Тетрадка",
      "Здесь появятся задания и история района."
    ],
    houses: [
      "Дома",
      "Здесь можно будет строить и улучшать жилые дома."
    ],
    finance: [
      "Финансы",
      "Баланс: " + state.balance.toLocaleString("ru-RU") + " ₽"
    ],
    residents: [
      "Жители",
      "Пока в районе живёт только Баба Зина."
    ]
  };

  const data = messages[name];

  if (data) openDialog(data[0], data[1]);
}

function setupNavigation() {
  document.querySelectorAll("[data-page]").forEach(button => {
    button.addEventListener("click", () => {
      showPanel(button.dataset.page);
    });
  });
}

function startGame() {
  loadGame();

  canvas.addEventListener("click", handleCanvasClick);

  window.addEventListener("resize", resizeCanvas);

  setupNavigation();
  resizeCanvas();

  // Стартовый диалог
  setTimeout(() => {
    openDialog(
      "Баба Зина",
      "Ну здравствуй, новый хозяин! Купил наш район за рубль? Теперь помоги вернуть ему жизнь!"
    );
  }, 500);
}

startGame();
