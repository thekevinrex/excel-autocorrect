"use server";

import { ResultType } from "@/components/check/excel-check";
import db from "@/lib/db";
import { formatExcel, toExcel, verifyModified } from "@/lib/utils";
import { ExcelType, ResultStatus } from "@prisma/client";

import Fuse from "fuse.js";
import { revalidatePath } from "next/cache";

export async function getLastDBUpdate() {
	const states = await db.states.findFirst({
		orderBy: {
			last_update: "desc",
		},
	});

	return states?.last_update;
}

export async function prepareStateData(states: string[]) {
	await db.states.deleteMany({
		where: {
			last_update: {
				lt: new Date(),
			},
		},
	});

	await db.states.createMany({
		data: states.map((s) => ({
			state: s,
			last_update: new Date(),
		})),
	});

	revalidatePath("/upload");
}

export async function updateStateData(
	state: string,

	data: Array<{
		d_code: string;

		d_asenta: string;
		d_tipo_asenta: string;

		d_muni: string;
		d_esta: string;
		d_ciud: string;
	}>
) {
	const s = await db.states.findFirst({
		where: {
			state,
		},
	});

	if (!s) {
		throw new Error("Estado no valido");
	}

	await db.address.createMany({
		data: data.map((d) => ({
			...d,

			id_state: s.id,
		})),
	});
}

export async function deleteExcel(excel: number) {
	const e = await db.excel.delete({
		where: {
			id: excel,
		},
	});

	revalidatePath("/upload");
}

export async function getExcel(excel: string) {
	const e = await db.excel.findFirst({
		where: {
			id: parseInt(excel),
		},
	});

	return e;
}

export async function getAllExcels() {
	const e = await db.excel.findMany({
		where: {},
		orderBy: {
			createdAt: "desc",
		},
	});

	return e;
}

export async function uploadExcel(
	file: {
		name: string;
		size: number;
	},

	excel: {
		from: number;
		to: number;
		type: ExcelType;
	},

	range: any
) {
	const data = formatExcel(JSON.parse(range), excel.type);

	const newE = await db.excel.create({
		data: {
			from: excel.from,
			to: excel.to,
			type: excel.type,
			last: -1,
			total: data.length,

			excel_name: file.name,
			excel_size: file.size,
		},
	});

	await db.excelResult.createMany({
		data: data.map((d, i) => ({
			excel_id: newE.id,

			row: i,
			status: "PENDING",

			code: d?.code ? `${d.code}` : undefined,
			city: d?.city ? `${d.city}` : undefined,
			colony: d?.colony ? `${d.colony}` : undefined,
			state: d.state ? `${d.state}` : undefined,

			name: d.name ? `${d.name}` : undefined,
			phone: d.phone ? `${d.phone}` : undefined,

			address: d?.address ? `${d.address}` : undefined,
			reference: d?.reference ? `${d.reference}` : undefined,
			local: d?.local ? `${d.local}` : undefined,

			rowData: d.row,
		})),
	});

	revalidatePath("/upload");

	return newE;
}

export async function update_row(
	id: number,

	address: string,
	reference: string,
	local: string,
	code: string
) {
	await db.excelResult.update({
		where: {
			id,
		},
		data: {
			address,
			reference,
			code,
			local,
		},
	});

	revalidatePath(`/check/${id}`);
}

export async function save_result(
	excel_id: number,
	row_num: number,
	status: ResultStatus,
	selected?: number
) {
	if (!selected) {
		throw new Error("No se selecciono una direccion valida");
	}

	const row_selected = await db.address.findFirst({
		where: {
			id: selected,
		},
	});

	if (!row_selected) {
		throw new Error("No se encontro la direccion seleccionada");
	}

	await db.excelResult.update({
		where: {
			excel_id_row: {
				excel_id,
				row: row_num,
			},
		},
		data: {
			code: row_selected?.d_code ? row_selected.d_code : undefined,
			city: row_selected?.d_muni ? row_selected.d_muni : undefined,
			colony: row_selected?.d_asenta ? row_selected.d_asenta : undefined,
			state: row_selected?.d_esta ? row_selected.d_esta : undefined,

			status: status,
		},
	});

	await db.excel.update({
		where: {
			id: excel_id,
		},
		data: {
			last: row_num,
		},
	});

	revalidatePath("/upload");
}

export async function duplicated_result(
	excel_id: number,
	row_num: number,
	selected?: number
) {
	if (!selected) {
		throw new Error("No se selecciono una direccion valida");
	}

	const row_selected = await db.excelResult.findFirst({
		where: {
			id: selected,
		},
	});

	if (!row_selected) {
		throw new Error("No se encontro la direccion seleccionada");
	}

	await db.excelResult.update({
		where: {
			excel_id_row: {
				excel_id,
				row: row_num,
			},
		},
		data: {
			code: row_selected.code,
			city: row_selected.city,
			colony: row_selected.colony,
			state: row_selected.state,

			equal_to: row_selected.id,
			status: "EQUAL",
		},
	});

	await db.excel.update({
		where: {
			id: excel_id,
		},
		data: {
			last: row_num,
		},
	});

	revalidatePath("/upload");
}

