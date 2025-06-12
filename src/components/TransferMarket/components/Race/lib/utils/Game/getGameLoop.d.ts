// File: src/components/.../Race/lib/renderer/createRenderer.d.ts
import Node from '..'; // Adjust path if needed
import Viewport from '../../utils/ViewPort'; // Adjust path if needed

// We declare the function signature and mark it as the default export.
declare function createRenderer(options: {
	canvas: HTMLCanvasElement;
	scene: Node | null;
	background: string;
	viewport: Viewport;
}): any; // Using `any` for the return type is fine if it's complex

export default createRenderer;