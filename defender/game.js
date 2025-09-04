class MainScene extends Phaser.Scene {
    // hier worden alle plaatjes voor geladen
    preload() {
        this.load.image('firewall', 'assets/firewall.png');
    }

    create() {
        this.createPlayer();
        this.keyConfig();
        this.cursors = this.input.keyboard.createCursorKeys(); // pijltjestoetsen
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

        this.player.y = this.sys.game.config.height - 100;
    }

    // hier worden de toetsen toegevoegd dat je ook met A & D kan bewegen en dadelijk ook met W kan schieten
    keyConfig() {
        // WASD apart toevoegen
        this.keys = this.input.keyboard.addKeys({
            W: Phaser.Input.Keyboard.KeyCodes.W,
            A: Phaser.Input.Keyboard.KeyCodes.A,
            D: Phaser.Input.Keyboard.KeyCodes.D
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
