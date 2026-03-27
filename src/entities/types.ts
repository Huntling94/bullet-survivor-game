import { Vector2 } from "../utils/vector2";

export interface Entity {
  position: Vector2;
  readonly radius: number;
  active: boolean;
}
