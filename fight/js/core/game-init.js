// ============================================
// 游戏初始化 Game Init
// ============================================

// 初始化游戏
function init() {
    // 重置队伍
    ballTeams = { 'A': 'none', 'M': 'none', 'B': 'none', 'D': 'none' };
    teamReds = [];
    teamBlues = [];

    ballA = new SwordBall(120, 180, 22, '#ff6b6b', 'A');
    ballM = new MageBall(W / 2, 120, 20, '#8b5cf6', 'M');
    ballB = new PoisonBall(W - 120, H - 180, 22, '#50fa7b', 'B');
    ballD = new ShieldBall(W / 2, H - 120, 24, '#00bfff', 'D'); // Shield ball

    // 清空数组
    poisonPools.length = 0;
    particles.length = 0;
    damageNumbers.length = 0;
    projectiles.length = 0;
    explosions.length = 0;
    swordTrail.length = 0;
    shockwaves.length = 0;

    // 重置游戏状态 - 先进入选人阶段
    gameState = 'selecting';
    gameTime = 0;
    totalDamage = { A: 0, M: 0, B: 0, D: 0 };
    screenShake = { x: 0, y: 0, intensity: 0 };

    // 详细伤害记录
    initDamageTracking();

    if (gameEndTimeout) {
        clearTimeout(gameEndTimeout);
        gameEndTimeout = null;
    }

    // 重置UI
    document.getElementById('winner').style.display = 'none';
    document.getElementById('restartBtn').style.display = 'none';
    document.getElementById('countdown').style.display = 'none';
    document.getElementById('healthSword').style.width = '100%';
    document.getElementById('healthMage').style.width = '100%';
    document.getElementById('healthPoison').style.width = '100%';
    document.getElementById('healthShield').style.width = '100%';
    document.getElementById('hpSword').textContent = '100';
    document.getElementById('hpMage').textContent = '100';
    document.getElementById('hpPoison').textContent = '100';
    document.getElementById('hpShield').textContent = '100';

    // 显示选人界面
    showTeamSelection();
}

// 开始战斗（从选人界面调用）
function startBattle() {
    // 检查是否每队至少有一个球
    const reds = Object.entries(ballTeams).filter(([_, t]) => t === 'red').length;
    const blues = Object.entries(ballTeams).filter(([_, t]) => t === 'blue').length;

    if (reds === 0 || blues === 0) {
        alert('每个队伍至少需要一名球员！\nEach team needs at least one ball!');
        return;
    }

    // 更新队伍列表
    teamReds = Object.keys(ballTeams).filter(t => ballTeams[t] === 'red');
    teamBlues = Object.keys(ballTeams).filter(t => ballTeams[t] === 'blue');

    // 设置球是否激活（只激活有队伍的球）
    const allBalls = { 'A': ballA, 'M': ballM, 'B': ballB, 'D': ballD };
    for (const [type, ball] of Object.entries(allBalls)) {
        ball.active = ballTeams[type] !== 'none';
    }

    // 隐藏选人界面
    document.getElementById('teamSelection').style.display = 'none';

    // 设置初始位置 - 红队左边，蓝队右边
    setupTeamPositions();

    // 设置初始速度（所有球：随机方向恒定速度移动）
    const angleA = Math.random() * Math.PI * 2;
    const angleM = Math.random() * Math.PI * 2;
    const angleB = Math.random() * Math.PI * 2;
    const angleD = Math.random() * Math.PI * 2;
    ballA.vx = Math.cos(angleA) * ballA.moveSpeed;
    ballA.vy = Math.sin(angleA) * ballA.moveSpeed;
    ballM.vx = Math.cos(angleM) * ballM.moveSpeed;
    ballM.vy = Math.sin(angleM) * ballM.moveSpeed;
    ballB.vx = Math.cos(angleB) * ballB.moveSpeed;
    ballB.vy = Math.sin(angleB) * ballB.moveSpeed;
    ballD.vx = Math.cos(angleD) * ballD.moveSpeed;
    ballD.vy = Math.sin(angleD) * ballD.moveSpeed;

    startCountdown();
}

