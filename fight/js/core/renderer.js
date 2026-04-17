// ============================================
// 渲染器 Renderer
// ============================================

// 绘制背景
function drawBackground() {
    ctx.strokeStyle = 'rgba(255,255,255,0.025)';
    ctx.lineWidth = 1;
    for (let x = WALL; x < W - WALL; x += 50) {
        ctx.beginPath();
        ctx.moveTo(x, WALL);
        ctx.lineTo(x, H - WALL);
        ctx.stroke();
    }
    for (let y = WALL; y < H - WALL; y += 50) {
        ctx.beginPath();
        ctx.moveTo(WALL, y);
        ctx.lineTo(W - WALL, y);
        ctx.stroke();
    }

    // 渐变色墙体
    const wallGrad = ctx.createLinearGradient(0, 0, W, 0);
    wallGrad.addColorStop(0, '#ff00aa');
    wallGrad.addColorStop(0.5, '#00ffaa');
    wallGrad.addColorStop(1, '#ff00aa');
    ctx.fillStyle = wallGrad;
    ctx.fillRect(0, 0, W, WALL);
    ctx.fillRect(0, H - WALL, W, WALL);
    ctx.fillRect(0, 0, WALL, H);
    ctx.fillRect(W - WALL, 0, WALL, H);

    // 内边框
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 2;
    ctx.strokeRect(WALL, WALL, W - WALL * 2, H - WALL * 2);
}

// 绘制毒池
function drawPoisonPools() {
    for (const pool of poisonPools) {
        const pulse = Math.sin(pool.pulse) * 5 + pool.radius;
        ctx.beginPath();
        ctx.arc(pool.x, pool.y, pulse, 0, Math.PI * 2);
        const grad = ctx.createRadialGradient(pool.x, pool.y, 0, pool.x, pool.y, pulse);
        grad.addColorStop(0, pool.isCloud ? 'rgba(80, 250, 123, 0.4)' : 'rgba(80, 250, 123, 0.3)');
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(pool.x, pool.y, pulse, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(80, 250, 123, ${0.5 + Math.sin(pool.pulse) * 0.2})`;
        ctx.lineWidth = 1;
        ctx.stroke();
    }
}

// 绘制剑的拖尾
function drawSwordTrail() {
    for (let i = 0; i < swordTrail.length; i++) {
        const t = swordTrail[i];
        t.alpha -= 0.08;
        if (t.alpha > 0) {
            ctx.beginPath();
            ctx.arc(t.x, t.y, 4 * t.alpha, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255,107,107,${t.alpha * 0.6})`;
            ctx.fill();
        }
    }
}

// 绘制伤害数字
function drawDamageNumbers(dt) {
    for (let i = damageNumbers.length - 1; i >= 0; i--) {
        const d = damageNumbers[i];
        d.y += d.vy * dt * 60;
        d.life -= dt;
        d.scale *= 0.98;

        ctx.save();
        ctx.translate(d.x, d.y);
        ctx.scale(d.scale, d.scale);
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = `rgba(255,255,255,${d.life})`;
        ctx.fillText(d.damage, 0, 0);
        ctx.restore();

        if (d.life <= 0) damageNumbers.splice(i, 1);
    }
}

// 绘制粒子
function drawParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx * dt * 60;
        p.y += p.vy * dt * 60;
        p.life -= p.decay;
        p.size *= 0.98;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}${Math.floor(p.life * 255).toString(16).padStart(2, '0')}`;
        ctx.fill();

        if (p.life <= 0) particles.splice(i, 1);
    }
}

// 更新背景粒子
function updateBgParticles() {
    for (const p of bgParticles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = W;
        if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H;
        if (p.y > H) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${p.alpha})`;
        ctx.fill();
    }
}

