// ============================================
// PoisonBall - 毒球 (Type B)
// ============================================

class PoisonBall extends Ball {
    constructor(x, y, radius, color, type) {
        super(x, y, radius, color, type);

        // 生命值
        this.hp = 250;

        this.maxHp = 250;

        this.moveSpeed = 1.25;
        this.cloudCooldown = 0; // 毒云冷却时间
        this.cloudReadyTimer = 0; // 记录冷却好后等待的时间
        this.cloudHealRate = 8; // 毒云中每秒回复生命值
    }

    update(dt, others) {
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

            // 恒定速度移动（无AI控制）
            if (gameState === 'playing') {
                this.moveWithConstantSpeed();
            }

            this.x += this.vx;
            this.y += this.vy;
        }

        // 完美弹性墙壁碰撞
        this.handleWallCollisionPerfect();

        // 中毒持续伤害
        this.updatePoison(dt);

        // 在毒云中回血
        for (const pool of poisonPools) {
            const dx = this.x - pool.x, dy = this.y - pool.y;
            if (dx * dx + dy * dy < (pool.radius + this.radius) ** 2) {
                if (this.hp < this.maxHp) {
                    this.hp = Math.min(this.maxHp, this.hp + this.cloudHealRate * dt);
                }
                break;
            }
        }

        // 毒云冷却
        if (this.cloudCooldown > 0) {
            this.cloudCooldown -= dt;
            this.cloudReadyTimer = 0;
        } else {
            // 冷却好后等待5秒自动释放
            this.cloudReadyTimer += dt;
            if (this.cloudReadyTimer >= 5) {
                createPoisonCloud(this.x, this.y, 'B');
                this.cloudCooldown = 3;
                this.cloudReadyTimer = 0;
            }
        }

        // 死亡检测
        if (this.hp <= 0 && this.hp > -999) {
            this.onDeath();
        }

        if (this.hitFlash > 0) this.hitFlash -= dt * 4;
    }

    // 恒定速度移动
    moveWithConstantSpeed() {
        const spd = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (spd < 0.1) {
            const angle = Math.random() * Math.PI * 2;
            this.vx = Math.cos(angle) * this.moveSpeed;
            this.vy = Math.sin(angle) * this.moveSpeed;
        } else if (spd !== this.moveSpeed) {
            this.vx = (this.vx / spd) * this.moveSpeed;
            this.vy = (this.vy / spd) * this.moveSpeed;
        }
    }

    // 完美弹性墙壁碰撞
    handleWallCollisionPerfect() {
        if (this.x - this.radius < WALL) {
            this.x = WALL + this.radius;
            this.vx *= -1;
        }
        if (this.x + this.radius > W - WALL) {
            this.x = W - WALL - this.radius;
            this.vx *= -1;
        }
        if (this.y - this.radius < WALL) {
            this.y = WALL + this.radius;
            this.vy *= -1;
        }
        if (this.y + this.radius > H - WALL) {
            this.y = H - WALL - this.radius;
            this.vy *= -1;
        }
    }

    draw() {
        if (!this.active || this.hp <= -999) return;

        ctx.save();

        // 中毒光环（自身也有）
        if (this.poisonDOT > 0) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius + 15, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(189, 147, 249, ${this.poisonAura * 0.4})`;
            ctx.fill();
        }

        // 冰冻效果
        this.drawFreezeEffect();

        // 发光效果
        const glowSize = this.radius * 1.8;
        const glow = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, glowSize);
        glow.addColorStop(0, this.color + '50');
        glow.addColorStop(0.5, this.color + '20');
        glow.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.arc(this.x, this.y, glowSize, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();

        // 球本体
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.hitFlash > 0 ? `rgba(255,255,255,${this.hitFlash})` : (this.invincible > 0 ? this.color + 'aa' : this.color);
        ctx.fill();

        // 高光
        ctx.beginPath();
        ctx.arc(this.x - this.radius * 0.3, this.y - this.radius * 0.3, this.radius * 0.35, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.fill();

        // 描边
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius - 2, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Poison的气泡
        for (let i = 0; i < 3; i++) {
            const bx = this.x + Math.sin(performance.now() / 200 + i * 2) * 10;
            const by = this.y + Math.cos(performance.now() / 200 + i * 2) * 10;
            ctx.beginPath();
            ctx.arc(bx, by, 3, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(189, 147, 249, ${0.3 + Math.sin(performance.now() / 100 + i) * 0.2})`;
            ctx.fill();
        }

        // 类型标记
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillText('P', this.x, this.y + 4);

        ctx.restore();
    }
}
