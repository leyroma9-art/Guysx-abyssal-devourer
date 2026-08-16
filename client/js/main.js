// main.js — главный цикл, ввод, камера + мобильное управление

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let width, height;
let cameraX = 0;
let cameraY = 0;

// Ввод
const keys = {
  left: false,
  right: false,
  jump: false
};

function resize() {
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width;
  canvas.height = height;
}
window.addEventListener('resize', resize);
resize();

// ===== Клавиатура =====
window.addEventListener('keydown', (e) => {
  if (e.code === 'KeyA' || e.code === 'ArrowLeft') keys.left = true;
  if (e.code === 'KeyD' || e.code === 'ArrowRight') keys.right = true;
  if (e.code === 'Space' || e.code === 'KeyW' || e.code === 'ArrowUp') {
    keys.jump = true;
    e.preventDefault();
  }

  // Чат
  if (e.code === 'Enter') {
    const input = document.getElementById('chatInput');
    if (document.activeElement === input) {
      sendChat(input.value);
      input.value = '';
      input.blur();
    } else {
      input.focus();
    }
  }
});

window.addEventListener('keyup', (e) => {
  if (e.code === 'KeyA' || e.code === 'ArrowLeft') keys.left = false;
  if (e.code === 'KeyD' || e.code === 'ArrowRight') keys.right = false;
  if (e.code === 'Space' || e.code === 'KeyW' || e.code === 'ArrowUp') keys.jump = false;
});

// ===== Мобильное управление =====
const mobileToggle = document.getElementById('mobileToggle');
const mobileControls = document.getElementById('mobileControls');
const btnLeft = document.getElementById('btnLeft');
const btnRight = document.getElementById('btnRight');
const btnJump = document.getElementById('btnJump');

let mobileEnabled = false;

mobileToggle.addEventListener('click', () => {
  mobileEnabled = !mobileEnabled;
  mobileToggle.classList.toggle('active', mobileEnabled);
  mobileControls.classList.toggle('hidden', !mobileEnabled);
});

// Универсальная функция для touch/mouse
function bindMobileButton(btn, keyName) {
  const start = (e) => {
    e.preventDefault();
    keys[keyName] = true;
    btn.classList.add('pressed');
  };
  const end = (e) => {
    e.preventDefault();
    keys[keyName] = false;
    btn.classList.remove('pressed');
  };

  btn.addEventListener('touchstart', start, { passive: false });
  btn.addEventListener('touchend', end, { passive: false });
  btn.addEventListener('touchcancel', end, { passive: false });
  btn.addEventListener('mousedown', start);
  btn.addEventListener('mouseup', end);
  btn.addEventListener('mouseleave', end);
}

bindMobileButton(btnLeft, 'left');
bindMobileButton(btnRight, 'right');
bindMobileButton(btnJump, 'jump');

// Предотвращаем скролл страницы на мобилках во время игры
document.addEventListener('touchmove', (e) => {
  if (mobileEnabled && !e.target.closest('#chat')) {
    e.preventDefault();
  }
}, { passive: false });

// ===== Кнопка входа =====
document.getElementById('joinBtn').addEventListener('click', () => {
  const name = document.getElementById('playerName').value.trim() || 'Hunter';
  const classType = document.getElementById('classSelect').value;
  const room = document.getElementById('roomId').value.trim();

  joinRoom(name, classType, room);
});

// ===== Игровой цикл =====
function gameLoop() {
  // Отправляем ввод на сервер
  if (myId) {
    sendInput({
      left: keys.left,
      right: keys.right,
      jump: keys.jump
    });
  }

  // Очистка
  ctx.fillStyle = '#0d0d18';
  ctx.fillRect(0, 0, width, height);

  // Камера следует за игроком (как в Terraria)
  if (myId && players[myId]) {
    const me = players[myId];
    cameraX = me.x - width / 2;
    cameraY = me.y - height / 2 - 80;

    // Обновляем HP бар
    const hpPercent = me.hp / me.maxHp;
    document.getElementById('hpFill').style.width = (hpPercent * 100) + '%';
    document.getElementById('hpText').textContent = `${Math.ceil(me.hp)} / ${me.maxHp}`;
  }

  ctx.save();
  ctx.translate(-cameraX, -cameraY);

  // ===== Фон / арена =====
  // Земля
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 520, 1200, 200);

  // Линия горизонта
  ctx.strokeStyle = '#2a2a45';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 520);
  ctx.lineTo(1200, 520);
  ctx.stroke();

  // Декоративные столбы
  ctx.fillStyle = '#252540';
  for (let i = 0; i < 6; i++) {
    ctx.fillRect(100 + i * 200, 400, 40, 120);
  }

  // Рисуем всех игроков
  for (const id in players) {
    drawPlayer(ctx, players[id], id === myId);
  }

  ctx.restore();

  // Список игроков слева
  updatePlayersList();

  requestAnimationFrame(gameLoop);
}

function updatePlayersList() {
  const list = document.getElementById('playersList');
  let html = '';
  for (const id in players) {
    const p = players[id];
    const color = classColors[p.classType] || '#fff';
    html += `<div style="color:${color}">${p.name} <span style="opacity:0.6">(${classNames[p.classType]})</span></div>`;
  }
  list.innerHTML = html;
}

// Запуск
gameLoop();