// 设置队伍位置
function setupTeamPositions() {
    // 红队放在左边区域，蓝队放在右边区域
    const redTypes = Object.keys(ballTeams).filter(t => ballTeams[t] === 'red');
    const blueTypes = Object.keys(ballTeams).filter(t => ballTeams[t] === 'blue');

    const allBalls = { 'A': ballA, 'M': ballM, 'B': ballB, 'D': ballD };

    // 红队位置 - 左侧垂直分布
    const redPositions = [
        { x: 60, y: 80 },
        { x: 60, y: 200 },
        { x: 60, y: 320 }
    ];
    // 蓝队位置 - 右侧垂直分布
    const bluePositions = [
        { x: W - 60, y: 80 },
        { x: W - 60, y: 200 },
        { x: W - 60, y: 320 }
    ];

    redTypes.forEach((type, i) => {
        if (allBalls[type] && redPositions[i]) {
            allBalls[type].x = redPositions[i].x;
            allBalls[type].y = redPositions[i].y;
        }
    });

    blueTypes.forEach((type, i) => {
        if (allBalls[type] && bluePositions[i]) {
            allBalls[type].x = bluePositions[i].x;
            allBalls[type].y = bluePositions[i].y;
        }
    });
}

// 显示队伍选择界面
function showTeamSelection() {
    let sel = document.getElementById('teamSelection');
    if (!sel) {
        sel = document.createElement('div');
        sel.id = 'teamSelection';
        document.getElementById('gameContainer').appendChild(sel);
    }

    const balls = [
        { type: 'A', name: 'SWORD', color: '#ff6b6b' },
        { type: 'M', name: 'MAGE', color: '#8b5cf6' },
        { type: 'B', name: 'POISON', color: '#50fa7b' },
        { type: 'D', name: 'SHIELD', color: '#00bfff' }
    ];

    sel.innerHTML = `
        <div class="selection-title">SELECT TEAMS</div>
        <div class="selection-container">
            <div class="team-panel red-panel">
                <div class="team-name">RED TEAM</div>
                <div class="team-balls" id="redTeamBalls"></div>
            </div>
            <div class="selection-center">
                <div class="available-balls">
                    <div class="available-title">AVAILABLE</div>
                    <div id="availableBalls"></div>
                </div>
                <button id="startBattleBtn" class="start-btn">START BATTLE</button>
                <button id="randomBtn" class="random-btn">RANDOM</button>
            </div>
            <div class="team-panel blue-panel">
                <div class="team-name">BLUE TEAM</div>
                <div class="team-balls" id="blueTeamBalls"></div>
            </div>
        </div>
    `;

    sel.style.display = 'flex';

    // 渲染可用球员
    function renderAvailable() {
        const container = document.getElementById('availableBalls');
        if (!container) return;
        container.innerHTML = '';
        balls.forEach(ball => {
            if (ballTeams[ball.type] === 'none') {
                const div = document.createElement('div');
                div.className = 'select-ball';
                div.style.background = ball.color;
                div.innerHTML = `<span>${ball.name.charAt(0)}</span>`;
                div.title = ball.name;
                div.onclick = () => cycleTeam(ball.type);
                container.appendChild(div);
            }
        });
    }

    // 渲染红队
    function renderRedTeam() {
        const container = document.getElementById('redTeamBalls');
        if (!container) return;
        container.innerHTML = '';
        balls.forEach(ball => {
            if (ballTeams[ball.type] === 'red') {
                const div = document.createElement('div');
                div.className = 'select-ball in-team';
                div.style.background = ball.color;
                div.style.boxShadow = '0 0 15px #ff4757';
                div.innerHTML = `<span>${ball.name}</span>`;
                div.onclick = () => cycleTeam(ball.type);
                container.appendChild(div);
            }
        });
    }

    // 渲染蓝队
    function renderBlueTeam() {
        const container = document.getElementById('blueTeamBalls');
        if (!container) return;
        container.innerHTML = '';
        balls.forEach(ball => {
            if (ballTeams[ball.type] === 'blue') {
                const div = document.createElement('div');
                div.className = 'select-ball in-team';
                div.style.background = ball.color;
                div.style.boxShadow = '0 0 15px #3742fa';
                div.innerHTML = `<span>${ball.name}</span>`;
                div.onclick = () => cycleTeam(ball.type);
                container.appendChild(div);
            }
        });
    }

    function renderAll() {
        renderAvailable();
        renderRedTeam();
        renderBlueTeam();
    }

    // 循环队伍: none -> red -> blue -> none
    window.cycleTeam = function(type) {
        const current = ballTeams[type];
        if (current === 'none') {
            ballTeams[type] = 'red';
        } else if (current === 'red') {
            ballTeams[type] = 'blue';
        } else {
            ballTeams[type] = 'none';
        }
        renderAll();
    };

    // 随机分配
    window.randomTeams = function() {
        const types = ['A', 'M', 'B', 'D'];
        // 随机洗牌
        for (let i = types.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [types[i], types[j]] = [types[j], types[i]];
        }
        // 前两个红队，后两个蓝队
        ballTeams['A'] = 'none';
        ballTeams['M'] = 'none';
        ballTeams['B'] = 'none';
        ballTeams['D'] = 'none';
        ballTeams[types[0]] = 'red';
        ballTeams[types[1]] = 'red';
        ballTeams[types[2]] = 'blue';
        ballTeams[types[3]] = 'blue';
        renderAll();
    };

    // 按钮事件
    setTimeout(() => {
        document.getElementById('startBattleBtn').onclick = startBattle;
        document.getElementById('randomBtn').onclick = randomTeams;
        renderAll();
    }, 0);
}

