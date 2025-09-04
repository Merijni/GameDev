class MainScene extends Phaser.Scene {
    // hier worden alle plaatjes voor geladen
    preload() {
        this.load.image('firewall', 'assets/firewall.png');
        this.load.image('bullet', 'assets/kogel.png');

    }

    create() {
        this.keys = this.input.keyboard.addKeys('W,A,D,SPACE');
        this.createPlayer();
        this.createBullets();
        this.cursors = this.input.keyboard.createCursorKeys(); // pijltjestoetsen


        this.remove();
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
