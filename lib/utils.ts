import { DataType } from "@/app/(app)/check/[excel]/check";
import { ExcelResult, ExcelType } from "@prisma/client";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function formatSize(size: number) {
	const units = ["B", "KB", "MB", "GB", "TB"];

	let unit = 0;
	while (size > 1024) {
		size /= 1024;
		unit++;
	}

	return `${size.toFixed(2)} ${units[unit]}`;
}

export function formatExcel(range: any, type: ExcelType) {
	if (type === "TIPE_1") {
		return excelType1(range);
	}

	if (type === "TIPE_2") {
		return excelType2(range);
	}

	throw new Error("Invalid excel type");
}

export function excelType1(range: any): DataType[] {
	const data = range.map((r: any) => {
		const d = {
			num: r["A"],
			name: r["E"],
			address: r["F"],
			local: r["G"],
			colony: r[`H`],
			city: r["I"],
			state: r["J"],
			code: r["K"],
			phone: r["L"],
			reference: r["O"],

			row: r,
		} as DataType;

		return d;
	});

	return data;
}

export function excelType2(range: any): DataType[] {
	const data = range.map((r: any) => {
		const d = {
			num: r["A"],
			address: r["E"],
			local: r["F"],
			name: r["G"],
			colony: r["K"],
			code: r["L"],
			city: r["M"],
			state: r["N"],
			phone: r["O"],
			reference: r["J"],

			row: r,
		} as DataType;

		return d;
	});

	return data;
}

export function toExcel(result: ExcelResult, type: ExcelType) {
	if (type === "TIPE_1") {
		return toExcelType1(result);
	}

	if (type === "TIPE_2") {
		return toExcelType2(result);
	}

	throw new Error("Invalid excel type");
}

export function toExcelType1(result: ExcelResult): any {
	return {
		...(result.rowData as Object),
		H: result.colony,
		I: result.city,
		J: result.state,
		K: result.code,

		L: result.phone,
		O: result.reference,
		F: result.address,
		E: result.name,
	};
}

export function toExcelType2(result: ExcelResult): any {
	return {
		...(result.rowData as Object),
		K: result.colony,
		L: result.code,
		M: result.city,
		N: result.state,

		O: result.phone,
		J: result.reference,
		E: result.address,
		G: result.name,
	};
}

export function verifyModified(result: ExcelResult, type: ExcelType) {
	if (type === "TIPE_1") {
		return verifyModifiedType1(result as any);
	}

	if (type === "TIPE_2") {
		return verifyModifiedType2(result as any);
	}

	throw new Error("Invalid excel type");
}

export function verifyModifiedType1(
	result: ExcelResult & { rowData: { [key: string]: any } }
): any {
	let modified = [];

	if (!result.rowData) {
		return [];
	}

	if (result.colony !== result.rowData["H"]) {
		modified.push("H");
	}

	if (result.city !== result.rowData["I"]) {
		modified.push("I");
	}

	if (result.state !== result.rowData["J"]) {
		modified.push("J");
	}

	if (result.code !== result.rowData["K"]) {
		modified.push("K");
	}

	return modified;
}

export function verifyModifiedType2(
	result: ExcelResult & { rowData: { [key: string]: any } }
): any {
	let modified = [];

	if (!result.rowData) {
		return [];
	}

	if (result.colony !== result.rowData["K"]) {
		modified.push("K");
	}

	if (result.city !== result.rowData["L"]) {
		modified.push("L");
	}

	if (result.state !== result.rowData["M"]) {
		modified.push("M");
	}

	if (result.code !== result.rowData["N"]) {
		modified.push("N");
	}

	return modified;
}
