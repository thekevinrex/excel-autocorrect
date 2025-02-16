"use server";

import { DataType } from "@/app/(app)/check/[excel]/check";
import { ResultType } from "@/components/check/excel-check";
import db from "@/lib/db";
import { toExcel, verifyModified } from "@/lib/utils";
import { ResultStatus } from "@prisma/client";
import { UTApi } from "uploadthing/server";

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

	if (e.excel_id) {
		const utapi = new UTApi();

		await utapi.deleteFiles([e.excel_id]);
	}

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

export async function save_result(
	excel_id: number,
	status: ResultStatus,
	row_num: number,
	row: DataType,
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

	const isReapeated =
		row.name || row.phone
			? await db.excelResult.findFirst({
					where: {
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

						excel_id: excel_id,
					},
			  })
			: null;

	await db.excelResult.upsert({
		where: {
			excel_id_row: {
				excel_id,
				row: row_num,
			},
		},
		create: {
			excel_id,

			code: row_selected?.d_code ? Number(row_selected.d_code) : row?.code || 0,
			city: row_selected?.d_muni ? row_selected.d_muni : `${row.city}`,
			colony: row_selected?.d_asenta ? row_selected.d_asenta : `${row.colony}`,
			state: row_selected?.d_esta ? row_selected.d_esta : `${row.state}`,
			row: row_num,
			status: isReapeated ? "EQUAL" : status,

			equal_to: isReapeated
				? isReapeated?.equal_to || isReapeated.id
				: undefined,

			name: row.name ? `${row.name}` : undefined,
			phone: row.phone ? `${row.phone}` : undefined,

			rowData: row.row,
		},
		update: {
			code: row_selected?.d_code ? Number(row_selected.d_code) : row?.code || 0,
			city: row_selected?.d_muni ? row_selected.d_muni : `${row.city}`,
			colony: row_selected?.d_asenta ? row_selected.d_asenta : `${row.colony}`,
			state: row_selected?.d_esta ? row_selected.d_esta : `${row.state}`,

			status: isReapeated ? "EQUAL" : status,

			equal_to: isReapeated
				? isReapeated?.equal_to || isReapeated.id
				: undefined,
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

export async function skip_result(
	excel_id: number,
	row_num: number,
	row: DataType
) {
	const isReapeated =
		row.name || row.phone
			? await db.excelResult.findFirst({
					where: {
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

						excel_id: excel_id,
					},
			  })
			: null;

	await db.excelResult.upsert({
		where: {
			excel_id_row: {
				excel_id,
				row: row_num,
			},
		},
		create: {
			excel_id,

			code: row?.code || 0,
			city: `${row.city}`,
			colony: `${row.colony}`,
			state: `${row.state}`,
			row: row_num,
			status: isReapeated ? "EQUAL" : "SKIP",

			equal_to: isReapeated
				? isReapeated?.equal_to || isReapeated.id
				: undefined,

			name: row.name ? `${row.name}` : undefined,
			phone: row.phone ? `${row.phone}` : undefined,

			rowData: row.row,
		},
		update: {
			code: row.code,
			city: row.city,
			colony: row.colony,
			state: row.state,
			status: isReapeated ? "EQUAL" : "SKIP",

			equal_to: isReapeated
				? isReapeated?.equal_to || isReapeated.id
				: undefined,
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
	row: DataType
): Promise<ResultType> {
	// Verify if the row is correct
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
			status: repeated ? "EQUAL" : "OK",

			errors: [],
			equals: repeated ? [repeated] : [],

			posible: [
				{
					id: correct.id,
					code: Number(correct.d_code),
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

	const posible_states = fuse_states.search(row.state);

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

	if (possibleEqual.length > 0) {
		errors.push("El nombre o telefono puede que este repetido");
	}

	// 5. Resultado final con sugerencias priorizadas
	return {
		status: errors.length > 0 ? "ERROR" : "OK",
		errors,

		equals: possibleEqual.map((p) => p.item),

		posible: validAddresses.map((a) => ({
			score: a.score,
			muni: a.item.d_muni,
			city: a.item.d_ciud,
			code: Number(a.item.d_code),
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
	code: string
) {
	if (!colony && !tipe_asenta && !code) {
		return [];
	}

	const results = await db.address.findMany({
		where: {
			d_asenta: colony
				? {
						contains: colony,
						mode: "insensitive",
				  }
				: undefined,

			d_tipo_asenta: tipe_asenta
				? {
						contains: tipe_asenta,
						mode: "insensitive",
				  }
				: undefined,

			d_code: code ? code : undefined,
		},
	});

	if (results.length <= 0) {
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
					name: "d_code",
					weight: 5, // Peso aumentado para colonia
				},
			],
			includeScore: true,
			shouldSort: true,
			useExtendedSearch: true,
			minMatchCharLength: 3, // Reducir para permitir coincidencias más flexibles
			threshold: 0.3,
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

		if (code) {
			$or.push({
				d_code: code,
			});
		}

		const possibleAddresses = fuseAddress.search({
			$or: $or,
		});

		const VALID_SCORE_THRESHOLD = 0.2; // Ajustar según necesidades

		const validAddresses = possibleAddresses
			.filter((a) => a.score! <= VALID_SCORE_THRESHOLD)
			.sort((a, b) => a.score! - b.score!);

		return validAddresses.map((a) => ({
			muni: a.item.d_muni,
			city: a.item.d_ciud,
			code: Number(a.item.d_code),
			colony: a.item.d_asenta,
			state: a.item.d_esta,
			id: a.item.id,
			d_tipo_asent: a.item.d_tipo_asenta,
		}));
	}

	return results.map((a) => ({
		muni: a.d_muni,
		city: a.d_ciud,
		code: Number(a.d_code),
		colony: a.d_asenta,
		state: a.d_esta,
		id: a.id,
		d_tipo_asent: a.d_tipo_asenta,
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
					// blue en rgb
					color = "22d3ee"; // "blue" en RGB
					break;
				case "SKIP":
					color = null;
					break;
				default:
					color = "22d3ee"; // "red" en RGB
					break;
			}
		}

		return {
			row: toExcel(r, excel.type),
			modified: verifyModified(r, excel.type),
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
