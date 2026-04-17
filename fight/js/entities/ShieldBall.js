// ============================================
// ShieldBall - 护盾球 (Type D)
// ============================================

class ShieldBall extends Ball {
    constructor(x, y, radius, color, type) {
        super(x, y, radius, color, type);

        // 生命值
        this.hp = 400;
        this.maxHp = 400;

        // Shield特有属性
        this.shield = 0;
        this.maxShield = 60;
        this.shieldRegenRate = 8;
        this.shieldRegenDelay = 0.5;
        this.lastDamageTime = 0;
        this.shieldCooldown = 0;
        this.shieldAngle = 0;

        // 移动速度（恒定）
        this.moveSpeed = 1.5;

        // 冲击波技能
        this.shockwaveReady = false;
        this.shieldSurgeCooldown = 0;
        this.SHIELDSURGE_THRESHOLD = 35;
        this.SHIELDSURGE_COST = 25;
        this.SHIELDSURGE_COOLDOWN = 4;

        // 生命过渡
        this.healthTransferCooldown = 0;
        this.HEALTH_TRANSFER_COOLDOWN = 20;
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

            if (gameState === 'playing') {
                this.moveWithConstantSpeed();
            }

            this.x += this.vx;
            this.y += this.vy;

            // 护盾回复
            this.lastDamageTime += dt;
            this.shieldCooldown -= dt;
            this.shieldSurgeCooldown -= dt;
            this.healthTransferCooldown -= dt;

            if (this.shield < this.maxShield) {
                if (this.lastDamageTime > this.shieldRegenDelay) {
                    this.shield = Math.min(this.maxShield, this.shield + this.shieldRegenRate * dt);
                }
            }

            // 检查是否可以使用冲击波技能
            if (this.shield >= this.SHIELDSURGE_THRESHOLD && this.shieldSurgeCooldown <= 0) {
                this.shockwaveReady = true;
            }

            // 释放冲击波
            if (this.shockwaveReady) {
                this.triggerShockwave(others);
            }

            // 生命过渡给低血量友军
            if (this.healthTransferCooldown <= 0) {
                this.tryHealthTransfer(others);
            }

            // 护盾旋转动画
            this.shieldAngle += dt * 0.5;
        }

        this.handleWallCollisionPerfect();
        this.updatePoisonHalf(dt);

        if (this.hp <= 0 && this.hp > -999) {
            this.onDeath();
        }

