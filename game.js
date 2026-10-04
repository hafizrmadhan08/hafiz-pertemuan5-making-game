/**
 * TAPPY STRIKER: ANTEK ASING BUSTER
 * Pure Canvas + Web Audio API Game Engine
 * Controls:
 *   [D] = Maju (Forward)
 *   [A] = Mundur (Backward)
 *   [S] = Tembak (Shoot)
 *   [R] = Reload (Isi Ulang)
 *   [W] / [Space] / [Click] = Naik / Flap (Tappy Plane Physics)
 */

(() => {
  'use strict';

  // ===================================================================
  // 1. Audio System (Synthesized via Web Audio API)
  // ===================================================================
  class SoundManager {
    constructor() {
      this.ctx = null;
      this.muted = false;
    }

    init() {
      if (!this.ctx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
          this.ctx = new AudioContext();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    toggleMute() {
      this.muted = !this.muted;
      return this.muted;
    }

    playFlap() {
      if (this.muted || !this.ctx) return;
      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(140, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(320, this.ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.15);
      } catch (e) {}
    }

    playShoot() {
      if (this.muted || !this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        // White noise burst
        const bufferSize = this.ctx.sampleRate * 0.08;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1600, now);
        filter.Q.setValueAtTime(3, now);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        noise.start(now);

        // Low thump
        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(260, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.09);
        oscGain.gain.setValueAtTime(0.3, now);
        oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.09);
        osc.connect(oscGain);
        oscGain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.09);
      } catch (e) {}
    }

    playHit() {
      if (this.muted || !this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(450, now);
        osc.frequency.exponentialRampToValueAtTime(120, now + 0.08);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.08);
      } catch (e) {}
    }

    playFallingWhistle() {
      if (this.muted || !this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(900, now);
        osc.frequency.exponentialRampToValueAtTime(150, now + 1.2);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 1.2);
      } catch (e) {}
    }

    playExplosion() {
      if (this.muted || !this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        const bufferSize = this.ctx.sampleRate * 0.45;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.15));
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(600, now);
        filter.frequency.linearRampToValueAtTime(80, now + 0.45);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.45, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        noise.start(now);
      } catch (e) {}
    }

    playReload() {
      if (this.muted || !this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        [0, 0.25, 0.6].forEach((delay, idx) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(idx === 2 ? 800 : 420 + idx * 80, now + delay);
          gain.gain.setValueAtTime(0.2, now + delay);
          gain.gain.exponentialRampToValueAtTime(0.01, now + delay + 0.08);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now + delay);
          osc.stop(now + delay + 0.08);
        });
      } catch (e) {}
    }

    playEmptyClick() {
      if (this.muted || !this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(800, now);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.04);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.04);
      } catch (e) {}
    }
  }

  // ===================================================================
  // 2. Game Assets Loader
  // ===================================================================
  const assets = {
    player: new Image(),
    enemyTrump: new Image(),
    trumpFace: new Image(),
    loaded: false
  };

  assets.player.src = 'assets/player_plane.png';
  assets.enemyTrump.src = 'assets/enemy_trump.png';
  assets.trumpFace.src = 'assets/trump_face.png';

  let loadedCount = 0;
  const onAssetLoad = () => {
    loadedCount++;
    if (loadedCount >= 3) {
      assets.loaded = true;
    }
  };
  assets.player.onload = onAssetLoad;
  assets.enemyTrump.onload = onAssetLoad;
  assets.trumpFace.onload = onAssetLoad;

  // ===================================================================
  // 3. Game Configuration & State
  // ===================================================================
  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');
  const sound = new SoundManager();

  // DOM Elements
  const hudScore = document.getElementById('hud-score');
  const hudKills = document.getElementById('hud-kills');
  const hudHigh = document.getElementById('hud-high');
  const playerHpBar = document.getElementById('player-hp-bar');
  const ammoText = document.getElementById('ammo-text');
  const ammoTray = document.getElementById('ammo-bullets-tray');
  const reloadPrompt = document.getElementById('reload-prompt');
  const comboContainer = document.getElementById('combo-container');
  const comboCountEl = document.getElementById('combo-count');
  const alertBanner = document.getElementById('alert-banner');
  const alertQuote = document.getElementById('alert-quote');

  const startOverlay = document.getElementById('start-overlay');
  const gameoverOverlay = document.getElementById('gameover-overlay');
  const pauseOverlay = document.getElementById('pause-overlay');

  const btnStart = document.getElementById('btn-start-game');
  const btnRestart = document.getElementById('btn-restart-game');
  const btnResume = document.getElementById('btn-resume-game');
  const btnPause = document.getElementById('btn-pause');
  const btnSound = document.getElementById('btn-sound');
  const soundIcon = document.getElementById('sound-icon');

  const goScore = document.getElementById('go-score');
  const goKills = document.getElementById('go-kills');
  const goHigh = document.getElementById('go-high');
  const goAcc = document.getElementById('go-acc');

  // Key Indicators
  const keyIndicators = {
    w: document.getElementById('key-w'),
    down: document.getElementById('key-down'),
    a: document.getElementById('key-a'),
    s: document.getElementById('key-s'),
    d: document.getElementById('key-d'),
    r: document.getElementById('key-r')
  };

  // Trump quotes on alert
  const trumpQuotes = [
    '"NOBODY FLIES BETTER THAN MY ANTEK! WRONG!"',
    '"YOU ARE ATTACKING MY FLEET! UNFAIR!"',
    '"TREMENDOUS DAMAGE, FAKE NEWS!"',
    '"WE WILL BUILD A CEILING IN THE SKY!"',
    '"I HAVE THE GREATEST PILOTS, TOTALLY INNOCENT!"'
  ];

  // Game Engine State
  const state = {
    status: 'START', // 'START', 'PLAYING', 'PAUSED', 'GAMEOVER'
    score: 0,
    kills: 0,
    highScore: parseInt(localStorage.getItem('tappy_striker_high') || '0', 10),
    shotsFired: 0,
    shotsHit: 0,
    combo: 0,
    comboTimer: 0,
    screenShake: 0,
    alertTimer: 0
  };

  hudHigh.textContent = state.highScore;

  // Keyboard Tracker
  const keys = {
    a: false,
    d: false,
    s: false,
    r: false,
    w: false,
    down: false,
    space: false
  };

  // ===================================================================
  // 4. Player Plane Object (Smooth Aerodynamic Flight - Zero Gravity)
  // ===================================================================
  const MAX_AMMO = 15;
  const player = {
    x: 140,
    y: 240,
    width: 88,
    height: 48,
    vx: 0,
    vy: 0,
    maxHp: 100,
    hp: 100,
    ammo: MAX_AMMO,
    isReloading: false,
    reloadProgress: 0,
    reloadDuration: 1.0, // seconds
    shootCooldown: 0,
    tilt: 0,
    propellerAngle: 0,
    invulnerableTime: 0,

    reset() {
      this.x = 140;
      this.y = 220;
      this.vx = 0;
      this.vy = 0;
      this.hp = this.maxHp;
      this.ammo = MAX_AMMO;
      this.isReloading = false;
      this.reloadProgress = 0;
      this.shootCooldown = 0;
      this.tilt = 0;
      this.invulnerableTime = 0;
    },

    reload() {
      if (this.isReloading || this.ammo === MAX_AMMO) return;
      this.isReloading = true;
      this.reloadProgress = 0;
      sound.playReload();
      createFloatingText(this.x + 30, this.y - 20, 'RELOADING...', '#00E5FF');
    },

    shoot() {
      if (this.isReloading) return;
      if (this.ammo <= 0) {
        sound.playEmptyClick();
        reloadPrompt.classList.add('active');
        return;
      }
      if (this.shootCooldown > 0) return;

      this.ammo--;
      this.shootCooldown = 0.16; // rapid fire interval
      state.shotsFired++;
      sound.playShoot();

      // Recoil slight impulse
      this.vx -= 0.6;

      // Spawn bullet from plane nose
      const bulletX = this.x + this.width - 5;
      const bulletY = this.y + 6;
      bullets.push(new Bullet(bulletX, bulletY, 18, 0));

      // Muzzle flash particles
      for (let i = 0; i < 4; i++) {
        particles.push(new SparkParticle(bulletX, bulletY, Math.random() * 5 + 3, (Math.random() - 0.5) * 4, '#FFE81F'));
      }

      if (this.ammo === 0) {
        reloadPrompt.classList.add('active');
      }
      updateAmmoDisplay();
    }
  };

  // ===================================================================
  // 5. Entities: Bullets, Enemies ("Antek Asing"), Particles
  // ===================================================================
  let bullets = [];
  let enemies = [];
  let particles = [];
  let floatingTexts = [];

  class Bullet {
    constructor(x, y, vx, vy) {
      this.x = x;
      this.y = y;
      this.vx = vx;
      this.vy = vy;
      this.radius = 4;
      this.length = 16;
      this.alive = true;
    }

    update(dt) {
      this.x += this.vx * (dt * 60);
      this.y += this.vy * (dt * 60);
      if (this.x > canvas.width + 50 || this.y < -20 || this.y > canvas.height + 20) {
        this.alive = false;
      }
    }

    draw(ctx) {
      ctx.save();
      // Glowing yellow tracer bullet
      ctx.strokeStyle = '#FFE81F';
      ctx.lineWidth = 3.5;
      ctx.shadowColor = '#FFE81F';
      ctx.shadowBlur = 10;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.x - this.length, this.y);
      ctx.stroke();

      // Core white laser
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.x - this.length * 0.7, this.y);
      ctx.stroke();
      ctx.restore();
    }
  }

  // Enemy Plane: Antek Asing with Donald Trump shouting livery decal!
  class Enemy {
    constructor(isBoss = false) {
      this.isBoss = isBoss;
      this.width = isBoss ? 135 : 95;
      this.height = isBoss ? 80 : 58;
      this.x = canvas.width + 60;
      this.y = Math.random() * (canvas.height - 180) + 40;
      this.speed = isBoss ? 1.6 : (Math.random() * 1.5 + 2.2);
      this.maxHp = isBoss ? 280 : 80;
      this.hp = this.maxHp;
      this.hitFlash = 0;
      this.state = 'FLYING'; // 'FLYING', 'FALLING' ("jatuh mati"), 'DEAD'
      this.vy = 0;
      this.vx = -this.speed;
      this.rotation = 0;
      this.spinSpeed = 0;
      this.smokeTimer = 0;
      this.bobPhase = Math.random() * Math.PI * 2;
    }

    update(dt) {
      if (this.hitFlash > 0) this.hitFlash -= dt;

      if (this.state === 'FLYING') {
        this.x += this.vx * (dt * 60);
        this.bobPhase += dt * 3;
        this.y += Math.sin(this.bobPhase) * 0.8;

        // Minor tilt
        this.rotation = Math.sin(this.bobPhase) * 0.05;

        // Random engine puff
        if (Math.random() < 0.2) {
          particles.push(new SmokeParticle(this.x + this.width - 10, this.y + this.height * 0.4, '#555'));
        }
      } else if (this.state === 'FALLING') {
        // "Jatuh mati" - falls rapidly, tilts downward, emits heavy fire & dark smoke
        this.vy += 0.38 * (dt * 60); // gravity acceleration
        this.x += this.vx * (dt * 60) * 0.65;
        this.y += this.vy * (dt * 60);
        this.rotation += this.spinSpeed * (dt * 60);

        // Constant heavy smoke and fire trail while falling
        this.smokeTimer += dt;
        if (this.smokeTimer > 0.02) {
          this.smokeTimer = 0;
          particles.push(new SmokeParticle(this.x + this.width * 0.3, this.y + this.height * 0.3, '#1c1c1c', 16, 28));
          particles.push(new FireParticle(this.x + this.width * 0.3, this.y + this.height * 0.3));
        }

        // Crash impact with bottom/ground
        if (this.y >= canvas.height - 40) {
          this.explodeCrash();
        }
      }
    }

    takeDamage(amount) {
      if (this.state !== 'FLYING') return;
      this.hp -= amount;
      this.hitFlash = 0.12;
      sound.playHit();
      state.shotsHit++;

      createFloatingText(this.x + this.width * 0.4, this.y - 12, `-${amount}`, '#FFE81F');

      if (this.hp <= 0) {
        this.hp = 0;
        this.startFallingDeath();
      }
    }

    startFallingDeath() {
      this.state = 'FALLING';
      this.vy = -1.5; // slight pop before diving
      this.spinSpeed = (Math.random() - 0.4) * 0.12 + 0.08;
      this.rotation = 0.2;
      sound.playFallingWhistle();

      state.kills++;
      hudKills.textContent = state.kills;
      const killPoints = this.isBoss ? 500 : 150;
      addScore(killPoints);

      createFloatingText(
        this.x + this.width * 0.2,
        this.y - 25,
        this.isBoss ? 'BOSS ANTEK JATUH! +500' : 'ANTEK TUMBANG! +150',
        '#FF334B'
      );

      // Trigger Trump Screaming alert quote occasionally
      triggerTrumpQuote();
    }

    explodeCrash() {
      this.state = 'DEAD';
      sound.playExplosion();
      state.screenShake = 12;

      // Spawn large explosion
      createExplosion(this.x + this.width * 0.5, this.y + this.height * 0.5, this.isBoss ? 45 : 28);
      createFloatingText(this.x + this.width * 0.5, this.y - 10, 'HANCUR TOTAL! 💥', '#FFE81F');
    }

    draw(ctx) {
      ctx.save();
      ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
      ctx.rotate(this.rotation);

      if (this.hitFlash > 0) {
        ctx.filter = 'brightness(2.2) contrast(1.5)';
      }

      // Draw Trump livery warplane sprite
      if (assets.loaded && assets.enemyTrump.complete) {
        ctx.drawImage(assets.enemyTrump, -this.width / 2, -this.height / 2, this.width, this.height);
      } else {
        // Fallback procedural enemy warplane with Trump screaming badge
        ctx.fillStyle = '#3E5638';
        ctx.fillRect(-this.width / 2, -this.height / 2 + 10, this.width, this.height - 20);
        // Trump badge livery
        ctx.fillStyle = '#FFE81F';
        ctx.beginPath();
        ctx.arc(-5, 0, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.font = 'bold 9px Chakra Petch';
        ctx.fillText('TRUMP', -16, 3);
      }

      ctx.restore();

      // Draw Health Bar floating above enemy (only if still flying or falling)
      if (this.state === 'FLYING' || (this.state === 'FALLING' && this.y < canvas.height - 30)) {
        this.drawHealthBar(ctx);
      }
    }

    drawHealthBar(ctx) {
      const barW = this.width;
      const barH = 7;
      const barX = this.x;
      const barY = this.y - 14;

      // Outer container
      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.strokeStyle = this.isBoss ? '#FFB703' : 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(barX, barY, barW, barH, 3);
      ctx.fill();
      ctx.stroke();

      // HP Fill
      const hpPct = Math.max(0, this.hp / this.maxHp);
      let fillColor = '#00E676';
      if (hpPct < 0.35) fillColor = '#FF334B';
      else if (hpPct < 0.65) fillColor = '#FFE81F';

      ctx.fillStyle = fillColor;
      ctx.beginPath();
      ctx.roundRect(barX + 1, barY + 1, (barW - 2) * hpPct, barH - 2, 2);
      ctx.fill();

      // Label
      ctx.font = '600 8px Chakra Petch, sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      const labelText = this.isBoss ? `BOSS TRUMP: ${Math.ceil(this.hp)}` : `ANTEK ASING: ${Math.ceil(this.hp)}`;
      ctx.fillText(labelText, barX + barW / 2, barY - 3);
      ctx.textAlign = 'left';
    }
  }

  // Particle Effects: Smoke, Fire, Sparks, Puffs
  class SmokeParticle {
    constructor(x, y, color = '#333', minR = 6, maxR = 18) {
      this.x = x;
      this.y = y;
      this.vx = (Math.random() - 0.5) * 1.5 - 1;
      this.vy = (Math.random() - 0.5) * 1.5 - 0.5;
      this.radius = minR;
      this.maxRadius = maxR;
      this.color = color;
      this.alpha = 0.85;
      this.alive = true;
    }

    update(dt) {
      this.x += this.vx * (dt * 60);
      this.y += this.vy * (dt * 60);
      this.radius += 0.3 * (dt * 60);
      this.alpha -= 0.02 * (dt * 60);
      if (this.alpha <= 0) this.alive = false;
    }

    draw(ctx) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, this.alpha);
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  class FireParticle {
    constructor(x, y) {
      this.x = x + (Math.random() - 0.5) * 10;
      this.y = y + (Math.random() - 0.5) * 10;
      this.vx = (Math.random() - 0.5) * 2 - 1.2;
      this.vy = (Math.random() - 0.5) * 2;
      this.radius = Math.random() * 5 + 4;
      this.alpha = 1;
      this.color = Math.random() > 0.4 ? '#FFE81F' : '#FF4500';
      this.alive = true;
    }

    update(dt) {
      this.x += this.vx * (dt * 60);
      this.y += this.vy * (dt * 60);
      this.radius *= 0.94;
      this.alpha -= 0.035 * (dt * 60);
      if (this.alpha <= 0 || this.radius < 0.5) this.alive = false;
    }

    draw(ctx) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, this.alpha);
      ctx.fillStyle = this.color;
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  class SparkParticle {
    constructor(x, y, vx, vy, color = '#FFE81F') {
      this.x = x;
      this.y = y;
      this.vx = vx;
      this.vy = vy;
      this.alpha = 1;
      this.color = color;
      this.alive = true;
    }

    update(dt) {
      this.x += this.vx * (dt * 60);
      this.y += this.vy * (dt * 60);
      this.alpha -= 0.06 * (dt * 60);
      if (this.alpha <= 0) this.alive = false;
    }

    draw(ctx) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, this.alpha);
      ctx.fillStyle = this.color;
      ctx.fillRect(this.x, this.y, 2.5, 2.5);
      ctx.restore();
    }
  }

  // Floating Combat Text
  function createFloatingText(x, y, text, color = '#FFE81F') {
    floatingTexts.push({
      x,
      y,
      text,
      color,
      alpha: 1,
      vy: -1.2,
      alive: true
    });
  }

  function createPuff(x, y, color = '#FFFFFF') {
    for (let i = 0; i < 3; i++) {
      particles.push(new SmokeParticle(x, y, color, 4, 12));
    }
  }

  function createExplosion(x, y, count = 25) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 6 + 2;
      particles.push(new SparkParticle(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, Math.random() > 0.5 ? '#FFE81F' : '#FF334B'));
      particles.push(new FireParticle(x, y));
    }
    for (let i = 0; i < 10; i++) {
      particles.push(new SmokeParticle(x + (Math.random() - 0.5) * 20, y + (Math.random() - 0.5) * 20, '#222', 12, 35));
    }
  }

  // ===================================================================
  // 6. Parallax Background System
  // ===================================================================
  const clouds = [];
  for (let i = 0; i < 9; i++) {
    clouds.push({
      x: Math.random() * canvas.width,
      y: Math.random() * (canvas.height * 0.65),
      width: Math.random() * 120 + 80,
      height: Math.random() * 45 + 30,
      speed: Math.random() * 0.8 + 0.3,
      alpha: Math.random() * 0.35 + 0.2
    });
  }

  const hills = [];
  for (let x = 0; x < canvas.width + 100; x += 90) {
    hills.push({ x, height: Math.random() * 40 + 60 });
  }

  function drawBackground(ctx, dt) {
    // Sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    skyGrad.addColorStop(0, '#0D1527');
    skyGrad.addColorStop(0.55, '#1E2C48');
    skyGrad.addColorStop(0.85, '#384A68');
    skyGrad.addColorStop(1, '#685A52');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Distant Sunrise/Sunset Sun Glow
    const sunGrad = ctx.createRadialGradient(canvas.width * 0.8, 110, 10, canvas.width * 0.8, 110, 180);
    sunGrad.addColorStop(0, 'rgba(255, 232, 31, 0.45)');
    sunGrad.addColorStop(0.5, 'rgba(255, 180, 0, 0.15)');
    sunGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(canvas.width * 0.8, 110, 180, 0, Math.PI * 2);
    ctx.fill();

    // Moving Clouds
    ctx.fillStyle = '#FFFFFF';
    clouds.forEach(c => {
      c.x -= c.speed * (dt * 60);
      if (c.x + c.width < 0) {
        c.x = canvas.width + 40;
        c.y = Math.random() * (canvas.height * 0.65);
      }
      ctx.save();
      ctx.globalAlpha = c.alpha;
      ctx.beginPath();
      ctx.ellipse(c.x, c.y, c.width * 0.5, c.height * 0.5, 0, 0, Math.PI * 2);
      ctx.ellipse(c.x - c.width * 0.25, c.y + 4, c.width * 0.35, c.height * 0.4, 0, 0, Math.PI * 2);
      ctx.ellipse(c.x + c.width * 0.25, c.y + 2, c.width * 0.35, c.height * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // Distant Mountain Ranges (Layer 1)
    ctx.fillStyle = '#141E30';
    ctx.beginPath();
    ctx.moveTo(0, canvas.height);
    hills.forEach((h, i) => {
      ctx.lineTo(h.x, canvas.height - h.height - 40);
    });
    ctx.lineTo(canvas.width, canvas.height);
    ctx.fill();

    // Foreground Military Ground / Ocean Strip (Layer 2)
    const groundGrad = ctx.createLinearGradient(0, canvas.height - 40, 0, canvas.height);
    groundGrad.addColorStop(0, '#1E2522');
    groundGrad.addColorStop(1, '#0C100E');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, canvas.height - 40, canvas.width, 40);

    // Yellow Accent Runway line
    ctx.fillStyle = '#FFE81F';
    ctx.globalAlpha = 0.5;
    for (let rx = -((Date.now() / 15) % 60); rx < canvas.width; rx += 60) {
      ctx.fillRect(rx, canvas.height - 18, 32, 4);
    }
    ctx.globalAlpha = 1.0;
  }

  // ===================================================================
  // 7. Enemy Spawning & Alert System
  // ===================================================================
  let spawnTimer = 0;
  let waveCount = 0;

  function handleSpawns(dt) {
    spawnTimer += dt;
    // Spawn every 2.2 to 3.5 seconds
    const interval = Math.max(1.8, 3.2 - waveCount * 0.08);
    if (spawnTimer >= interval) {
      spawnTimer = 0;
      waveCount++;

      // Every 6 waves, spawn Boss Antek Trump
      const isBoss = (waveCount % 6 === 0);
      enemies.push(new Enemy(isBoss));

      if (isBoss) {
        triggerTrumpQuote('PERINGATAN: SQUADRON BOSS TRUMP TERDETEKSI!');
      }
    }
  }

  function triggerTrumpQuote(customText) {
    if (customText) {
      alertQuote.textContent = customText;
    } else {
      const q = trumpQuotes[Math.floor(Math.random() * trumpQuotes.length)];
      alertQuote.textContent = q;
    }
    alertBanner.classList.add('active');
    state.alertTimer = 3.5;
  }

  // ===================================================================
  // 8. Score, Ammo & UI Updates
  // ===================================================================
  function addScore(points) {
    state.combo++;
    state.comboTimer = 2.5; // combo streak timeout
    const multiplier = Math.min(4, 1 + Math.floor(state.combo / 3) * 0.5);
    const earned = Math.floor(points * multiplier);
    state.score += earned;

    hudScore.textContent = state.score;
    if (state.score > state.highScore) {
      state.highScore = state.score;
      localStorage.setItem('tappy_striker_high', state.highScore);
      hudHigh.textContent = state.highScore;
    }

    if (state.combo > 1) {
      comboContainer.classList.add('active');
      comboCountEl.textContent = `${state.combo}x`;
    }
  }

  function updateAmmoDisplay() {
    ammoText.textContent = `${player.ammo} / ${MAX_AMMO}`;
    ammoTray.innerHTML = '';
    for (let i = 0; i < MAX_AMMO; i++) {
      const pip = document.createElement('div');
      pip.className = 'bullet-pip' + (i >= player.ammo ? ' spent' : '');
      ammoTray.appendChild(pip);
    }
  }
  updateAmmoDisplay();

  function updateHpBar() {
    const pct = Math.max(0, (player.hp / player.maxHp) * 100);
    playerHpBar.style.width = `${pct}%`;
    if (pct < 30) {
      playerHpBar.style.background = '#FF334B';
    } else {
      playerHpBar.style.background = 'linear-gradient(90deg, #FFB703, var(--accent-yellow))';
    }
  }

  // ===================================================================
  // 9. Input & Controls Handling (Strict [D], [A], [S], [R], [W/Flap])
  // ===================================================================
  function setKeyIndicator(key, isPressed) {
    if (keyIndicators[key]) {
      if (isPressed) {
        keyIndicators[key].classList.add('pressed');
      } else {
        keyIndicators[key].classList.remove('pressed');
      }
    }
  }

  window.addEventListener('keydown', (e) => {
    sound.init();
    const k = e.key.toLowerCase();

    if (k === 'd') {
      keys.d = true;
      setKeyIndicator('d', true);
    } else if (k === 'a') {
      keys.a = true;
      setKeyIndicator('a', true);
    } else if (k === 's') {
      keys.s = true;
      setKeyIndicator('s', true);
      if (state.status === 'PLAYING') {
        player.shoot();
      }
    } else if (k === 'r') {
      keys.r = true;
      setKeyIndicator('r', true);
      if (state.status === 'PLAYING') {
        player.reload();
      }
    } else if (k === 'w' || e.code === 'Space' || e.key === 'ArrowUp') {
      keys.w = true;
      setKeyIndicator('w', true);
    } else if (e.key === 'ArrowDown' || k === 'x' || e.key === 'Shift') {
      keys.down = true;
      setKeyIndicator('down', true);
    } else if (k === 'p' || e.key === 'Escape') {
      togglePause();
    } else if (e.key === 'Enter') {
      if (state.status === 'START') startGame();
      else if (state.status === 'GAMEOVER') restartGame();
    }
  });

  window.addEventListener('keyup', (e) => {
    const k = e.key.toLowerCase();
    if (k === 'd') {
      keys.d = false;
      setKeyIndicator('d', false);
    } else if (k === 'a') {
      keys.a = false;
      setKeyIndicator('a', false);
    } else if (k === 's') {
      keys.s = false;
      setKeyIndicator('s', false);
    } else if (k === 'r') {
      keys.r = false;
      setKeyIndicator('r', false);
    } else if (k === 'w' || e.code === 'Space' || e.key === 'ArrowUp') {
      keys.w = false;
      setKeyIndicator('w', false);
    } else if (e.key === 'ArrowDown' || k === 'x' || e.key === 'Shift') {
      keys.down = false;
      setKeyIndicator('down', false);
    }
  });

  // Prevent default context menu so right-click is dedicated to Reload
  window.addEventListener('contextmenu', (e) => {
    if (e.target === canvas || e.target.closest('#game-app')) {
      e.preventDefault();
    }
  });

  // Mouse Controls: Left Click = Tembak (Shoot), Right Click = Isi Ulang (Reload)
  canvas.addEventListener('mousedown', (e) => {
    sound.init();
    if (state.status !== 'PLAYING') return;

    if (e.button === 0) {
      // Left Click: Shoot
      e.preventDefault();
      keys.s = true;
      setKeyIndicator('s', true);
      player.shoot();
    } else if (e.button === 2) {
      // Right Click: Reload
      e.preventDefault();
      keys.r = true;
      setKeyIndicator('r', true);
      player.reload();
    }
  });

  window.addEventListener('mouseup', (e) => {
    if (e.button === 0) {
      keys.s = false;
      setKeyIndicator('s', false);
    } else if (e.button === 2) {
      keys.r = false;
      setKeyIndicator('r', false);
    }
  });

  // Touch Dock Buttons
  const setupTouchBtn = (id, onDown, onUp) => {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      sound.init();
      if (onDown) onDown();
    });
    btn.addEventListener('pointerup', (e) => {
      e.preventDefault();
      if (onUp) onUp();
    });
    btn.addEventListener('pointerleave', (e) => {
      if (onUp) onUp();
    });
  };

  setupTouchBtn('touch-fly', () => { keys.w = true; setKeyIndicator('w', true); }, () => { keys.w = false; setKeyIndicator('w', false); });
  setupTouchBtn('touch-down', () => { keys.down = true; setKeyIndicator('down', true); }, () => { keys.down = false; setKeyIndicator('down', false); });
  setupTouchBtn('touch-backward', () => { keys.a = true; setKeyIndicator('a', true); }, () => { keys.a = false; setKeyIndicator('a', false); });
  setupTouchBtn('touch-forward', () => { keys.d = true; setKeyIndicator('d', true); }, () => { keys.d = false; setKeyIndicator('d', false); });
  setupTouchBtn('touch-shoot', () => { player.shoot(); setKeyIndicator('s', true); }, () => { setKeyIndicator('s', false); });
  setupTouchBtn('touch-reload', () => { player.reload(); setKeyIndicator('r', true); }, () => { setKeyIndicator('r', false); });

  // ===================================================================
  // 10. Core Game Loop & Physics
  // ===================================================================
  let lastTime = performance.now();

  function update(dt) {
    if (state.status !== 'PLAYING') return;

    // Screen Shake decay
    if (state.screenShake > 0) {
      state.screenShake -= dt * 25;
      if (state.screenShake < 0) state.screenShake = 0;
    }

    // Trump alert timer decay
    if (state.alertTimer > 0) {
      state.alertTimer -= dt;
      if (state.alertTimer <= 0) {
        alertBanner.classList.remove('active');
      }
    }

    // Combo streak decay
    if (state.comboTimer > 0) {
      state.comboTimer -= dt;
      if (state.comboTimer <= 0) {
        state.combo = 0;
        comboContainer.classList.remove('active');
      }
    }

    // Player Shooting cooldown & Reload Progress
    if (player.shootCooldown > 0) {
      player.shootCooldown -= dt;
    }

    if (player.isReloading) {
      player.reloadProgress += dt / player.reloadDuration;
      if (player.reloadProgress >= 1) {
        player.isReloading = false;
        player.ammo = MAX_AMMO;
        player.reloadProgress = 0;
        reloadPrompt.classList.remove('active');
        updateAmmoDisplay();
        createFloatingText(player.x + 20, player.y - 20, 'READY! ⚡', '#FFE81F');
      }
    }

    // Auto shoot if holding 'S'
    if (keys.s && player.shootCooldown <= 0) {
      player.shoot();
    }

    // Forward ('D') / Backward ('A') Acceleration
    const speedX = 5.2;
    if (keys.d) {
      player.vx = Math.min(player.vx + 0.45 * (dt * 60), speedX);
    } else if (keys.a) {
      player.vx = Math.max(player.vx - 0.45 * (dt * 60), -speedX * 0.8);
    } else {
      player.vx *= 0.92; // friction
    }

    // Zero-Gravity Smooth Vertical Flight:
    // W (or ArrowUp) ascends smoothly, ArrowDown descends smoothly,
    // and letting go smoothly glides to a stop with aerodynamic damping.
    const speedY = 4.8;
    if (keys.w) {
      player.vy = Math.max(player.vy - 0.42 * (dt * 60), -speedY);
      // Subtle exhaust puff when ascending
      if (Math.random() < 0.25) {
        particles.push(new SmokeParticle(player.x - 6, player.y + player.height * 0.6, '#FFE81F', 3, 7));
      }
    } else if (keys.down) {
      player.vy = Math.min(player.vy + 0.42 * (dt * 60), speedY);
    } else {
      player.vy *= 0.90; // Smooth damping, plane hovers steadily
    }

    // Update Player Position
    player.x += player.vx * (dt * 60);
    player.y += player.vy * (dt * 60);

    // Soft Aerodynamic Boundaries
    const minX = 40;
    const maxX = canvas.width * 0.75;
    if (player.x < minX) { player.x = minX; player.vx = 0; }
    if (player.x > maxX) { player.x = maxX; player.vx = 0; }

    const minY = 20;
    const maxY = canvas.height - player.height - 35; // ground
    if (player.y < minY) {
      player.y = minY;
      player.vy = 0;
    }
    if (player.y > maxY) {
      player.y = maxY;
      player.vy = 0;
    }

    // Smooth pitch tilt according to vertical velocity & forward thrust
    const targetTilt = (player.vy * 0.04) + (keys.d ? 0.06 : 0) - (keys.a ? 0.06 : 0);
    player.tilt += (targetTilt - player.tilt) * 0.12;

    // Propeller spin
    player.propellerAngle += 0.45;

    // Invulnerability timer
    if (player.invulnerableTime > 0) {
      player.invulnerableTime -= dt;
    }

    // Spawn exhaust particles
    if (Math.random() < 0.35) {
      particles.push(new SmokeParticle(player.x - 4, player.y + player.height * 0.5, '#FFE81F', 3, 8));
    }

    // Update Bullets
    bullets.forEach(b => b.update(dt));
    bullets = bullets.filter(b => b.alive);

    // Update Enemies & Handle Spawns
    handleSpawns(dt);
    enemies.forEach(e => e.update(dt));

    // Collision: Bullets vs Enemies
    bullets.forEach(b => {
      enemies.forEach(e => {
        if (e.state === 'FLYING') {
          // AABB Collision check
          if (
            b.x >= e.x &&
            b.x <= e.x + e.width &&
            b.y >= e.y &&
            b.y <= e.y + e.height
          ) {
            b.alive = false;
            e.takeDamage(25);
          }
        }
      });
    });

    // Collision: Player vs Enemy Planes
    enemies.forEach(e => {
      if (e.state === 'FLYING' && player.invulnerableTime <= 0) {
        const pMargin = 12;
        if (
          player.x + pMargin < e.x + e.width - pMargin &&
          player.x + player.width - pMargin > e.x + pMargin &&
          player.y + pMargin < e.y + e.height - pMargin &&
          player.y + player.height - pMargin > e.y + pMargin
        ) {
          // Mid-air collision!
          damagePlayer(30);
          e.takeDamage(50);
          sound.playExplosion();
          state.screenShake = 16;
          createExplosion((player.x + e.x) / 2, (player.y + e.y) / 2, 20);
        }
      }
    });

    // Filter out dead or off-screen enemies
    enemies = enemies.filter(e => {
      if (e.state === 'DEAD') return false;
      if (e.x + e.width < -100) return false;
      return true;
    });

    // Update Particles
    particles.forEach(p => p.update(dt));
    particles = particles.filter(p => p.alive);

    // Update Floating Text
    floatingTexts.forEach(ft => {
      ft.y += ft.vy * (dt * 60);
      ft.alpha -= 0.02 * (dt * 60);
      if (ft.alpha <= 0) ft.alive = false;
    });
    floatingTexts = floatingTexts.filter(ft => ft.alive);
  }

  function damagePlayer(amount) {
    if (player.invulnerableTime > 0) return;
    player.hp -= amount;
    player.invulnerableTime = 1.0;
    updateHpBar();
    sound.playHit();
    state.screenShake = 14;

    createFloatingText(player.x + 20, player.y - 15, `-${amount} HP!`, '#FF334B');

    if (player.hp <= 0) {
      player.hp = 0;
      updateHpBar();
      triggerGameOver();
    }
  }

  function triggerGameOver() {
    state.status = 'GAMEOVER';
    sound.playExplosion();
    createExplosion(player.x + player.width / 2, player.y + player.height / 2, 35);

    // Accuracy Calculation
    const acc = state.shotsFired > 0 ? Math.round((state.shotsHit / state.shotsFired) * 100) : 0;

    goScore.textContent = state.score;
    goKills.textContent = state.kills;
    goHigh.textContent = state.highScore;
    goAcc.textContent = `${acc}%`;

    gameoverOverlay.classList.add('active');
  }

  // ===================================================================
  // 11. Rendering & Drawing
  // ===================================================================
  function render() {
    ctx.save();

    // Screen Shake effect
    if (state.screenShake > 0) {
      const shakeX = (Math.random() - 0.5) * state.screenShake;
      const shakeY = (Math.random() - 0.5) * state.screenShake;
      ctx.translate(shakeX, shakeY);
    }

    // 1. Background
    drawBackground(ctx, 0.016);

    // 2. Enemies
    enemies.forEach(e => e.draw(ctx));

    // 3. Bullets
    bullets.forEach(b => b.draw(ctx));

    // 4. Player Plane
    drawPlayer(ctx);

    // 5. Particles (Smoke, Fire, Sparks)
    particles.forEach(p => p.draw(ctx));

    // 6. Floating Text
    floatingTexts.forEach(ft => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, ft.alpha);
      ctx.font = '700 13px Chakra Petch, sans-serif';
      ctx.fillStyle = ft.color;
      ctx.shadowColor = ft.color;
      ctx.shadowBlur = 8;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    });

    ctx.restore();
  }

  function drawPlayer(ctx) {
    ctx.save();
    ctx.translate(player.x + player.width / 2, player.y + player.height / 2);
    ctx.rotate(player.tilt);

    // Invulnerability flicker
    if (player.invulnerableTime > 0 && Math.floor(Date.now() / 80) % 2 === 0) {
      ctx.globalAlpha = 0.45;
    }

    if (assets.loaded && assets.player.complete) {
      ctx.drawImage(assets.player, -player.width / 2, -player.height / 2, player.width, player.height);
    } else {
      // Procedural hero plane fallback
      ctx.fillStyle = '#FFE81F';
      ctx.fillRect(-player.width / 2, -player.height / 2 + 8, player.width, player.height - 16);
      ctx.fillStyle = '#00E5FF';
      ctx.beginPath();
      ctx.arc(player.width * 0.1, -player.height * 0.2, 12, 0, Math.PI * 2);
      ctx.fill();
    }

    // Reloading indicator arc around player
    if (player.isReloading) {
      ctx.strokeStyle = '#00E5FF';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, 32, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * player.reloadProgress);
      ctx.stroke();
    }

    ctx.restore();
  }

  // ===================================================================
  // 12. Main Game Loop Runner
  // ===================================================================
  function gameLoop(time) {
    const dt = Math.min((time - lastTime) / 1000, 0.1);
    lastTime = time;

    update(dt);
    render();

    requestAnimationFrame(gameLoop);
  }

  // ===================================================================
  // 13. Game States & Flow Controllers
  // ===================================================================
  function startGame() {
    sound.init();
    state.status = 'PLAYING';
    state.score = 0;
    state.kills = 0;
    state.shotsFired = 0;
    state.shotsHit = 0;
    state.combo = 0;
    waveCount = 0;
    spawnTimer = 0;

    hudScore.textContent = '0';
    hudKills.textContent = '0';
    player.reset();
    updateHpBar();
    updateAmmoDisplay();

    enemies = [];
    bullets = [];
    particles = [];
    floatingTexts = [];

    startOverlay.classList.remove('active');
    gameoverOverlay.classList.remove('active');
    pauseOverlay.classList.remove('active');

    triggerTrumpQuote('PERSIAPKAN DIRI! ANTEK ASING MENDEKAT!');
  }

  function restartGame() {
    startGame();
  }

  function togglePause() {
    if (state.status === 'PLAYING') {
      state.status = 'PAUSED';
      pauseOverlay.classList.add('active');
    } else if (state.status === 'PAUSED') {
      state.status = 'PLAYING';
      pauseOverlay.classList.remove('active');
      lastTime = performance.now();
    }
  }

  btnStart.addEventListener('click', startGame);
  btnRestart.addEventListener('click', restartGame);
  btnResume.addEventListener('click', togglePause);
  btnPause.addEventListener('click', togglePause);

  btnSound.addEventListener('click', () => {
    sound.init();
    const isMuted = sound.toggleMute();
    soundIcon.textContent = isMuted ? '🔇' : '🔊';
  });

  // Kickstart loop
  requestAnimationFrame(gameLoop);

})();
