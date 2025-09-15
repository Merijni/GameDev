export default class Virus extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, texture, type) {
    super(scene, x, y, texture);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.type = type;
    this.body.setAllowGravity(false);

    // handiger alias
    const r = Phaser.Math.Between;

    // basis snelheid afhankelijk van type
    if (type === 'red') {
      this.setScale(0.15);
      this.baseSpeed = r(60, 90);
    }
    else if (type === 'blue') {
      this.setScale(0.1);
      this.baseSpeed = r(40, 70);
    }
    else if (type === 'green') {
      this.setScale(0.2);
      this.baseSpeed = r(20, 50);
    }
    else if (type === 'purple') {
      this.setScale(0.25);
      this.baseSpeed = r(80, 120);
    } else {
      // fallback als er een onbekend type is
      this.setScale(0.15);
      this.baseSpeed = r(30, 100);
    }

    // multiplier die door de scene aangepast wordt
    this.speedMultiplier = 1;
  }

  setSpeedMultiplier(m) {
    this.speedMultiplier = m;
    return this;
  }

  update() {
    // snelheid = baseSpeed × multiplier
    this.setVelocityY(this.baseSpeed * this.speedMultiplier);
  }
}
