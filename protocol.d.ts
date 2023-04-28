export interface KeyCommand {
	_: "key";
	key: string;
}

export interface MoveCommand {
	_: "mousemove";
	x: number;
	y: number;
  pos: "rel" | "abs";
}

export interface ClickCommand {
	_: "click";
	x: number;
	y: number;
  pos: "rel" | "abs";
}

type MouseCommand = MoveCommand | ClickCommand;
export type Command = KeyCommand | MouseCommand;


/*

Casti klavesnice:

  + sipky ArrowLeft, ...
  + funkcni klavesy
  + pojmenovane klavesy (esc, Enter, Space, Tab, Home, ...)

  + cislice / na numpadu => chceme generovat spis scancody, abychom ty dve odlisili
  + operatory na numpadu => chceme scancody

  - problemove znaky: tilda/backtick, minus+rovnase, tecky, carka, zavorky
  ? pismena

  - elite si zapamatuje scankod, ale zobrazi vk dle aktualniho rezimu


scenare:
  elite:
    - F1, Home
    - "V" (klavesa = scancode)

  clicker:
    - scancodes

  autoclicker:
    - mys

  typer:
    - '1 + "ahoj vole" + enter'

  kombo:
    - ctrl+alt+s (scancodes)

*/
