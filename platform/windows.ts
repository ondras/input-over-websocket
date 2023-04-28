import Platform from "./platform.ts";
import { Struct, Union } from "./struct.ts";

// typedef struct tagKEYBDINPUT {
//   WORD    wVk;
//   WORD    wScan;
//   DWORD   dwFlags;
//   DWORD   time;
//   ULONG_PTR dwExtraInfo;
// } KEYBDINPUT;

const INPUT_MOUSE = 0;
const INPUT_KEYBOARD = 1;

const KEYEVENTF_SCANCODE = 0x0008;
const KEYEVENTF_KEYUP = 0x0002;
const KEYEVENTF_EXTENDEDKEY = 0x0001;

const MOUSEEVENTF_MOVE = 0x0001;
const MOUSEEVENTF_LEFTDOWN = 0x0002;
const MOUSEEVENTF_LEFTUP = 0x0004;
const MOUSEEVENTF_ABSOLUTE = 0x8000;

const MAPVK_VK_TO_VSC = 0;

const STRUCT: Deno.NativeType[] = [ // probably incorrect, but works ¯\_(ツ)_/¯
	'u32', // type
	'u16',
	'u16',
	'u32',
	'u32',
	'pointer'
];

export default class Windows extends Platform {
	protected lib = openLibrary();
	protected input = createInputStruct();

	keyDown(key: string) {
		const { lib, input } = this;
		let { scanCode, flags } = parseKey(key);

		let buffer = input.newBuffer();
		input.type = INPUT_KEYBOARD;
		input.union.ki.scan = scanCode;
		input.union.ki.flags = flags;
		lib.symbols.SendInput(1, buffer, buffer.byteLength);
	}

	keyUp(key: string): void {
		const { lib, input } = this;
		let { scanCode, flags } = parseKey(key);

		let buffer = input.newBuffer();
		input.type = INPUT_KEYBOARD;
		input.union.ki.scan = scanCode;
		input.union.ki.flags = flags + KEYEVENTF_KEYUP;
		lib.symbols.SendInput(1, buffer, buffer.byteLength);
	}

	mouseMove(x: number, y: number, pos: "rel" | "abs") {
		const { lib, input } = this;

		let buffer = input.newBuffer();
		input.type = INPUT_MOUSE;
		input.union.mi.dx = x;
		input.union.mi.dy = y;
		input.union.mi.flags = MOUSEEVENTF_MOVE + (pos == "abs" ? MOUSEEVENTF_ABSOLUTE : 0);
		lib.symbols.SendInput(1, buffer, buffer.byteLength);
	}

	mouseDown() {
		const { lib, input } = this;

		let buffer = input.newBuffer();
		input.type = INPUT_MOUSE;
		input.union.mi.flags = MOUSEEVENTF_LEFTDOWN;
		lib.symbols.SendInput(1, buffer, buffer.byteLength);
	}

	mouseUp() {
		const { lib, input } = this;

		let buffer = input.newBuffer();
		input.type = INPUT_MOUSE;
		input.union.mi.flags = MOUSEEVENTF_LEFTUP;
		lib.symbols.SendInput(1, buffer, buffer.byteLength);
	}

	protected keyCodeToScanCode(keyCode: number) {
		const { lib } = this;
		return lib.symbols.MapVirtualKeyExA(keyCode, MAPVK_VK_TO_VSC, 0);
	}
}

function parseKey(key: string) {
	if (!(key in SCAN_CODES)) { throw new Error(`Unknown key "${key}"`); }

	let scanCode = SCAN_CODES[key as keyof typeof SCAN_CODES];

	let flags = KEYEVENTF_SCANCODE;
	if (scanCode > 57344) { flags += KEYEVENTF_EXTENDEDKEY; }

	return {scanCode, flags};
}

function openLibrary() {
	return Deno.dlopen("user32", {
		SendInput: {
			parameters: ["i32", {struct: STRUCT}, "i32"],
			result: "i32"
		},
		MapVirtualKeyExA: {
			parameters: ["u32", "u32", "i32"],
			result: "u32"
		}
	} as const);
}

function createInputStruct() {
	let kbInput = new Struct({
		vk: "u16",
		scan: "u16",
		flags: "u32",
		time:"u32",
		extraInfo: "pointer"
	});

	let mouseInput = new Struct({
		dx: "i32",
		dy: "i32",
		mouseData: "u32",
		flags: "u32",
		time: "u32",
		extraInfo: "pointer",
	})

	let inputUnion = new Union({
		ki: kbInput,
		mi: mouseInput
	});

	return new Struct({
		type: "u32",
		union: inputUnion
	});
}

