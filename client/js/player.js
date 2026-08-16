// player.js — отрисовка игроков

const classColors = {
  berserker: '#ff4d6d',
  ranger: '#4d9fff',
  mage: '#c77dff'
};

const classNames = {
  berserker: 'Берсерк',
  ranger: 'Стрелок',
  mage: 'Маг'
};

function drawPlayer(ctx, p, isMe) {
  const w = 28;
  const h = 42;

  ctx.save();
  ctx.translate(p.x, p.y);

  // Отражение в зависимости от направления
  if (p.facing === -1) {
    ctx.scale(-1, 1);
  }

  // Тело
  ctx.fillStyle = classColors[p.classType] || '#ffffff';
  ctx.fillRect(-w / 2, -h, w, h);

  // Голова
  ctx.fillStyle = '#f0e6d0';
  ctx.fillRect(-10, -h - 16, 20, 18);

  // Глаза
  ctx.fillStyle = '#111';
  ctx.fillRect(-6, -h - 10, 4, 4);
  ctx.fillRect(2, -h - 10, 4, 4);

  // Обводка если это ты
  if (isMe) {
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(-w / 2 - 2, -h - 18, w + 4, h + 20);
  }

  ctx.restore();

  // Ник над головой
  ctx.fillStyle = isMe ? '#ffffff' : '#ccccdd';
  ctx.font = '12px Segoe UI';
  ctx.textAlign = 'center';
  ctx.fillText(p.name, p.x, p.y - h - 28);

  // Маленькая полоска HP
  const hpPercent = p.hp / p.maxHp;
  ctx.fillStyle = '#333';
  ctx.fillRect(p.x - 20, p.y - h - 22, 40, 5);
  ctx.fillStyle = hpPercent > 0.3 ? '#4caf50' : '#ff3860';
  ctx.fillRect(p.x - 20, p.y - h - 22, 40 * hpPercent, 5);
}
