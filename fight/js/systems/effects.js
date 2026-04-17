// ============================================
// 效果函数 Effects
// ============================================

// 创建毒池
function createPoisonPool(x, y, owner = null) {
    x = Math.max(WALL + 15, Math.min(W - WALL - 15, x));
    y = Math.max(WALL + 15, Math.min(H - WALL - 15, y));

    // 避免重叠
    for (const pool of poisonPools) {
        const dx = pool.x - x, dy = pool.y - y;
        if (dx * dx + dy * dy < 400) return;
    }

    poisonPools.push({ x, y, radius: 30, damage: 5, pulse: Math.random() * Math.PI * 2, age: 0, owner: owner });
    document.getElementById('poolCount').textContent = `POOLS: ${poisonPools.length}`;
}

// 创建毒云
function createPoisonCloud(x, y, owner) {
    x = Math.max(WALL + 10, Math.min(W - WALL - 10, x));
    y = Math.max(WALL + 10, Math.min(H - WALL - 10, y));

    poisonPools.push({ x, y, radius: 35, damage: 6, pulse: Math.random() * Math.PI * 2, age: 0, isCloud: true, owner: owner || null });
    spawnParticles(x, y, '#50fa7b', 12);
    document.getElementById('poolCount').textContent = `POOLS: ${poisonPools.length}`;
}

// 创建爆炸
function createExplosion(x, y, radius, damage, owner) {
    explosions.push({ x, y, radius, damage, owner, alpha: 1, scale: 0 });
    spawnParticles(x, y, '#00d9ff', 20);
    spawnParticles(x, y, '#8b5cf6', 15);
    triggerScreenShake(6);
}

// 生成粒子
function spawnParticles(x, y, color, count, angle = null) {
    for (let i = 0; i < count; i++) {
        const a = angle !== null ? angle + (Math.random() - 0.5) * 1.5 : Math.random() * Math.PI * 2;
        const spd = 2 + Math.random() * 4;
        particles.push({
            x, y,
            vx: Math.cos(a) * spd,
            vy: Math.sin(a) * spd,
            life: 1,
            decay: 0.02 + Math.random() * 0.03,
            size: 2 + Math.random() * 4,
            color
        });
    }
}

// 生成伤害数字
function spawnDamageNumber(x, y, damage) {
    damageNumbers.push({
        x: x + (Math.random() - 0.5) * 20,
        y,
        damage,
        vy: -2.5,
        life: 1,
        scale: 1 + Math.random() * 0.3
    });
}

// 屏幕震动
function triggerScreenShake(intensity) {
    screenShake.intensity = Math.min(intensity, 10);
}

// 创建冲击波
function createShockwave(x, y, owner) {
    shockwaves.push({
        x, y,
        owner,
        radius: 0,
        maxRadius: 150,
        speed: 200,
        alpha: 0.8,
        damage: 25
    });
    spawnParticles(x, y, '#00bfff', 30);
    triggerScreenShake(8);
}

// 更新冲击波
function updateShockwaves(dt) {
    for (let i = shockwaves.length - 1; i >= 0; i--) {
        const s = shockwaves[i];
        s.radius += s.speed * dt;
        s.alpha -= dt * 1.5;

        if (s.alpha <= 0 || s.radius >= s.maxRadius) {
            shockwaves.splice(i, 1);
            continue;
        }

        // 检测敌人受伤
        const allBalls = [ballA, ballM, ballB, ballD, ballV, ballL];
        for (const ball of allBalls) {
            if (!ball.active || ball.hp <= -999) continue;
            // 冲击波伤害敌人
            if (s.owner && isEnemy(ball.type, s.owner)) {
                const dx = ball.x - s.x;
                const dy = ball.y - s.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                // 在冲击波范围内的敌人受到伤害
                if (Math.abs(dist - s.radius) < 30) {
                    ball.hp -= s.damage * dt * 10;
                    if (Math.random() < 0.1) {
                        spawnDamageNumber(ball.x, ball.y - ball.radius - 10, Math.round(s.damage));
                        spawnParticles(ball.x, ball.y, '#00bfff', 5);
                    }
                }
            }
        }
    }
}

// 绘制冲击波
function drawShockwaves() {
    for (const s of shockwaves) {
        ctx.save();
        ctx.translate(s.x, s.y);

        // 外圈
        ctx.beginPath();
        ctx.arc(0, 0, s.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(0, 191, 255, ${s.alpha})`;
        ctx.lineWidth = 4;
        ctx.shadowColor = '#00bfff';
        ctx.shadowBlur = 20;
        ctx.stroke();

        // 内圈
        ctx.beginPath();
        ctx.arc(0, 0, s.radius * 0.7, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(0, 191, 255, ${s.alpha * 0.5})`;
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.restore();
    }
}
