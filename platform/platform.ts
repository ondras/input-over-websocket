export default abstract class Platform {
	abstract keyDown(key: string): void;
	abstract keyUp(key: string): void;
	abstract mouseDown(): void;
	abstract mouseUp(): void;
	abstract mouseMove(x: number, y: number, pos: "abs" | "rel"): void;
}
