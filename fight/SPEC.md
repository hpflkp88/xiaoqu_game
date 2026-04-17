# Fight Game - 2D Ball Combat (Team Battle)

## Project Overview
- **Project Name**: Fight
- **Type**: 2D Physics-based Combat Game
- **Core Functionality**: Two teams of AI-controlled balls battle in an enclosed arena. Players select team composition before battle.
- **Target Users**: Casual viewers / spectators

## Visual & Rendering Specification

### Canvas Setup
- **Resolution**: 900x600 pixels
- **Background**: Dark (#0a0a0f) with subtle grid pattern
- **Border**: Gradient neon walls (pink/cyan)

### Color Palette
- **Ball A (Sword)**: Coral red (#ff6b6b), white sword
- **Ball B (Poison)**: Toxic green (#50fa7b), purple pools
- **Ball M (Mage)**: Purple (#8b5cf6), cyan projectiles
- **Health bars**: Gradient colored per ball type
- **Poison pools**: Semi-transparent purple with pulsing animation
- **Damage numbers**: Yellow (#f1fa8c), Cyan for FREEZE text

### Visual Effects
- Screen shake on damage
- Particle explosions on hits
- Sword rotation trail
- Poison aura on poisoned balls
- Freeze effect with ice crystals
- Projectile trails
- Explosion shockwaves
- Background ambient particles

## Game Mechanics Specification

### Arena
- Size: 900x600 pixels with 25px thick walls
- Elastic collision with walls (coefficient: 0.95)

### Ball A - Sword Ball (Physics: Bouncing)
- **Radius**: 22px, **Health**: 100 HP, **Speed**: 1.25 px/frame (constant)
- **Movement**: 无AI控制，随机方向出发，碰墙/球完美弹性反弹
- **Collision Damage**: 6
- **Sword**: 双剑，长度3.2x半径，相向旋转3 rad/s
- **Stick Attack**: On hit, sticks for 4 hits dealing 8 damage each (32 total)

### Ball M - Mage Ball (Physics: Bouncing)
- **Radius**: 20px, **Health**: 100 HP, **Speed**: 1.25 px/frame (constant)
- **Movement**: 无AI控制，随机方向出发，碰墙/球完美弹性反弹
- **Collision Damage**: 3
- **Projectile**:
  - Fires every 1.8 seconds
  - Speed: 5 px/frame
  - Damage: 10 HP
  - **Wall Reflect**: 可弹墙反射一次
  - **On hit**: Creates explosion + Freezes target for 0.8 seconds
- **Contact**: Applies poison on touch with Sword/Poison balls

### Ball B - Poison Ball (Physics: Bouncing)
- **Radius**: 22px, **Health**: 100 HP, **Speed**: 1.25 px/frame (constant)
- **Movement**: 无AI控制，随机方向出发，碰墙/球完美弹性反弹
- **Collision Damage**: 0
- **Poison Touch**: 4 HP/s for 4 seconds on contact
- **Poison Clouds**:
  - Created on ball collision (with 3 second cooldown)
  - Radius: 35px, Damage: 6 HP/s
  - **Never disappear**

### Ball D - Shield Ball (Physics: Bouncing)
- **Radius**: 24px, **Health**: 100 HP, **Speed**: 1.5 px/frame (constant)
- **Movement**: 无AI控制，随机方向出发，碰墙/球完美弹性反弹
- **Collision Damage**: 3
- **Shield**: 50 HP (absorbs damage before HP), regenerates 5 HP/s after 3s no damage
- **Reflection**: 受到伤害时，25%伤害反弹给攻击者
- **Poison**: 受毒伤时50%减免
- **Shield Transfer**: Can transfer 25 shield to allies below 60% HP (8s cooldown)

### Physics
- Elastic collisions between balls (coefficient: 0.9)
- No friction - constant speed movement
- Perfect elastic wall reflection

## UI Specification

### HUD Elements
- **Health bars**: Three corners, 180x16px with HP text
- **Timer**: Top center, MM:SS format
- **Legend**: Ball type indicators
- **Pool counter**: Bottom center
- **Damage stats**: Total damage per ball (A:M:B)
- **Countdown**: 3-2-1-FIGHT! before start

### Game States
1. **Selecting**: Team selection screen where players assign balls to Red/Blue teams
2. **Countdown**: 3 second delay with animated numbers
3. **Playing**: Team-based auto-battle
4. **Ended**: Team victory announcement + restart button

## Mage Ball Special Mechanics

### Projectile System
- Fires toward nearest enemy
- Leaves glowing trail
- Explodes on wall or enemy contact
- Explosion has AOE damage and visual shockwave

### Freeze Debuff
- Duration: 2 seconds
- Visual: Cyan aura + rotating ice crystals
- Effect: Target movement halted, velocity reduced
- Strategic use: Crowd control, escape tool

## Acceptance Criteria
- [x] Team selection screen before battle
- [x] Click balls to cycle through teams (none -> red -> blue -> none)
- [x] Random team assignment button
- [x] Unselected balls (team = none) do not participate in battle
- [x] Teammates cannot damage each other (friendly fire off)
- [x] Team color rings shown around balls
- [x] Selected balls fight automatically
- [x] Sword rotates with trail effect
- [x] Sword sticks on hit, 4x8 = 32 damage
- [x] Mage fires projectiles every 1.2s
- [x] Projectiles freeze enemies for 2 seconds
- [x] Poison DOT applied on contact (4 HP/s for 4s)
- [x] Poison pools created on wall collision (permanent)
- [x] Pools deal damage and never disappear
- [x] Health bars update in real-time
- [x] Screen shake on hits
- [x] Particle effects on damage
- [x] Explosion shockwaves for mage
- [x] Freeze visual effect with ice crystals
- [x] Game ends when one team is eliminated
- [x] Team victory announced with restart option
- [x] Damage statistics tracked
