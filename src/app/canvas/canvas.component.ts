import { Component, OnDestroy, OnInit } from '@angular/core';

interface Point {
  x: number;
  y: number;
}

interface Atom {
  pos: Point;
  temperature: number;
  id: string;
}

interface GasAtom extends Atom {
  velocity: Point;
  color: string;
}

interface SolidAtom extends Atom {
  origin: Point;
}

interface ObjectModel {
  atoms: SolidAtom[];
  pos: Point;
  id: string;
}

@Component({
  selector: 'app-canvas',
  standalone: true,
  imports: [],
  templateUrl: './canvas.component.html'
})
export class CanvasComponent implements OnInit, OnDestroy {
  private readonly maxMovement: number = 5;
  private intervalID: any;

  readonly objects: ObjectModel[] = [];
  readonly airAtoms: GasAtom[] = [];

  private atomCount: number = 0;
  private objectCount: number = 0;

  private selectedObject: ObjectModel | null = null;

  airRadius: number = 20;

  canvasWidth!: number;
  canvasHeight!: number;

  ngOnInit(): void {
    this.startInterval();
    this.generateObjs();
    this.generateAir();
    this.animate();
  }

  ngOnDestroy(): void {
    this.stopInterval();
  }

  private startInterval(): void {
    this.intervalID = setInterval(() => {
      this.periodicTask();
    }, 50);
  }

  private stopInterval(): void {
    if (this.intervalID) {
      clearInterval(this.intervalID);
    }
  }

  onMouseDown(e: MouseEvent, object: ObjectModel) {
    this.selectedObject = object;
  }

  onMouseMove(e: MouseEvent) {
    if (this.selectedObject) {
      this.selectedObject.pos.x = e.clientX;
      this.selectedObject.pos.y = e.clientY;
    }
  }

  onMouseUp() {
    this.selectedObject = null;
  }

  generateObjs() {
    const atoms: SolidAtom[] = [];

    for (let i = 0; i < 10; i++) {
      for (let j = 0; j < 10; j++) {
        atoms.push({
          origin: {
            x: 20 * i,
            y: 20 * j
          },
          pos: {
            x: 20 * i,
            y: 20 * j
          },
          temperature: 0,
          id: `atom ${this.atomCount}`
        });

        this.atomCount++;
      }
    }

    const object: ObjectModel = {
      id: `object${this.objectCount}`,
      atoms,
      pos: {
        x: 50,
        y: 50
      }
    };

    this.objects.push(object);
  }

  createParticle(id: string, width: number, height: number): GasAtom {
    return {
      id,
      pos: {
        x: Math.random() * width,
        y: Math.random() * height
      },
      velocity: {
        x: (Math.random() - 0.5) / 4,
        y: (Math.random() - 0.5) / 4
      },
      temperature: 50,
      color: '#00F'
    };
  }

  updateParticle(atom: GasAtom) {
    atom.pos.x += atom.velocity.x;
    atom.pos.y += atom.velocity.y;

    if (
      atom.pos.x - this.airRadius < 0 ||
      atom.pos.x + this.airRadius > this.canvasWidth
    ) {
      atom.velocity.x *= -1;
    }

    if (
      atom.pos.y - this.airRadius < 0 ||
      atom.pos.y + this.airRadius > this.canvasHeight
    ) {
      atom.velocity.y *= -1;
    }
  }

  detectCollisions() {
    for (let i = 0; i < this.airAtoms.length; i++) {
      for (let j = i + 1; j < this.airAtoms.length; j++) {
        const p1 = this.airAtoms[i];
        const p2 = this.airAtoms[j];
        const dx = p1.pos.x - p2.pos.x;
        const dy = p1.pos.y - p2.pos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < 2 * this.airRadius) {
          const overlap = 2 * this.airRadius - distance;

          const ax = ((dx / distance) * overlap) / 2;
          const ay = ((dy / distance) * overlap) / 2;
          p1.pos.x += ax;
          p1.pos.y += ay;
          p2.pos.x -= ax;
          p2.pos.y -= ay;

          [p1.velocity.x, p2.velocity.x] = [p2.velocity.x, p1.velocity.x];
          [p1.velocity.y, p2.velocity.y] = [p2.velocity.y, p1.velocity.y];
        }
      }
    }
  }

  animate() {
    this.airAtoms.forEach(this.updateParticle.bind(this));
    this.detectCollisions();
    requestAnimationFrame(this.animate.bind(this));
  }

  generateAir() {
    const { width, height } = (document.getElementById(
      'canvas'
    ) as HTMLCanvasElement)!.getBoundingClientRect();

    this.canvasWidth = width;
    this.canvasHeight = height;

    const numParticles = 1100;

    for (let i = 0; i < numParticles; i++) {
      this.airAtoms.push(this.createParticle(`air ${i}`, width, height));
    }
  }

  private periodicTask(): void {
    for (const object of this.objects) {
      for (const atom of object.atoms) {
        const trueMaxMovement = (this.maxMovement * atom.temperature) / 40;

        let posX = atom.pos.x + (Math.random() - 0.5) * trueMaxMovement;
        let posY = atom.pos.y + (Math.random() - 0.5) * trueMaxMovement;

        if (posX < atom.origin.x - trueMaxMovement) {
          posX = atom.origin.x - trueMaxMovement;
        } else if (posX > atom.origin.x + trueMaxMovement) {
          posX = atom.origin.x + trueMaxMovement;
        }

        if (posY < atom.origin.y - trueMaxMovement) {
          posY = atom.origin.y - trueMaxMovement;
        } else if (posY > atom.origin.y + trueMaxMovement) {
          posY = atom.origin.y + trueMaxMovement;
        }

        atom.pos.x = posX;
        atom.pos.y = posY;
      }
    }
  }
}
