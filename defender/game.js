import Virus from './virus.js';

// Mapping van virus types naar texture keys
const TEX_BY_TYPE = {
    red: 'virus_red',
    blue: 'virus_blue',
    green: 'virus_green',
    purple: 'virus_purple'
};

class MainScene extends Phaser.Scene {
    // hier worden alle plaatjes voor geladen

    preload() {
        this.load.image('firewall', 'assets/firewall.png');
        this.load.image('bullet', 'assets/kogel.png');
        this.load.image('virus_red', 'assets/virus_red.png');
        this.load.image('virus_blue', 'assets/virus_blue.png');
        this.load.image('virus_green', 'assets/virus_green.png');
        this.load.image('virus_purple', 'assets/virus_purple.png');
    }

    create() {
        this.keys = this.input.keyboard.addKeys('W,A,D,SPACE');
        this.createPlayer();
        this.createBullets();

        this.cursors = this.input.keyboard.createCursorKeys();

        this.viruses = this.physics.add.group({ runChildUpdate: true });

        this.cursors = this.input.keyboard.createCursorKeys();

        // — Grid wave (2 rijen x 6 kolommen) —
        this.spawnWaveGrid(['red', 'blue', 'green', 'purple'], {
            rows: 2, cols: 6,
            startX: 90, startY: -60, // boven beeld spawnen
            gapX: 110, gapY: 80
        });
    }

    // A) Spawn in een grid
    spawnWaveGrid(types, { rows, cols, startX, startY, gapX, gapY }) {
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const type = types[(r * cols + c) % types.length];
                const x = startX + c * gapX;
                const y = startY + r * gapY;
                const v = new Virus(this, x, y, TEX_BY_TYPE[type] || 'virus_red', type);
                this.viruses.add(v);
            }
        }
    }

    // B) Spawn één voor één met interval (wave “stroomt” in)
    spawnWaveTimed(types, { count, delay, startX, startY, gapX }) {
        let i = 0;
        this.time.addEvent({
            delay,
            repeat: count - 1,
            callback: () => {
                const type = types[i % types.length];
                const x = startX + (i % Math.ceil(count / 2)) * gapX; // simpele spreiding
                const v = new Virus(this, x, startY, TEX_BY_TYPE[type] || 'virus_red', type);
                this.viruses.add(v);
                i++;
            }
        });
    }


    update() {
        this.player.setVelocityY(0);

        if (this.cursors.left.isDown || this.keys.A.isDown) {
            this.player.setVelocityX(-160);
        } else if (this.cursors.right.isDown || this.keys.D.isDown) {
            this.player.setVelocityX(160);
        } else {
            this.player.setVelocityX(0);
        }

        if (this.keys && this.keys.SPACE && Phaser.Input.Keyboard.JustDown(this.keys.SPACE)) {
            this.shoot();
        }

        this.player.y = this.sys.game.config.height - 100;
    }


    shoot() {
        const bullet = this.bullets.get(this.player.x, this.player.y - 20, 'bullet'); // key hier meegeven mag ook
        if (!bullet) return;

        bullet.setActive(true).setVisible(true);
        bullet.body.setAllowGravity(false);
        bullet.setVelocityY(-300);

        bullet.setScale(0.05);
        // hier draai ik de kogel dat hij naar boven wijst
        bullet.setAngle(270);

        bullet.body.onWorldBounds = true;
    }

    // hier maakt hij de kogels aan
    createBullets() {
        this.bullets = this.physics.add.group({
            defaultKey: 'bullet',
        });
    }

    // hier maakt hij de speler aan
    createPlayer() {
        // hoogte van je canvas opvragen
        const gameHeight = this.sys.game.config.height;
        // speler onderaan zetten, maar 50px van de onderkant af
        const gameWidth = this.sys.game.config.width;
        // zorg dat je altijd in het midden spawnt, 50px van de onderkant
        this.player = this.physics.add.sprite(gameWidth * 0.5, gameHeight - 100, 'firewall').setScale(0.1);
        // mag niet buiten het scherm bewegen
        this.player.setCollideWorldBounds(true);
    }

    remove() {
        this.physics.world.on('worldbounds', (body) => {
            const go = body.gameObject;
            if (go && go.texture && go.texture.key === 'bullet') {
                this.bullets.killAndHide(go); // terug in de pool
                body.enable = false;          // physics uit
            }
        });
    }
}

const config = {
    type: Phaser.AUTO,         // kiest WebGL of Canvas
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',       // simpele physics engine
        arcade: { gravity: { y: 300 }, debug: false }
    },
    scene: [MainScene]         // welke scene(s) je wilt draaien
};

const game = new Phaser.Game(config);
