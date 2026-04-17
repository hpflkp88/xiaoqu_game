// ============================================
// MageBall - 法师球 (Type M)
// ============================================

class MageBall extends Ball {
    constructor(x, y, radius, color, type) {
        super(x, y, radius, color, type);

        // 生命值
        this.hp = 200;
        this.maxHp = 200;

        // Mage特有属性
        this.fireCooldown = 0;
        this.fireRate = 1.2;
        this.projectileSpeed = 4;
        this.projectileDamage = 20;
        this.mageAngle = 0;

        // 移动速度（恒定）
        this.moveSpeed = 1.25;
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

            // 法师瞄准
            const nearest = this.findNearest(others);
            if (nearest) {
                const dx = nearest.x - this.x;
                const dy = nearest.y - this.y;
                this.mageAngle = Math.atan2(dy, dx);
            }
            this.fireCooldown -= dt;
            if (this.fireCooldown <= 0 && gameState === 'playing' && !this.isFrozen) {
                this.fireProjectile(others);
                this.fireCooldown = this.fireRate;
            }
        }

        // 完美弹性墙壁碰撞
        this.handleWallCollisionPerfect();

        // 中毒持续伤害
        this.updatePoison(dt);

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

    fireProjectile(others) {
        const nearest = this.findNearest(others);
        if (!nearest) return;

        const dx = nearest.x - this.x;
        const dy = nearest.y - this.y;
        const angle = Math.atan2(dy, dx);

        projectiles.push({
            x: this.x + Math.cos(angle) * (this.radius + 10),
            y: this.y + Math.sin(angle) * (this.radius + 10),
            vx: Math.cos(angle) * this.projectileSpeed,
            vy: Math.sin(angle) * this.projectileSpeed,
            radius: 8,
            damage: this.projectileDamage,
            owner: this.type,
            trail: [],
            reflected: false
        });
        spawnParticles(
            this.x + Math.cos(angle) * (this.radius + 10),
            this.y + Math.sin(angle) * (this.radius + 10),
            '#8b5cf6', 6
        );
    }

    draw() {
        if (!this.active || this.hp <= -999) return;

        ctx.save();

        // 中毒光环
        this.drawPoisonAura();

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

        // Mage的法杖绘制
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.mageAngle);
        ctx.strokeStyle = '#c4b5fd';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#8b5cf6';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(this.radius * 0.5, 0);
        ctx.lineTo(this.radius + 15, 0);
        ctx.stroke();
        ctx.fillStyle = '#8b5cf6';
        ctx.beginPath();
        ctx.arc(this.radius + 15, 0, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // 眼睛
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(this.x - 5, this.y - 4, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this.x + 5, this.y - 4, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#1a1a2e';
        ctx.beginPath();
        ctx.arc(this.x - 4, this.y - 4, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this.x + 6, this.y - 4, 2, 0, Math.PI * 2);
        ctx.fill();

        // 类型标记
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillText('M', this.x, this.y + 4);

        ctx.restore();
    }
}
