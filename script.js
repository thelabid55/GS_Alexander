// Mobile Menu Toggle
        document.getElementById('mobile-menu-btn').addEventListener('click', function () {
            document.getElementById('mobile-menu').classList.toggle('hidden');
        });

        // Form message handler (no alerts)
        function showMessage(msg) {
            const msgBox = document.getElementById('formMessage');
            msgBox.textContent = msg;
            msgBox.classList.remove('hidden');
            setTimeout(() => {
                msgBox.classList.add('hidden');
            }, 3000);
        }

/**
         * STICK PLATFORMER - Enhanced Game Engine
         * Built in Vanilla JS for HTML5 Canvas
         * Features: Smooth gravity, saws, missiles, bounce pads, gravity portals
         */
        const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');
        const gameUI = document.getElementById('gameUI');
        const uiTitle = document.getElementById('uiTitle');
        const uiSubtitle = document.getElementById('uiSubtitle');
        const uiBtn = document.getElementById('uiBtn');
        const gameHUD = document.getElementById('gameHUD');
        const hudLevel = document.getElementById('hudLevel');
        const hudAttempts = document.getElementById('hudAttempts');
        const hudProgress = document.getElementById('hudProgress');

        // Internal resolution for consistent physics
        const GAME_WIDTH = 800;
        const GAME_HEIGHT = 450;
        canvas.width = GAME_WIDTH;
        canvas.height = GAME_HEIGHT;

        // Game States
        const STATE_MENU = 0;
        const STATE_PLAYING = 1;
        const STATE_GAMEOVER = 2;
        const STATE_VICTORY = 3;

        let currentState = STATE_MENU;
        let animationFrameId;
        let gameTime = 0; // global tick counter for animations
        
        let rickrollPauseTimer = 0;
        let rickrollAudio = new Audio('./rick-roll-bass-boosted_ZPqkNIT.mp3');

        // Colors
        const COLOR_BG = '#0f172a';
        const COLOR_PLAYER = '#06B6D4';
        const COLOR_SPIKE = '#EF4444';
        const COLOR_BLOCK = '#A855F7';
        const COLOR_GROUND = '#1E293B';
        const COLOR_GRID = '#334155';
        const COLOR_SAW = '#F43F5E';
        const COLOR_MISSILE = '#FB923C';
        const COLOR_BOUNCE = '#22D3EE';
        const COLOR_PORTAL = '#C084FC';

        // Physics & Engine config
        // Tuned for a realistic, symmetric jump arc (not arcade-floaty or brick-fast)
        const GRAVITY = 0.45;            // gentle base pull — natural parabola
        const FALL_MULTIPLIER = 1.15;    // barely faster fall — almost symmetric, realistic
        const LOW_JUMP_MULTIPLIER = 1.5; // light tap = shorter jump, but not jarring
        const JUMP_FORCE = -11;          // strong enough to clear 3-block walls
        const BOUNCE_FORCE = -16;        // recalibrated: clears tall walls with the lighter gravity
        const SCROLL_SPEED = 5.5;
        const GROUND_HEIGHT = 50;
        const FLOOR_Y = GAME_HEIGHT - GROUND_HEIGHT;
        const TILE_SIZE = 40;
        const COYOTE_TIME = 6;
        const JUMP_BUFFER_TIME = 8;

        /*
         * Object types:
         * 0 = Spike (Triangle, kills player)
         * 1 = Block (Square, kills on side hit, safe to land on)
         * 2 = Saw Blade (Spinning circle, kills on any contact)
         * 3 = Missile (Horizontal projectile, kills on contact)
         * 4 = Bounce Pad (Launches player high into the air)
         * 5 = Gravity Portal (Flips gravity temporarily — visual obstacle)
         * 6 = Slowing Trap (Purple mud, slows movement)
         * 7 = Blue Portal (Entrance)
         * 8 = Orange Portal (Exit)
         * 9 = Landmine (Explodes on touch)
         * 10 = Rickroll Button (Pauses game, plays song)
         * 11 = Giant Missile (Double size, slower)
         * 12 = Giant Saw Blade (Double size)
         *
         * For missiles: they use obj._active flag and obj._screenX for runtime tracking.
         * For saws: obj.radius sets size (default TILE_SIZE/2).
         */

        const levels = [
            // ── Level 1: Easy Introduction ──────────────────────────
            {
                name: "Level 1 - First Steps",
                length: 3000,
                objects: [
                    // Gentle single spikes with generous spacing
                    { x: 700, y: FLOOR_Y, type: 0 },
                    { x: 1100, y: FLOOR_Y, type: 0 },
                    // Introduce bounce pad
                    { x: 1500, y: FLOOR_Y, type: 4 },
                    // Block to land on after bounce
                    { x: 1700, y: FLOOR_Y - 80, type: 1 },
                    { x: 1740, y: FLOOR_Y - 80, type: 1 },
                    // Easy spike after block section
                    { x: 2100, y: FLOOR_Y, type: 0 },
                    { x: 2500, y: FLOOR_Y, type: 0 },
                ]
            },
            // ── Level 2: Momentum Builder ─────────────────────────
            {
                name: "Level 2 - Momentum",
                length: 3800,
                objects: [
                    // Double spike
                    { x: 600, y: FLOOR_Y, type: 0 },
                    { x: 640, y: FLOOR_Y, type: 0 },
                    // Block platform with spike on top
                    { x: 1000, y: FLOOR_Y, type: 1 },
                    { x: 1040, y: FLOOR_Y, type: 1 },
                    { x: 1040, y: FLOOR_Y - 40, type: 0 },
                    // Saw blade (floating)
                    { x: 1400, y: FLOOR_Y - 60, type: 2 },
                    // Bounce pad to clear a tall block wall
                    { x: 1700, y: FLOOR_Y, type: 4 },
                    { x: 1900, y: FLOOR_Y, type: 1 },
                    { x: 1900, y: FLOOR_Y - 40, type: 1 },
                    { x: 1900, y: FLOOR_Y - 80, type: 1 },
                    // More spikes after the wall
                    { x: 2300, y: FLOOR_Y, type: 0 },
                    { x: 2340, y: FLOOR_Y, type: 0 },
                    { x: 2380, y: FLOOR_Y, type: 0 },
                    // Gravity portal before end
                    { x: 2700, y: FLOOR_Y - 50, type: 5 },
                    { x: 3000, y: FLOOR_Y, type: 0 },
                ]
            },
            // ── Level 3: Saw Gauntlet ─────────────────────────────
            {
                name: "Level 3 - Saw Gauntlet",
                length: 4500,
                objects: [
                    // Opening spike triple
                    { x: 600, y: FLOOR_Y, type: 0 },
                    { x: 640, y: FLOOR_Y, type: 0 },
                    { x: 680, y: FLOOR_Y, type: 0 },
                    // Floating saw blades - dodge sequence
                    { x: 1000, y: FLOOR_Y - 50, type: 2 },
                    { x: 1250, y: FLOOR_Y - 90, type: 2 },
                    // Bounce pad into elevated platform section
                    { x: 1500, y: FLOOR_Y, type: 4 },
                    { x: 1650, y: FLOOR_Y - 100, type: 1 },
                    { x: 1690, y: FLOOR_Y - 100, type: 1 },
                    { x: 1730, y: FLOOR_Y - 100, type: 1 },
                    { x: 1730, y: FLOOR_Y - 140, type: 0 },
                    // Missile from the right
                    { x: 2100, y: FLOOR_Y - 25, type: 3 },
                    // Block staircase
                    { x: 2400, y: FLOOR_Y, type: 1 },
                    { x: 2440, y: FLOOR_Y, type: 1 },
                    { x: 2440, y: FLOOR_Y - 40, type: 1 },
                    { x: 2480, y: FLOOR_Y, type: 1 },
                    { x: 2480, y: FLOOR_Y - 40, type: 1 },
                    { x: 2480, y: FLOOR_Y - 80, type: 1 },
                    // Saw right after staircase
                    { x: 2600, y: FLOOR_Y - 30, type: 2 },
                    // Final spikes
                    { x: 3000, y: FLOOR_Y, type: 0 },
                    { x: 3040, y: FLOOR_Y, type: 0 },
                    // Gravity portal
                    { x: 3300, y: FLOOR_Y - 50, type: 5 },
                    { x: 3600, y: FLOOR_Y, type: 0 },
                    { x: 3800, y: FLOOR_Y, type: 0 },
                ]
            },
            // ── Level 4: Missile Madness ──────────────────────────
            {
                name: "Level 4 - Missile Madness",
                length: 5000,
                objects: [
                    // Quick spikes to set the tone
                    { x: 500, y: FLOOR_Y, type: 0 },
                    { x: 540, y: FLOOR_Y, type: 0 },
                    // First missile
                    { x: 850, y: FLOOR_Y - 25, type: 3 },
                    // Saw blade + spike combo
                    { x: 1200, y: FLOOR_Y - 60, type: 2 },
                    { x: 1300, y: FLOOR_Y, type: 0 },
                    { x: 1340, y: FLOOR_Y, type: 0 },
                    // Bounce pad over double saw
                    { x: 1600, y: FLOOR_Y, type: 4 },
                    { x: 1750, y: FLOOR_Y - 70, type: 2 },
                    { x: 1850, y: FLOOR_Y - 40, type: 2 },
                    // Landing platform
                    { x: 2000, y: FLOOR_Y - 60, type: 1 },
                    { x: 2040, y: FLOOR_Y - 60, type: 1 },
                    // Missile barrage (two missiles)
                    { x: 2300, y: FLOOR_Y - 20, type: 3 },
                    { x: 2500, y: FLOOR_Y - 60, type: 3 },
                    // Block pillar with spike
                    { x: 2800, y: FLOOR_Y, type: 1 },
                    { x: 2800, y: FLOOR_Y - 40, type: 1 },
                    { x: 2800, y: FLOOR_Y - 80, type: 0 },
                    // Gravity portal section
                    { x: 3100, y: FLOOR_Y - 50, type: 5 },
                    { x: 3300, y: FLOOR_Y - 80, type: 2 },
                    // Bounce pad to safety
                    { x: 3600, y: FLOOR_Y, type: 4 },
                    { x: 3750, y: FLOOR_Y - 120, type: 1 },
                    { x: 3790, y: FLOOR_Y - 120, type: 1 },
                    // Final stretch spikes
                    { x: 4100, y: FLOOR_Y, type: 0 },
                    { x: 4140, y: FLOOR_Y, type: 0 },
                    { x: 4180, y: FLOOR_Y, type: 0 },
                    { x: 4220, y: FLOOR_Y, type: 0 },
                    { x: 4600, y: FLOOR_Y, type: 0 },
                ]
            },
            // ── Level 5: The Gauntlet ─────────────────────────────
            {
                name: "Level 5 - The Gauntlet",
                length: 5500,
                objects: [
                    // Immediate pressure - triple spike
                    { x: 450, y: FLOOR_Y, type: 0 },
                    { x: 490, y: FLOOR_Y, type: 0 },
                    { x: 530, y: FLOOR_Y, type: 0 },
                    // Saw + missile combo
                    { x: 800, y: FLOOR_Y - 55, type: 2 },
                    { x: 950, y: FLOOR_Y - 25, type: 3 },
                    // Bounce pad over block wall with saw on top
                    { x: 1200, y: FLOOR_Y, type: 4 },
                    { x: 1350, y: FLOOR_Y, type: 1 },
                    { x: 1350, y: FLOOR_Y - 40, type: 1 },
                    { x: 1350, y: FLOOR_Y - 80, type: 1 },
                    { x: 1350, y: FLOOR_Y - 120, type: 2 },
                    // Spike field
                    { x: 1600, y: FLOOR_Y, type: 0 },
                    { x: 1640, y: FLOOR_Y, type: 0 },
                    { x: 1680, y: FLOOR_Y, type: 0 },
                    { x: 1720, y: FLOOR_Y, type: 0 },
                    // Gravity portal into saw dodge
                    { x: 1950, y: FLOOR_Y - 50, type: 5 },
                    { x: 2100, y: FLOOR_Y - 80, type: 2 },
                    { x: 2250, y: FLOOR_Y - 40, type: 2 },
                    // Missile from right
                    { x: 2500, y: FLOOR_Y - 30, type: 3 },
                    // Block staircase with spikes between
                    { x: 2800, y: FLOOR_Y, type: 1 },
                    { x: 2840, y: FLOOR_Y, type: 1 },
                    { x: 2840, y: FLOOR_Y - 40, type: 1 },
                    { x: 2920, y: FLOOR_Y, type: 0 },
                    { x: 2960, y: FLOOR_Y, type: 0 },
                    { x: 3050, y: FLOOR_Y, type: 1 },
                    { x: 3050, y: FLOOR_Y - 40, type: 1 },
                    { x: 3050, y: FLOOR_Y - 80, type: 1 },
                    // Bounce pad + double missile
                    { x: 3300, y: FLOOR_Y, type: 4 },
                    { x: 3500, y: FLOOR_Y - 30, type: 3 },
                    { x: 3600, y: FLOOR_Y - 70, type: 3 },
                    // Landing blocks
                    { x: 3800, y: FLOOR_Y - 60, type: 1 },
                    { x: 3840, y: FLOOR_Y - 60, type: 1 },
                    { x: 3840, y: FLOOR_Y - 100, type: 0 },
                    // Saw field
                    { x: 4100, y: FLOOR_Y - 30, type: 2 },
                    { x: 4250, y: FLOOR_Y - 70, type: 2 },
                    { x: 4400, y: FLOOR_Y - 30, type: 2 },
                    // Final bounce over spike wall
                    { x: 4700, y: FLOOR_Y, type: 4 },
                    { x: 4850, y: FLOOR_Y, type: 0 },
                    { x: 4890, y: FLOOR_Y, type: 0 },
                    { x: 4930, y: FLOOR_Y, type: 0 },
                    { x: 4970, y: FLOOR_Y, type: 0 },
                    { x: 5010, y: FLOOR_Y, type: 0 },
                    // Final missile
                    { x: 5300, y: FLOOR_Y - 25, type: 3 },
                    { x: 5700, y: FLOOR_Y, type: 0 },
                    { x: 5740, y: FLOOR_Y, type: 0 },
                    { x: 5780, y: FLOOR_Y, type: 0 },
                ]
            },
            // ── Level 6: Muddy Path ───────────────────────────────
            {
                name: "Level 6 - Muddy Path",
                length: 4000,
                objects: [
                    { x: 500, y: FLOOR_Y, type: 6 }, // Slowing trap
                    { x: 540, y: FLOOR_Y, type: 6 },
                    { x: 800, y: FLOOR_Y, type: 0 },
                    { x: 1200, y: FLOOR_Y, type: 6 },
                    { x: 1400, y: FLOOR_Y, type: 4 }, // Bounce over
                    { x: 1600, y: FLOOR_Y - 50, type: 2 },
                    { x: 1800, y: FLOOR_Y, type: 6 },
                    { x: 1840, y: FLOOR_Y, type: 6 },
                    { x: 1880, y: FLOOR_Y, type: 6 },
                    { x: 2300, y: FLOOR_Y - 30, type: 3 },
                    { x: 2600, y: FLOOR_Y, type: 1 },
                    { x: 2600, y: FLOOR_Y - 40, type: 1 },
                    { x: 2900, y: FLOOR_Y, type: 6 },
                    { x: 3000, y: FLOOR_Y, type: 0 },
                    { x: 3040, y: FLOOR_Y, type: 0 },
                    { x: 3300, y: FLOOR_Y - 50, type: 5 }, // Gravity
                    { x: 3600, y: FLOOR_Y, type: 6 },
                    { x: 3900, y: FLOOR_Y, type: 4 },
                    { x: 4200, y: FLOOR_Y, type: 0 },
                    { x: 4240, y: FLOOR_Y, type: 0 },
                    { x: 4280, y: FLOOR_Y, type: 0 }
                ]
            },
            // ── Level 7: Sticky Situation ─────────────────────────
            {
                name: "Level 7 - Explosive Mud",
                length: 6000,
                objects: [
                    { x: 500, y: FLOOR_Y, type: 6 },
                    { x: 520, y: FLOOR_Y, type: 9 }, // Landmine in mud
                    { x: 600, y: FLOOR_Y - 30, type: 3 },
                    { x: 900, y: FLOOR_Y, type: 1 },
                    { x: 940, y: FLOOR_Y, type: 1 },
                    { x: 940, y: FLOOR_Y - 40, type: 1 },
                    { x: 1200, y: FLOOR_Y, type: 6 },
                    { x: 1220, y: FLOOR_Y, type: 9 }, // Landmine
                    { x: 1240, y: FLOOR_Y, type: 6 },
                    { x: 1300, y: FLOOR_Y, type: 0 },
                    { x: 1340, y: FLOOR_Y, type: 0 },
                    { x: 1600, y: FLOOR_Y, type: 4 },
                    { x: 1800, y: FLOOR_Y - 70, type: 2 },
                    { x: 2000, y: FLOOR_Y, type: 6 },
                    { x: 2300, y: FLOOR_Y - 50, type: 5 },
                    { x: 2500, y: FLOOR_Y, type: 10 }, // Rickroll button!
                    { x: 2540, y: FLOOR_Y, type: 0 },
                    { x: 2700, y: FLOOR_Y, type: 6 },
                    { x: 2720, y: FLOOR_Y, type: 9 },
                    { x: 2740, y: FLOOR_Y, type: 6 },
                    { x: 3000, y: FLOOR_Y, type: 4 },
                    { x: 3200, y: FLOOR_Y - 30, type: 3 },
                    { x: 3500, y: FLOOR_Y, type: 1 },
                    { x: 3500, y: FLOOR_Y - 40, type: 1 },
                    { x: 3500, y: FLOOR_Y - 80, type: 2 },
                    { x: 3800, y: FLOOR_Y, type: 6 },
                    { x: 3840, y: FLOOR_Y, type: 9 }, // Landmine
                    { x: 4100, y: FLOOR_Y, type: 0 },
                    { x: 4140, y: FLOOR_Y, type: 0 },
                    { x: 4180, y: FLOOR_Y, type: 0 },
                    { x: 4500, y: FLOOR_Y, type: 6 },
                    { x: 4540, y: FLOOR_Y, type: 6 },
                    { x: 4580, y: FLOOR_Y, type: 6 },
                    { x: 4620, y: FLOOR_Y, type: 6 },
                    { x: 5000, y: FLOOR_Y, type: 4 },
                    { x: 5300, y: FLOOR_Y - 50, type: 2 }
                ]
            },
            // ── Level 8: Giant Threats ────────────────────────────
            {
                name: "Level 8 - Giant Threats",
                length: 6500,
                objects: [
                    { x: 400, y: FLOOR_Y, type: 6 },
                    { x: 440, y: FLOOR_Y, type: 6 },
                    { x: 700, y: FLOOR_Y, type: 0 },
                    { x: 740, y: FLOOR_Y, type: 0 },
                    { x: 1000, y: FLOOR_Y, type: 4 },
                    { x: 1200, y: FLOOR_Y, type: 12 }, // Giant Saw
                    { x: 1500, y: FLOOR_Y, type: 6 },
                    { x: 1540, y: FLOOR_Y, type: 6 },
                    { x: 1580, y: FLOOR_Y, type: 6 },
                    { x: 1800, y: FLOOR_Y - 30, type: 11 }, // Giant Missile
                    { x: 2200, y: FLOOR_Y, type: 4 },
                    { x: 2400, y: FLOOR_Y - 50, type: 5 },
                    { x: 2600, y: FLOOR_Y - 40, type: 2 },
                    { x: 2900, y: FLOOR_Y, type: 6 },
                    { x: 2940, y: FLOOR_Y, type: 6 },
                    { x: 3100, y: FLOOR_Y, type: 0 },
                    { x: 3140, y: FLOOR_Y, type: 0 },
                    { x: 3180, y: FLOOR_Y, type: 0 },
                    { x: 3400, y: FLOOR_Y, type: 1 },
                    { x: 3400, y: FLOOR_Y - 40, type: 1 },
                    { x: 3440, y: FLOOR_Y, type: 1 },
                    { x: 3700, y: FLOOR_Y, type: 6 },
                    { x: 4000, y: FLOOR_Y, type: 4 },
                    { x: 4200, y: FLOOR_Y - 60, type: 12 }, // Giant Saw
                    { x: 4500, y: FLOOR_Y, type: 0 },
                    { x: 4540, y: FLOOR_Y, type: 0 },
                    { x: 4800, y: FLOOR_Y, type: 6 },
                    { x: 4840, y: FLOOR_Y, type: 6 },
                    { x: 4880, y: FLOOR_Y, type: 6 },
                    { x: 5100, y: FLOOR_Y - 30, type: 11 }, // Giant Missile
                    { x: 5400, y: FLOOR_Y, type: 4 },
                    { x: 5600, y: FLOOR_Y, type: 0 },
                    { x: 5640, y: FLOOR_Y, type: 0 },
                    { x: 5680, y: FLOOR_Y, type: 0 },
                    { x: 5720, y: FLOOR_Y, type: 0 }
                ]
            },
            // ── Level 9: Precision ────────────────────────────────
            {
                name: "Level 9 - Portal Precision",
                length: 7000,
                objects: [
                    { x: 500, y: FLOOR_Y, type: 1 },
                    { x: 500, y: FLOOR_Y - 40, type: 1 },
                    { x: 540, y: FLOOR_Y, type: 1 },
                    { x: 800, y: FLOOR_Y, type: 6 },
                    { x: 840, y: FLOOR_Y, type: 6 },
                    { x: 880, y: FLOOR_Y, type: 0 },
                    { x: 1100, y: FLOOR_Y, type: 4 },
                    { x: 1300, y: FLOOR_Y - 100, type: 2 },
                    { x: 1600, y: FLOOR_Y, type: 6 },
                    { x: 1700, y: FLOOR_Y, type: 7 }, // Blue portal
                    { x: 1800, y: FLOOR_Y, type: 12 }, // Giant Saw blocking path
                    { x: 2100, y: FLOOR_Y - 100, type: 8 }, // Orange portal high up
                    { x: 2300, y: FLOOR_Y, type: 10 }, // Rickroll
                    { x: 2400, y: FLOOR_Y - 80, type: 2 },
                    { x: 2700, y: FLOOR_Y, type: 6 },
                    { x: 2740, y: FLOOR_Y, type: 6 },
                    { x: 2780, y: FLOOR_Y, type: 6 },
                    { x: 2820, y: FLOOR_Y, type: 6 },
                    { x: 3100, y: FLOOR_Y, type: 4 },
                    { x: 3300, y: FLOOR_Y, type: 1 },
                    { x: 3300, y: FLOOR_Y - 40, type: 1 },
                    { x: 3340, y: FLOOR_Y, type: 1 },
                    { x: 3600, y: FLOOR_Y, type: 7 }, // Blue Portal
                    { x: 3800, y: FLOOR_Y, type: 12 }, // Blocked by giant saw
                    { x: 4200, y: FLOOR_Y, type: 8 }, // Exit portal
                    { x: 4300, y: FLOOR_Y - 40, type: 11 }, // Giant missile
                    { x: 4600, y: FLOOR_Y, type: 4 },
                    { x: 4800, y: FLOOR_Y - 70, type: 2 },
                    { x: 5100, y: FLOOR_Y, type: 6 },
                    { x: 5200, y: FLOOR_Y, type: 0 },
                    { x: 5240, y: FLOOR_Y, type: 0 },
                    { x: 5500, y: FLOOR_Y, type: 4 },
                    { x: 5700, y: FLOOR_Y - 120, type: 1 },
                    { x: 5740, y: FLOOR_Y - 120, type: 1 },
                    { x: 6000, y: FLOOR_Y, type: 0 },
                    { x: 6040, y: FLOOR_Y, type: 0 },
                    { x: 6080, y: FLOOR_Y, type: 0 },
                    { x: 6120, y: FLOOR_Y, type: 0 }
                ]
            },
            // ── Level 10: The Ultimate Escape ─────────────────────
            {
                name: "Level 10 - The Ultimate Escape",
                length: 8000,
                objects: [
                    { x: 400, y: FLOOR_Y, type: 0 },
                    { x: 440, y: FLOOR_Y, type: 0 },
                    { x: 700, y: FLOOR_Y, type: 6 },
                    { x: 740, y: FLOOR_Y, type: 9 }, // Landmine
                    { x: 800, y: FLOOR_Y - 40, type: 11 }, // Giant Missile
                    { x: 1000, y: FLOOR_Y, type: 4 },
                    { x: 1200, y: FLOOR_Y, type: 12 }, // Giant Saw
                    { x: 1400, y: FLOOR_Y, type: 1 },
                    { x: 1400, y: FLOOR_Y - 40, type: 1 },
                    { x: 1440, y: FLOOR_Y, type: 1 },
                    { x: 1700, y: FLOOR_Y, type: 7 }, // Portal Blue
                    { x: 1900, y: FLOOR_Y, type: 12 }, // Wall of saws
                    { x: 2100, y: FLOOR_Y - 100, type: 8 }, // Portal Orange
                    { x: 2300, y: FLOOR_Y, type: 10 }, // Rickroll
                    { x: 2400, y: FLOOR_Y - 80, type: 2 },
                    { x: 2600, y: FLOOR_Y - 40, type: 2 },
                    { x: 2900, y: FLOOR_Y, type: 6 },
                    { x: 3100, y: FLOOR_Y, type: 0 },
                    { x: 3140, y: FLOOR_Y, type: 0 },
                    { x: 3180, y: FLOOR_Y, type: 0 },
                    { x: 3220, y: FLOOR_Y, type: 0 },
                    { x: 3500, y: FLOOR_Y - 20, type: 11 }, // Giant Missile
                    { x: 3600, y: FLOOR_Y - 70, type: 3 },
                    { x: 3800, y: FLOOR_Y, type: 4 },
                    { x: 4000, y: FLOOR_Y - 120, type: 1 },
                    { x: 4040, y: FLOOR_Y - 120, type: 1 },
                    { x: 4300, y: FLOOR_Y, type: 6 },
                    { x: 4340, y: FLOOR_Y, type: 6 },
                    { x: 4380, y: FLOOR_Y, type: 6 },
                    { x: 4420, y: FLOOR_Y, type: 6 },
                    { x: 4700, y: FLOOR_Y, type: 7 }, // Portal Blue
                    { x: 4900, y: FLOOR_Y, type: 12 }, // Giant Saw
                    { x: 5000, y: FLOOR_Y - 100, type: 8 }, // Portal Orange
                    { x: 5200, y: FLOOR_Y - 50, type: 5 },
                    { x: 5400, y: FLOOR_Y - 80, type: 2 },
                    { x: 5600, y: FLOOR_Y, type: 6 },
                    { x: 5640, y: FLOOR_Y, type: 9 }, // Landmine
                    { x: 5800, y: FLOOR_Y, type: 1 },
                    { x: 5800, y: FLOOR_Y - 40, type: 1 },
                    { x: 5800, y: FLOOR_Y - 80, type: 1 },
                    { x: 6100, y: FLOOR_Y - 40, type: 11 }, // Giant Missile
                    { x: 6300, y: FLOOR_Y - 30, type: 11 }, // Giant Missile
                    { x: 6600, y: FLOOR_Y, type: 4 },
                    { x: 6800, y: FLOOR_Y - 100, type: 2 },
                    { x: 7100, y: FLOOR_Y, type: 0 },
                    { x: 7140, y: FLOOR_Y, type: 0 },
                    { x: 7180, y: FLOOR_Y, type: 0 },
                    { x: 7220, y: FLOOR_Y, type: 0 },
                    { x: 7260, y: FLOOR_Y, type: 0 }
                ]
            },
            // ── Level 11: The Ultimate Level ──────────────────────────
            {
                name: "Level 11 - The Ultimate Level",
                length: 30000,
                speed: 8.5,
                objects: (function() {
                    let objs = [];
                    // Generate a massive 30,000 unit long level combining everything
                    for(let x = 600; x < 29000; x += 400) {
                        let rand = Math.random();
                        if (rand < 0.15) {
                            objs.push({x: x, y: FLOOR_Y, type: 0});
                            objs.push({x: x+40, y: FLOOR_Y, type: 0});
                        } else if (rand < 0.25) {
                            objs.push({x: x, y: FLOOR_Y - 40, type: 11}); // Giant Missile
                        } else if (rand < 0.35) {
                            objs.push({x: x, y: FLOOR_Y, type: 12}); // Giant Saw
                        } else if (rand < 0.45) {
                            objs.push({x: x, y: FLOOR_Y, type: 9}); // Landmine
                        } else if (rand < 0.55) {
                            objs.push({x: x, y: FLOOR_Y, type: 4}); // Bounce Pad
                            objs.push({x: x+200, y: FLOOR_Y - 80, type: 2}); // Saw above
                        } else if (rand < 0.65) {
                            objs.push({x: x, y: FLOOR_Y, type: 6}); // Slow trap
                            objs.push({x: x+40, y: FLOOR_Y, type: 6});
                            if (Math.random() > 0.5) objs.push({x: x+20, y: FLOOR_Y, type: 9}); // Landmine in mud
                        } else if (rand < 0.75) {
                            objs.push({x: x, y: FLOOR_Y, type: 7}); // Blue portal
                            objs.push({x: x+200, y: FLOOR_Y - 120, type: 8}); // Orange portal
                            x += 200;
                        } else if (rand < 0.85) {
                            objs.push({x: x, y: FLOOR_Y, type: 1}); 
                            objs.push({x: x, y: FLOOR_Y - 40, type: 1}); 
                            objs.push({x: x, y: FLOOR_Y - 80, type: 1}); 
                        } else if (rand < 0.90) {
                            objs.push({x: x, y: FLOOR_Y - 50, type: 5}); // Gravity portal
                        } else if (rand < 0.95) {
                            objs.push({x: x, y: FLOOR_Y, type: 10}); // Rickroll button
                        } else {
                            objs.push({x: x, y: FLOOR_Y - 30, type: 3}); // Normal missile
                            objs.push({x: x+100, y: FLOOR_Y - 60, type: 3}); 
                        }
                    }
                    return objs;
                })()
            }
        ];

        let currentLevelIdx = 0;
        let attempts = 1;
        let cameraX = 0;
        let particles = [];
        let trailParticles = [];
        let activeMissiles = [];
        let celebrationParticles = [];

        // ─── AUDIO CONTEXT FOR MONSTER ───
        let audioCtx = null;
        let monsterOsc = null;
        let monsterGain = null;
        let monsterFilter = null;

        function initAudio() {
            if (!audioCtx) {
                audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            }
            if (audioCtx.state === 'suspended') {
                audioCtx.resume();
            }
        }

        function startMonsterAudio() {
            if (!audioCtx) return;
            if (monsterOsc) stopMonsterAudio();
            
            monsterOsc = audioCtx.createOscillator();
            monsterOsc.type = 'sawtooth';
            monsterOsc.frequency.value = 40; // low ominous drone
            
            monsterFilter = audioCtx.createBiquadFilter();
            monsterFilter.type = 'lowpass';
            monsterFilter.frequency.value = 100;

            monsterGain = audioCtx.createGain();
            monsterGain.gain.value = 0; // start silent, fade in based on proximity
            
            monsterOsc.connect(monsterFilter);
            monsterFilter.connect(monsterGain);
            monsterGain.connect(audioCtx.destination);
            
            monsterOsc.start();
        }

        function updateMonsterAudio(distance) {
            if (!monsterGain) return;
            // distance ranges from approx 400 to 0
            // Closer = louder, higher frequency cutoff, slightly higher pitch
            let proximity = Math.max(0, 1 - (distance / 600)); // 0 (far) to 1 (close)
            
            // LFO for pulsating effect
            let pulse = Math.sin(gameTime * 0.1) * 0.5 + 0.5;
            
            monsterGain.gain.setTargetAtTime(proximity * 0.5 * pulse, audioCtx.currentTime, 0.1);
            monsterFilter.frequency.setTargetAtTime(100 + proximity * 400, audioCtx.currentTime, 0.1);
            monsterOsc.frequency.setTargetAtTime(40 + proximity * 30, audioCtx.currentTime, 0.1);
        }

        function stopMonsterAudio() {
            if (monsterOsc) {
                try { monsterOsc.stop(); } catch(e) {}
                monsterOsc.disconnect();
                monsterOsc = null;
            }
            if (monsterGain) {
                monsterGain.disconnect();
                monsterGain = null;
            }
            if (monsterFilter) {
                monsterFilter.disconnect();
                monsterFilter = null;
            }
        }

        function playExplosionSound() {
            if (!audioCtx) return;
            let osc = audioCtx.createOscillator();
            let gain = audioCtx.createGain();
            osc.type = 'square';
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            
            osc.frequency.setValueAtTime(150, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(10, audioCtx.currentTime + 0.3);
            
            gain.gain.setValueAtTime(0.5, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
            
            osc.start();
            osc.stop(audioCtx.currentTime + 0.3);
        }

        // ─── MONSTER CHASER ───
        const monsterChaser = {
            screenX: -300,     // start further back because it's huge
            baseSpeed: 0.3,
            radius: 150,       // MASSIVE
            active: false,

            reset() {
                this.screenX = -300;
                this.active = true;
                startMonsterAudio();
            },

            update() {
                if (!this.active) {
                    stopMonsterAudio();
                    return;
                }
                
                // Audio update
                let distanceToPlayer = player.x - this.screenX;
                updateMonsterAudio(distanceToPlayer);

                // Calculate frames needed to finish level
                let lvl = levels[currentLevelIdx];
                let lvlSpeed = lvl.speed || 5.0;
                let framesToFinish = lvl.length / lvlSpeed;
                
                // We want the monster to cover ~300 pixels (from -300 to 0) over the entire level
                // so it's always dangerously close by the end, but won't kill if you play perfectly.
                let basePacingSpeed = 300 / framesToFinish;

                // If player is slowed, the monster gets a huge burst of speed to punish them
                let slowPenalty = player.isSlowed ? 5.0 : 0; 
                
                this.screenX += basePacingSpeed + slowPenalty;
                
                // Cap
                if (this.screenX > player.x - 40) this.screenX = player.x - 40;

                // Collision with player
                let dx = (this.screenX) - (player.x + player.width / 2);
                let dy = (FLOOR_Y - 100) - (player.y + player.height / 2); // adjusted Y for larger radius
                // For collision we check against a smaller core radius so the player gets deep into the mouth
                if (Math.sqrt(dx * dx + dy * dy) < this.radius * 0.6) {
                    stopMonsterAudio();
                    die();
                }

                // Suck in ambient particles
                if (gameTime % 2 === 0) {
                    let particleColor;
                    if (currentLevelIdx % 2 === 0) {
                        particleColor = Math.random() > 0.5 ? '#9333EA' : '#C084FC'; // Purple for black hole
                    } else {
                        particleColor = Math.random() > 0.5 ? '#EF4444' : '#B91C1C'; // Red for fleshy monster
                    }
                    particles.push({
                        x: this.screenX + (Math.random() - 0.5) * 400,
                        y: FLOOR_Y - 100 + (Math.random() - 0.5) * 400,
                        vx: (this.screenX - (this.screenX + (Math.random() - 0.5) * 400)) * 0.08,
                        vy: (FLOOR_Y - 100 - (FLOOR_Y - 100 + (Math.random() - 0.5) * 400)) * 0.08,
                        life: 0.8,
                        color: particleColor
                    });
                }
            },

            draw() {
                if (!this.active) return;
                let cx = this.screenX;
                let cy = FLOOR_Y - 100;
                let r = this.radius;

                ctx.save();
                ctx.translate(cx, cy);

                if (currentLevelIdx % 2 === 0) {
                    // ── BLACK HOLE VARIANT ──
                    let swirl = gameTime * 0.05;
                    for(let i=0; i<3; i++) {
                        ctx.save();
                        ctx.rotate(swirl + i * (Math.PI / 1.5));
                        ctx.beginPath();
                        ctx.ellipse(0, 0, r * 1.5, r * 0.8, 0, 0, Math.PI * 2);
                        let grad = ctx.createRadialGradient(0,0, r*0.5, 0,0, r*1.5);
                        grad.addColorStop(0, 'rgba(0,0,0,1)');
                        grad.addColorStop(0.5, 'rgba(88,28,135,0.7)');
                        grad.addColorStop(1, 'rgba(0,0,0,0)');
                        ctx.fillStyle = grad;
                        ctx.fill();
                        ctx.restore();
                    }
                    
                    // Core void
                    ctx.fillStyle = '#000000';
                    ctx.beginPath();
                    ctx.arc(0, 0, r * 0.8, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // Accretion disk
                    ctx.save();
                    ctx.rotate(-swirl * 2);
                    ctx.beginPath();
                    ctx.ellipse(0, 0, r * 1.8, r * 0.3, 0.4, 0, Math.PI * 2);
                    ctx.strokeStyle = 'rgba(192, 132, 252, 0.8)';
                    ctx.lineWidth = 10;
                    ctx.stroke();
                    ctx.restore();
                } else {
                    // ── FLESHY MONSTER VARIANT ──
                    // Chomping animation
                    let chomp = Math.abs(Math.sin(gameTime * 0.15));
                    let mouthAngle = 0.15 + chomp * 0.5;

                    // Body glow
                    ctx.shadowColor = '#000000';
                    ctx.shadowBlur = 40;

                    // Main fleshy body
                    ctx.fillStyle = '#270410'; 
                    ctx.beginPath();
                    ctx.arc(0, 0, r, 0, Math.PI * 2);
                    ctx.fill();

                    ctx.shadowBlur = 0;

                    // Open mouth (void)
                    ctx.fillStyle = '#000000';
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.arc(0, 0, r, -mouthAngle, mouthAngle);
                    ctx.closePath();
                    ctx.fill();

                    // Teeth
                    ctx.fillStyle = '#F8FAFC';
                    ctx.save();
                    ctx.rotate(-mouthAngle);
                    for (let i = 0; i < 10; i++) {
                        let tx = r * 0.3 + i * 14;
                        if (tx > r - 10) break;
                        ctx.beginPath();
                        ctx.moveTo(tx, 0);
                        ctx.lineTo(tx + 7, 25); 
                        ctx.lineTo(tx + 14, 0);
                        ctx.fill();
                    }
                    ctx.restore();

                    ctx.save();
                    ctx.rotate(mouthAngle);
                    for (let i = 0; i < 10; i++) {
                        let tx = r * 0.3 + i * 14;
                        if (tx > r - 10) break;
                        ctx.beginPath();
                        ctx.moveTo(tx, 0);
                        ctx.lineTo(tx + 7, -25); 
                        ctx.lineTo(tx + 14, 0);
                        ctx.fill();
                    }
                    ctx.restore();

                    // Eyes
                    let drawEye = (ex, ey, s) => {
                        ctx.fillStyle = '#EF4444';
                        ctx.shadowColor = '#EF4444';
                        ctx.shadowBlur = 20 * s;
                        ctx.beginPath();
                        ctx.ellipse(ex, ey, 15*s, 8*s, 0.2, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.fillStyle = '#FEF2F2';
                        ctx.shadowBlur = 0;
                        ctx.beginPath();
                        ctx.arc(ex + 4*s, ey - 1*s, 3*s, 0, Math.PI * 2);
                        ctx.fill();
                    };

                    drawEye(-r*0.2, -r*0.5, 1);
                    drawEye(r*0.1, -r*0.65, 0.7);
                    drawEye(-r*0.4, -r*0.3, 0.6);
                }

                ctx.restore();
            }
        };

        let jumpHeld = false; // tracks whether the jump key/button is held

        const player = {
            x: 150,
            y: FLOOR_Y - TILE_SIZE,
            width: 24,           // narrower hitbox for stickman
            height: TILE_SIZE,   // full tile height for stickman
            vy: 0,
            rotation: 0,
            isGrounded: true,
            bounceTimer: 0,
            coyoteTimer: 0,
            jumpBufferTimer: 0,
            runCycle: 0,         // animation cycle for running legs

            reset() {
                this.y = FLOOR_Y - this.height;
                this.vy = 0;
                this.rotation = 0;
                this.isGrounded = true;
                this.bounceTimer = 0;
                this.coyoteTimer = 0;
                this.jumpBufferTimer = 0;
                this.runCycle = 0;
                this.isSlowed = false;
            },

            jump() {
                if (this.isGrounded || this.coyoteTimer > 0) {
                    this.vy = JUMP_FORCE;
                    this.isGrounded = false;
                    this.coyoteTimer = 0;
                    this.jumpBufferTimer = 0;
                    jumpHeld = true;
                } else {
                    this.jumpBufferTimer = JUMP_BUFFER_TIME;
                }
            },

            update() {
                let gravityScale = 1.0;
                if (this.vy > 0) {
                    gravityScale = FALL_MULTIPLIER;
                } else if (this.vy < 0 && !jumpHeld) {
                    gravityScale = LOW_JUMP_MULTIPLIER;
                }

                this.vy += GRAVITY * gravityScale * 0.5;
                let nextY = this.y + this.vy;
                this.vy += GRAVITY * gravityScale * 0.5;

                if (this.bounceTimer > 0) this.bounceTimer--;
                if (this.jumpBufferTimer > 0) this.jumpBufferTimer--;

                let wasGrounded = this.isGrounded;
                this.isGrounded = false;
                if (wasGrounded && this.vy > 0) {
                    this.coyoteTimer = COYOTE_TIME;
                } else if (this.coyoteTimer > 0) {
                    this.coyoteTimer--;
                }

                // Animate run cycle
                if (this.isGrounded || wasGrounded) {
                    this.runCycle += 0.35;
                }

                let level = levels[currentLevelIdx];
                let groundLevel = FLOOR_Y;
                this.isSlowed = false;

                for (let obj of level.objects) {
                    let objScreenX = obj.x - cameraX;
                    if (objScreenX > GAME_WIDTH + 100 || objScreenX < -TILE_SIZE - 100) continue;

                    let pL = this.x;
                    let pR = this.x + this.width;
                    let pT = nextY;
                    let pB = nextY + this.height;

                    // ─── TYPE 0: SPIKE ───
                    if (obj.type === 0) {
                        let oL = objScreenX;
                        let oR = objScreenX + TILE_SIZE;
                        let oT = obj.y - TILE_SIZE;
                        let oB = obj.y;
                        if (pR > oL && pL < oR && pB > oT && pT < oB) {
                            let shrink = 8;
                            if (pR - shrink > oL && pL + shrink < oR && pB > oT + shrink) {
                                die(); return;
                            }
                        }
                    }
                    // ─── TYPE 1: BLOCK ───
                    else if (obj.type === 1) {
                        let oL = objScreenX;
                        let oR = objScreenX + TILE_SIZE;
                        let oT = obj.y - TILE_SIZE;
                        let oB = obj.y;
                        if (pR > oL && pL < oR && pB > oT && pT < oB) {
                            let prevB = this.y + this.height;
                            if (prevB <= oT + 5 && this.vy >= 0) {
                                groundLevel = Math.min(groundLevel, oT);
                            } else {
                                die(); return;
                            }
                        }
                    }
                    // ─── TYPE 2: SAW BLADE ───
                    else if (obj.type === 2) {
                        let sawR = TILE_SIZE * 0.45;
                        let cx = objScreenX + TILE_SIZE / 2;
                        let cy = obj.y - TILE_SIZE / 2;
                        let closestX = Math.max(pL, Math.min(cx, pR));
                        let closestY = Math.max(pT, Math.min(cy, pB));
                        let dx = cx - closestX;
                        let dy = cy - closestY;
                        if (dx * dx + dy * dy < (sawR - 4) * (sawR - 4)) {
                            die(); return;
                        }
                    }
                    // ─── TYPE 3: MISSILE (spawner) ───
                    else if (obj.type === 3) {
                        if (!obj._fired && objScreenX < GAME_WIDTH + 50 && objScreenX > -200) {
                            obj._fired = true;
                            activeMissiles.push({
                                x: GAME_WIDTH + 20,
                                y: obj.y,
                                speed: 8 + currentLevelIdx * 0.5,
                                life: 300
                            });
                        }
                    }
                    // ─── TYPE 4: BOUNCE PAD ───
                    else if (obj.type === 4) {
                        let padW = TILE_SIZE;
                        let padH = 20;
                        let oL = objScreenX;
                        let oR = objScreenX + padW;
                        let oT = obj.y - padH;
                        let oB = obj.y;
                        if (pR > oL && pL < oR && pB > oT && pT < oB) {
                            this.vy = BOUNCE_FORCE;
                            this.isGrounded = false;
                            this.bounceTimer = 15;
                            for (let i = 0; i < 8; i++) {
                                particles.push({
                                    x: this.x + this.width / 2 + (Math.random() - 0.5) * 20,
                                    y: this.y + this.height,
                                    vx: (Math.random() - 0.5) * 4,
                                    vy: -Math.random() * 5,
                                    life: 0.7,
                                    color: COLOR_BOUNCE
                                });
                            }
                            this.y = nextY;
                            return;
                        }
                    }
                    // ─── TYPE 5: GRAVITY PORTAL ───
                    else if (obj.type === 5) {
                        let portalW = 30;
                        let portalH = 60;
                        let oL = objScreenX + (TILE_SIZE - portalW) / 2;
                        let oR = oL + portalW;
                        let oT = obj.y - portalH;
                        let oB = obj.y;
                        if (pR > oL && pL < oR && pB > oT && pT < oB) {
                            if (!obj._used) {
                                obj._used = true;
                                this.vy = -14;
                                this.isGrounded = false;
                                this.bounceTimer = 20;
                                for (let i = 0; i < 12; i++) {
                                    particles.push({
                                        x: this.x + this.width / 2,
                                        y: this.y + this.height / 2,
                                        vx: (Math.random() - 0.5) * 8,
                                        vy: (Math.random() - 0.5) * 8,
                                        life: 1.0,
                                        color: COLOR_PORTAL
                                    });
                                }
                            }
                        }
                    }
                    // ─── TYPE 6: SLOWING TRAP ───
                    else if (obj.type === 6) {
                        let padW = TILE_SIZE;
                        let padH = 10;
                        let oL = objScreenX;
                        let oR = objScreenX + padW;
                        let oT = obj.y - padH;
                        let oB = obj.y;
                        if (pR > oL && pL < oR && pB > oT && pT < oB) {
                            this.isSlowed = true;
                            if (gameTime % 4 === 0) {
                                particles.push({
                                    x: this.x + this.width / 2 + (Math.random() - 0.5) * 10,
                                    y: this.y + this.height,
                                    vx: (Math.random() - 0.5) * 2,
                                    vy: -Math.random() * 3,
                                    life: 0.5,
                                    color: '#8B5CF6' // Purple mud
                                });
                            }
                        }
                    }
                    // ─── NEW TRAPS 7-12 ───
                    else if (obj.type === 7) {
                        let portalW = 30;
                        let portalH = 60;
                        let px = objScreenX + (TILE_SIZE - portalW) / 2;
                        let py = obj.y - portalH;
                        if (pR > px && pL < px + portalW && pB > py && pT < py + portalH) {
                            if (!obj._used) {
                                obj._used = true;
                                let found = false;
                                for (let p of level.objects) {
                                    if (p.type === 8 && p.x > obj.x) {
                                        cameraX = p.x - this.x; 
                                        this.y = p.y - portalH - this.height; 
                                        found = true;
                                        break;
                                    }
                                }
                                if (found) {
                                    for (let i = 0; i < 20; i++) {
                                        particles.push({
                                            x: this.x + this.width / 2, y: this.y + this.height / 2,
                                            vx: (Math.random() - 0.5) * 10, vy: (Math.random() - 0.5) * 10,
                                            life: 1.2, color: '#3B82F6'
                                        });
                                    }
                                }
                            }
                        }
                    }
                    else if (obj.type === 9) {
                        let mineW = 20;
                        let mineH = 6;
                        let mx = objScreenX + (TILE_SIZE - mineW) / 2;
                        let my = obj.y - mineH;
                        if (pR > mx && pL < mx + mineW && pB > my && pT < my + mineH) {
                            playExplosionSound();
                            for (let p = 0; p < 40; p++) {
                                particles.push({ x: mx + mineW/2, y: my, vx: (Math.random() - 0.5) * 15, vy: (Math.random() - 0.5) * 15, life: 1.5, color: '#EF4444' });
                            }
                            die(); return;
                        }
                    }
                    else if (obj.type === 10) {
                        let btnW = 24;
                        let btnH = 8;
                        let bx = objScreenX + (TILE_SIZE - btnW) / 2;
                        let by = obj.y - btnH;
                        if (pR > bx && pL < bx + btnW && pB > by && pT < by + btnH) {
                            if (!obj._used) {
                                obj._used = true;
                                rickrollPauseTimer = 300; 
                                rickrollAudio.currentTime = 0;
                                rickrollAudio.play().catch(e => console.log('Audio error:', e));
                            }
                        }
                    }
                    else if (obj.type === 11) {
                        if (!obj._fired && objScreenX < GAME_WIDTH + 50 && objScreenX > -200) {
                            obj._fired = true;
                            activeMissiles.push({
                                x: GAME_WIDTH + 20,
                                y: obj.y,
                                speed: 6 + currentLevelIdx * 0.4,
                                life: 400,
                                isGiant: true
                            });
                        }
                    }
                    else if (obj.type === 12) {
                        let sawR = TILE_SIZE * 0.9; 
                        let cx = objScreenX + TILE_SIZE / 2;
                        let cy = obj.y - TILE_SIZE; 
                        let closestX = Math.max(pL, Math.min(cx, pR));
                        let closestY = Math.max(pT, Math.min(cy, pB));
                        let dx = cx - closestX;
                        let dy = cy - closestY;
                        if (dx * dx + dy * dy < (sawR - 4) * (sawR - 4)) {
                            die(); return;
                        }
                    }
                }

                // ─── MISSILE COLLISION ───
                for (let i = 0; i < activeMissiles.length; i++) {
                    let m = activeMissiles[i];
                    let mWidth = m.isGiant ? 72 : 36;
                    let mHeight = m.isGiant ? 20 : 10;
                    let mL = m.x;
                    let mR = m.x + mWidth;
                    let mT = m.y - mHeight;
                    let mB = m.y + mHeight;
                    if (this.x + this.width > mL && this.x < mR && nextY + this.height > mT && nextY < mB) {
                        let oldBottom = this.y + this.height;
                        // If falling and was previously above the rocket, bounce!
                        if (oldBottom <= mT + 8 && this.vy >= 0) {
                            nextY = mT - this.height;
                            this.vy = -JUMP_FORCE * 0.8; // Nice bounce off the rocket
                            this.isGrounded = false;
                            for (let p = 0; p < 8; p++) {
                                particles.push({
                                    x: this.x + this.width / 2 + (Math.random() - 0.5) * 20,
                                    y: nextY + this.height,
                                    vx: (Math.random() - 0.5) * 4,
                                    vy: Math.random() * 2,
                                    life: 0.6,
                                    color: '#ffffff'
                                });
                            }
                        } else {
                            // Hit the front or bottom
                            activeMissiles.splice(i, 1);
                            i--;
                            playExplosionSound();
                            for (let p = 0; p < 30; p++) {
                                particles.push({
                                    x: m.x + 18,
                                    y: m.y,
                                    vx: (Math.random() - 0.5) * 12,
                                    vy: (Math.random() - 0.5) * 12,
                                    life: 1.2,
                                    color: Math.random() > 0.5 ? '#EF4444' : '#F59E0B'
                                });
                            }
                            die();
                            return;
                        }
                    }
                }

                // Apply ground check
                if (nextY + this.height >= groundLevel) {
                    this.y = groundLevel - this.height;
                    this.vy = 0;
                    this.isGrounded = true;
                    this.coyoteTimer = 0;

                    if (this.jumpBufferTimer > 0) {
                        this.jumpBufferTimer = 0;
                        this.vy = JUMP_FORCE;
                        this.isGrounded = false;
                        jumpHeld = true;
                    }
                } else {
                    this.y = nextY;
                }
            },

            draw() {
                let cx = this.x + this.width / 2;
                let headY = this.y;                 // top of hitbox
                let bodyLen = this.height;

                // Stickman proportions
                let headR = 7;
                let lean = this.isGrounded ? 0.25 : 0.1; // Forward lean
                let neckX = cx + Math.sin(lean) * bodyLen * 0.3;
                let neckY = headY + headR * 2 + 1;
                let hipX = cx - Math.sin(lean) * bodyLen * 0.2;
                let hipY = neckY + bodyLen * 0.4;

                ctx.save();

                // Bounce glow
                if (this.bounceTimer > 0) {
                    ctx.shadowColor = COLOR_BOUNCE;
                    ctx.shadowBlur = 20 * (this.bounceTimer / 15);
                }

                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';

                // Helper to draw limbs with elbows/knees
                const drawLimb = (startX, startY, angle1, angle2, len1, len2, color) => {
                    ctx.strokeStyle = color;
                    let elbowX = startX + Math.sin(angle1) * len1;
                    let elbowY = startY + Math.cos(angle1) * len1;
                    let handX = elbowX + Math.sin(angle2) * len2;
                    let handY = elbowY + Math.cos(angle2) * len2;
                    ctx.beginPath();
                    ctx.moveTo(startX, startY);
                    ctx.lineTo(elbowX, elbowY);
                    ctx.lineTo(handX, handY);
                    ctx.stroke();
                };

                let time = this.runCycle;
                let isJumping = !this.isGrounded;
                let jumpPhase = Math.max(-1, Math.min(1, this.vy / 12)); // -1 going up, 1 going down

                let leftThighAngle, rightThighAngle, leftCalfAngle, rightCalfAngle;
                let leftUpperArmAngle, rightUpperArmAngle, leftLowerArmAngle, rightLowerArmAngle;

                if (isJumping) {
                    // Dynamic jumping pose
                    leftThighAngle = -0.3 + jumpPhase * 0.2;  // trailing back
                    rightThighAngle = 0.8 - jumpPhase * 0.2;  // knee up
                    leftCalfAngle = leftThighAngle - 0.5;
                    rightCalfAngle = rightThighAngle - 1.2;  // knee bent back

                    leftUpperArmAngle = 1.8 - jumpPhase * 0.5;  // reaching up/forward
                    rightUpperArmAngle = -1.5 - jumpPhase * 0.5; // trailing back

                    // Reaching up: arm extends naturally
                    leftLowerArmAngle = leftUpperArmAngle + 0.2;
                    // Trailing arm bends slightly
                    rightLowerArmAngle = rightUpperArmAngle + 0.3;
                } else {
                    // Running animation
                    let stride = Math.sin(time);
                    let strideCos = Math.cos(time);

                    leftThighAngle = stride * 0.9;
                    rightThighAngle = -stride * 0.9;

                    // Calves bend backward as the leg comes forward
                    let leftBend = Math.max(0, strideCos);
                    let rightBend = Math.max(0, -strideCos);
                    leftCalfAngle = leftThighAngle - leftBend * 1.8;
                    rightCalfAngle = rightThighAngle - rightBend * 1.8;

                    leftUpperArmAngle = -stride * 1.2;
                    rightUpperArmAngle = stride * 1.2;

                    // Elbows bend *up* (positive angle) when arms swing forward
                    let leftArmBend = Math.max(0, leftUpperArmAngle) * 0.8 + 0.2;
                    let rightArmBend = Math.max(0, rightUpperArmAngle) * 0.8 + 0.2;

                    leftLowerArmAngle = leftUpperArmAngle + leftArmBend;
                    rightLowerArmAngle = rightUpperArmAngle + rightArmBend;
                }

                let armLen1 = 7, armLen2 = 7;
                let legLen1 = 9, legLen2 = 9;

                let backColor = '#94A3B8'; // darker color for background limbs
                let frontColor = COLOR_PLAYER;

                // Left Arm (back)
                ctx.lineWidth = 2.5;
                drawLimb(neckX, neckY + 2, leftUpperArmAngle, leftLowerArmAngle, armLen1, armLen2, backColor);

                // Left Leg (back)
                ctx.lineWidth = 3;
                drawLimb(hipX, hipY, leftThighAngle, leftCalfAngle, legLen1, legLen2, backColor);

                // Torso
                ctx.strokeStyle = frontColor;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(neckX, neckY);
                ctx.lineTo(hipX, hipY);
                ctx.stroke();

                // Head
                ctx.fillStyle = frontColor;
                ctx.beginPath();
                ctx.arc(neckX, headY + headR, headR, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#CFFAFE';
                ctx.lineWidth = 1.5;
                ctx.stroke();

                // Right Leg (front)
                ctx.lineWidth = 3;
                drawLimb(hipX, hipY, rightThighAngle, rightCalfAngle, legLen1, legLen2, frontColor);

                // Right Arm (front)
                ctx.lineWidth = 2.5;
                drawLimb(neckX, neckY + 2, rightUpperArmAngle, rightLowerArmAngle, armLen1, armLen2, frontColor);

                // Eyes
                ctx.fillStyle = '#0f172a';
                ctx.beginPath();
                ctx.arc(neckX + 1.5, headY + headR - 1, 1.2, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(neckX + 4.5, headY + headR - 1, 1.2, 0, Math.PI * 2);
                ctx.fill();

                ctx.shadowBlur = 0;
                ctx.restore();
            }
        };

        function handleInput(e) {
            if (e.type === 'keydown' && (e.code === 'Space' || e.code === 'ArrowUp')) {
                e.preventDefault();
            }
            if (currentState === STATE_PLAYING) {
                if (e.type === 'mousedown' || e.type === 'touchstart' || (e.type === 'keydown' && (e.code === 'Space' || e.code === 'ArrowUp'))) {
                    jumpHeld = true;
                    player.jump();
                }
            }
        }

        function handleInputRelease(e) {
            if (e.type === 'keyup' && (e.code === 'Space' || e.code === 'ArrowUp')) {
                jumpHeld = false;
            }
            if (e.type === 'mouseup' || e.type === 'touchend') {
                jumpHeld = false;
            }
        }

        window.addEventListener('keydown', handleInput);
        window.addEventListener('keyup', handleInputRelease);
        canvas.addEventListener('mousedown', handleInput);
        canvas.addEventListener('mouseup', handleInputRelease);
        canvas.addEventListener('touchstart', handleInput, { passive: false });
        canvas.addEventListener('touchend', handleInputRelease);

        uiBtn.addEventListener('click', () => {
            initAudio();
            if (!window.isLoggedIn && currentLevelIdx >= 3) {
                showMessage("Please Sign In to access level 4 and beyond!");
                window.location.hash = "#register";
                return;
            }
            if (currentState === STATE_MENU || currentState === STATE_GAMEOVER) {
                startGame();
            } else if (currentState === STATE_VICTORY) {
                // currentLevelIdx was already advanced by winLevel()
                // Only reset to 0 if we finished ALL levels ("PLAY AGAIN")
                if (currentLevelIdx >= levels.length - 1) {
                    currentLevelIdx = 0;
                }
                startGame();
            }
        });

        function resetLevelRuntime() {
            // Reset runtime flags on all objects for the current level
            let level = levels[currentLevelIdx];
            for (let obj of level.objects) {
                delete obj._fired;
                delete obj._used;
            }
            activeMissiles = [];
        }

        function startGame() {
            cameraX = 0;
            attempts = 1;
            player.reset();
            particles = [];
            trailParticles = [];
            celebrationParticles = [];
            resetLevelRuntime();
            monsterChaser.reset();
            currentState = STATE_PLAYING;

            gameUI.classList.add('hidden');
            gameUI.classList.remove('flex');
            gameHUD.classList.remove('hidden');

            updateHUD();
        }

        function retryLevel() {
            cameraX = 0;
            attempts++;
            player.reset();
            particles = [];
            trailParticles = [];
            celebrationParticles = [];
            resetLevelRuntime();
            monsterChaser.reset();
            currentState = STATE_PLAYING;
            updateHUD();
        }

        const screamSound = new Audio('./chicken-bird-screaming-2.mp3');

        function die() {
            currentState = STATE_GAMEOVER;
            stopMonsterAudio();

            // Play Screaming Chicken Sound
            screamSound.currentTime = 0;
            screamSound.play().catch(e => console.log('Audio playback prevented:', e));
            for (let i = 0; i < 25; i++) {
                particles.push({
                    x: player.x + player.width / 2,
                    y: player.y + player.height / 2,
                    vx: (Math.random() - 0.5) * 12,
                    vy: (Math.random() - 0.5) * 12,
                    life: 1.0,
                    color: COLOR_PLAYER
                });
            }

            setTimeout(() => {
                if (currentState === STATE_GAMEOVER) {
                    retryLevel();
                }
            }, 2500); // Increased delay so the meme sound can finish playing
        }

        function spawnCelebration() {
            // Firework bursts at random positions
            const colors = ['#06B6D4', '#A855F7', '#F97316', '#22D3EE', '#FBBF24', '#34D399', '#F43F5E'];
            for (let burst = 0; burst < 5; burst++) {
                let bx = 150 + Math.random() * (GAME_WIDTH - 300);
                let by = 60 + Math.random() * (FLOOR_Y - 150);
                let burstColor = colors[Math.floor(Math.random() * colors.length)];
                for (let i = 0; i < 18; i++) {
                    let angle = (i / 18) * Math.PI * 2;
                    let speed = 3 + Math.random() * 3;
                    celebrationParticles.push({
                        x: bx,
                        y: by,
                        vx: Math.cos(angle) * speed,
                        vy: Math.sin(angle) * speed,
                        life: 1.0,
                        color: burstColor,
                        size: 3 + Math.random() * 3
                    });
                }
            }
        }

        function drawCelebration() {
            for (let i = celebrationParticles.length - 1; i >= 0; i--) {
                let p = celebrationParticles[i];
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.06; // gentle gravity on fireworks
                p.vx *= 0.99; // air resistance
                p.life -= 0.015;
                if (p.life <= 0) {
                    celebrationParticles.splice(i, 1);
                    continue;
                }
                let r = parseInt(p.color.slice(1, 3), 16);
                let g = parseInt(p.color.slice(3, 5), 16);
                let b = parseInt(p.color.slice(5, 7), 16);
                ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${p.life})`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        function winLevel() {
            currentState = STATE_VICTORY;
            monsterChaser.active = false;
            stopMonsterAudio();

            // Spawn celebration fireworks
            spawnCelebration();
            // Stagger additional bursts
            setTimeout(spawnCelebration, 300);
            setTimeout(spawnCelebration, 600);

            if (currentLevelIdx < levels.length - 1) {
                setTimeout(() => {
                    currentLevelIdx++;
                    cameraX = 0;
                    attempts = 1;
                    player.reset();
                    resetLevelRuntime();
                    updateHUD();

                    gameUI.classList.remove('hidden');
                    gameUI.classList.add('flex');
                    uiTitle.textContent = "LEVEL COMPLETE!";
                    uiTitle.className = "text-5xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-green-400 to-brand-primary mb-4 drop-shadow-lg";
                    if (!window.isLoggedIn && currentLevelIdx === 3) {
                        uiSubtitle.textContent = "Sign in to unlock Level 4!";
                        uiBtn.textContent = "REGISTER";
                    } else {
                        uiSubtitle.textContent = levels[currentLevelIdx].name;
                        uiBtn.textContent = "NEXT LEVEL";
                    }
                    gameHUD.classList.add('hidden');
                }, 1500);
            } else {
                setTimeout(() => {
                    gameUI.classList.remove('hidden');
                    gameUI.classList.add('flex');
                    uiTitle.textContent = "YOU WON!";
                    uiTitle.className = "text-5xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-yellow-400 to-brand-accent mb-4 drop-shadow-lg";
                    uiSubtitle.textContent = "You've completed the game! Map creator coming soon.";
                    uiBtn.textContent = "PLAY AGAIN";
                    gameHUD.classList.add('hidden');
                }, 1500);
            }
        }

        function updateHUD() {
            hudLevel.textContent = levels[currentLevelIdx].name;
            hudAttempts.textContent = attempts;
        }

        // ─── RENDERING ──────────────────────────────────────────

        function drawBackground() {
            ctx.fillStyle = COLOR_BG;
            ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

            // Grid (parallax)
            ctx.strokeStyle = COLOR_GRID;
            ctx.lineWidth = 1;
            let gridOffsetX = -(cameraX * 0.5) % 50;
            ctx.beginPath();
            for (let x = gridOffsetX; x < GAME_WIDTH; x += 50) {
                ctx.moveTo(x, 0);
                ctx.lineTo(x, GAME_HEIGHT);
            }
            for (let y = 0; y < GAME_HEIGHT; y += 50) {
                ctx.moveTo(0, y);
                ctx.lineTo(GAME_WIDTH, y);
            }
            ctx.stroke();

            // Ground
            ctx.fillStyle = (currentLevelIdx % 2 === 0) ? COLOR_GROUND : '#0f172a';
            ctx.fillRect(0, FLOOR_Y, GAME_WIDTH, GROUND_HEIGHT);

            // Ground line
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, FLOOR_Y);
            ctx.lineTo(GAME_WIDTH, FLOOR_Y);
            ctx.stroke();
        }

        function drawObjects() {
            let level = levels[currentLevelIdx];

            for (let obj of level.objects) {
                let x = obj.x - cameraX;
                if (x > GAME_WIDTH + 50 || x < -TILE_SIZE - 50) continue;

                let y = obj.y - TILE_SIZE;

                // ─── SPIKE ───
                if (obj.type === 0) {
                    ctx.fillStyle = COLOR_SPIKE;
                    ctx.beginPath();
                    ctx.moveTo(x + TILE_SIZE / 2, y);
                    ctx.lineTo(x + TILE_SIZE, y + TILE_SIZE);
                    ctx.lineTo(x, y + TILE_SIZE);
                    ctx.closePath();
                    ctx.fill();
                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }
                // ─── BLOCK ───
                else if (obj.type === 1) {
                    ctx.fillStyle = COLOR_BLOCK;
                    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(x, y, TILE_SIZE, TILE_SIZE);
                    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
                    ctx.strokeRect(x + 4, y + 4, TILE_SIZE - 8, TILE_SIZE - 8);
                }
                // ─── SAW BLADE ───
                else if (obj.type === 2) {
                    let cx = x + TILE_SIZE / 2;
                    let cy = obj.y - TILE_SIZE / 2;
                    let r = TILE_SIZE * 0.45;
                    let teeth = 8;
                    let angle = gameTime * 0.08;

                    ctx.save();
                    ctx.translate(cx, cy);
                    ctx.rotate(angle);

                    // Outer jagged circle
                    ctx.beginPath();
                    for (let i = 0; i < teeth * 2; i++) {
                        let a = (i / (teeth * 2)) * Math.PI * 2;
                        let rad = (i % 2 === 0) ? r : r * 0.7;
                        ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
                    }
                    ctx.closePath();
                    ctx.fillStyle = COLOR_SAW;
                    ctx.fill();
                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 1.5;
                    ctx.stroke();

                    // Center hole
                    ctx.beginPath();
                    ctx.arc(0, 0, r * 0.2, 0, Math.PI * 2);
                    ctx.fillStyle = '#1e293b';
                    ctx.fill();
                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 1;
                    ctx.stroke();

                    ctx.restore();
                }
                // ─── MISSILE SPAWNER (marker) ───
                else if (obj.type === 3) {
                    // Draw a small warning indicator at spawn point
                    let mx = x + TILE_SIZE / 2;
                    let my = obj.y;
                    ctx.save();
                    ctx.globalAlpha = 0.3 + 0.2 * Math.sin(gameTime * 0.15);
                    ctx.fillStyle = COLOR_MISSILE;
                    ctx.beginPath();
                    ctx.arc(mx, my, 6, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }
                // ─── BOUNCE PAD ───
                else if (obj.type === 4) {
                    let padW = TILE_SIZE;
                    let padH = 12;
                    let px = x;
                    let py = obj.y - padH;

                    // Base
                    ctx.fillStyle = '#164e63';
                    ctx.fillRect(px, py + padH - 6, padW, 6);

                    // Spring top (pulsing)
                    let pulse = 1 + 0.15 * Math.sin(gameTime * 0.12);
                    ctx.fillStyle = COLOR_BOUNCE;
                    ctx.fillRect(px + 2, py, padW - 4, padH - 6);

                    // Chevron arrows on pad
                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(px + padW * 0.3, py + padH * 0.5);
                    ctx.lineTo(px + padW * 0.5, py + 1);
                    ctx.lineTo(px + padW * 0.7, py + padH * 0.5);
                    ctx.stroke();

                    // Glow
                    ctx.save();
                    ctx.shadowColor = COLOR_BOUNCE;
                    ctx.shadowBlur = 8 * pulse;
                    ctx.strokeStyle = COLOR_BOUNCE;
                    ctx.lineWidth = 1;
                    ctx.strokeRect(px, py, padW, padH);
                    ctx.restore();
                }
                // ─── GRAVITY PORTAL ───
                else if (obj.type === 5) {
                    let portalW = 30;
                    let portalH = 60;
                    let px = x + (TILE_SIZE - portalW) / 2;
                    let py = obj.y - portalH;

                    ctx.save();
                    // Swirling effect
                    let swirl = gameTime * 0.06;
                    let alpha = 0.5 + 0.3 * Math.sin(swirl);

                    // Outer glow
                    ctx.shadowColor = COLOR_PORTAL;
                    ctx.shadowBlur = 15 + 5 * Math.sin(swirl);

                    // Portal body
                    ctx.fillStyle = `rgba(192, 132, 252, ${alpha})`;
                    ctx.beginPath();
                    ctx.ellipse(px + portalW / 2, py + portalH / 2, portalW / 2, portalH / 2, 0, 0, Math.PI * 2);
                    ctx.fill();

                    // Inner ring
                    ctx.strokeStyle = '#e9d5ff';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.ellipse(px + portalW / 2, py + portalH / 2, portalW / 3, portalH / 3, swirl, 0, Math.PI * 2);
                    ctx.stroke();

                    // Center dot
                    ctx.fillStyle = '#ffffff';
                    ctx.beginPath();
                    ctx.arc(px + portalW / 2, py + portalH / 2, 3, 0, Math.PI * 2);
                    ctx.fill();

                    ctx.restore();
                }
                // ─── SLOWING TRAP ───
                else if (obj.type === 6) {
                    let padW = TILE_SIZE;
                    let padH = 10;
                    let px = x;
                    let py = obj.y - padH;
                    
                    ctx.save();
                    let pulse = Math.sin(gameTime * 0.1 + px) * 2;
                    
                    ctx.fillStyle = '#8B5CF6'; // Purple mud
                    ctx.beginPath();
                    ctx.ellipse(px + padW/2, py + padH, padW/2 + pulse, padH/2, 0, 0, Math.PI * 2);
                    ctx.fill();

                    ctx.fillStyle = '#A78BFA';
                    ctx.beginPath();
                    ctx.ellipse(px + padW/2, py + padH - 2, padW/3, padH/3, 0, 0, Math.PI * 2);
                    ctx.fill();

                    if (gameTime % 20 < 10) {
                        ctx.fillStyle = '#C4B5FD';
                        ctx.beginPath();
                        ctx.arc(px + padW*0.3, py + padH - 4 + pulse*0.5, 2, 0, Math.PI*2);
                        ctx.fill();
                    }

                    ctx.shadowColor = '#8B5CF6';
                    ctx.shadowBlur = 10;
                    ctx.strokeStyle = '#6D28D9';
                    ctx.lineWidth = 1;
                    ctx.stroke();
                    ctx.restore();
                }
                // ─── NEW TRAPS 7-12 ───
                else if (obj.type === 7 || obj.type === 8) { // Portals
                    let portalW = 30;
                    let portalH = 60;
                    let px = x + (TILE_SIZE - portalW) / 2;
                    let py = obj.y - portalH;

                    ctx.save();
                    let swirl = gameTime * 0.06;
                    let alpha = 0.5 + 0.3 * Math.sin(swirl);
                    let color = obj.type === 7 ? '59, 130, 246' : '249, 115, 22'; // Blue or Orange

                    ctx.shadowColor = `rgb(${color})`;
                    ctx.shadowBlur = 15 + 5 * Math.sin(swirl);

                    ctx.fillStyle = `rgba(${color}, ${alpha})`;
                    ctx.beginPath();
                    ctx.ellipse(px + portalW / 2, py + portalH / 2, portalW / 2, portalH / 2, 0, 0, Math.PI * 2);
                    ctx.fill();

                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.ellipse(px + portalW / 2, py + portalH / 2, portalW / 3, portalH / 3, swirl, 0, Math.PI * 2);
                    ctx.stroke();

                    ctx.fillStyle = '#ffffff';
                    ctx.beginPath();
                    ctx.arc(px + portalW / 2, py + portalH / 2, 3, 0, Math.PI * 2);
                    ctx.fill();

                    ctx.restore();
                }
                else if (obj.type === 9) { // Landmine
                    let mineW = 20;
                    let mineH = 6;
                    let mx = x + (TILE_SIZE - mineW) / 2;
                    let my = obj.y - mineH;
                    
                    ctx.fillStyle = '#111827';
                    ctx.fillRect(mx, my, mineW, mineH);
                    ctx.fillStyle = '#EF4444'; // Red button
                    ctx.beginPath();
                    ctx.arc(mx + mineW/2, my, 4, 0, Math.PI * 2);
                    ctx.fill();
                    if (gameTime % 20 < 10) {
                        ctx.fillStyle = '#ffffff';
                        ctx.fill();
                    }
                }
                else if (obj.type === 10) { // Rickroll Button
                    let btnW = 24;
                    let btnH = 8;
                    let bx = x + (TILE_SIZE - btnW) / 2;
                    let by = obj.y - btnH;
                    
                    ctx.fillStyle = '#374151';
                    ctx.fillRect(bx, by, btnW, btnH);
                    ctx.fillStyle = '#FDE047'; // Yellow top
                    ctx.fillRect(bx+2, by-2, btnW-4, 2);
                }
                else if (obj.type === 11) { // Giant Missile Spawner
                    let mx = x + TILE_SIZE / 2;
                    let my = obj.y;
                    ctx.save();
                    ctx.globalAlpha = 0.3 + 0.2 * Math.sin(gameTime * 0.15);
                    ctx.fillStyle = '#DC2626';
                    ctx.beginPath();
                    ctx.arc(mx, my, 12, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }
                else if (obj.type === 12) { // Giant Saw
                    let cx = x + TILE_SIZE / 2;
                    let cy = obj.y - TILE_SIZE; 
                    let r = TILE_SIZE * 0.9;
                    let teeth = 12;
                    let angle = gameTime * -0.06;

                    ctx.save();
                    ctx.translate(cx, cy);
                    ctx.rotate(angle);

                    ctx.beginPath();
                    for (let i = 0; i < teeth * 2; i++) {
                        let a = (i / (teeth * 2)) * Math.PI * 2;
                        let rad = (i % 2 === 0) ? r : r * 0.7;
                        ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
                    }
                    ctx.closePath();
                    ctx.fillStyle = '#991B1B'; // Darker red
                    ctx.fill();
                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 2;
                    ctx.stroke();

                    ctx.beginPath();
                    ctx.arc(0, 0, r * 0.2, 0, Math.PI * 2);
                    ctx.fillStyle = '#1e293b';
                    ctx.fill();
                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 1;
                    ctx.stroke();

                    ctx.restore();
                }
            }
        }

        function drawMissiles() {
            for (let m of activeMissiles) {
                let mx = m.x;
                let my = m.y;
                let isGiant = m.isGiant;
                let w = isGiant ? 72 : 36;
                let h = isGiant ? 20 : 8;

                ctx.save();
                // Missile body
                ctx.fillStyle = isGiant ? '#DC2626' : COLOR_MISSILE;
                ctx.beginPath();
                ctx.moveTo(mx, my);
                ctx.lineTo(mx + w, my);
                ctx.lineTo(mx + w, my);
                ctx.lineTo(mx + w - 6, my - h);
                ctx.lineTo(mx, my - h);
                ctx.closePath();
                ctx.fill();

                // Nose cone
                ctx.fillStyle = '#ef4444';
                ctx.beginPath();
                ctx.moveTo(mx, my);
                ctx.lineTo(mx - (isGiant ? 16 : 8), my - h/2);
                ctx.lineTo(mx, my - h);
                ctx.closePath();
                ctx.fill();

                // Exhaust flame
                let flicker = Math.random() * (isGiant ? 12 : 6);
                ctx.fillStyle = '#fbbf24';
                ctx.beginPath();
                ctx.moveTo(mx + w, my);
                ctx.lineTo(mx + w + (isGiant ? 12 : 6) + flicker, my - h/2);
                ctx.lineTo(mx + w, my - h);
                ctx.closePath();
                ctx.fill();

                // Glow
                ctx.shadowColor = isGiant ? '#DC2626' : COLOR_MISSILE;
                ctx.shadowBlur = isGiant ? 20 : 10;
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 1;
                ctx.strokeRect(mx, my - h, w, h);
                ctx.restore();
            }
        }

        function drawTrailParticles() {
            for (let i = trailParticles.length - 1; i >= 0; i--) {
                let p = trailParticles[i];
                p.life -= 0.06;
                p.x -= SCROLL_SPEED * 0.5;
                if (p.life <= 0) {
                    trailParticles.splice(i, 1);
                    continue;
                }
                ctx.fillStyle = `rgba(6, 182, 212, ${p.life * 0.5})`;
                ctx.fillRect(p.x, p.y, 3, 3);
            }
        }

        function drawParticles() {
            for (let i = particles.length - 1; i >= 0; i--) {
                let p = particles[i];
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.15; // mini gravity on particles
                p.life -= 0.04;

                if (p.life <= 0) {
                    particles.splice(i, 1);
                    continue;
                }

                let color = p.color || COLOR_PLAYER;
                // Parse hex to rgb for alpha
                let r = parseInt(color.slice(1, 3), 16);
                let g = parseInt(color.slice(3, 5), 16);
                let b = parseInt(color.slice(5, 7), 16);
                ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${p.life})`;
                ctx.fillRect(p.x, p.y, 4, 4);
            }
        }

        // ─── GAME LOOP ──────────────────────────────────────────

        function gameLoop() {
            gameTime++;

            let currentSpeed = levels[currentLevelIdx].speed || SCROLL_SPEED;
            if (player.isSlowed) currentSpeed *= 0.35; // major speed reduction in mud

            if (currentState === STATE_PLAYING) {
                if (rickrollPauseTimer > 0) {
                    rickrollPauseTimer--;
                } else {
                    cameraX += currentSpeed;

                    player.update();
                    monsterChaser.update();

                    // Player trail particles
                    if (gameTime % 3 === 0) {
                        trailParticles.push({
                            x: player.x + 2,
                            y: player.y + player.height / 2 + (Math.random() - 0.5) * 8,
                            life: 0.8
                        });
                    }

                    // Update missiles
                    for (let i = activeMissiles.length - 1; i >= 0; i--) {
                        let m = activeMissiles[i];
                        m.x -= m.speed;
                        m.life--;
                        if (m.x < -100 || m.life <= 0) {
                            activeMissiles.splice(i, 1);
                        }
                    }
                }

                // Progress bar (still update visually)
                let levelLength = levels[currentLevelIdx].length;
                let progress = Math.min(100, (cameraX / levelLength) * 100);
                hudProgress.style.width = `${progress}%`;

                // Win check
                if (cameraX >= levelLength) {
                    winLevel();
                }
            }

            // ─── RENDER ───
            drawBackground();

            if (currentState === STATE_PLAYING || currentState === STATE_VICTORY) {
                monsterChaser.draw();
                drawTrailParticles();
                drawObjects();
                drawMissiles();
                player.draw();
                drawParticles();
                drawCelebration();
            } else if (currentState === STATE_GAMEOVER) {
                monsterChaser.draw();
                drawObjects();
                drawMissiles();
                drawParticles();
            }

            animationFrameId = requestAnimationFrame(gameLoop);
        }

        // Initialize
        window.onload = function () {
            uiSubtitle.textContent = levels[0].name;
            gameLoop();
        }