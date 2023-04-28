import { serve } from "https://deno.land/std@0.180.0/http/server.ts";
import Windows from "./platform/windows.ts";
import * as protocol from "./protocol.d.ts";


const ALIASES: Record<string, string> = {
	"Ctrl": "ControlLeft",
	"Alt": "AltLeft",
	"Shift": "ShiftLeft",
}

let platform = new Windows();


function processCommand(cmd: protocol.Command) {
	switch (cmd._) {
		case "key":
			let parts = cmd.key.split("+").map(part => ALIASES[part] || part);
			parts.forEach(part => platform.keyDown(part));
			parts.reverse().forEach(part => platform.keyUp(part));
		break;

		case "mousemove":
			platform.mouseMove(cmd.x, cmd.y, cmd.pos);
		break;

		case "click":
			platform.mouseDown();
			platform.mouseUp();
		break;
	}
}

function onSocketMessage(e: MessageEvent) {
	console.log("-->", e.data);

	try {
		let cmd = JSON.parse(e.data) as protocol.Command;
		if (!cmd._) { throw new Error("No command type member"); }
		processCommand(cmd);
	} catch (e) {
		console.warn("!!", e.message);
	}
}

async function handle(r: Request) {
	console.log("-->", r.url);
	try {
		const { socket, response } = Deno.upgradeWebSocket(r);
		console.log("<-- new ws connection");
		socket.addEventListener("message", onSocketMessage);
		return response;
	} catch (e) {
		console.log("<-- ws failure");
		return new Response("this is a websocket endpoint");
	}
}

let port = Number(Deno.env.get("PORT") || "3456");
serve(handle, {port})
