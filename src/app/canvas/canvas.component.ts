import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { MatDivider } from '@angular/material/divider';
import { MatList, MatListItem } from '@angular/material/list';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import {
  MatCell,
  MatCellDef,
  MatColumnDef,
  MatHeaderCell,
  MatHeaderCellDef,
  MatHeaderRow,
  MatHeaderRowDef,
  MatRow,
  MatRowDef,
  MatTable
} from '@angular/material/table';
import { NgClass, NgForOf, NgStyle } from '@angular/common';
import { thermal_conductivity } from '../../lib/data';
import { MatDialog } from '@angular/material/dialog';
import { CreateDialogComponent } from '../create-dialog/create-dialog.component';
import { atom_radius, tableElements } from '../data';
import { MatSlider, MatSliderThumb } from '@angular/material/slider';
import { FormsModule } from '@angular/forms';
import { MatSlideToggle } from '@angular/material/slide-toggle';

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
  z: number;
}

export interface elementModel {
  inactive: boolean;
  symbol: string;
  name: string;
  mass: number;
  Z: number;
  valences: number[] | string;
  group: string;
  x: number;
  y: number;
  period: number;
  positionGroup: number;
  anionValence?: number;
}

@Component({
  selector: 'app-canvas',
  standalone: true,
  imports: [
    MatDivider,
    MatList,
    MatListItem,
    MatButton,
    MatIcon,
    MatIconButton,
    MatTable,
    MatColumnDef,
    MatHeaderCellDef,
    MatCellDef,
    MatHeaderCell,
    MatCell,
    MatHeaderRowDef,
    MatRowDef,
    MatHeaderRow,
    MatRow,
    NgClass,
    NgStyle,
    NgForOf,
    MatSlider,
    FormsModule,
    MatSliderThumb,
    MatSlideToggle
  ],
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

  toolTipContent?: string = '';

  airRadius: number = 20;

  canvasWidth!: number;
  canvasHeight!: number;

  interval: number = 1000;
  backgroundAtoms: boolean = true;

  measureTool: boolean = false;

  baseTemp: number = 293;

  getTemperature(
    k1: number,
    k2: number,
    T1: number,
    T2: number,
    d: number,
    A: number = 1
  ) {
    return -(((k1 + k2) / 2) * A * (T1 - T2)) / d;
  }

  getColor(atom: Atom) {
    return `rgba(${Math.round((atom.temperature / 500) * 255)}, 0, ${255 - Math.round((atom.temperature / 500) * 255)})`;
  }

  ngOnInit(): void {
    this.startInterval(1000);
    this.generateAir();
    this.animate();
  }

  ngOnDestroy(): void {
    this.stopInterval();
  }

  startInterval(interval: number): void {
    this.agitationInterval = setInterval(() => {
      this.updateSolidAtoms();
    }, 50);

    this.temperatureInterval = setInterval(() => {
      this.updateTemperature();
    }, interval);
  }

  setTemp(temp: number) {
    this.baseTemp = temp;

    for (const atom of this.airAtoms) {
      atom.temperature = temp;
    }
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
    } else {
      const groupAtomsCopy = structuredClone(
        this.objects
          .map((object) =>
            object.atoms.map((atom) => ({
              pos: {
                x: atom.pos.x + object.pos.x,
                y: atom.pos.y + object.pos.y
              },
              temperature: atom.temperature,
              conductivity: atom.conductivity,
              id: atom.id
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
          conductivity: atom.conductivity,
          id: atom.id
        }))
      );

      const total_atoms = [...groupAtomsCopy, ...airAtomsCopy];

      let short_dist = 100,
        min_point_temp: number | null = null;

      for (const atom of total_atoms) {
        const dist = this.sqrt(atom.pos, { x: e.clientX, y: e.clientY });

        if (dist < short_dist) {
          short_dist = dist;
          min_point_temp = atom.temperature;
        }
      }

      this.toolTipContent = min_point_temp?.toFixed(2);
    }
  }

  onMouseUp() {
    this.selectedObject = null;
  }

  getNameByZ(Z: number) {
    return tableElements.find((el) => el.Z === Z)!.name;
  }

  electronOrbitRadius(v: number) {
    const h = 6.626e-34;
    const m_e = 9.109e-31;
    const pi = Math.PI;

    return h / (2 * pi * m_e * v);
  }

  electronVelocity(Z: number, n = 1) {
    const e = 1.602e-19;
    const epsilon_0 = 8.854e-12;
    const h_bar = 1.055e-34;

    return ((Z * e * e) / (2 * epsilon_0 * h_bar)) * (1 / n);
  }

  generateObj(
    rows: number,
    cols: number,
    atomRadius: number,
    atomGap: number,
    temperature: number,
    z: number
  ) {
    const atoms: SolidAtom[] = [];

    // atomRadius = 5 + 5 * Math.log10(z);

    atomRadius = atom_radius.find((el) => el.Z === z)!.radius / 30;

    console.log(atomRadius);

    const space = atomGap + atomRadius * 2;

    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        atoms.push({
          origin: {
            x: space * i,
            y: space * j
          },
          pos: {
            x: space * i,
            y: space * j
          },
          temperature: temperature,
          Z: z,
          conductivity: thermal_conductivity.find((el) => el.Z === z)!
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
      height: space * rows - atomGap - atomRadius,
      z: z
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
      temperature: this.baseTemp,
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

  removeAir() {
    this.airAtoms.splice(0, this.airAtoms.length);
  }

  private updateSolidAtoms(): void {
    for (const object of this.objects) {
      for (const atom of object.atoms) {
        const trueMaxMovement =
          (this.maxMovement * atom.temperature) / ((400 * atom.Z) / 6 + 300);

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

  updateTemperature() {
    const groupAtomsCopy = structuredClone(
      this.objects
        .map((object) =>
          object.atoms.map((atom) => ({
            pos: {
              x: atom.pos.x + object.pos.x,
              y: atom.pos.y + object.pos.y
            },
            temperature: atom.temperature,
            conductivity: atom.conductivity,
            id: atom.id
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
        conductivity: atom.conductivity,
        id: atom.id
      }))
    );

    const total_atoms = [...groupAtomsCopy, ...airAtomsCopy];

    for (const object of this.objects) {
      for (const atom of object.atoms) {
        for (const influence of total_atoms) {
          if (atom.id === influence.id) {
            continue;
          }

          const distance = this.sqrt(
            {
              x: atom.pos.x + object.pos.x,
              y: atom.pos.y + object.pos.y
            },
            influence.pos
          );

          atom.temperature -=
            this.getTemperature(
              atom.conductivity,
              influence.conductivity,
              influence.temperature,
              atom.temperature,
              distance + 0.01
            ) * 100;

          atom.temperature = Math.max(atom.temperature, 0);
        }
      }
    }

    for (const atom of this.airAtoms) {
      for (const influence of total_atoms) {
        if (atom.id === influence.id) {
          continue;
        }

        const distance = this.sqrt(atom.pos, influence.pos);

        atom.temperature -=
          this.getTemperature(
            atom.conductivity,
            influence.conductivity,
            influence.temperature,
            atom.temperature,
            distance + 0.01
          ) * 100;
      }
    }
  }

  meanTemperature(object: ObjectModel) {
    return (
      object.atoms.reduce((acc, atom) => acc + atom.temperature, 0) /
      object.atoms.length
    );
  }

  readonly dialog = inject(MatDialog);

  temperature: number = 0;
  width: number = 5;
  height: number = 5;

  currentElement: elementModel = tableElements[0];

  openDialog(): void {
    const dialogRef = this.dialog.open(CreateDialogComponent, {
      data: {
        temperature: this.temperature,
        width: this.width,
        height: this.height,
        element: this.currentElement
      }
    });

    dialogRef.afterClosed().subscribe((result) => {
      console.log(result);
      if (result !== undefined) {
        const { temperature, width, height, inProgress } = result;
        if (!inProgress) {
          this.generateObj(
            width,
            height,
            5,
            5,
            temperature,
            this.currentElement.Z
          );
          this.temperature = 0;
          this.width = 5;
          this.height = 5;
        } else {
          this.temperature = temperature;
          this.width = width;
          this.height = height;
          this.tableOpen = true;
        }
      }
    });
  }

  PI: number = Math.PI;

  velocity: number = 200;

  activeElement: elementModel = tableElements.find((el) => el.symbol === 'H')!;

  tableOpen: boolean = false;

  shells: number[] = [1];

  themes: any = {
    'Alkali metals': '#ecbe59',
    'Alkaline earth metals': '#dee955',
    Lanthanides: '#ec77a3',
    Actinides: '#c686cc',
    'Transition metals': '#fd8572',
    'Post-transition metals': '#4cddf3',
    'Other nonmetals': '#52ee61',
    'Noble gases': '#759fff',
    Metalloids: '#3aefb6'
  };

  addElement(element: elementModel): void {
    this.currentElement = element;
    this.tableOpen = false;
    this.openDialog();
  }

  getPos(element: Point) {
    const table = document.getElementById('table')!;

    const height = table.clientHeight / 11;

    return {
      top: `${element.y * height - height / 2}px`,
      left: `${element.x * height - height / 2}px`,
      width: `${height}px`,
      height: `${height}px`
    };
  }

  getPosElementCard(element: Point) {
    const table = document.getElementById('table')!;

    const height = table.clientHeight / 11;

    return {
      top: `${element.y * height - height / 2}px`,
      left: `${element.x * height - height / 2}px`,
      width: `${height * 2.5}px`,
      height: `${height * 2.5}px`
    };
  }

  getRange(length: number): number[] {
    return Array.from({ length }, (_, i) => i);
  }

  selectActiveElement(element: elementModel) {
    this.activeElement = element;
    this.shells = [];

    const shellValues = [2, 8, 8, 18, 18, 32, 32];

    for (let remaining = this.activeElement.Z, i = 0; remaining; i++) {
      if (shellValues[i] <= remaining) {
        this.shells.push(shellValues[i]);
        remaining -= shellValues[i];
      } else {
        if (remaining) {
          this.shells.push(remaining);
          break;
        }
      }
    }
    this.shells.reverse();
  }

  protected readonly tableElements = tableElements;
}
