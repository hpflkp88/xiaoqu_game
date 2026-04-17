// ============================================
// SwordBall - 剑球 (Type A)
// ============================================

class SwordBall extends Ball {
    constructor(x, y, radius, color, type) {
        super(x, y, radius, color, type);

        // 生命值
        this.hp = 300;
        this.maxHp = 300;

        // Sword特有属性
        this.swordAngle = 0;
        this.swordAngle2 = Math.PI; // 第二把剑（相反方向）
        this.swordLength = radius * 3.2;
        this.swordWidth = 7;
        this.swordRotSpeed = 3;
        this.isSticking = false;
        this.stickTarget = null;
        this.stickHits = 0;
        this.stickTimer = 0;

        // 移动速度（恒定）
        this.moveSpeed = 1.5625;
    }

    update(dt, others) {
        // 剑球不受冰冻效果影响（全程免疫）
        // 剑球不受毒雾减速影响（移动速度不变）

        this.invincible = Math.max(0, this.invincible - dt);
        this.auraPhase += dt * 3;

        // 血量越低，剑的旋转速度越快（最低50%血量时达到2倍速度）
        const hpPercent = this.hp / this.maxHp;
        const speedMultiplier = 1 + (1 - hpPercent) * 1;

        // 恒定速度移动（无AI控制，不受毒雾减速影响）
        if (gameState === 'playing') {
            this.moveWithConstantSpeed();
        }

        this.x += this.vx;
        this.y += this.vy;

        // 剑的旋转（血量越低转速越快）
        this.swordAngle += this.swordRotSpeed * speedMultiplier * dt;
        this.swordAngle2 += this.swordRotSpeed * speedMultiplier * dt;
        const tipX = this.x + Math.cos(this.swordAngle) * this.swordLength;
        const tipY = this.y + Math.sin(this.swordAngle) * this.swordLength;
        swordTrail.push({ x: tipX, y: tipY, alpha: 1, color: '#ff6b6b' });
        if (swordTrail.length > 12) swordTrail.shift();
        // 第二把剑的轨迹
        const tipX2 = this.x + Math.cos(this.swordAngle2) * this.swordLength;
        const tipY2 = this.y + Math.sin(this.swordAngle2) * this.swordLength;
        swordTrail.push({ x: tipX2, y: tipY2, alpha: 1, color: '#ff6b6b' });
        if (swordTrail.length > 24) swordTrail.shift();

        // 完美弹性墙壁碰撞
        this.handleWallCollisionPerfect();

        // 中毒持续伤害（不吃毒雾减速，但仍然受毒伤）
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

    getSwordTip() {
        return {
            x: this.x + Math.cos(this.swordAngle) * this.swordLength,
            y: this.y + Math.sin(this.swordAngle) * this.swordLength
        };
    }

    getSwordTip2() {
        return {
            x: this.x + Math.cos(this.swordAngle2) * this.swordLength,
            y: this.y + Math.sin(this.swordAngle2) * this.swordLength
        };
    }

    // 检测剑是否阻挡投射物（返回是否阻挡）
    blocksProjectile(px, py, pradius) {
        if (!this.active || this.hp <= -999) return false;

        const swordWidthHalf = this.swordWidth / 2 + pradius;

        // 检查两把剑
        const tips = [this.getSwordTip(), this.getSwordTip2()];
        for (const tip of tips) {
            // 剑是沿半径方向的，判断点到线段的距离
            const dist = this.pointToSegmentDistance(px, py, this.x, this.y, tip.x, tip.y);
            if (dist < swordWidthHalf) {
                return true;
            }
        }
        return false;
    }

    // 点到线段的距离
    pointToSegmentDistance(px, py, x1, y1, x2, y2) {
        const dx = x2 - x1, dy = y2 - y1;
        const lenSq = dx * dx + dy * dy;
        if (lenSq === 0) return Math.sqrt((px - x1) ** 2 + (py - y1) ** 2);

        let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
        t = Math.max(0, Math.min(1, t));

        const nearX = x1 + t * dx, nearY = y1 + t * dy;
        return Math.sqrt((px - nearX) ** 2 + (py - nearY) ** 2);
    }

    draw() {
        if (!this.active || this.hp <= -999) return;

        ctx.save();

        // 中毒光环
        this.drawPoisonAura();

        // 冰冻效果
        this.drawFreezeEffect();

        // 发光效果
        const glowSize = this.radius * (this.isSticking ? 2.5 : 1.8);
        const glow = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, glowSize);
        glow.addColorStop(0, this.color + '50');
        glow.addColorStop(0.5, this.color + '20');
        glow.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.arc(this.x, this.y, glowSize, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();

        // 剑的吸附目标高亮
        if (this.isSticking && this.stickTarget && this.stickTarget.hp > -999) {
            ctx.beginPath();
            ctx.arc(this.stickTarget.x, this.stickTarget.y, this.stickTarget.radius + 8, 0, Math.PI * 2);
            ctx.strokeStyle = '#ff6b6b';
            ctx.lineWidth = 3;
            ctx.setLineDash([8, 4]);
            ctx.stroke();
            ctx.setLineDash([]);
        }

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

        // Sword的剑绘制
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.swordAngle);
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 15;
        ctx.fillStyle = '#e8e8e8';
        ctx.fillRect(this.radius * 0.6, -this.swordWidth / 2, this.swordLength - this.radius * 0.5, this.swordWidth);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(this.radius * 0.6, -this.swordWidth / 2, this.swordLength - this.radius * 0.5, 2);
        ctx.beginPath();
        ctx.moveTo(this.swordLength + 5, 0);
        ctx.lineTo(this.swordLength - 10, -10);
        ctx.lineTo(this.swordLength - 10, 10);
        ctx.closePath();
        ctx.fillStyle = '#e8e8e8';
        ctx.fill();
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(this.radius * 0.4, -this.swordWidth - 3, 6, this.swordWidth * 2 + 6);
        ctx.restore();

        // 第二把剑
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.swordAngle2);
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 15;
        ctx.fillStyle = '#e8e8e8';
        ctx.fillRect(this.radius * 0.6, -this.swordWidth / 2, this.swordLength - this.radius * 0.5, this.swordWidth);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(this.radius * 0.6, -this.swordWidth / 2, this.swordLength - this.radius * 0.5, 2);
        ctx.beginPath();
        ctx.moveTo(this.swordLength + 5, 0);
        ctx.lineTo(this.swordLength - 10, -10);
        ctx.lineTo(this.swordLength - 10, 10);
        ctx.closePath();
        ctx.fillStyle = '#e8e8e8';
        ctx.fill();
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(this.radius * 0.4, -this.swordWidth - 3, 6, this.swordWidth * 2 + 6);
        ctx.restore();

        // 类型标记
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillText('S', this.x, this.y + 4);

        ctx.restore();
    }
}