// 倒计时
function startCountdown() {
    const countdownEl = document.getElementById('countdown');
    let count = 3;
    function showCount() {
        countdownEl.style.display = 'block';
        countdownEl.textContent = count;
        countdownEl.style.animation = 'none';
        countdownEl.offsetHeight;
        countdownEl.style.animation = 'countPulse 1s ease-out';

        if (count > 0) {
            count--;
            setTimeout(showCount, 1000);
        } else {
            countdownEl.textContent = 'FIGHT!';
            countdownEl.style.color = '#f1fa8c';
            setTimeout(() => {
                countdownEl.style.display = 'none';
                countdownEl.style.color = '#fff';
                gameState = 'playing';
            }, 800);
        }
    }
    showCount();
}

// 重启游戏
function restart() {
    init();
}

// ============================================
// 伤害跟踪系统 Damage Tracking System
// ============================================

const TYPES = ['A', 'M', 'B', 'D'];
const TYPE_NAMES = { 'A': 'SWORD', 'M': 'MAGE', 'B': 'POISON', 'D': 'SHIELD' };
const TYPE_CLASS = { 'A': 'sword', 'M': 'mage', 'B': 'poison', 'D': 'shield' };

// 初始化伤害跟踪数据结构
function initDamageTracking() {
    window.damageDealt = {};
    window.damageTaken = {};

    for (const t1 of TYPES) {
        damageDealt[t1] = {};
        damageTaken[t1] = {};
        for (const t2 of TYPES) {
            if (t1 !== t2) {
                damageDealt[t1][t2] = 0;
                damageTaken[t1][t2] = 0;
            }
        }
    }
}

// 记录伤害
function recordDamage(attacker, target, amount) {
    if (!damageDealt[attacker] || !damageTaken[target]) return;
    damageDealt[attacker][target] += amount;
    damageTaken[target][attacker] += amount;
}

// 更新伤害面板UI
function updateDamagePanel() {
    const panel = document.getElementById('damagePanel');
    if (!panel) return;

    if (gameState === 'playing' || gameState === 'waiting') {
        panel.classList.add('visible');
    } else {
        panel.classList.remove('visible');
        return;
    }

    // 更新造成伤害表
    updateDamageTable('damageDealtTable', damageDealt, false);
    // 更新承受伤害表
    updateDamageTable('damageTakenTable', damageTaken, true);
}

