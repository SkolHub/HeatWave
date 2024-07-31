export interface Point {
  x: number;
  y: number;
}

export interface DataModel {
  sources: SourceModel[];
  lenses: LensModel[];
  walls: WallModel[];
}

export interface SourceModel {
  id: string;
  pos: Point;
}

export interface LensModel {}

export interface WallModel {}