export async function skip_result(excel_id: number, row_num: number) {
	await db.excelResult.update({
		where: {
			excel_id_row: {
				excel_id,
				row: row_num,
			},
		},
		data: {
			status: "SKIP",
		},
	});

	await db.excel.update({
		where: {
			id: excel_id,
		},
		data: {
			last: row_num,
		},
	});

	revalidatePath("/upload");
}

export async function proccess_row(
	excel_id: number,
	num: number
): Promise<ResultType> {
	// Verify if the row is correct
	const row = await db.excelResult.findFirst({
		where: {
			excel_id,
			row: num,
		},
	});

	if (!row) {
		throw new Error("Fila no encontrada");
	}

	const correct = await db.address.findFirst({
		where: {
			d_code: `${row.code}`,

			d_muni: {
				equals: `${row.city}`,
				mode: "insensitive",
			},

			d_esta: {
				equals: `${row.state}`,
				mode: "insensitive",
			},

			d_asenta: {
				equals: `${row.colony}`,
				mode: "insensitive",
			},
		},
	});

	//  Verify repeated
	const repeated =
		row.phone || row.name
			? await db.excelResult.findFirst({
					where: {
						excel_id: excel_id,
						status: {
							not: "PENDING",
						},

						OR: [
							{
								name: row.name
									? {
											equals: `${row.name}`,
											mode: "insensitive",
									  }
									: undefined,
							},
							{
								phone: row.phone ? `${row.phone}` : undefined,
							},
						],
					},
			  })
			: null;

	if (correct) {
		return {
			status: "OK",
			row,

			errors: [],
			equals: repeated ? [repeated] : [],

			posible: [
				{
					id: correct.id,
					code: correct.d_code,
					muni: correct.d_muni,
					city: correct.d_ciud,
					state: correct.d_esta,
					colony: correct.d_asenta,
					d_tipo_asent: correct.d_tipo_asenta,
				},
			],
		};
	}

	const states = await db.states.findMany();

	const fuse_states = new Fuse(states, {
		keys: ["state"],
		threshold: 0.3,
	});

	const posible_states = row.state ? fuse_states.search(row.state) : [];

	const address = await db.address.findMany({
		where: {
			id_state:
				posible_states.length > 0
					? {
							in: posible_states.map((p) => p.item.id),
					  }
					: undefined,
		},
	});

	const fuseAddress = new Fuse(address, {
		keys: [
			{
				name: "d_code",
				weight: 15, // Prioridad máxima (código postal debe ser exacto)
			},
			{
				name: "d_esta",
				weight: 15, // Alto peso para coincidencia de estado
			},
			{
				name: "d_muni",
				weight: 6, // Ciudad importante pero flexible
			},
			{
				name: "d_asenta",
				weight: 5, // Peso aumentado para colonia
			},
		],
		includeScore: true,
		shouldSort: true,
		useExtendedSearch: true,
		minMatchCharLength: 3, // Reducir para permitir coincidencias más flexibles
		threshold: 0.3,
	});

	const possibleAddresses = fuseAddress.search({
		$or: [
			{
				d_code: `${row.code}`,
			},
			{
				d_esta: `${row.state}`,
			},
			{
				d_muni: `${row.city}`,
			},
			{
				d_asenta: `${row.colony}`,
			},
		],
	});

	const VALID_SCORE_THRESHOLD = 0.2; // Ajustar según necesidades

	const validAddresses = possibleAddresses
		.filter((a) => a.score! <= VALID_SCORE_THRESHOLD)
		.sort((a, b) => a.score! - b.score!);

	let errors: Array<string> = [];

	if (!validAddresses.some((a) => a.item.d_code === `${row.code}`)) {
		errors.push("El código puede que este mal");
	}

	if (!validAddresses.some((a) => a.item.d_muni === row.city)) {
		errors.push("La ciudad puede que este mal");
	}

	if (!validAddresses.some((a) => a.item.d_esta === row.state)) {
		errors.push("El estado puede que este mal");
	}

	if (!validAddresses.some((a) => a.item.d_asenta === row.colony)) {
		errors.push("La colonia puede que este mal");
	}

	const prev_results = await db.excelResult.findMany({
		where: {
			excel_id: excel_id,

			status: {
				not: "PENDING",
			},
		},
	});

	const fusePrev = new Fuse(prev_results, {
		keys: ["name", "phone"],
		includeScore: true,
		shouldSort: true,
		useExtendedSearch: true,
		minMatchCharLength: 3, // Reducir para permitir coincidencias más flexibles
		threshold: 0.2,
	});

	const possibleEqual = fusePrev.search({
		$or: [
			{
				name: `${row.name}`,
			},
			{
				phone: `${row.phone}`,
			},
		],
	});

	return {
		status: errors.length > 0 ? "ERROR" : "OK",
		errors,
		row,

		equals: possibleEqual.map((p) => p.item),

		posible: validAddresses.map((a) => ({
			score: a.score,
			muni: a.item.d_muni,
			city: a.item.d_ciud,
			code: a.item.d_code,
			colony: a.item.d_asenta,
			state: a.item.d_esta,
			id: a.item.id,
			d_tipo_asent: a.item.d_tipo_asenta,
		})),
	};
}

