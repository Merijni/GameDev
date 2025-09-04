export default class Virus extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, texture, type) {
    super(scene, x, y, texture);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.type = type;
    this.body.setAllowGravity(false);

    // type-kleuren of gedrag
    if (type === 'red') {
        this.setScale(0.15);
    }
    else if (type === 'blue') {
        this.setScale(0.1);
    }
    else if (type === 'green') {
        this.setScale(0.2);
    }
    else if (type === 'purple') {
        this.setScale(0.25);
    }
  }

  update() {
    // gedrag van virus, bv. naar beneden bewegen
    this.setVelocityY(50);
  }
}
