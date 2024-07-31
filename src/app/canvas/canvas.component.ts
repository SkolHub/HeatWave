import { Component } from '@angular/core';

interface Point {
  x: number;
  y: number;
}

interface Source {
  id: string;
  pos: Point;
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
  private selected: string | null = null;

  onMouseDown(source: Source) {
    this.selected = source.id;
    this.action = Action.MoveSource;
  }

  onMouseMove(source: Source, e: MouseEvent) {
    if (!this.selected) {
      return;
    }

    source.pos = {
      x: e.clientX,
      y: e.clientY
    };
  }

  onMouseUp() {}

  addSource() {
    this.sources.push({
      pos: {
        x: 10,
        y: 10
      },
      id: 's' + this.sourcesSeq
    });

    this.sourcesSeq++;
  }
}