function updateDamageTable(tableId, data, isTaken) {
    const container = document.getElementById(tableId);
    if (!container) return;

    const activeBalls = ['A', 'M', 'B', 'D'].filter(t => {
        const ball = window['ball' + t];
        return ball && ball.active;
    });

    // 计算每行的最大值（用于比例条）
    const maxByRow = {};
    for (const t1 of activeBalls) {
        let total = 0;
        for (const t2 of TYPES) {
            if (t1 !== t2 && data[t1] && data[t1][t2] !== undefined) {
                total += data[t1][t2];
            }
        }
        maxByRow[t1] = total || 1;
    }

    let html = '';
    for (const t1 of activeBalls) {
        const rowData = data[t1] || {};
        const maxVal = maxByRow[t1];

        // 计算总伤害
        let total = 0;
        for (const t2 of TYPES) {
            if (t1 !== t2 && rowData[t2] !== undefined) {
                total += rowData[t2];
            }
        }

        html += `<div class="damage-row">`;
        html += `<span class="damage-row-label ${TYPE_CLASS[t1]}">${TYPE_NAMES[t1].substring(0, 3)}</span>`;
        html += `<div class="damage-bars">`;

        for (const t2 of TYPES) {
            if (t1 === t2) continue;
            const val = rowData[t2] || 0;
            const pct = Math.min(100, (val / maxVal) * 100);
            html += `<div class="damage-bar-wrap">
                <div class="damage-bar-fill ${TYPE_CLASS[t2]}" style="width:${pct}%"></div>
            </div>`;
        }

        html += `</div>`;
        html += `<span class="damage-total">${Math.round(total)}</span>`;
        html += `</div>`;
    }

    container.innerHTML = html;
}

// 检测胜利者（队伍模式）
function checkWinner() {
    const allBalls = [ballA, ballM, ballB, ballD];
    const aliveByTeam = { red: 0, blue: 0 };

    for (const ball of allBalls) {
        if (ball.active && ball.hp > -999) {
            const team = ballTeams[ball.type];
            if (team === 'red') aliveByTeam.red++;
            else if (team === 'blue') aliveByTeam.blue++;
        }
    }

    const redAlive = aliveByTeam.red;
    const blueAlive = aliveByTeam.blue;

    if (redAlive > 0 && blueAlive === 0) {
        gameState = 'waiting';
        if (gameEndTimeout) clearTimeout(gameEndTimeout);
        gameEndTimeout = setTimeout(() => endGame('red'), 500);
    } else if (blueAlive > 0 && redAlive === 0) {
        gameState = 'waiting';
        if (gameEndTimeout) clearTimeout(gameEndTimeout);
        gameEndTimeout = setTimeout(() => endGame('blue'), 500);
    } else if (redAlive === 0 && blueAlive === 0) {
        gameState = 'ended';
        const winnerEl = document.getElementById('winner'), textEl = document.getElementById('winnerText');
        winnerEl.style.display = 'block';
        document.getElementById('restartBtn').style.display = 'block';
        winnerEl.className = 'draw';
        textEl.textContent = 'DRAW';
    }
}

// 结束游戏
function endGame(winner) {
    gameState = 'ended';
    const winnerEl = document.getElementById('winner'), textEl = document.getElementById('winnerText');
    winnerEl.style.display = 'block';
    document.getElementById('restartBtn').style.display = 'block';

    if (winner === 'red') {
        winnerEl.className = 'red-win';
        textEl.textContent = 'RED TEAM WINS';
    } else if (winner === 'blue') {
        winnerEl.className = 'blue-win';
        textEl.textContent = 'BLUE TEAM WINS';
    } else {
        winnerEl.className = 'draw';
        textEl.textContent = 'DRAW';
    }
}