const SCAN_CODES = {
	"Backquote": 41,
	"Backslash": 43,
	"Backspace": 14,
	"BracketLeft": 26,
	"BracketRight": 27,
	"Comma": 51,
	"Digit0": 11,
	"Digit1": 2,
	"Digit2": 3,
	"Digit3": 4,
	"Digit4": 5,
	"Digit5": 6,
	"Digit6": 7,
	"Digit7": 8,
	"Digit8": 9,
	"Digit9": 10,
	"Equal": 13,
	"IntlBackslash": 86,
	"IntlRo": 89,
	"KeyA": 30,
	"KeyB": 48,
	"KeyC": 46,
	"KeyD": 32,
	"KeyE": 18,
	"KeyF": 33,
	"KeyG": 34,
	"KeyH": 35,
	"KeyI": 23,
	"KeyJ": 36,
	"KeyK": 37,
	"KeyL": 38,
	"KeyM": 50,
	"KeyN": 49,
	"KeyO": 24,
	"KeyP": 25,
	"KeyQ": 16,
	"KeyR": 19,
	"KeyS": 31,
	"KeyT": 20,
	"KeyU": 22,
	"KeyV": 47,
	"KeyW": 17,
	"KeyX": 45,
	"KeyY": 21,
	"KeyZ": 44,
	"Minus": 12,
	"Period": 52,
	"Quote": 40,
	"Semicolon": 39,
	"Slash": 53,
	"AltLeft": 56,
	"AltRight": 0xE038,
	"CapsLock": 58,
	"ControlLeft": 29,
	"ControlRight": 0xE01D,
	"Enter": 28,
	"ShiftLeft": 42,
	"ShiftRight": 54,
	"Space": 57,
	"Tab": 15,
	"ArrowDown": 0xE050,
	"ArrowLeft": 0xE04B,
	"ArrowRight": 0xE04D,
	"ArrowUp": 0xE048,
	"Delete": 0xE053,
	"End": 0xE04F,
	"Escape": 1,
	"Home": 0xE047,
	"Insert": 0xE052,
	"PageDown": 0xE051,
	"PageUp": 0xE049,
	"NumLock": 0xE045,
	"Numpad0": 82,
	"Numpad1": 79,
	"Numpad2": 80,
	"Numpad3": 81,
	"Numpad4": 75,
	"Numpad5": 76,
	"Numpad6": 77,
	"Numpad7": 71,
	"Numpad8": 72,
	"Numpad9": 73,
	"NumpadAdd": 78,
	"NumpadDecimal": 83,
	"NumpadDivide": 0xE035,
	"NumpadEnter": 0xE01C,
	"NumpadMultiply": 55,
	"NumpadSubtract": 74,
	"F1": 59,
	"F2": 60,
	"F3": 61,
	"F4": 62,
	"F5": 63,
	"F6": 64,
	"F7": 65,
	"F8": 66,
	"F9": 67,
	"F10": 68,
	"F11": 87,
	"F12": 88,
	"AudioVolumeMute": 0xE020,
	"NumpadComma": 179,
	"NumpadEqual": 141,
	"Power": 102,
	"ScrollLock": 70,
	"VolumeDown": 0xE02E,
	"VolumeUp": 0xE030
}


//let scanCode = keyCodeToScanCode(81);
/*
send(0x1e, 0x0008);
send(0x1e, 0x0008 | 0x0002);
*/
//send(42, 0x0008);
//send(scanCode, 0x0008);

//send(scanCode, 0x0008 | 0x0002);
//send(42, 0x0008 | 0x0002);

/*


/*
const keyDownKeyboardInput = KEYBDINPUT({vk: 0, extraInfo: ref.NULL_POINTER, time: 0, scan: scanCode, flags: 0x0008})
const keyDownInput = INPUT({type: 1, union: INPUT_UNION({ki: keyDownKeyboardInput})})
user32.SendInput(1, keyDownInput.ref(), INPUT.size)
*/


// jen keyboard:
// vk... scan. flags...... time....... PAD pro.... extraInfo..............
// 00 00 1e 00 08 00 00 00 00 00 00 00 00 00 00 00 d0 a7 b5 06 00 00 00 00


/* KB:
 8 = tag + struct al
 ignment
 2 = vk
 2 = scan
 4 = flags
 4 = time
 8 = pointer = dwExtraInfo
 4 = structure pad (20->24)
 8 = zbytek z mouse union (na 32)
*/

/* Mouse:
 8 = tag + struct alignment
 4 = x
 4 = y
 4 = mouseData
 4 = dwFlags
 4 = time
 4 = align pro nasledujici
 8 = pointer = dwExtraInfo
*/



// tag........             vk... scan. flags...... time....... PAD........ extraInfo.............. MOUSE UNION ZBYTEK
//[01 00 00 00 00 00 00 00 00 00 1e 00 08 00 00 00 00 00 00 00 00 00 00 00 d0 a7 b5 06 00 00 00 00 00 00 00 00 00 00 00 00]
/*
   00 00 00 01 00 00 00 1e 00 00 00 08 00 00 00 00 00 00 00 00 00 00 00 00 ]

   let down = "01 00 00 00 00 00 00 00 00 00 1e 00 08 00 00 00 00 00 00 00 00 00 00 00 a0 e8 0c a0 a1 7f 00 00 00 00 00 00 00 00 00 00".split(" ").map(x => parseInt(x, 16));

   */
