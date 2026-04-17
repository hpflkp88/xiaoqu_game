// ============================================
// 碰撞检测 Collision Detection
// ============================================

// 圆形碰撞检测
function circleCollision(a, b) {
    if (a.hp <= -999 || b.hp <= -999) return false;
    const dx = b.x - a.x, dy = b.y - a.y;
    return Math.sqrt(dx * dx + dy * dy) < a.radius + b.radius;
}

// 点是否在圆内
function pointInCircle(px, py, cx, cy, r) {
    const dx = px - cx, dy = py - cy;
    return dx * dx + dy * dy < r * r;
}

// 碰撞解析
function resolveCollision(a, b) {
    const dx = b.x - a.x, dy = b.y - a.y, dist = Math.sqrt(dx * dx + dy * dy);
    if (dist === 0) return;

    const nx = dx / dist, ny = dy / dist;
    const dvx = a.vx - b.vx, dvy = a.vy - b.vy, dvn = dvx * nx + dvy * ny;
    if (dvn < 0) return;

    const ma = a.radius, mb = b.radius, massSum = ma + mb;
    const impulse = (2 * dvn) / massSum;

    a.vx -= impulse * mb * nx * 0.9;
    a.vy -= impulse * mb * ny * 0.9;
    b.vx += impulse * ma * nx * 0.9;
    b.vy += impulse * ma * ny * 0.9;

    const overlap = (a.radius + b.radius - dist) / 2;
    a.x -= overlap * nx;
    a.y -= overlap * ny;
    b.x += overlap * nx;
    b.y += overlap * ny;
}

// 检测球之间的碰撞
function checkBallCollisions() {
    // 碰撞伤害定义
    const collisionDamage = { 'A': 6, 'M': 3, 'B': 0, 'D': 3, 'V': 5, 'L': 4 };

    // 剑球血量越低碰撞伤害越高
    const swordHpPercent = ballA.hp / ballA.maxHp;
    const swordDamageMultiplier = 1 + (1 - swordHpPercent) * 1.5;
    const swordCollisionDamage = Math.round(collisionDamage['A'] * swordDamageMultiplier);

    // Vampire球血量越低伤害越高
    const vampireHpPercent = ballV.hp / ballV.maxHp;
    const vampireDamageMultiplier = 1 + (1 - vampireHpPercent) * 0.5;
    const vampireCollisionDamage = Math.round(collisionDamage['V'] * vampireDamageMultiplier);

    const allBalls = [ballA, ballM, ballB, ballD, ballV, ballL];

    // 遍历所有球对之间的碰撞
    for (let i = 0; i < allBalls.length; i++) {
        for (let j = i + 1; j < allBalls.length; j++) {
            const ball1 = allBalls[i];
            const ball2 = allBalls[j];

            if (!ball1.active || !ball2.active) continue;
            if (ball1.hp <= -999 || ball2.hp <= -999) continue;
            if (isSameTeam(ball1.type, ball2.type)) continue;
            if (!circleCollision(ball1, ball2)) continue;

            resolveCollision(ball1, ball2);

            let dmg1 = collisionDamage[ball2.type] || 0;
            let dmg2 = collisionDamage[ball1.type] || 0;

            // Sword球特殊伤害
            if (ball1.type === 'A') dmg2 = swordCollisionDamage;
            if (ball2.type === 'A') dmg1 = swordCollisionDamage;

            // Vampire球特殊伤害
            if (ball1.type === 'V') dmg2 = vampireCollisionDamage;
            if (ball2.type === 'V') dmg1 = vampireCollisionDamage;

            if (ball1.hp > -999 && ball2.hp > -999) {
                ball1.takeDamage(dmg1, ball2.x, ball2.y, ball2.type);
                ball2.takeDamage(dmg2, ball1.x, ball1.y, ball1.type);
                totalDamage[ball2.type] += dmg1;
                totalDamage[ball1.type] += dmg2;

                // Vampire吸血
                if (ball1.type === 'V' && ballV.active && dmg2 > 0) {
                    ballV.onDealDamage(dmg2);
                }
                if (ball2.type === 'V' && ballV.active && dmg1 > 0) {
                    ballV.onDealDamage(dmg1);
                }

                // Poison球碰撞生成毒云
                if (ball1.type === 'B' && ballB.cloudCooldown <= 0) {
                    createPoisonCloud((ball1.x + ball2.x) / 2, (ball1.y + ball2.y) / 2, 'B');
                    ballB.cloudCooldown = 3;
                }
                if (ball2.type === 'B' && ballB.cloudCooldown <= 0) {
                    createPoisonCloud((ball1.x + ball2.x) / 2, (ball1.y + ball2.y) / 2, 'B');
                    ballB.cloudCooldown = 3;
                }

                // Lightning球链式闪电 - 从被击中的目标开始弹跳
                if (ball1.type === 'L' && ballL.active) {
                    ballL.startChainLightning(ball2);
                }
                if (ball2.type === 'L' && ballL.active) {
                    ballL.startChainLightning(ball1);
                }

                spawnParticles((ball1.x + ball2.x) / 2, (ball1.y + ball2.y) / 2, ball1.color, 5);
                triggerScreenShake(2);
            }
        }
    }
}