// 游戏主循环
function gameLoop(timestamp) {
    const dt = (timestamp - lastTime) / 1000;
    lastTime = timestamp;

    // 清空画布
    ctx.clearRect(0, 0, W, H);

    // 屏幕震动处理
    if (screenShake.intensity > 0) {
        screenShake.x = (Math.random() - 0.5) * screenShake.intensity;
        screenShake.y = (Math.random() - 0.5) * screenShake.intensity;
        screenShake.intensity *= 0.9;
    }
    ctx.save();
    ctx.translate(screenShake.x, screenShake.y);

    // 绘制背景和粒子
    drawBackground();
    updateBgParticles();

    if (gameState === 'playing' || gameState === 'waiting') {
        // 只更新激活的球
        const balls = [ballA, ballM, ballB, ballD].filter(b => b.active);
        balls.forEach(ball => ball.update(dt, balls));

        // 检测碰撞/击中（传递所有球，内部会过滤）
        checkBallCollisions();
        checkSwordHit();
        checkPoisonTouch();
        checkMageCollisions();
        checkPoisonPools();

        // 更新投射物/爆炸
        updateProjectiles(dt, balls);
        updateExplosions(dt);
        updateShockwaves(dt);

        // 更新UI（血量）- 只显示激活的球）
        const showSword = ballA.active;
        const showMage = ballM.active;
        const showPoison = ballB.active;
        const showShield = ballD.active;

        document.getElementById('healthSword').parentElement.style.display = showSword ? 'flex' : 'none';
        document.getElementById('healthMage').parentElement.style.display = showMage ? 'flex' : 'none';
        document.getElementById('healthPoison').parentElement.style.display = showPoison ? 'flex' : 'none';
        document.getElementById('healthShield').parentElement.style.display = showShield ? 'flex' : 'none';

        if (showSword) {
            const hpPercent = Math.max(0, ballA.hp / ballA.maxHp * 100);
            document.getElementById('healthSword').style.width = `${hpPercent}%`;
            document.getElementById('hpSword').textContent = `${Math.round(hpPercent)}%`;
        }
        if (showMage) {
            const hpPercent = Math.max(0, ballM.hp / ballM.maxHp * 100);
            document.getElementById('healthMage').style.width = `${hpPercent}%`;
            document.getElementById('hpMage').textContent = `${Math.round(hpPercent)}%`;
        }
        if (showPoison) {
            const hpPercent = Math.max(0, ballB.hp / ballB.maxHp * 100);
            document.getElementById('healthPoison').style.width = `${hpPercent}%`;
            document.getElementById('hpPoison').textContent = `${Math.round(hpPercent)}%`;
        }
        if (showShield) {
            const hpPercent = Math.max(0, ballD.hp / ballD.maxHp * 100);
            document.getElementById('healthShield').style.width = `${hpPercent}%`;
            document.getElementById('hpShield').textContent = `${Math.round(hpPercent)}%`;
        }

        // 更新计时器
        gameTime += dt;
        const minutes = Math.floor(gameTime / 60).toString().padStart(2, '0');
        const seconds = Math.floor(gameTime % 60).toString().padStart(2, '0');
        document.getElementById('timer').textContent = `${minutes}:${seconds}`;

        // 更新伤害统计
        document.getElementById('damageStats').textContent = `A:${totalDamage.A} M:${totalDamage.M} B:${totalDamage.B} D:${totalDamage.D}`;

        // 更新伤害面板
        updateDamagePanel();
    }

    // 绘制毒池
    drawPoisonPools();

    // 绘制剑拖尾
    drawSwordTrail();

    // 绘制球
    ballA.draw();
    ballM.draw();
    ballB.draw();
    ballD.draw();

    // 绘制投射物/爆炸
    drawProjectiles();
    drawExplosions();
    drawShockwaves();

    // 绘制伤害数字和粒子
    drawDamageNumbers(dt);
    drawParticles(dt);

    ctx.restore();
    requestAnimationFrame(gameLoop);
}

// 启动游戏
window.addEventListener('load', () => {
    init();
    requestAnimationFrame(gameLoop);
});
