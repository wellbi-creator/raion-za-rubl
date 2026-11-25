
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const balance = document.getElementById("balance");
const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modalTitle");
const modalText = document.getElementById("modalText");
const modalAvatar = document.getElementById("modalAvatar");
const panelHeading = document.getElementById("panelHeading");
const panelContent = document.getElementById("panelContent");
const modalClose = document.getElementById("modalClose");
const modalAction = document.getElementById("modalAction");

const defaultState = {
  balance: 1000000,
  reputation: 0,
  gameMinutes: 8 * 60,
  lastTime: Date.now(),
  repairs: {
    wiring: false,
    panel: false,
    sockets: false,
    lighting: false,
    water: false,
    heating: false,
    sewage: false,
    rooms: false,
    furniture: false
  }
};

let state = structuredClone(defaultState);
let modalActionHandler = () => closeDialog();
let currentPanel = "district";
let animationTime = 0;
let lastFrame = 0;
let saveTimer = 0;

const repairItems = [
  { id: "wiring", name: "Замена проводки", icon: "⚡", price: 120000, description: "Новая электропроводка во всём доме" },
  { id: "panel", name: "Электрощиток", icon: "🔌", price: 45000, description: "Установка нового электрощитка" },
  { id: "sockets", name: "Розетки", icon: "🔋", price: 25000, description: "Замена старых розеток" },
  { id: "lighting", name: "Освещение", icon: "💡", price: 60000, description: "Новые светильники и лампы" },
  { id: "water", name: "Водопровод", icon: "💧", price: 110000, description: "Восстановление подачи воды" },
  { id: "heating", name: "Отопление", icon: "🔥", price: 130000, description: "Ремонт системы отопления" },
  { id: "sewage", name: "Канализация", icon: "🚰", price: 90000, description: "Восстановление канализации" },
  { id: "rooms", name: "Ремонт помещений", icon: "🧱", price: 160000, description: "Ремонт стен, пола и потолка" },
  { id: "furniture", name: "Новая мебель", icon: "🛋️", price: 100000, description: "Покупка мебели для дома" }
];

// ВРЕМЯ ИГРЫ

function getClock() {
  const minutes = Math.floor(state.gameMinutes) % 1440;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  return {
    hours,
    minutes: mins,
    text: String(hours).padStart(2, "0") + ":" +
      String(mins).padStart(2, "0")
  };
}

function getTimeOfDay() {
  const hour = getClock().hours;

  if (hour >= 6 && hour < 9) return "Рассвет";
  if (hour >= 9 && hour < 17) return "День";
  if (hour >= 17 && hour < 20) return "Закат";
  return "Ночь";
}

function getNightAmount() {
  const hour = getClock().hours;

  if (hour >= 20 || hour < 5) return 0.65;
  if (hour >= 5 && hour < 7) return 0.65 * (7 - hour) / 2;
  if (hour >= 18 && hour < 20) return 0.65 * (hour - 18) / 2;

  return 0;
}

function updateGameTime(delta) {
  // 5 реальных секунд = 1 игровая минута
  state.gameMinutes += delta / 5000;

  if (state.gameMinutes >= 1440) {
    state.gameMinutes %= 1440;
  }
}

// СОХРАНЕНИЕ

function saveGame() {
  state.lastTime = Date.now();
  localStorage.setItem("raion-save", JSON.stringify(state));
}

function loadGame() {
  try {
    const saved = JSON.parse(localStorage.getItem("raion-save"));

    if (saved) {
      state = {
        ...defaultState,
        ...saved,
        repairs: {
          ...defaultState.repairs,
          ...(saved.repairs || {})
        }
      };

      // Продвижение игрового времени, пока игра была закрыта
      if (saved.lastTime) {
        const offlineTime = Math.max(
          0,
          Date.now() - saved.lastTime
        );

        state.gameMinutes += offlineTime / 5000;
        state.gameMinutes %= 1440;
      }
    }
  } catch (e) {
    state = structuredClone(defaultState);
  }

  state.lastTime = Date.now();
  updateBalance();
}

function updateBalance() {
  balance.textContent =
    state.balance.toLocaleString("ru-RU") + " ₽";
}

// ДИАЛОГИ

