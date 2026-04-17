// ============================================
// 投射物与爆炸 Projectiles & Explosions
// ============================================

// 更新投射物
function updateProjectiles(dt, balls) {
    // 清除死亡球发射的投射物
    const deadTypes = [];
    for (const ball of [ballA, ballM, ballB, ballD]) {
        if (!ball.active && ball.hp <= -999) {
            deadTypes.push(ball.type);
        }
    }
    if (deadTypes.length > 0) {
        for (let i = projectiles.length - 1; i >= 0; i--) {
            if (deadTypes.includes(projectiles[i].owner)) {
                projectiles.splice(i, 1);
            }
        }
    }

    for (let i = projectiles.length - 1; i >= 0; i--) {
        const p = projectiles[i];
        p.trail.push({ x: p.x, y: p.y, alpha: 1 });
        if (p.trail.length > 10) p.trail.shift();
        for (const t of p.trail) t.alpha -= 0.1;

        p.x += p.vx;
        p.y += p.vy;

        // 墙体碰撞（可反射一次）
        if (p.x < WALL || p.x > W - WALL) {
            if (!p.reflected) {
                p.vx *= -1;
                p.x = p.x < WALL ? WALL : W - WALL;
                p.reflected = true;
            } else {
                createExplosion(p.x, p.y, 40, p.damage, p.owner);
                projectiles.splice(i, 1);
                continue;
            }
        }
        if (p.y < WALL || p.y > H - WALL) {
            if (!p.reflected) {
                p.vy *= -1;
                p.y = p.y < WALL ? WALL : H - WALL;
                p.reflected = true;
            } else {
                createExplosion(p.x, p.y, 40, p.damage, p.owner);
                projectiles.splice(i, 1);
                continue;
            }
        }

        // 击中球
        let hit = false;
        for (const ball of balls) {
            if (ball.hp <= -999) continue;
            // 同队不伤害
            if (p.owner && !isEnemy(ball.type, p.owner)) continue;

            const dx = ball.x - p.x, dy = ball.y - p.y;
            if (dx * dx + dy * dy < (ball.radius + p.radius) ** 2) {
                ball.takeDamage(p.damage, p.x, p.y, p.owner);
                if (p.owner === 'M') {
                    ball.applyFreeze(ball.freezeDuration);
                    totalDamage.M += p.damage;
                } else if (p.owner === 'A') {
                    totalDamage.A += p.damage;
                } else {
                    totalDamage.B += p.damage;
                }
                createExplosion(p.x, p.y, 50, p.damage, p.owner);
                hit = true;
                break;
            }
        }
        if (hit) {
            projectiles.splice(i, 1);
            continue;
        }
    }
}

// 绘制投射物
function drawProjectiles() {
    for (const p of projectiles) {
        for (const t of p.trail) {
            if (t.alpha > 0) {
                ctx.beginPath();
                ctx.arc(t.x, t.y, 5 * t.alpha, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(139, 92, 246, ${t.alpha * 0.6})`;
                ctx.fill();
            }
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
        grad.addColorStop(0, '#fff');
        grad.addColorStop(0.3, '#8b5cf6');
        grad.addColorStop(1, '#4c1d95');
        ctx.fillStyle = grad;
        ctx.shadowColor = '#8b5cf6';
        ctx.shadowBlur = 15;
        ctx.fill();
        ctx.shadowBlur = 0;
    }
}

// 更新爆炸
function updateExplosions(dt) {
    for (let i = explosions.length - 1; i >= 0; i--) {
        const e = explosions[i];
        e.scale += dt * 8;
        e.alpha -= dt * 2;
        if (e.alpha <= 0) explosions.splice(i, 1);
    }
}

// 绘制爆炸
function drawExplosions() {
    for (const e of explosions) {
        ctx.save();
        ctx.translate(e.x, e.y);
        ctx.scale(e.scale, e.scale);
        ctx.beginPath();
        ctx.arc(0, 0, e.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(0, 217, 255, ${e.alpha})`;
        ctx.lineWidth = 4;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 0, e.radius * 0.6, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(139, 92, 246, ${e.alpha * 0.5})`;
        ctx.fill();
        ctx.restore();
    }
}
