import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDivider } from '@angular/material/divider';
import { MatList, MatListItem } from '@angular/material/list';
import { thermal_conductivity } from '../../lib/data';

interface Point {
  x: number;
  y: number;
}

interface Atom {
  pos: Point;
  temperature: number;
  id: string;
  Z: number;
  conductivity: number;
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
  atomRadius: number;
  width: number;
  height: number;
}

@Component({
  selector: 'app-canvas',
  standalone: true,
  imports: [MatDivider, MatList, MatListItem],
  templateUrl: './canvas.component.html'
})
export class CanvasComponent implements OnInit, OnDestroy {
  private readonly maxMovement: number = 5;
  private agitationInterval: any;
  private temperatureInterval: any;

  readonly objects: ObjectModel[] = [];
  readonly airAtoms: GasAtom[] = [];

  private atomCount: number = 0;
  private objectCount: number = 0;

  private selectedObject: ObjectModel | null = null;
  private moveAction: {
    origin: Point;
    grip: Point;
  } = {
    origin: {
      x: 0,
      y: 0
    },
    grip: {
      x: 0,
      y: 0
    }
  };

  airRadius: number = 20;

  canvasWidth!: number;
  canvasHeight!: number;

  getTemperature(k1: number, k2: number, dT: number, d: number, A: number = 1) {
    return (((k1 + k2) / 2) * A * dT) / d;
  }

  getColor(atom: Atom) {
    return `rgba(${Math.round((atom.temperature / 100) * 255)}, ${255 - Math.round((atom.temperature / 100) * 255)}, 0)`;
  }

  ngOnInit(): void {
    this.startInterval();
    this.generateAir();
    this.animate();
  }

  ngOnDestroy(): void {
    this.stopInterval();
  }

  private startInterval(): void {
    this.agitationInterval = setInterval(() => {
      this.updateSolidAtoms();
    }, 50);

    this.temperatureInterval = setInterval(() => {
      this.updateTemperature();
    }, 1000);
  }

  private stopInterval(): void {
    if (this.agitationInterval) {
      clearInterval(this.agitationInterval);
    }

    if (this.temperatureInterval) {
      clearInterval(this.temperatureInterval);
    }
  }

  onMouseDown(e: MouseEvent, object: ObjectModel) {
    this.selectedObject = object;

    this.moveAction.origin.x = object.pos.x;
    this.moveAction.origin.y = object.pos.y;

    this.moveAction.grip.x = e.clientX;
    this.moveAction.grip.y = e.clientY;
  }

  onMouseMove(e: MouseEvent) {
    if (this.selectedObject) {
      this.selectedObject.pos.x =
        e.clientX - this.moveAction.grip.x + this.moveAction.origin.x;
      this.selectedObject.pos.y =
        e.clientY - this.moveAction.grip.y + this.moveAction.origin.y;
    }
  }

  onMouseUp() {
    this.selectedObject = null;
  }

  generateObj(rows: number, cols: number, atomRadius: number, atomGap: number) {
    const atoms: SolidAtom[] = [];

    const space = atomGap + atomRadius * 2;

    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        atoms.push({
          origin: {
            x: space * i,
            y: space * j
          },
          pos: {
            x: space * i,
            y: space * j
          },
          temperature: 10,
          Z: 8,
          conductivity: thermal_conductivity.find((el) => el.Z === 8)!
            .conductivity,
          id: `atom${this.atomCount}`
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
      },
      atomRadius,
      width: space * cols - atomGap - atomRadius,
      height: space * rows - atomGap - atomRadius
    };

    this.objectCount++;

    this.objects.push(object);
  }

  createParticle(
    id: string,
    width: number,
    height: number,
    Z: number
  ): GasAtom {
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
      Z,
      conductivity: thermal_conductivity.find((el) => el.Z === Z)!.conductivity,
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
      this.airAtoms.push(this.createParticle(`air ${i}`, width, height, 8));
    }
  }

  private updateSolidAtoms(): void {
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

  sqrt(P1: Point, P2: Point) {
    return Math.sqrt(
      (P1.x - P2.x) * (P1.x - P2.x) + (P1.y - P2.y) * (P1.y - P2.y)
    );
  }

  async updateTemperature() {
    const groupAtomsCopy = structuredClone(
      this.objects
        .map((object) =>
          object.atoms.map((atom) => ({
            pos: {
              x: atom.pos.x + object.pos.x,
              y: atom.pos.y + object.pos.y
            },
            temperature: atom.temperature,
            conductivity: atom.conductivity
          }))
        )
        .flat()
    );

    const airAtomsCopy = structuredClone(
      this.airAtoms.map((atom) => ({
        pos: {
          x: atom.pos.x,
          y: atom.pos.y
        },
        temperature: atom.temperature,
        conductivity: atom.conductivity
      }))
    );

    const total_atoms = [...groupAtomsCopy, ...airAtomsCopy];

    for (const object of this.objects) {
      for (const atom of object.atoms) {
        for (const influence of total_atoms) {
          const distance = this.sqrt(atom.pos, influence.pos);

          atom.temperature -=
            this.getTemperature(
              atom.conductivity,
              influence.conductivity,
              atom.temperature - influence.temperature,
              distance + 0.01
            ) * 100;

          console.log(atom.temperature);
        }
      }
    }

    for (const atom of this.airAtoms) {
      for (const influence of total_atoms) {
        const distance = this.sqrt(atom.pos, influence.pos);

        atom.temperature -=
          this.getTemperature(
            atom.conductivity,
            influence.conductivity,
            atom.temperature - influence.temperature,
            distance + 0.01
          ) * 100;
      }
    }
  }
}
