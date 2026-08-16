// network.js — работа с Socket.io

const socket = io();

let myId = null;
let players = {};
let roomId = null;

function joinRoom(name, classType, room) {
  socket.emit('joinRoom', {
    name,
    classType,
    roomId: room || 'default'
  });
}

socket.on('roomJoined', (data) => {
  myId = data.yourId;
  players = data.players;
  roomId = data.roomId;

  console.log('Присоединился к комнате:', roomId);
  // Переключаем экран
  document.getElementById('menu').classList.add('hidden');
  document.getElementById('game').classList.remove('hidden');

  // Фокус на canvas
  document.getElementById('canvas').focus();
});

socket.on('playerJoined', (player) => {
  players[player.id] = player;
  addChatMessage('Система', `${player.name} присоединился (${player.classType})`);
});

socket.on('playerLeft', (id) => {
  if (players[id]) {
    addChatMessage('Система', `${players[id].name} вышел`);
    delete players[id];
  }
});

socket.on('gameState', (state) => {
  // Обновляем позиции игроков с сервера
  for (const id in state.players) {
    if (players[id]) {
      // Плавная интерполяция можно добавить позже
      players[id].x = state.players[id].x;
      players[id].y = state.players[id].y;
      players[id].facing = state.players[id].facing;
      players[id].hp = state.players[id].hp;
    } else {
      players[id] = state.players[id];
    }
  }
});

socket.on('chatMessage', (msg) => {
  addChatMessage(msg.name, msg.text);
});

socket.on('error', (err) => {
  alert(err.message);
});

// Отправка ввода
function sendInput(input) {
  socket.emit('playerInput', input);
}

// Чат
function sendChat(text) {
  if (text.trim()) {
    socket.emit('chatMessage', text.trim());
  }
}

function addChatMessage(name, text) {
  const container = document.getElementById('chatMessages');
  const div = document.createElement('div');
  div.innerHTML = `<span class="name">${name}:</span> ${text}`;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}