function openDialog(
  title,
  message,
  avatar = "👵🏻",
  buttonText = "Понятно",
  action = closeDialog
) {
  modalTitle.textContent = title;
  modalText.textContent = message;
  modalAvatar.textContent = avatar;
  modalAction.textContent = buttonText;
  modalActionHandler = action;
  modal.classList.remove("hidden");
}

function closeDialog() {
  modal.classList.add("hidden");
}

modalClose.addEventListener("click", closeDialog);
modalAction.addEventListener("click", () => modalActionHandler());

modal.addEventListener("click", e => {
  if (e.target === modal) closeDialog();
});

// РЕМОНТ

function completedRepairs() {
  return repairItems.filter(
    item => state.repairs[item.id]
  ).length;
}

function electricityRestored() {
  return [
    "wiring",
    "panel",
    "sockets",
    "lighting"
  ].every(id => state.repairs[id]);
}

function allUtilitiesRestored() {
  return [
    "wiring",
    "panel",
    "sockets",
    "lighting",
    "water",
    "heating",
    "sewage"
  ].every(id => state.repairs[id]);
}

function renderRepairPanel() {
  const itemsHTML = repairItems.map(item => {
    const done = state.repairs[item.id];

    return `
      <div class="info-card">
        <h3>${item.icon} ${item.name}</h3>
        <p>${item.description}</p>
        <p><b>${item.price.toLocaleString("ru-RU")} ₽</b></p>
        ${
          done
            ? `<p style="color:#4b9b5b"><b>✓ Выполнено</b></p>`
            : `<button class="repair-button"
                data-repair="${item.id}"
                style="padding:10px 14px;border:0;border-radius:10px;background:#426d4b;color:white;font-weight:bold">
                Купить ремонт
              </button>`
        }
      </div>
    `;
  }).join("");

  panelHeading.textContent = "Ремонт дома";

  panelContent.innerHTML = `
    <div class="info-card">
      <h3>🏚️ Старый дом</h3>
      <p>Восстанови дом и верни в него жизнь!</p>
      <p>Выполнено работ: ${completedRepairs()} из ${repairItems.length}</p>
      <p>Бюджет: ${state.balance.toLocaleString("ru-RU")} ₽</p>
    </div>
    ${itemsHTML}
  `;
}

function buyRepair(id) {
  const item = repairItems.find(x => x.id === id);

  if (!item || state.repairs[id]) return;

  if (state.balance < item.price) {
    openDialog(
      "Не хватает денег",
      `Для этой работы нужно ${item.price.toLocaleString("ru-RU")} ₽. У тебя сейчас ${state.balance.toLocaleString("ru-RU")} ₽.`,
      "💸"
    );
    return;
  }

  state.balance -= item.price;
  state.repairs[id] = true;

  let bonusReceived = false;

  if (allUtilitiesRestored() && state.reputation === 0) {
    state.reputation = 10;
    state.balance += 100000;
    bonusReceived = true;
  }

  saveGame();
  updateBalance();
  drawWorld();

  if (currentPanel === "repair") {
    renderRepairPanel();
  }

  if (bonusReceived) {
    openDialog(
      "Первый успех!",
      "Все коммуникации восстановлены! Баба Зина очень рада. Район получил 10 очков репутации и премию 100 000 ₽!",
      "👵🏻"
    );
    return;
  }

  openDialog(
    "Работа выполнена!",
    `${item.name}: готово! Дом постепенно становится лучше.`,
    "🔨"
  );
}

// РАЗДЕЛЫ ИГРЫ