        if (this.hitFlash > 0) this.hitFlash -= dt * 4;
    }

    triggerShockwave(others) {
        if (this.shield < this.SHIELDSURGE_COST) {
            this.shockwaveReady = false;
            return;
        }

        this.shield -= this.SHIELDSURGE_COST;
        this.shockwaveReady = false;
        this.shieldSurgeCooldown = this.SHIELDSURGE_COOLDOWN;

        createShockwave(this.x, this.y, this.type);

        const allBalls = [ballA, ballM, ballB];
        for (const ally of allBalls) {
            if (!ally.active || ally.hp <= -999) continue;
            if (!isSameTeam(this.type, ally.type)) continue;
            ally.hitShield = 3;
            spawnParticles(ally.x, ally.y, '#00bfff', 20);
            spawnDamageNumber(ally.x, ally.y - ally.radius - 20, 'SHIELD x3');
        }

        spawnDamageNumber(this.x, this.y - this.radius - 30, 'SURGE!');
    }

    tryHealthTransfer(others) {
        const allBalls = [ballA, ballM, ballB];
        let lowestHpAlly = null;
        let lowestHpRatio = 0.25;

        for (const ally of allBalls) {
            if (!ally.active || ally.hp <= -999) continue;
            if (!isSameTeam(this.type, ally.type)) continue;
            if (ally === this) continue;

            const hpRatio = ally.hp / ally.maxHp;
            if (hpRatio < lowestHpRatio) {
                lowestHpRatio = hpRatio;
                lowestHpAlly = ally;
            }
        }

        if (lowestHpAlly && this.hp > 100) {
            const transferAmount = Math.min(100, this.hp - 1);
            if (transferAmount >= 50) {
                this.hp -= transferAmount;
                lowestHpAlly.hp = Math.min(lowestHpAlly.maxHp, lowestHpAlly.hp + transferAmount);
                this.healthTransferCooldown = this.HEALTH_TRANSFER_COOLDOWN;

                spawnParticles(this.x, this.y, '#00bfff', 25);
                spawnParticles(lowestHpAlly.x, lowestHpAlly.y, '#00ffdd', 25);
                spawnDamageNumber(this.x, this.y - this.radius - 20, -transferAmount);
                spawnDamageNumber(lowestHpAlly.x, lowestHpAlly.y - lowestHpAlly.radius - 20, '+' + transferAmount);
                spawnDamageNumber(this.x, this.y - this.radius - 40, 'TRANSFER');
                triggerScreenShake(6);
            }
        }
    }

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

    updatePoisonHalf(dt) {
        if (this.poisonDOT > 0) {
            this.hp -= this.poisonDamage * dt * 0.5;
            this.poisonTimer -= dt;
            this.poisonAura = Math.sin(this.auraPhase) * 0.3 + 0.7;
            if (this.poisonTimer <= 0) {
                this.poisonDOT = 0;
                this.poisonAura = 0;
            }
        }
    }

    takeDamage(amount, fromX, fromY, attackerType = null) {
        if (this.invincible > 0) return;
        this.lastDamageTime = 0;

        if (this.shield > 0) {
            const shieldAbsorb = Math.min(this.shield, amount);
            this.shield -= shieldAbsorb;
            amount -= shieldAbsorb;
            if (shieldAbsorb > 0) {
                spawnParticles(this.x, this.y, '#00bfff', 5);
                spawnDamageNumber(this.x, this.y - this.radius - 30, 'BLOCK');
            }
        }

        if (amount <= 0) {
            this.hitFlash = 0.5;
            this.invincible = 0.05;
            return;
        }

        this.hp -= amount;
        this.hitFlash = 1;
        this.invincible = 0.05;
        spawnDamageNumber(this.x, this.y - this.radius - 15, Math.round(amount));
        const angle = Math.atan2(this.y - fromY, this.x - fromX);
        spawnParticles(this.x, this.y, this.color, 8, angle);
        triggerScreenShake(amount * 0.25);

        if (attackerType && window.damageDealt) {
            recordDamage(attackerType, this.type, amount);
        }
    }

    draw() {
        if (!this.active || this.hp <= -999) return;

        ctx.save();

        this.drawPoisonAura();
        this.drawFreezeEffect();

        const glowSize = this.radius * 1.8;
        const glow = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, glowSize);
        glow.addColorStop(0, this.color + '50');
        glow.addColorStop(0.5, this.color + '20');
        glow.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.arc(this.x, this.y, glowSize, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.hitFlash > 0 ? `rgba(255,255,255,${this.hitFlash})` : (this.invincible > 0 ? this.color + 'aa' : this.color);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(this.x - this.radius * 0.3, this.y - this.radius * 0.3, this.radius * 0.35, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius - 2, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.lineWidth = 2;
        ctx.stroke();

        const teamColor = getTeamColor(this.type);
        if (teamColor) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius + 5, 0, Math.PI * 2);
            ctx.strokeStyle = teamColor;
            ctx.lineWidth = 3;
            ctx.shadowColor = teamColor;
            ctx.shadowBlur = 10;
            ctx.stroke();
            ctx.shadowBlur = 0;
        }

        if (this.shield > 0) {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.shieldAngle);

            const shieldRatio = this.shield / this.maxShield;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius + 10, 0, Math.PI * 2 * shieldRatio);
            ctx.strokeStyle = `rgba(0, 191, 255, ${0.6 + Math.sin(performance.now() / 100) * 0.2})`;
            ctx.lineWidth = 6;
            ctx.shadowColor = '#00bfff';
            ctx.shadowBlur = 15;
            ctx.stroke();

            if (shieldRatio < 1) {
                ctx.beginPath();
                ctx.arc(0, 0, this.radius + 10, Math.PI * 2 * shieldRatio, Math.PI * 2);
                ctx.strokeStyle = 'rgba(0, 191, 255, 0.2)';
                ctx.lineWidth = 4;
                ctx.stroke();
            }

            ctx.restore();
        }

        // 冲击波就绪提示
        if (this.shockwaveReady) {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.shieldAngle * 3);
            ctx.beginPath();
            ctx.arc(0, 0, this.radius + 18, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(0, 255, 220, ${0.5 + Math.sin(performance.now() / 100) * 0.3})`;
            ctx.lineWidth = 2;
            ctx.setLineDash([8, 4]);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.restore();
        }

        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillText('D', this.x, this.y + 4);

        ctx.restore();
    }
}