// 检测剑的击中
function checkSwordHit() {
    if (!ballA.active) return;

    // 血量越低伤害越高（最低50%血量时达到2.5倍伤害）
    const hpPercent = ballA.hp / ballA.maxHp;
    const damageMultiplier = 1 + (1 - hpPercent) * 1.5;
    const baseDamage = 8;
    const currentDamage = Math.round(baseDamage * damageMultiplier);

    if (ballA.isSticking && ballA.stickTarget) {
        if (!ballA.stickTarget.active || ballA.stickTarget.hp <= -999 || isSameTeam('A', ballA.stickTarget.type)) {
            ballA.isSticking = false;
            ballA.stickTarget = null;
            ballA.stickHits = 0;
            return;
        }
        ballA.stickTimer -= 1/60;
        if (ballA.stickTimer <= 0) {
            ballA.stickHits++;
            ballA.stickTarget.takeDamage(currentDamage, ballA.x, ballA.y, 'A');
            totalDamage.A += currentDamage;
            ballA.stickTimer = 0.6;
            spawnParticles(ballA.stickTarget.x, ballA.stickTarget.y, '#ff6b6b', 12);
            triggerScreenShake(4);
            if (ballA.stickHits >= 4) {
                ballA.isSticking = false;
                ballA.stickTarget = null;
                ballA.stickHits = 0;
            }
        }
        return;
    }

    const tip = ballA.getSwordTip();
    const tip2 = ballA.getSwordTip2();
    for (const target of [ballM, ballB, ballD]) {
        if (!target.active || target.hp <= -999) continue;
        if (isSameTeam('A', target.type)) continue; // 不攻击队友
        // 检查第一把剑
        if (pointInCircle(tip.x, tip.y, target.x, target.y, target.radius)) {
            const slashAngle = ballA.swordAngle - 0.3;
            target.vx += Math.cos(slashAngle) * 5;
            target.vy += Math.sin(slashAngle) * 5;
            ballA.isSticking = true;
            ballA.stickTarget = target;
            ballA.stickHits = 1;
            ballA.stickTimer = 0.6;
            target.takeDamage(currentDamage, ballA.x, ballA.y, 'A');
            totalDamage.A += currentDamage;
            spawnParticles(target.x, target.y, '#ff6b6b', 15);
            triggerScreenShake(6);
            break;
        }
        // 检查第二把剑
        if (pointInCircle(tip2.x, tip2.y, target.x, target.y, target.radius)) {
            const slashAngle = ballA.swordAngle2 - 0.3;
            target.vx += Math.cos(slashAngle) * 5;
            target.vy += Math.sin(slashAngle) * 5;
            ballA.isSticking = true;
            ballA.stickTarget = target;
            ballA.stickHits = 1;
            ballA.stickTimer = 0.6;
            target.takeDamage(currentDamage, ballA.x, ballA.y, 'A');
            totalDamage.A += currentDamage;
            spawnParticles(target.x, target.y, '#ff6b6b', 15);
            triggerScreenShake(6);
            break;
        }
    }
}