const panels = {
  district: {
    title: "Район",
    html: () => `
      <div class="info-card">
        <h3>🏚️ Заброшенный район</h3>
        <p>Ты купил этот район всего за один рубль.</p>
        <p>Теперь предстоит вернуть ему жизнь!</p>
      </div>
      <div class="info-card">
        <h3>Состояние района</h3>
        <p>🕒 Время: ${getClock().text}</p>
        <p>🌤️ Период: ${getTimeOfDay()}</p>
        <p>⚡ Электричество: ${electricityRestored() ? "восстановлено" : "отключено"}</p>
        <p>💧 Вода: ${state.repairs.water ? "восстановлена" : "отключена"}</p>
        <p>🔥 Отопление: ${state.repairs.heating ? "восстановлено" : "отключено"}</p>
        <p>🚰 Канализация: ${state.repairs.sewage ? "восстановлена" : "отключена"}</p>
        <p>⭐ Репутация: ${state.reputation}</p>
      </div>`
  },

  quests: {
    title: "Тетрадка",
    html: () => `
      <div class="info-card">
        <h3>📖 Задание №1. Новый хозяин</h3>
        <p>Познакомься с Бабой Зиной и осмотри старый дом.</p>
        <p>Статус: ${completedRepairs() > 0 ? "начато" : "ожидает выполнения"}.</p>
      </div>
      <div class="info-card">
        <h3>🔨 Задание №2. Возвращаем жизнь</h3>
        <p>Восстанови электричество, воду, отопление и канализацию.</p>
        <p>Прогресс: ${completedRepairs()} из ${repairItems.length}</p>
        <p>${allUtilitiesRestored() ? "✓ Коммуникации восстановлены!" : "Задание выполняется"}</p>
      </div>
      <div class="info-card">
        <h3>🛋️ Задание №3. Домашний уют</h3>
        <p>Отремонтируй комнаты и купи новую мебель.</p>
        <p>Статус: ${state.repairs.rooms && state.repairs.furniture ? "выполнено" : "ожидает выполнения"}.</p>
      </div>`
  },

  houses: {
    title: "Дома",
    html: () => `
      <div class="info-card">
        <h3>🏠 Старый дом</h3>
        <p>Первый дом района.</p>
        <p>Ремонт: ${completedRepairs()} из ${repairItems.length} работ.</p>
        <button data-open-repair
          style="padding:10px 14px;border:0;border-radius:10px;background:#426d4b;color:white">
          Открыть ремонт
        </button>
      </div>`
  },

  finance: {
    title: "Финансы",
    html: () => `
      <div class="info-card">
        <h3>💰 Бюджет района</h3>
        <p>Баланс: ${state.balance.toLocaleString("ru-RU")} ₽</p>
        <p>Репутация: ${state.reputation}</p>
        <p>Выполнено работ: ${completedRepairs()}</p>
      </div>`
  },

  residents: {
    title: "Жители",
    html: () => `
      <div class="info-card">
        <h3>👵🏻 Баба Зина</h3>
        <p>Первая жительница района.</p>
        <p>Настроение: ${allUtilitiesRestored() ? "счастлива" : "ждёт перемен"}.</p>
        <p>Сейчас: ${getTimeOfDay().toLowerCase()}.</p>
      </div>`
  }
};

function showPanel(name) {
  currentPanel = name;

  if (name === "repair") {
    renderRepairPanel();
  } else {
    const panel = panels[name];
    if (!panel) return;

    panelHeading.textContent = panel.title;
    panelContent.innerHTML = panel.html();
  }

  document.querySelectorAll(".nav-item").forEach(button => {
    button.classList.toggle(
      "active",
      button.dataset.panel === name
    );
  });
}

document.querySelectorAll(".nav-item").forEach(button => {
  button.addEventListener("click", () => {
    showPanel(button.dataset.panel);
  });
});

panelContent.addEventListener("click", e => {
  const repairButton = e.target.closest("[data-repair]");

  if (repairButton) {
    buyRepair(repairButton.dataset.repair);
    return;
  }

  if (e.target.closest("[data-open-repair]")) {
    showPanel("repair");
  }
});

// ИЗОМЕТРИЧЕСКАЯ КАРТА

function iso(x, y) {
  return {
    x: canvas.clientWidth / 2 + (x - y) * 38,
    y: canvas.clientHeight / 2 + (x + y) * 19
  };
}

function diamond(x, y, color) {
  const p = iso(x, y);

  ctx.beginPath();
  ctx.moveTo(p.x, p.y - 19);
  ctx.lineTo(p.x + 38, p.y);
  ctx.lineTo(p.x, p.y + 19);
  ctx.lineTo(p.x - 38, p.y);
  ctx.closePath();

  ctx.fillStyle = color;
  ctx.fill();
}

