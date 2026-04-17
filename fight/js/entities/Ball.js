// ============================================
// 球基类 Ball Base Class
// ============================================

class Ball {
    constructor(x, y, radius, color, type) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.type = type;

        this.vx = 0;
        this.vy = 0;
        this.hp = 100;
        this.maxHp = 100;
        this.speed = 2.5;
        this.friction = 0.992;

        this.hitFlash = 0;
        this.invincible = 0;
        this.active = false; // 未选择的球不参与战斗
        this.hitShield = 0; // 能抵消伤害的护盾次数

        // 中毒属性（共用）
        this.poisonDOT = 0;
        this.poisonTimer = 0;
        this.poisonDuration = 5;
        this.poisonDamage = 6;
        this.poisonAura = 0;
        this.auraPhase = 0;

        // 冰冻属性（共用）
        this.freezeDuration = 0.8;
        this.freezeImmunity = 0;
        this.isFrozen = 0;

        // AI属性
        this.aiTimer = 0;
        this.stuckTimer = 0;
        this.lastPos = { x, y };
    }

    // 更新方法 - 子类可重写
    update(dt, others) {
        this.updateCommon(dt, others);
    }

    // 共用更新逻辑
    updateCommon(dt, others) {
        if (this.isFrozen > 0) {
            this.isFrozen -= dt;
            this.freezeImmunity = 0.5;
            this.vx *= 0.85;
            this.vy *= 0.85;
            if (this.isFrozen <= 0) {
                this.isFrozen = 0;
            }
        } else {
            this.freezeImmunity = Math.max(0, this.freezeImmunity - dt);
            this.invincible = Math.max(0, this.invincible - dt);
            this.auraPhase += dt * 3;

            if (gameState === 'playing') {
                this.updateAI(others, dt);
            }

            this.vx *= this.friction;
            this.vy *= this.friction;

            const spd = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
            if (spd > this.speed) {
                this.vx = (this.vx / spd) * this.speed;
                this.vy = (this.vy / spd) * this.speed;
            }
            this.x += this.vx;
            this.y += this.vy;
        }

        // 墙体碰撞
        this.handleWallCollision();

        // 中毒持续伤害
        this.updatePoison(dt);

        // 死亡检测
        if (this.hp <= 0 && this.hp > -999) {
            this.onDeath();
        }

        if (this.hitFlash > 0) this.hitFlash -= dt * 4;
    }

    handleWallCollision() {
        if (this.x - this.radius < WALL) {
            this.x = WALL + this.radius;
            this.vx *= -0.95;
        }
        if (this.x + this.radius > W - WALL) {
            this.x = W - WALL - this.radius;
            this.vx *= -0.95;
        }
        if (this.y - this.radius < WALL) {
            this.y = WALL + this.radius;
            this.vy *= -0.95;
        }
        if (this.y + this.radius > H - WALL) {
            this.y = H - WALL - this.radius;
            this.vy *= -0.95;
        }
    }

    updatePoison(dt) {
        if (this.poisonDOT > 0) {
            this.hp -= this.poisonDamage * dt;
            this.poisonTimer -= dt;
            this.poisonAura = Math.sin(this.auraPhase) * 0.3 + 0.7;
            if (this.poisonTimer <= 0) {
                this.poisonDOT = 0;
                this.poisonAura = 0;
            }
        }
    }

    onDeath() {
        this.hp = -1000;
        this.active = false; // 死亡后禁用
        spawnParticles(this.x, this.y, this.color, 30);
        if (this.type === 'B') {
            createPoisonPool(this.x, this.y, 'B');
        }
        checkWinner();
    }

    // AI更新 - 子类重写
    updateAI(others, dt) {
        this.aiTimer -= dt;
        if (this.aiTimer > 0) return;
        this.aiTimer = 0.05 + Math.random() * 0.1;

        const nearest = this.findNearest(others);
        if (!nearest) return;

        const dx = nearest.x - this.x;
        const dy = nearest.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // 防止卡住
        this.handleStuck(dt);

        // 避开毒池
        this.avoidPoisonPools();
    }

    handleStuck(dt) {
        const moved = Math.abs(this.x - this.lastPos.x) + Math.abs(this.y - this.lastPos.y);
        if (moved < 0.5) {
            this.stuckTimer += dt;
            if (this.stuckTimer > 0.5) {
                this.vx += (Math.random() - 0.5) * 3;
                this.vy += (Math.random() - 0.5) * 3;
                this.stuckTimer = 0;
            }
        } else {
            this.stuckTimer = 0;
        }
        this.lastPos.x = this.x;
        this.lastPos.y = this.y;
    }

    avoidPoisonPools() {
        let avoidX = 0, avoidY = 0;
        if (this.type !== 'B') {
            for (const pool of poisonPools) {
                const pdx = this.x - pool.x;
                const pdy = this.y - pool.y;
                const pdist = Math.sqrt(pdx * pdx + pdy * pdy);
                if (pdist < pool.radius * 2.5) {
                    avoidX += (pdx / pdist) * 3;
                    avoidY += (pdy / pdist) * 3;
                }
            }
        }
        this.vx += avoidX * 0.4;
        this.vy += avoidY * 0.4;
    }

    findNearest(others) {
        let nearest = null;
        let minDist = Infinity;
        for (const o of others) {
            if (o === this || !o.active || o.hp <= -999) continue;
            // 队伍模式下只找敌人
            if (!isEnemy(this.type, o.type)) continue;
            const dx = o.x - this.x;
            const dy = o.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < minDist) {
                minDist = dist;
                nearest = o;
            }
        }
        return nearest;
    }

    takeDamage(amount, fromX, fromY, attackerType = null) {
        if (this.invincible > 0) return;

        // 检查hitShield护盾（能抵消3次伤害）
        if (this.hitShield > 0) {
            this.hitShield--;
            spawnParticles(this.x, this.y, '#00bfff', 12);
            spawnDamageNumber(this.x, this.y - this.radius - 20, 'BLOCKED');
            if (this.hitShield > 0) {
                spawnDamageNumber(this.x + 15, this.y - this.radius - 25, `${this.hitShield}`);
            }
            return;
        }

        this.hp -= amount;
        this.hitFlash = 1;
        this.invincible = 0.05;
        spawnDamageNumber(this.x, this.y - this.radius - 15, Math.round(amount));
        const angle = Math.atan2(this.y - fromY, this.x - fromX);
        spawnParticles(this.x, this.y, this.color, 8, angle);
        triggerScreenShake(amount * 0.25);

        // 记录伤害
        if (attackerType && window.damageDealt) {
            recordDamage(attackerType, this.type, amount);
        }
    }

    applyFreeze(duration) {
        if (this.freezeImmunity > 0) return;
        if (this.isFrozen > 0) return;

        this.isFrozen = duration;
        spawnParticles(this.x, this.y, '#00d9ff', 15);
        spawnDamageNumber(this.x, this.y - this.radius - 30, 'ICE!');
    }

    applyPoison() {
        this.poisonDOT = 1;
        this.poisonTimer = this.poisonDuration;
    }

    // 绘制方法 - 子类重写
    draw() {
        if (!this.active || this.hp <= -999) return;

        ctx.save();

        // 中毒光环
        this.drawPoisonAura();

        // 冰冻效果
        this.drawFreezeEffect();

        // 发光效果
        this.drawGlow();

        // 球本体
        this.drawBody();

        // 高光
        this.drawHighlight();

        // 描边
        this.drawOutline();

        // 队伍指示器（头顶三角）
        this.drawTeamIndicator();

        // 类型标记
        this.drawTypeLabel();

        ctx.restore();
    }

    drawPoisonAura() {
        if (this.poisonDOT > 0) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius + 15, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(189, 147, 249, ${this.poisonAura * 0.4})`;
            ctx.fill();
        }
    }

    drawFreezeEffect() {
        if (this.isFrozen > 0) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius + 12, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(0, 217, 255, ${0.4 + Math.sin(performance.now() / 80) * 0.2})`;
            ctx.fill();

            ctx.save();
            ctx.translate(this.x, this.y);
            for (let i = 0; i < 6; i++) {
                ctx.rotate(Math.PI / 3);
                ctx.fillStyle = `rgba(0, 217, 255, ${0.5 + Math.sin(performance.now() / 100 + i) * 0.3})`;
                ctx.fillRect(-2, this.radius + 5, 4, 10);
            }
            ctx.restore();
        }
    }

    drawGlow() {
        const glowSize = this.radius * 1.8;
        const glow = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, glowSize);
        glow.addColorStop(0, this.color + '50');
        glow.addColorStop(0.5, this.color + '20');
        glow.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.arc(this.x, this.y, glowSize, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();
    }

    drawBody() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.hitFlash > 0 ? `rgba(255,255,255,${this.hitFlash})` : (this.invincible > 0 ? this.color + 'aa' : this.color);
        ctx.fill();
    }

    drawHighlight() {
        ctx.beginPath();
        ctx.arc(this.x - this.radius * 0.3, this.y - this.radius * 0.3, this.radius * 0.35, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.fill();
    }

    drawOutline() {
        // 队伍颜色标记 - 更粗更明显的边框
        const teamColor = getTeamColor(this.type);
        if (teamColor) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius + 6, 0, Math.PI * 2);
            ctx.strokeStyle = teamColor;
            ctx.lineWidth = 4;
            ctx.shadowColor = teamColor;
            ctx.shadowBlur = 15;
            ctx.stroke();
            ctx.shadowBlur = 0;
        } else {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius - 2, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(255,255,255,0.2)';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    }

    // 绘制队伍指示器（头顶三角标记）
    drawTeamIndicator() {
        const teamColor = getTeamColor(this.type);
        if (!teamColor) return;

        const indicatorY = this.y - this.radius - 18;
        const size = 8;

        ctx.save();
        ctx.translate(this.x, indicatorY);
        ctx.rotate(Math.PI);

        ctx.beginPath();
        ctx.moveTo(0, size);
        ctx.lineTo(-size * 0.8, -size * 0.5);
        ctx.lineTo(size * 0.8, -size * 0.5);
        ctx.closePath();

        ctx.fillStyle = teamColor;
        ctx.shadowColor = teamColor;
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.restore();
    }

    // 绘制队友连线
    drawTeamLine(otherBall) {
        if (!isSameTeam(this.type, otherBall.type)) return;
        if (otherBall.hp <= -999 || !otherBall.active) return;

        const dx = otherBall.x - this.x;
        const dy = otherBall.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 250) return; // 只画近距离队友连线

        const teamColor = getTeamColor(this.type);
        const alpha = 1 - (dist / 250);

        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(otherBall.x, otherBall.y);
        ctx.strokeStyle = teamColor + Math.floor(alpha * 80).toString(16).padStart(2, '0');
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    drawTypeLabel() {
        const labels = { 'A': 'S', 'M': 'M', 'B': 'P', 'D': 'D' };
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillText(labels[this.type] || this.type, this.x, this.y + 4);
    }
}