// 检测中毒接触
function checkPoisonTouch() {
    // Poison球 → Shield球 (不同队, 50%伤害减免由ShieldBall处理)
    if (ballB.active && ballD.active && ballB.hp > -999 && ballD.hp > -999 && ballD.poisonDOT <= 0 && !isSameTeam('B', 'D')) {
        const dx = ballD.x - ballB.x, dy = ballD.y - ballB.y;
        if (Math.sqrt(dx * dx + dy * dy) < ballD.radius + ballB.radius + 5) {
            ballD.applyPoison();
            spawnParticles(ballD.x, ballD.y, '#bd93f9', 10);
            const angle = Math.atan2(dy, dx);
            ballD.vx += Math.cos(angle) * 3;
            ballD.vy += Math.sin(angle) * 3;
            ballB.vx -= Math.cos(angle) * 3;
            ballB.vy -= Math.sin(angle) * 3;
        }
    }

    // Mage球 → Shield球 (不同队)
    if (ballM.active && ballD.active && ballM.hp > -999 && ballD.hp > -999 && ballD.poisonDOT <= 0 && !isSameTeam('M', 'D')) {
        const dx = ballD.x - ballM.x, dy = ballD.y - ballM.y;
        if (Math.sqrt(dx * dx + dy * dy) < ballD.radius + ballM.radius) {
            ballD.applyPoison();
            spawnParticles(ballD.x, ballD.y, '#bd93f9', 8);
        }
    }
}

// 检测法师碰撞
function checkMageCollisions() {
    // Mage ↔ Sword (不同队)
    if (ballM.active && ballA.active && ballM.hp > -999 && ballA.hp > -999 && !isSameTeam('M', 'A')) {
        const mdx = ballM.x - ballA.x, mdy = ballM.y - ballA.y;
        if (Math.sqrt(mdx * mdx + mdy * mdy) < ballM.radius + ballA.radius) {
            const angle = Math.atan2(mdy, mdx);
            ballM.vx += Math.cos(angle) * 2;
            ballM.vy += Math.sin(angle) * 2;
            ballA.vx -= Math.cos(angle) * 2;
            ballA.vy -= Math.sin(angle) * 2;
        }
    }

    // Mage ↔ Poison (不同队)
    if (ballM.active && ballB.active && ballM.hp > -999 && ballB.hp > -999 && !isSameTeam('M', 'B')) {
        const mdx2 = ballM.x - ballB.x, mdy2 = ballM.y - ballB.y;
        if (Math.sqrt(mdx2 * mdx2 + mdy2 * mdy2) < ballM.radius + ballB.radius) {
            const angle = Math.atan2(mdy2, mdx2);
            ballM.vx += Math.cos(angle) * 2;
            ballM.vy += Math.sin(angle) * 2;
            ballB.vx -= Math.cos(angle) * 2;
            ballB.vy -= Math.sin(angle) * 2;
        }
    }

    // Mage ↔ Shield (不处理碰撞,Shield有独立碰撞)
}

// 检测毒池伤害
function checkPoisonPools() {
    for (const pool of poisonPools) {
        pool.age += 1/60;
        pool.pulse += 0.06;
        for (const ball of [ballA, ballM, ballB, ballD, ballV, ballL]) {
            if (!ball.active || ball.hp <= -999) continue;
            // Poison球免疫毒池伤害（剑球不禁忌，虽然会受到伤害）
            if (ball.type === 'B') continue;

            // 检查是否是友军（Pool.owner的队友不受伤害）
            if (pool.owner && !isEnemy(ball.type, pool.owner)) continue;

            const dx = ball.x - pool.x, dy = ball.y - pool.y;
            if (dx * dx + dy * dy < (pool.radius + ball.radius) ** 2) {
                const dmg = pool.damage / 60;
                ball.hp -= dmg;

                // 记录毒池伤害
                if (pool.owner && window.damageDealt) {
                    recordDamage(pool.owner, ball.type, dmg);
                }

                if (Math.random() < 0.02) {
                    spawnDamageNumber(ball.x, ball.y - ball.radius - 10, Math.round(pool.damage));
                    spawnParticles(ball.x, ball.y, '#bd93f9', 3);
                }
                if (Math.random() < 0.12 && ball.poisonDOT <= 0) {
                    ball.poisonDOT = 1;
                    ball.poisonTimer = 3;
                    ball.poisonAura = 0.5;
                }
            }
        }
    }
}
