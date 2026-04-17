// 全局常量 & 初始化全局变量
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const W = canvas.width, H = canvas.height;
const WALL = 25;

// 游戏状态变量
let gameState = 'countdown';
let gameTime = 0;
let lastTime = performance.now();
let screenShake = { x: 0, y: 0, intensity: 0 };
let totalDamage = { A: 0, M: 0, B: 0, D: 0 };
let gameEndTimeout = null;

// 游戏元素数组
const particles = [];
const bgParticles = [];
const damageNumbers = [];
const poisonPools = [];
const projectiles = [];
const explosions = [];
const swordTrail = [];
const shockwaves = [];

// 球实例（后续在core中初始化）
let ballA, ballM, ballB, ballD;

// 队伍系统
const TEAM_COLORS = {
    none: null,
    red: '#ff4757',
    blue: '#3742fa'
};
let ballTeams = {
    'A': 'none',  // 'none' | 'red' | 'blue'
    'M': 'none',
    'B': 'none',
    'D': 'none'
};
let teamReds = [];  // 红队球列表
let teamBlues = []; // 蓝队球列表

// 获取队伍颜色
function getTeamColor(type) {
    return TEAM_COLORS[ballTeams[type]];
}

// 检查两球是否是同队
function isSameTeam(type1, type2) {
    if (ballTeams[type1] === 'none' || ballTeams[type2] === 'none') return false;
    return ballTeams[type1] === ballTeams[type2];
}

// 检查两球是否是敌人
function isEnemy(type1, type2) {
    if (ballTeams[type1] === 'none' || ballTeams[type2] === 'none') return true;
    return ballTeams[type1] !== ballTeams[type2];
}

// 键盘控制
const keys = {};

// 初始化背景粒子
for (let i = 0; i < 60; i++) {
    bgParticles.push({
        x: Math.random() * W, y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 2 + 0.5, alpha: Math.random() * 0.3 + 0.1
    });
}

// 键盘事件监听
document.addEventListener('keydown', e => {
    keys[e.key.toLowerCase()] = true;
    if (e.key.toLowerCase() === 'r') restart();
});
document.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);