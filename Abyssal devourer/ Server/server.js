const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Раздаём клиент
app.use(express.static(path.join(__dirname, '../client')));

const PORT = process.env.PORT || 3000;

// ====== Игровое состояние ======
const rooms = {}; // roomId -> { players: {}, boss: null, ... }

function createRoom(roomId) {
  rooms[roomId] = {
    players: {},
    maxPlayers: 5,
    started: false
  };
  return rooms[roomId];
}

io.on('connection', (socket) => {
  console.log(`[+] Игрок подключился: ${socket.id}`);

  socket.on('joinRoom', ({ roomId, name, classType }) => {
    roomId = roomId || 'default';
    name = (name || 'Игрок').slice(0, 16);
    classType = ['berserker', 'ranger', 'mage'].includes(classType) ? classType : 'berserker';

    if (!rooms[roomId]) {
      createRoom(roomId);
    }

    const room = rooms[roomId];

    if (Object.keys(room.players).length >= room.maxPlayers) {
      socket.emit('error', { message: 'Комната заполнена (макс 5 игроков)' });
      return;
    }

    // Добавляем игрока
    room.players[socket.id] = {
      id: socket.id,
      name,
      classType,
      x: 400 + Math.random() * 200,
      y: 300,
      vx: 0,
      vy: 0,
      hp: 100,
      maxHp: 100,
      facing: 1, // 1 = вправо, -1 = влево
      onGround: false
    };

    socket.join(roomId);
    socket.roomId = roomId;

    // Отправляем текущее состояние комнаты новому игроку
    socket.emit('roomJoined', {
      roomId,
      players: room.players,
      yourId: socket.id
    });

    // Сообщаем остальным
    socket.to(roomId).emit('playerJoined', room.players[socket.id]);

    console.log(`[Room ${roomId}] ${name} (${classType}) присоединился`);
  });

  // Ввод игрока (движение и т.д.)
  socket.on('playerInput', (input) => {
    const roomId = socket.roomId;
    if (!roomId || !rooms[roomId]) return;

    const player = rooms[roomId].players[socket.id];
    if (!player) return;

    // Простая физика на сервере (авторитет)
    const speed = 5;
    player.vx = 0;

    if (input.left) {
      player.vx = -speed;
      player.facing = -1;
    }
    if (input.right) {
      player.vx = speed;
      player.facing = 1;
    }

    // Прыжок
    if (input.jump && player.onGround) {
      player.vy = -12;
      player.onGround = false;
    }

    // Горизонтальное движение
    player.x += player.vx;

    // Гравитация
    player.vy += 0.5;
    player.y += player.vy;

    // Простая "земля"
    if (player.y > 500) {
      player.y = 500;
      player.vy = 0;
      player.onGround = true;
    }

    // Границы арены
    if (player.x < 50) player.x = 50;
    if (player.x > 1150) player.x = 1150;
  });

  // Чат
  socket.on('chatMessage', (text) => {
    const roomId = socket.roomId;
    if (!roomId || !rooms[roomId]) return;

    const player = rooms[roomId].players[socket.id];
    if (!player) return;

    const message = {
      name: player.name,
      text: String(text).slice(0, 120),
      time: Date.now()
    };

    io.to(roomId).emit('chatMessage', message);
  });

  socket.on('disconnect', () => {
    const roomId = socket.roomId;
    if (roomId && rooms[roomId]) {
      const player = rooms[roomId].players[socket.id];
      if (player) {
        console.log(`[-] ${player.name} отключился`);
        delete rooms[roomId].players[socket.id];
        socket.to(roomId).emit('playerLeft', socket.id);

        // Если комната пустая — удаляем
        if (Object.keys(rooms[roomId].players).length === 0) {
          delete rooms[roomId];
        }
      }
    }
  });
});

// Игровой цикл (отправка состояния всем)
setInterval(() => {
  for (const roomId in rooms) {
    const room = rooms[roomId];
    io.to(roomId).emit('gameState', {
      players: room.players
    });
  }
}, 1000 / 30); // 30 тиков в секунду

server.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});