function tree(x, y) {
  const p = iso(x, y);

  ctx.fillStyle = "#765036";
  ctx.fillRect(p.x - 4, p.y - 25, 8, 28);

  ctx.fillStyle = "#28613a";
  ctx.beginPath();
  ctx.arc(p.x, p.y - 37, 19, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#43894d";
  ctx.beginPath();
  ctx.arc(p.x - 8, p.y - 44, 11, 0, Math.PI * 2);
  ctx.fill();
}

// ДОМ

function house(x, y) {
  const p = iso(x, y);

  const repaired = state.repairs.rooms;
  const electricity = electricityRestored();

  // Боковая стена
  ctx.beginPath();
  ctx.moveTo(p.x, p.y - 65);
  ctx.lineTo(p.x + 43, p.y - 85);
  ctx.lineTo(p.x + 43, p.y - 27);
  ctx.lineTo(p.x, p.y - 7);
  ctx.closePath();
  ctx.fillStyle = repaired ? "#c6ad8b" : "#927b63";
  ctx.fill();

  // Передняя стена
  ctx.fillStyle = repaired ? "#e5d4b5" : "#b69d7e";
  ctx.fillRect(p.x - 43, p.y - 65, 43, 58);

  ctx.strokeStyle = "#594737";
  ctx.lineWidth = 2;
  ctx.strokeRect(p.x - 43, p.y - 65, 43, 58);

  // Фасад
  if (!repaired) {
    ctx.strokeStyle = "#8d745a";
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.moveTo(p.x - 38, p.y - 20);
    ctx.lineTo(p.x - 22, p.y - 31);
    ctx.moveTo(p.x - 10, p.y - 55);
    ctx.lineTo(p.x - 4, p.y - 43);
    ctx.stroke();
  } else {
    ctx.strokeStyle = "#d5bd99";
    ctx.lineWidth = 2;

    for (let i = 1; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(p.x - 43, p.y - 65 + i * 14);
      ctx.lineTo(p.x, p.y - 65 + i * 14);
      ctx.stroke();
    }
  }

  // Крыша
  ctx.beginPath();
  ctx.moveTo(p.x - 51, p.y - 65);
  ctx.lineTo(p.x, p.y - 110);
  ctx.lineTo(p.x + 51, p.y - 85);
  ctx.lineTo(p.x, p.y - 38);
  ctx.closePath();
  ctx.fillStyle = repaired ? "#a94f40" : "#75483e";
  ctx.fill();

  ctx.strokeStyle = "#55352e";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Полосы крыши
  ctx.strokeStyle = repaired ? "#c47760" : "#986354";
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.moveTo(p.x - 34, p.y - 67);
  ctx.lineTo(p.x + 17, p.y - 91);
  ctx.moveTo(p.x - 17, p.y - 50);
  ctx.lineTo(p.x + 34, p.y - 75);
  ctx.stroke();

  // Окна
  function drawWindow(wx, wy) {
    ctx.fillStyle = "#493d32";
    ctx.fillRect(wx - 2, wy - 2, 20, 19);

    ctx.fillStyle = electricity ? "#ffe7a0" : "#648b94";
    ctx.fillRect(wx, wy, 16, 15);

    ctx.strokeStyle = "#f0e0c4";
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(wx + 8, wy);
    ctx.lineTo(wx + 8, wy + 15);
    ctx.moveTo(wx, wy + 7);
    ctx.lineTo(wx + 16, wy + 7);
    ctx.stroke();
  }

  drawWindow(p.x - 35, p.y - 57);
  drawWindow(p.x + 16, p.y - 76);

  // Дверь
  ctx.fillStyle = "#60412d";
  ctx.fillRect(p.x - 13, p.y - 39, 18, 32);

  ctx.fillStyle = repaired ? "#9b7048" : "#765137";
  ctx.fillRect(p.x - 10, p.y - 36, 12, 26);

  ctx.fillStyle = "#e8c36f";
  ctx.beginPath();
  ctx.arc(p.x - 1, p.y - 23, 2, 0, Math.PI * 2);
  ctx.fill();

  // Крыльцо
  ctx.fillStyle = "#80634b";
  ctx.beginPath();
  ctx.moveTo(p.x - 18, p.y - 7);
  ctx.lineTo(p.x + 12, p.y - 7);
  ctx.lineTo(p.x + 20, p.y + 2);
  ctx.lineTo(p.x - 10, p.y + 2);
  ctx.closePath();
  ctx.fill();

  // Дымоход
  ctx.fillStyle = "#75483e";
  ctx.fillRect(p.x + 23, p.y - 112, 12, 29);

  ctx.fillStyle = "#593c34";
  ctx.fillRect(p.x + 21, p.y - 114, 16, 5);

  // Цветы после покупки мебели
  if (state.repairs.furniture) {
    ctx.fillStyle = "#a45d43";
    ctx.fillRect(p.x - 42, p.y - 11, 9, 8);
    ctx.fillRect(p.x + 23, p.y - 11, 9, 8);

    ctx.fillStyle = "#43894d";
    ctx.beginPath();
    ctx.arc(p.x - 38, p.y - 16, 6, 0, Math.PI * 2);
    ctx.arc(p.x + 27, p.y - 16, 6, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ЖИТЕЛИ С АНИМАЦИЕЙ

function getBabaPosition() {
  return {
    x: 1 + Math.sin(animationTime * 0.0007) * 0.65,
    y: 2 + Math.cos(animationTime * 0.0005) * 0.3
  };
}

function getPlayerPosition() {
  return {
    x: -1 + Math.sin(animationTime * 0.0005) * 0.35,
    y: 2
  };
}

function person(x, y, color, name, moving = false) {
  const p = iso(x, y);

  const step = moving
    ? Math.sin(animationTime * 0.008) * 3
    : 0;

  // Тень
  ctx.fillStyle = "rgba(0,0,0,0.15)";
  ctx.beginPath();
  ctx.ellipse(p.x, p.y, 10, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Ноги
  ctx.strokeStyle = "#39332e";
  ctx.lineWidth = 4;

  ctx.beginPath();
  ctx.moveTo(p.x - 3, p.y - 8);
  ctx.lineTo(p.x - 4 - step, p.y);
  ctx.moveTo(p.x + 3, p.y - 8);
  ctx.lineTo(p.x + 4 + step, p.y);
  ctx.stroke();

  // Тело
  ctx.fillStyle = color;
  ctx.fillRect(p.x - 8, p.y - 22, 16, 17);

  // Голова
  ctx.fillStyle = "#e6b58e";
  ctx.beginPath();
  ctx.arc(p.x, p.y - 29, 8, 0, Math.PI * 2);
  ctx.fill();

  // Волосы Бабы Зины
  if (name === "Баба Зина") {
    ctx.fillStyle = "#e2e0d5";
    ctx.beginPath();
    ctx.arc(p.x, p.y - 33, 8, Math.PI, Math.PI * 2);
    ctx.fill();
  }

  // Имя
  ctx.fillStyle = "#fff";
  ctx.font = "11px sans-serif";
  ctx.textAlign = "center";
  ctx.shadowColor = "#333";
  ctx.shadowBlur = 4;
  ctx.fillText(name, p.x, p.y - 43);
  ctx.shadowBlur = 0;
}

// НЕБО И ОСВЕЩЕНИЕ

function drawSkyOverlay() {
  const darkness = getNightAmount();

  if (darkness <= 0) return;

  const w = canvas.clientWidth;
  const h = canvas.clientHeight;

  ctx.fillStyle = `rgba(15, 24, 53, ${darkness})`;
  ctx.fillRect(0, 0, w, h);

  // Лунное свечение
  const moonX = w - 55;
  const moonY = 48;

  ctx.fillStyle = "#f4edc9";
  ctx.beginPath();
  ctx.arc(moonX, moonY, 13, 0, Math.PI * 2);
  ctx.fill();

  // Звёзды
  ctx.fillStyle = "rgba(255,255,230,0.85)";

  for (let i = 0; i < 18; i++) {
    const sx = (i * 73 + 31) % Math.max(w, 1);
    const sy = (i * 37 + 17) % Math.max(100, h * 0.55);

    ctx.beginPath();
    ctx.arc(sx, sy, i % 3 === 0 ? 2 : 1, 0, Math.PI * 2);
    ctx.fill();
  }

  // Свет окон поверх ночного затемнения
  if (electricityRestored()) {
    const p = iso(0, 0);

    ctx.fillStyle = "rgba(255, 210, 100, 0.95)";
    ctx.fillRect(p.x - 35, p.y - 57, 16, 15);
    ctx.fillRect(p.x + 16, p.y - 76, 16, 15);
  }
}

function drawTimeLabel() {
  const clock = getClock();
  const w = canvas.clientWidth;

  ctx.fillStyle = "rgba(25,35,30,0.75)";
  ctx.beginPath();
  ctx.roundRect(w - 115, 12, 103, 35, 9);
  ctx.fill();

  ctx.fillStyle = "#fff";
  ctx.font = "bold 15px sans-serif";
  ctx.textAlign = "center";

  const icon = getTimeOfDay() === "Ночь" ? "🌙" :
    getTimeOfDay() === "Закат" ? "🌇" :
    getTimeOfDay() === "Рассвет" ? "🌅" : "☀️";

  ctx.fillText(
    icon + " " + clock.text,
    w - 63,
    35
  );
}

// ПОЛНАЯ ОТРИСОВКА МИРА

function drawWorld() {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;

  if (!w || !h) return;

  ctx.clearRect(0, 0, w, h);

  ctx.fillStyle = "#87ad76";
  ctx.fillRect(0, 0, w, h);

  // Земля
  for (let x = -7; x <= 7; x++) {
    for (let y = -7; y <= 7; y++) {
      diamond(
        x,
        y,
        (x + y) % 2 ? "#86ad73" : "#91b77e"
      );
    }
  }

  // Дорога
  const a = iso(-7, 3);
  const b = iso(7, 3);
  const c = iso(7, 4.2);
  const d = iso(-7, 4.2);

  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.lineTo(c.x, c.y);
  ctx.lineTo(d.x, d.y);
  ctx.closePath();
  ctx.fillStyle = "#626b68";
  ctx.fill();

  // Двор
  diamond(-1, 0, "#b9a17b");
  diamond(0, 0, "#b9a17b");
  diamond(1, 0, "#b9a17b");

  // Деревья
  tree(-3, -2);
  tree(3, -2);
  tree(-3, 1);
  tree(3, 1);
  tree(-4, 3);

  // Дом
  house(0, 0);

  // Жители
  const player = getPlayerPosition();
  const baba = getBabaPosition();

  person(
    player.x,
    player.y,
    "#456e9b",
    "Вы",
    true
  );

  person(
    baba.x,
    baba.y,
    "#a94d45",
    "Баба Зина",
    true
  );

  // Ночь поверх мира
  drawSkyOverlay();

  // Часы поверх затемнения
  drawTimeLabel();
}

// АНИМАЦИЯ ИГРЫ

function gameLoop(timestamp) {
  if (!lastFrame) lastFrame = timestamp;

  const delta = Math.min(timestamp - lastFrame, 1000);
  lastFrame = timestamp;

  animationTime += delta;

  updateGameTime(delta);

  saveTimer += delta;

  if (saveTimer >= 10000) {
    saveGame();
    saveTimer = 0;
  }

  drawWorld();

  requestAnimationFrame(gameLoop);
}

// РАЗМЕР КАРТЫ

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;

  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  drawWorld();
}

// ВЗАИМОДЕЙСТВИЕ С ОБЪЕКТАМИ

canvas.addEventListener("click", event => {
  const rect = canvas.getBoundingClientRect();

  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  const h = iso(0, 0);
  const baba = getBabaPosition();
  const b = iso(baba.x, baba.y);

  if (
    Math.abs(x - h.x) < 55 &&
    Math.abs(y - (h.y - 70)) < 65
  ) {
    openDialog(
      "Старый дом",
      "Дом требует ремонта. Восстанови коммуникации, а затем приведи в порядок комнаты и мебель.",
      "🏚️",
      "Перейти к ремонту",
      () => {
        closeDialog();
        showPanel("repair");
      }
    );

    return;
  }

  if (
    Math.abs(x - b.x) < 40 &&
    Math.abs(y - (b.y - 20)) < 40
  ) {
    openDialog(
      "Баба Зина",
      allUtilitiesRestored()
        ? "Спасибо тебе, хозяин! В доме снова есть свет, вода и тепло. Теперь можно заняться уютом!"
        : "Здравствуй, хозяин! Сначала восстанови электричество, воду, отопление и канализацию. Без этого нам никак!",
      "👵🏻",
      "Открыть задания",
      () => {
        closeDialog();
        showPanel("quests");
      }
    );
  }
});

// ЗАПУСК

document.getElementById("homeView").addEventListener("click", () => {
  resizeCanvas();
});

window.addEventListener("resize", resizeCanvas);

window.addEventListener("beforeunload", saveGame);

loadGame();
showPanel("district");
resizeCanvas();

requestAnimationFrame(gameLoop);

setTimeout(() => {
  openDialog(
    "Баба Зина",
    "Ну здравствуй, новый хозяин! Купил наш район за рубль? Теперь помоги вернуть ему жизнь!"
  );
}, 500);
