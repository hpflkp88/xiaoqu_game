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
    const collisionDamage = { 'A': 6, 'M': 3, 'B': 0, 'D': 3 };

    // ballA vs ballM
    if (ballA.active && ballM.active && circleCollision(ballA, ballM) && !isSameTeam('A', 'M')) {
        resolveCollision(ballA, ballM);
        if (ballA.hp > -999 && ballM.hp > -999) {
            ballA.takeDamage(collisionDamage['M'], ballM.x, ballM.y, 'M');
            ballM.takeDamage(collisionDamage['A'], ballA.x, ballA.y, 'A');
            totalDamage.M += collisionDamage['M'];
            totalDamage.A += collisionDamage['A'];
            spawnParticles((ballA.x + ballM.x) / 2, (ballA.y + ballM.y) / 2, '#ff6b6b', 5);
            triggerScreenShake(2);
        }
    }
    // ballA vs ballB
    if (ballA.active && ballB.active && circleCollision(ballA, ballB) && !isSameTeam('A', 'B')) {
        resolveCollision(ballA, ballB);
        if (ballA.hp > -999 && ballB.hp > -999) {
            ballA.takeDamage(collisionDamage['B'], ballB.x, ballB.y, 'B');
            ballB.takeDamage(collisionDamage['A'], ballA.x, ballA.y, 'A');
            totalDamage.B += collisionDamage['B'];
            totalDamage.A += collisionDamage['A'];
            spawnParticles((ballA.x + ballB.x) / 2, (ballA.y + ballB.y) / 2, '#50fa7b', 5);
            triggerScreenShake(2);
            const cx = (ballA.x + ballB.x) / 2, cy = (ballA.y + ballB.y) / 2;
            if (ballB.cloudCooldown <= 0) {
                createPoisonCloud(cx, cy, 'B');
                ballB.cloudCooldown = 3;
            }
        }
    }
    // ballM vs ballB
    if (ballM.active && ballB.active && circleCollision(ballM, ballB) && !isSameTeam('M', 'B')) {
        resolveCollision(ballM, ballB);
        if (ballM.hp > -999 && ballB.hp > -999) {
            ballM.takeDamage(collisionDamage['B'], ballB.x, ballB.y, 'B');
            ballB.takeDamage(collisionDamage['M'], ballM.x, ballM.y, 'M');
            totalDamage.B += collisionDamage['B'];
            totalDamage.M += collisionDamage['M'];
            spawnParticles((ballM.x + ballB.x) / 2, (ballM.y + ballB.y) / 2, '#8b5cf6', 5);
            triggerScreenShake(2);
            const cx = (ballM.x + ballB.x) / 2, cy = (ballM.y + ballB.y) / 2;
            if (ballB.cloudCooldown <= 0) {
                createPoisonCloud(cx, cy, 'B');
                ballB.cloudCooldown = 3;
            }
        }
    }
    // ballD vs ballA
    if (ballD.active && ballA.active && circleCollision(ballD, ballA) && !isSameTeam('D', 'A')) {
        resolveCollision(ballD, ballA);
        if (ballD.hp > -999 && ballA.hp > -999) {
            ballD.takeDamage(collisionDamage['A'], ballA.x, ballA.y, 'A');
            ballA.takeDamage(collisionDamage['D'], ballD.x, ballD.y, 'D');
            totalDamage.A += collisionDamage['A'];
            totalDamage.D += collisionDamage['D'];
            spawnParticles((ballD.x + ballA.x) / 2, (ballD.y + ballA.y) / 2, '#00bfff', 5);
            triggerScreenShake(2);
        }
    }
    // ballD vs ballM
    if (ballD.active && ballM.active && circleCollision(ballD, ballM) && !isSameTeam('D', 'M')) {
        resolveCollision(ballD, ballM);
        if (ballD.hp > -999 && ballM.hp > -999) {
            ballD.takeDamage(collisionDamage['M'], ballM.x, ballM.y, 'M');
            ballM.takeDamage(collisionDamage['D'], ballD.x, ballD.y, 'D');
            totalDamage.M += collisionDamage['M'];
            totalDamage.D += collisionDamage['D'];
            spawnParticles((ballD.x + ballM.x) / 2, (ballD.y + ballM.y) / 2, '#00bfff', 5);
            triggerScreenShake(2);
        }
    }
    // ballD vs ballB
    if (ballD.active && ballB.active && circleCollision(ballD, ballB) && !isSameTeam('D', 'B')) {
        resolveCollision(ballD, ballB);
        if (ballD.hp > -999 && ballB.hp > -999) {
            ballD.takeDamage(collisionDamage['B'], ballB.x, ballB.y, 'B');
            ballB.takeDamage(collisionDamage['D'], ballD.x, ballD.y, 'D');
            totalDamage.B += collisionDamage['B'];
            totalDamage.D += collisionDamage['D'];
            spawnParticles((ballD.x + ballB.x) / 2, (ballD.y + ballB.y) / 2, '#00bfff', 5);
            triggerScreenShake(2);
        }
    }
}

// 检测剑的击中
function checkSwordHit() {
    if (!ballA.active) return;

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
            ballA.stickTarget.takeDamage(8, ballA.x, ballA.y, 'A');
            totalDamage.A += 8;
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
            target.takeDamage(8, ballA.x, ballA.y, 'A');
            totalDamage.A += 8;
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
            target.takeDamage(8, ballA.x, ballA.y, 'A');
            totalDamage.A += 8;
            spawnParticles(target.x, target.y, '#ff6b6b', 15);
            triggerScreenShake(6);
            break;
        }
    }
}

// 检测中毒接触
function checkPoisonTouch() {
    // Poison球 → Sword球 (不同队)
    if (ballB.active && ballA.active && ballB.hp > -999 && ballA.hp > -999 && ballA.poisonDOT <= 0 && !isSameTeam('B', 'A')) {
        const dx = ballA.x - ballB.x, dy = ballA.y - ballB.y;
        if (Math.sqrt(dx * dx + dy * dy) < ballA.radius + ballB.radius + 5) {
            ballA.applyPoison();
            spawnParticles(ballA.x, ballA.y, '#bd93f9', 10);
            const angle = Math.atan2(dy, dx);
            ballA.vx += Math.cos(angle) * 3;
            ballA.vy += Math.sin(angle) * 3;
            ballB.vx -= Math.cos(angle) * 3;
            ballB.vy -= Math.sin(angle) * 3;
        }
    }

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

    // Mage球 → Sword球 (不同队)
    if (ballM.active && ballA.active && ballM.hp > -999 && ballA.hp > -999 && ballA.poisonDOT <= 0 && !isSameTeam('M', 'A')) {
        const dx = ballA.x - ballM.x, dy = ballA.y - ballM.y;
        if (Math.sqrt(dx * dx + dy * dy) < ballA.radius + ballM.radius) {
            ballA.applyPoison();
            spawnParticles(ballA.x, ballA.y, '#bd93f9', 8);
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
        for (const ball of [ballA, ballM, ballB, ballD]) {
            if (!ball.active || ball.hp <= -999) continue;
            if (ball.type === 'B') continue; // Only Poison is immune

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
