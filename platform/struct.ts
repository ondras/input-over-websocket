export type Type = "u8" | "i8" | "u16" | "i16" | "u32" | "i32" | "u64" | "i64" | "f32" | "f64" | "pointer";
type Method = keyof DataView;
interface Field {
	type: Type | Struct;
	name: string;
	offset: number;
	alignment: number;
	size: number;
	getter: Method;
	setter: Method;
}

export class Struct {
	fields: Field[];
	protected view!: DataView;

	constructor(defs: Record<string, Type | Struct>) {
		let fields = Object.entries(defs).map(([name, type]) => createField(name, type));
		this.computeOffsets(fields);
		this.defineProperties(fields);
		this.fields = fields;

		this.newBuffer();
	}

	get size() {
		let lastField = this.fields[this.fields.length-1];
		return lastField.offset + lastField.size;
	}

	get alignment() {
		let alignments = this.fields.map(field => field.alignment);
		return Math.max(...alignments);
	}

	get dataView() { return this.view; }
	set dataView(dv: DataView) {
		this.view = dv;
		type StructField = Field & { type: Struct };
		let structFields = this.fields.filter(field => field.type instanceof Struct) as StructField[];
		structFields.forEach(field => {
			let subView = new DataView(dv.buffer, dv.byteOffset + field.offset, field.size);
			field.type.dataView = subView;
		});
	}

	newBuffer() {
		let buffer = new ArrayBuffer(this.size);
		this.dataView = new DataView(buffer);
		return buffer;
	}

	toJSON() {
		let entries = this.fields.map(field => [field.name, this[field.name]]);
		return Object.fromEntries(entries);
	}

	protected defineProperties(fields: Field[]) {
		fields.forEach(field => {
			let descriptor = this.createDescriptor(field);
			Object.defineProperty(this, field.name, descriptor);
		});
	}

	protected createDescriptor(field: Field) {
		if (field.type instanceof Struct) {
			return {
				get() { return field.type; },
				set() { throw new Error(`Field "${field.name}" is a struct; it cannot be assigned to`); }
			}
		} else {
			return {
				get() { return this.dataView[field.getter](field.offset, true); },
				set(value: number) { this.dataView[field.setter](field.offset, value, true); }
			}
		}
	}

	protected computeOffsets(fields: Field[]) {
		let offset = 0;
		fields.forEach(field => {
			offset = align(offset, field.alignment)
			field.offset = offset;
			offset += field.size;
		});
	}
}

export class Union extends Struct {
	protected computeOffsets(fields: Field[]) {
		fields.forEach(field => field.offset = 0);
	}

	get size() {
		let sizes = this.fields.map(field => field.size);
		return Math.max(...sizes);
	}
}

function align(value: number, alignment: number) {
	let misalign = (value % alignment);
	return (misalign ? value + (alignment-misalign) : value);
}

function createField(name: string, type: Type | Struct): Field {
	return {
		name,
		type,
		offset: 0,
		alignment: getAlignment(type),
		size: getSize(type),
		getter: type instanceof Struct ? "" : getGetterMethod(type),
		setter: type instanceof Struct ? "" : getSetterMethod(type)
	}
}

function getSetterMethod(type: Type): keyof DataView {
	switch (type) {
		case "i8": return "setInt8";
		case "u8": return "setUint8";
		case "i16": return "setInt16";
		case "u16": return "setUint16";
		case "i32": return "setInt32";
		case "u32": return "setUint32";
		case "f32": return "setFloat32";
		case "i64": return "setBigInt64";
		case "u64": return "setBigUint64";
		case "f64": return "setFloat64";
		case "pointer": return "setBigUint64";
		default: throw new Error(`No setter for ${type}`);
	}
}

function getGetterMethod(type: Type) {
	switch (type) {
		case "i8": return "getInt8";
		case "u8": return "getUint8";
		case "i16": return "getInt16";
		case "u16": return "getUint16";
		case "i32": return "getInt32";
		case "u32": return "getUint32";
		case "f32": return "getFloat32";
		case "i64": return "getBigInt64";
		case "u64": return "getBigUint64";
		case "f64": return "getFloat64";
		case "pointer": return "getBigUint64";
		default: throw new Error(`No getter for ${type}`);
	}
}

function getSize(type: Type | Struct) {
	if (type instanceof Struct) { return type.size; }
	switch (type) {
		case "i8":
		case "u8": return 1;
		case "i16":
		case "u16": return 2;
		case "i32":
		case "u32":
		case "f32": return 4;
		case "i64":
		case "u64":
		case "f64": return 8;
		case "pointer": return 8;
		default: throw new Error(`No size for ${type}`);
	}
}

function getAlignment(type: Type | Struct) {
	if (type instanceof Struct) { return type.alignment; }
	return getSize(type);
}

	/* *
	let s = new Struct([
	{name:"a", type:"i16"},
	{name:"b", type:"u64"},
	{name:"c", type:"u16"},
	]);

	s.a = 1;
	s.b = 2n;
	s.c = 3;

	console.log(s, s.fields);
	console.log(s.toJSON())

	console.log(new Uint8Array(s.dataView.buffer))
	/* */
