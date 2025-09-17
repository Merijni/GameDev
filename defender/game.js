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
        this.load.audio('laser', 'assets/laser-gun.mp3');
        this.load.audio('serverHit', 'assets/server-hit.mp3');

    }

    create() {
        this.keys = this.input.keyboard.addKeys('W,A,D,SPACE');
        this.createPlayer();
        this.createBullets();

        this.sfx = {
            laser: this.sound.add('laser', { volume: 0.6 }), // volume kun je zelf instellen
            serverHit: this.sound.add('serverHit', { volume: 0.6 })
        };
        this.cursors = this.input.keyboard.createCursorKeys();

        this.viruses = this.physics.add.group({ runChildUpdate: true });

        // als een kogel de virus raakt dan de onBulletHitsVirus functie aanroepen
        this.physics.add.overlap(
            this.bullets,
            this.viruses,
            this.onBulletHitsVirus,
            null,
            this
        );

        // leven en score
        this.lives = 3;
        this.livesText = this.add.text(650, 16, 'Lives: ' + this.lives, {
            fontSize: '24px',
            fill: '#fff'
        });

        this.score = 0;
        this.scoreText = this.add.text(16, 16, 'Score: 0', {
            fontSize: '24px',
            fill: '#fff'
        });

        // --- difficulty controls ---
        this.level = 1;           // voor info/gevoel
        this.difficulty = 1;      // multiplier voor virus-snelheid
        this.spawnDelay = 1500;   // start rustig
        this.spawnBurst = 1;      // hoeveel virussen per tick

        // (optioneel) level HUD
        this.levelText = this.add.text(350, 16, 'Level: ' + this.level, {
            fontSize: '24px', fill: '#fff'
        });

        // Spawn timer, bewaar de reference zodat we 'm kunnen aanpassen
        this.spawnTimer = this.time.addEvent({
            delay: this.spawnDelay,
            loop: true,
            callback: () => {
                for (let i = 0; i < this.spawnBurst; i++) {
                    this.spawnRandomVirus(['red', 'blue', 'green', 'purple']);
                }
            }
        });

        // Elke 15s een tikje moeilijker (kan ook score-based, zie onder)
        this.time.addEvent({
            delay: 15000,
            loop: true,
            callback: () => this.levelUp()
        });

        this.gameOver = false;
    }

    spawnRandomVirus(types) {
        const x = Phaser.Math.Between(50, this.sys.game.config.width - 50);
        const y = -50;
        const type = Phaser.Utils.Array.GetRandom(types);

        const v = new Virus(this, x, y, TEX_BY_TYPE[type] || 'virus_red', type)
            .setSpeedMultiplier(this.difficulty);

        this.viruses.add(v);
    }

    levelUp() {
        this.level += 1;
        if (this.levelText) this.levelText.setText('Level: ' + this.level);

        // 1) virussen sneller laten bewegen (via multiplier op Virus)
        this.difficulty = Math.min(3.0, this.difficulty + 0.2); // cap 3x

        // 2) af en toe méér tegelijk spawnen
        if (this.level % 2 === 0) {
            this.spawnBurst = Math.min(4, this.spawnBurst + 1); // max 4 tegelijk
        }

        // 3) spawns vaker laten komen (delay -10%, tot min 500ms)
        this.spawnDelay = Math.max(500, Math.floor(this.spawnDelay * 0.9));

        // timer herstarten met nieuwe delay
        this.spawnTimer.remove(false);
        this.spawnTimer = this.time.addEvent({
            delay: this.spawnDelay,
            loop: true,
            callback: () => {
                for (let i = 0; i < this.spawnBurst; i++) {
                    this.spawnRandomVirus(['red', 'blue', 'green', 'purple']);
                }
            }
        });
    }

    onBulletHitsVirus(bullet, virus) {
        if (bullet.body) {
            bullet.disableBody(true, true);
        } else {
            bullet.setActive(false).setVisible(false);
        }

        if (virus.body) {
            virus.disableBody(true, true);
        } else {
            virus.setActive(false).setVisible(false);
        }

        // score bijhouden
        this.score += 10;
        this.scoreText.setText('Score: ' + this.score);
        // this.sound.play('hit_sfx');
    }

    update() {
        this.player.setVelocityY(0);

        if (this.cursors.left.isDown || this.keys.A.isDown) {
            this.player.setVelocityX(-300);
        } else if (this.cursors.right.isDown || this.keys.D.isDown) {
            this.player.setVelocityX(300);
        } else {
            this.player.setVelocityX(0);
        }

        if (this.keys && this.keys.SPACE && Phaser.Input.Keyboard.JustDown(this.keys.SPACE)) {
            this.shoot();
        }

        this.player.y = this.sys.game.config.height - 100;

        // check of een virus onderaan het scherm is gekomen
        this.viruses.children.iterate((virus) => {
            if (virus && virus.active && virus.y > this.sys.game.config.height) {
                virus.disableBody(true, true);
                this.loseLife();
            }
        });
    }

    loseLife() {
        this.sfx.serverHit.play();
        this.lives -= 1;
        this.livesText.setText('Lives: ' + this.lives);
        if (this.lives <= 0 && !this.gameOver) {
            this.gameOver = true;               // voorkomt dubbele submits
            this.physics.pause();               // alles stilzetten
            this.spawnTimer?.remove();          // timer stoppen (als hij bestaat)

            const name = localStorage.getItem('player_name') || 'Anon';
            submitScore(name, this.score);      // fire-and-forget

            // kleine delay voor UX en om het request te laten vertrekken
            this.time.delayedCall(400, () => {
                this.scene.stop();
                window.location.href = 'index.html'; // terug naar startscherm
            });
        }
    }

    // hier zorgt hij dat een kogel wordt afgevuurd
    shoot() {
        const startX = this.player.x;
        const startY = this.player.y - 20;

        const bullet = this.bullets.get(startX, startY, 'bullet');
        if (!bullet) return;

        bullet.setActive(true).setVisible(true);

        if (bullet.body) {
            bullet.body.enable = true;
            bullet.body.reset(startX, startY);
            bullet.body.setAllowGravity(false);
        } else {
            this.physics.world.enable(bullet);
            bullet.body.reset(startX, startY);
            bullet.body.setAllowGravity(false);
        }

        bullet.setScale(0.05);
        bullet.setAngle(270);
        bullet.setVelocityY(-300);
        bullet.setCollideWorldBounds(true);
        bullet.body.onWorldBounds = true;

        this.sfx.laser.play();
    }


    // hier maakt hij de kogels aan
    createBullets() {
        this.bullets = this.physics.add.group({
            defaultKey: 'bullet',
            maxSize: 50,
            allowGravity: false
        });

        // alle kogels die uit het beeld gaan verwijderen
        this.physics.world.on('worldbounds', (body) => {
            const go = body.gameObject;
            if (go && go.texture && go.texture.key === 'bullet') {
                this.bullets.killAndHide(go);
                body.enable = false;
            }
        });
    }

    // hier maakt hij de speler aan
    createPlayer() {
        const gameHeight = this.sys.game.config.height;
        const gameWidth = this.sys.game.config.width;
        this.player = this.physics.add.sprite(gameWidth * 0.5, gameHeight - 100, 'firewall').setScale(0.1);
        this.player.setCollideWorldBounds(true);
    }
}

const config = {
    type: Phaser.AUTO,
    parent: 'gameMount',
    width: 960,
    height: 600,  // hoogte hetzelfde
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
        default: 'arcade',
        arcade: { gravity: { y: 300 }, debug: false }
    },
    scene: [MainScene]
};



const game = new Phaser.Game(config);
