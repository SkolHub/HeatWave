import { Component } from '@angular/core';

interface Point {
  x: number;
  y: number;
}

interface Ray {

}

interface Source {
  id: string;
  pos: Point;
  ray: Ray;
}

enum Action {
  None,
  MoveSource
}

@Component({
  selector: 'app-canvas',
  standalone: true,
  imports: [],
  templateUrl: './canvas.component.html'
})
export class CanvasComponent {
  readonly sources: Source[] = [];
  private sourcesSeq: number = 0;

  private action: Action = Action.None;
  private readonly moveActionData: {
    origin: Point;
    grip: Point;
  } = {
    grip: { x: 0, y: 0 },
    origin: { x: 0, y: 0 }
  };

  private selectedSource: Source | null = null;

  onMouseDown(source: Source, e: MouseEvent) {
    this.selectedSource = source;
    this.action = Action.MoveSource;

    this.moveActionData.grip = {
      x: e.clientX,
      y: e.clientY
    };

    this.moveActionData.origin = {
      x: source.pos.x,
      y: source.pos.y
    };
  }

  onMouseMove(e: MouseEvent) {
    if (!this.selectedSource) {
      return;
    }

    if (this.action === Action.MoveSource) {
      this.selectedSource.pos = {
        x:
          this.moveActionData.origin.x + e.clientX - this.moveActionData.grip.x,
        y: this.moveActionData.origin.y + e.clientY - this.moveActionData.grip.y
      };
    }
  }

  onMouseUp() {
    this.action = Action.None;
  }

  addSource() {

    this.sourcesSeq++;
  }
}