export async function search_results(
	colony: string,
	tipe_asenta: string,
	code: string,
	state: string
) {
	if (!colony && !tipe_asenta && !code && !state) {
		return [];
	}

	if (code) {
		const results = await db.address.findMany({
			where: {
				d_code: {
					contains: `${code.trim()}`,
					mode: "insensitive",
				},
			},
		});

		return results.map((a) => ({
			muni: a.d_muni,
			city: a.d_ciud,
			code: a.d_code,
			colony: a.d_asenta,
			state: a.d_esta,
			id: a.id,
			d_tipo_asent: a.d_tipo_asenta,
		}));
	}

	const address = await db.address.findMany({});

	const fuseAddress = new Fuse(address, {
		keys: [
			{
				name: "d_asenta",
				weight: 5, // Peso aumentado para colonia
			},
			{
				name: "d_tipo_asenta",
				weight: 5, // Peso aumentado para colonia
			},
			{
				name: "d_esta",
				weight: 5, // Peso aumentado para colonia
			},
		],
		includeScore: true,
		shouldSort: true,
		useExtendedSearch: true,
		minMatchCharLength: 3, // Reducir para permitir coincidencias más flexibles
		threshold: 0.6,
	});

	let $or = [];

	if (colony) {
		$or.push({
			d_asenta: colony,
		});
	}

	if (tipe_asenta) {
		$or.push({
			d_tipo_asenta: tipe_asenta,
		});
	}

	if (state) {
		$or.push({
			d_esta: state,
		});
	}

	const possibleAddresses = fuseAddress.search({
		$and: $or,
	});

	const validAddresses = possibleAddresses.sort((a, b) => a.score! - b.score!);

	return validAddresses.map((a) => ({
		muni: a.item.d_muni,
		city: a.item.d_ciud,
		code: a.item.d_code,
		colony: a.item.d_asenta,
		state: a.item.d_esta,
		id: a.item.id,
		d_tipo_asent: a.item.d_tipo_asenta,
	}));
}

export async function export_excel(excel_id: number) {
	const excel = await db.excel.findFirst({
		where: {
			id: excel_id,
		},
	});

	if (!excel) {
		throw new Error("Excel no encontrado");
	}

	const results = await db.excelResult.findMany({
		where: {
			excel_id,

			status: {
				not: "PENDING",
			},
		},
		orderBy: {
			row: "asc",
		},
	});

	const equalsResults = results.filter((r) => r.status === "EQUAL");

	const colorMap = new Map();

	// Asignar colores aleatorios a los resultados con estado "EQUAL"
	equalsResults.forEach((result) => {
		const key = result.equal_to || result.id;

		if (!colorMap.has(key)) {
			const randomColor = Math.floor(Math.random() * 16777215)
				.toString(16)
				.padStart(6, "0"); // RGB sin "#"
			colorMap.set(key, randomColor);
		}

		// Asignar el mismo color al ID actual si no está en el mapa
		if (!colorMap.has(result.id)) {
			colorMap.set(result.id, colorMap.get(key));
		}
	});

	// Mapear los resultados con sus colores correspondientes
	return results.map((r) => {
		let color = null;

		if (colorMap.has(r.id)) {
			color = colorMap.get(r.id);
		}

		if (!color) {
			switch (r.status) {
				case "OK":
					color = "22d3ee";
					break;
				case "SKIP":
					color = "ef4444";
					// color = null;
					break;
				case "ERROR":
					color = "22d3ee";
					break;
				default:
					color = "22d3ee";
					break;
			}
		}

		return {
			row: toExcel(r, excel.type),
			modified: verifyModified(r, excel.type),
			status: r.status,
			color,
		};
	});
}

export async function getAllTipoAsent() {
	const results = await db.address.findMany({
		select: {
			d_tipo_asenta: true,
		},
	});

	const unique = [...new Set(results.map((r) => r.d_tipo_asenta))];

	return unique.filter(Boolean);
}
