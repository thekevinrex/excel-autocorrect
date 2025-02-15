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
	};
}

export function toExcelType2(result: ExcelResult): any {
	return {
		...(result.rowData as Object),
		K: result.colony,
		L: result.code,
		M: result.city,
		N: result.state,
	};
}
