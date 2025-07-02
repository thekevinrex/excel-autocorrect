"use server";

import { DataType } from "@/app/(app)/(check)/check/[excel]/check";
import { ResultType } from "@/components/check/excel-check";
import db from "@/lib/db";
import {
	compareStrings,
	formatExcel,
	normalizeNumbersToRoman,
	removeAccents,
	toExcel,
	verifyModified,
} from "@/lib/utils";
import { ExcelResult, ExcelType, ResultStatus } from "@prisma/client";

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
			num: d.num ? `${d.num}` : undefined,

			address: d?.address ? `${d.address}` : undefined,
			reference: d?.reference ? `${d.reference}` : undefined,
			local: d?.local ? `${d.local}` : undefined,

			rowData: d.row,
		})),
	});

	revalidatePath("/upload");

	return newE;
}

export async function uploadExcel_Pedido(
	file: {
		name: string;
		size: number;
	},

	excel: {
		type: ExcelType;
		total: number;
		id?: number;
	},

	data: DataType[]
) {
	let id = excel.id;

	if (!id) {
		const newE = await db.excel.create({
			data: {
				from: 0,
				to: excel.total,
				type: excel.type,
				last: -1,
				total: excel.total,

				excel_name: file.name,
				excel_size: file.size,
			},
		});

		id = newE.id;
	}

	await db.excelResult.createMany({
		data: data.map((d, i) => ({
			excel_id: id,

			row: i,
			status: "PENDING",

			code: d?.code ? `${d.code}` : undefined,
			city: d?.city ? `${d.city}` : undefined,
			colony: d?.colony ? `${d.colony}` : undefined,
			state: d.state ? `${d.state}` : undefined,

			name: d.name ? `${d.name}` : undefined,
			phone: d.phone ? `${d.phone}` : undefined,
			num: d.num ? `${d.num}` : undefined,

			address: d?.address ? `${d.address}` : undefined,
			reference: d?.reference ? `${d.reference}` : undefined,
			local: d?.local ? `${d.local}` : undefined,

			rowData: d.row,
		})),
	});

	revalidatePath("/upload");

	return id;
}

export async function update_row(
	id: number,

	address: string,
	reference: string,
	local: string,
	code: string
) {
	const result = await db.excelResult.findFirst({
		where: {
			id,
		},
	});

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

	if (result?.code !== code) {
		revalidatePath(`/check/${id}`);
	}
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

	const row = await db.excelResult.findFirst({
		where: {
			excel_id,
			row: row_num,
		},
	});

	if (!row) {
		throw new Error("Fila no encontrada");
	}

	await db.excelResult.update({
		where: {
			id: row.id,
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

	const row = await db.excelResult.findFirst({
		where: {
			excel_id,
			row: row_num,
		},
	});

	if (!row) {
		throw new Error("Fila no encontrada");
	}

	await db.excelResult.update({
		where: {
			id: row.id,
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
	const row = await db.excelResult.findFirst({
		where: {
			excel_id,
			row: row_num,
		},
	});

	if (!row) {
		throw new Error("Fila no encontrada");
	}

	await db.excelResult.update({
		where: {
			id: row.id,
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

export async function ok_result(excel_id: number, row_num: number) {
	const row = await db.excelResult.findFirst({
		where: {
			excel_id,
			row: row_num,
		},
	});

	if (!row) {
		throw new Error("Fila no encontrada");
	}

	await db.excelResult.update({
		where: {
			id: row.id,
		},
		data: {
			status: "OK",
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

export async function pre_process_rows(
	excel_id: number,
	step: "f1" | "f2" | "f3" | "f4" | "f01"
) {
	try {
		if (step === "f4") {
			return await pre_f4(excel_id);
		}

		const rows = await db.excelResult.findMany({
			where: {
				excel_id,
				status: "PENDING",

				posibleData: undefined,
			},
		});

		if (step === "f01") {
			return await pre_f01(excel_id, rows);
		}

		if (step === "f1") {
			return await pre_f1(excel_id, rows);
		}

		if (step === "f2") {
			return await pre_f2(excel_id, rows);
		}

		if (step === "f3") {
			return await pre_f3(excel_id, rows);
		}

		return null;
	} catch (e) {
		console.error(e);
		return null;
	}
}

export async function pre_f01(excel_id: number, rows: ExcelResult[]) {
	let stats = 0;

	const address = await db.address.findMany();

	for (const row of rows) {
		/* if (row.address && row.state && row.city && row.code) {
			const correctedAddress = await correctStructuredAddress(
				row.address,
				row.state,
				row.city,
				row.code
			);

			if (correctedAddress) {
				await db.excelResult.update({
					where: { id: row.id },
					data: {
						city: correctedAddress.city,
						colony: correctedAddress.colony,
					},
				});
				stats++;
				continue;
			}
		} */

		if (row.colony && isPrefixedColony(row.colony)) {
			const baseNames = getPossibleColonyNames(row.colony);
			const correctedColony = await findMatchingColony(
				baseNames,
				row?.state ?? "",
				row?.city ?? "",
				row?.code ?? ""
			);

			if (correctedColony) {
				await db.excelResult.update({
					where: { id: row.id },
					data: {
						colony: correctedColony,
					},
				});
				stats++;
				continue;
			}
		}

		if (row.colony) {
			const baseColonyName = getPossibleColonyNames(
				row.colony.toLowerCase()
			)[0];

			// Buscar coincidencias en la misma ciudad y estado

			const matchingStateAndCode = address.filter(
				(a) =>
					removeAccents(`${row.state}`.toLowerCase()).includes(
						removeAccents(a.d_esta.toLowerCase())
					) && a.d_code === `${row.code}`
			);

			if (row.colony.toLowerCase().includes("centro") && !!row.city) {
				// Si la colonia contiene "centro", buscamos coincidencias en el estado y código
				const fuseCentro = new Fuse(
					matchingStateAndCode.map((m) => ({
						...m,
						d_muni: removeAccents(m.d_muni),
					})),
					{
						keys: ["d_muni"],
						includeScore: true,
						shouldSort: true,
						threshold: 0.2,
					}
				);

				const possibleCentroMatches = fuseCentro
					.search(removeAccents(row.city?.toLowerCase() ?? ""))
					.sort((a, b) => a.score! - b.score!);

				let bestMath = possibleCentroMatches.filter((m) => {
					if (
						removeAccents(m.item.d_asenta?.toLowerCase() ?? "").includes(
							removeAccents(m.item.d_muni.toLowerCase() ?? "")
						)
					) {
						return true;
					}

					if (
						removeAccents(row.city?.toLowerCase() ?? "").includes(
							removeAccents(m.item.d_muni.toLowerCase() ?? "")
						)
					) {
						if (
							removeAccents(row.colony?.toLowerCase() ?? "").includes(
								removeAccents(m.item.d_muni.toLowerCase())
							)
						) {
							return true;
						}

						if (
							removeAccents(row.colony?.toLowerCase() ?? "").includes(
								removeAccents(m.item.d_asenta.toLowerCase() ?? "")
							)
						) {
							return true;
						}

						if (
							removeAccents(m.item.d_asenta.toLowerCase() ?? "").includes(
								removeAccents(m.item.d_muni?.toLowerCase() ?? "")
							)
						) {
							return true;
						}
					}
					return false;
				});

				if (!bestMath || bestMath.length === 0) {
					bestMath = matchingStateAndCode
						.filter((a) => {
							if (
								removeAccents(row.city?.toLowerCase() ?? "").includes(
									removeAccents(a.d_muni.toLowerCase() ?? "")
								)
							) {
								if (
									removeAccents(row.colony?.toLowerCase() ?? "").includes(
										removeAccents(a.d_asenta.toLowerCase() ?? "")
									)
								) {
									return true;
								}

								if (
									removeAccents(a.d_asenta.toLowerCase() ?? "").includes(
										removeAccents(a.d_muni?.toLowerCase() ?? "")
									)
								) {
									return true;
								}
							}
							return false;
						})
						.map((a) => ({
							item: a,
							score: 0,
							refIndex: 0,
						}));
				}

				if (bestMath && bestMath.length > 1) {
					const rankedBest = bestMath
						.map((a) => {
							let score = 0;

							if (
								removeAccents(row.colony?.toLowerCase() ?? "").includes(
									removeAccents(a.item.d_muni.toLowerCase())
								)
							) {
								score++;
							}

							if (
								removeAccents(row.colony?.toLowerCase() ?? "").includes(
									removeAccents(a.item.d_asenta.toLowerCase())
								)
							) {
								score++;
							}

							return {
								...a,
								score,
							};
						})
						.sort((a, b) => (a.score > b.score ? -1 : 1));

					const selectedBest = rankedBest.find((r) => r.score >= 1);
					if (selectedBest) {
						bestMath = [selectedBest];
					}
				}

				if (bestMath && bestMath.length === 1) {
					// Si encontramos una coincidencia, actualizamos la colonia
					await db.excelResult.update({
						where: { id: row.id },
						data: {
							colony: bestMath[0].item.d_asenta,
							city: bestMath[0].item.d_muni,
							state: bestMath[0].item.d_esta,
							code: bestMath[0].item.d_code,
						},
					});
					stats++;
					continue;
				}
			}

			const fuseStateCode = new Fuse(matchingStateAndCode, {
				keys: ["d_asenta"],
				includeScore: true,
				shouldSort: true,
				threshold: 0.2,
			});

			const possibleMatchesStateCode = fuseStateCode
				.search(baseColonyName)
				.sort((a, b) => a.score! - b.score!);

			if (possibleMatchesStateCode.length === 1) {
				// Si encontramos una coincidencia, actualizamos la colonia
				await db.excelResult.update({
					where: { id: row.id },
					data: {
						colony: possibleMatchesStateCode[0].item.d_asenta,
						city: possibleMatchesStateCode[0].item.d_muni,
						state: possibleMatchesStateCode[0].item.d_esta,
						code: possibleMatchesStateCode[0].item.d_code,
					},
				});
				stats++;
				continue;
			}

			const matchingAddresses = address.filter((a) => {
				return (
					compareStrings(a.d_esta, row.state || "").porcent > 60 ||
					a.d_code === `${row.code}` ||
					compareStrings(a.d_muni, row.city || "").porcent > 60
				);
			});

			const fuseColony = new Fuse(matchingAddresses, {
				keys: ["d_asenta"],
				includeScore: true,
				shouldSort: true,
				threshold: 0.5,
			});

			const possibleMatchesColony = fuseColony.search(baseColonyName);

			let bestColonyMatch;

			bestColonyMatch = matchingAddresses
				.map((m) => {
					let score = 0;

					score += Math.max(
						compareStrings(m.d_asenta, baseColonyName).score,
						compareStrings(baseColonyName, m.d_asenta).score
					);

					score += Math.max(
						compareStrings(row.city || "", m.d_muni).score,
						compareStrings(m.d_muni, row.city || "").score
					);

					if (m.d_code === row.code) {
						score += 3;
					}

					if (
						removeAccents(m.d_asenta.toLowerCase()) ===
						removeAccents(row.colony?.toLowerCase() || "")
					) {
						score += 4;
					}

					return {
						...m,
						item: m,
						score,
					};
				})
				.sort((a, b) => {
					return a.score > b.score ? -1 : 1;
				});

			// if (!!row.state && !!row.code) {
			// 	bestColonyMatch = possibleMatchesColony.filter((m) => {
			// 		return (
			// 			removeAccents(m.item.d_esta.toLowerCase()).includes(
			// 				removeAccents(row.state.toLowerCase())
			// 			) && row.code === m.item.d_code
			// 		);
			// 	});
			// }

			const bestSelected = bestColonyMatch.find((c) => c.score >= 6);
			if (["#79743"].includes(row.num!)) {
				console.log({
					row: JSON.stringify(row),
					bestColonyMatch: bestColonyMatch.map((m) => ({
						...m,
						item: JSON.stringify(m.item),
					})),
				});
			}

			if (bestSelected && bestColonyMatch.length > 1) {
				bestColonyMatch = [bestSelected];
			}

			/* if (!bestColonyMatch || bestColonyMatch.length === 0) {
				bestColonyMatch = matchingAddresses
					.filter((a) => {
						return removeAccents(a.d_asenta.toLowerCase()).includes(
							removeAccents(baseColonyName.toLowerCase())
						);
					})
					.map((a) => ({
						item: a,
						score: 0,
						refIndex: 0,
					}));
			} */

			if (bestColonyMatch && bestColonyMatch.length === 1) {
				// Si encontramos una coincidencia, actualizamos la colonia
				await db.excelResult.update({
					where: { id: row.id },
					data: {
						colony: bestColonyMatch[0].item.d_asenta,
						city: bestColonyMatch[0].item.d_muni,
						state: bestColonyMatch[0].item.d_esta,
						code: bestColonyMatch[0].item.d_code,
					},
				});
				stats++;
				continue;
			}
		}

		if (row.colony && /\d+/.test(row.colony)) {
			const normalizedColony = normalizeNumbersToRoman(row.colony);
			if (normalizedColony !== row.colony) {
				await db.excelResult.update({
					where: { id: row.id },
					data: { colony: normalizedColony },
				});
				stats++;
			}
		}

		if (
			row.colony?.toLowerCase().includes("primera sección") ||
			row.colony?.toLowerCase().includes("primera seccion")
		) {
			if (row.colony.toLowerCase().includes("san mateo")) {
				await db.excelResult.update({
					where: {
						id: row.id,
					},
					data: {
						colony: `San Mateo 1ra Sección`,
					},
				});

				stats++;
			}
		}

		if (row.colony?.toLowerCase().includes(" sm ")) {
			await db.excelResult.update({
				where: {
					id: row.id,
				},
				data: {
					colony: row.colony.includes(" sm ")
						? row.colony.replace(" sm ", "Supermanzana")
						: row.colony.replace(" Sm ", "Supermanzana"),
				},
			});

			stats++;
		}

		if (row.city?.toLowerCase().includes("cancun")) {
			await db.excelResult.update({
				where: {
					id: row.id,
				},
				data: {
					city: "Benito Juárez",
				},
			});

			stats++;
		}
	}

	return stats;
}

// Corrige direcciones mal estructuradas (caso Palo Gordo)
async function correctStructuredAddress(
	address: string,
	state: string,
	city: string,
	code: string
): Promise<{ city: string; colony: string } | null> {
	// Extraer posibles nombres de localidad de la dirección
	const possibleLocations = address
		.split(" ")
		.filter((part) => part.length > 3 && !/^\d+$/.test(part));

	// Buscar coincidencias exactas en la base de datos
	for (const location of possibleLocations) {
		const matches = await db.address.findMany({
			where: {
				d_code: code,
				d_esta: state,
				OR: [
					{ d_asenta: { contains: location, mode: "insensitive" } },
					{ d_muni: { contains: location, mode: "insensitive" } },
					{ d_ciud: { contains: location, mode: "insensitive" } },
				],
			},
			select: {
				d_asenta: true,
				d_muni: true,
				d_ciud: true,
			},
		});

		// Si hay una única coincidencia para este código postal
		if (matches.length === 1) {
			return {
				city: matches[0].d_muni,
				colony: matches[0].d_asenta,
			};
		}
	}
	return null;
}

// Verifica si la colonia tiene prefijos (Fracc, Colonia, etc.)
function isPrefixedColony(colony: string): boolean {
	return /^(fracc|fraccionamiento|colonia|barrio|col)\s/i.test(colony);
}

// Genera posibles nombres base para búsqueda (ej: "Fracc Montoya IVO" → ["Montoya IVO", "IVO Montoya"])
function getPossibleColonyNames(colony: string): string[] {
	const baseName = colony
		.replace(/^(fracc|fraccionamiento|colonia|barrio)\s/i, "")
		.trim();

	// Si tiene números romanos o naturales, probar diferentes ordenamientos
	if (/\s[IVXLCDM]+\s?$/i.test(baseName)) {
		const parts = baseName.split(" ");
		if (parts.length > 1) {
			return [
				baseName,
				`${parts[parts.length - 1]} ${parts.slice(0, -1).join(" ")}`,
			];
		}
	}
	return [baseName];
}

// Busca la colonia en la base de datos con diferentes variaciones
async function findMatchingColony(
	possibleNames: string[],
	state: string,
	city: string,
	code: string
): Promise<string | null> {
	for (const name of possibleNames) {
		const matches = await db.address.findMany({
			where: {
				d_code: code,
				d_esta: state,
				d_muni: city,
				d_asenta: { contains: name, mode: "insensitive" },
			},
			select: { d_asenta: true },
		});

		if (matches.length === 1) {
			return matches[0].d_asenta;
		}
	}
	return null;
}

export async function pre_f1(excel_id: number, rows: ExcelResult[]) {
	let stats = 0;

	for (const row of rows) {
		const correct = await verify_is_correct(excel_id, row);

		if (correct) {
			stats++;
		}
	}

	return stats;
}

export async function pre_f2(excel_id: number, rows: ExcelResult[]) {
	let stats = 0;

	for (const row of rows) {
		const f2_posibles = await db.address.findMany({
			where: {
				d_code: `${row.code}`,

				d_asenta: {
					equals: `${row.colony}`,
					mode: "insensitive",
				},
			},
		});

		if (f2_posibles.length > 0) {
			await db.excelResult.update({
				where: {
					id: row.id,
				},
				data: {
					status: "OK_FILTER",

					code: f2_posibles[0]?.d_code ? f2_posibles[0].d_code : undefined,
					city: f2_posibles[0]?.d_muni ? f2_posibles[0].d_muni : undefined,
					colony: f2_posibles[0]?.d_asenta
						? f2_posibles[0].d_asenta
						: undefined,
					state: f2_posibles[0]?.d_esta ? f2_posibles[0].d_esta : undefined,
				},
			});

			stats++;
		}
	}

	return stats;
}

export async function pre_f3(excel_id: number, rows: ExcelResult[]) {
	let stats = 0;

	for (const row of rows) {
		const f3_posibles = await db.address.findMany({
			where: {
				d_code: `${row.code}`,

				d_esta: {
					contains: `${row.state}`,
					mode: "insensitive",
				},
			},
		});

		const fuseAddress = new Fuse(f3_posibles, {
			keys: [
				{
					name: "d_esta",
					weight: 15, // Alto peso para coincidencia de estado
				},
				{
					name: "d_muni",
					weight: 6, // Ciudad importante pero flexible
				},
			],
			includeScore: true,
			shouldSort: true,
			useExtendedSearch: true,
			minMatchCharLength: 3, // Reducir para permitir coincidencias más flexibles
			threshold: 0.2,
		});

		const possibleAddresses = fuseAddress.search({
			$or: [
				{
					d_esta: `${row.state}`,
				},
				{
					d_muni: `${row.city}`,
				},
			],
		});

		if (possibleAddresses.length > 0) {
			await db.excelResult.update({
				where: {
					id: row.id,
				},
				data: {
					status: "PENDING",

					posibleData: possibleAddresses.map((a) => a.item.id),
				},
			});

			stats++;
		}
	}

	return stats;
}

export async function pre_f4(excel_id: number) {
	// Reorganize rows based on the specified criteria
	const allResults = await db.excelResult.findMany({
		where: {
			excel_id,
		},
		orderBy: {
			row: "asc",
		},
	});

	const okResults = allResults.filter(
		(r) => r.status === "OK" || r.status === "OK_FILTER"
	);

	const pendingWithPossibleData = allResults.filter(
		(r) => r.status === "PENDING" && r.posibleData
	);
	const otherResults = allResults.filter(
		(r) =>
			r.status !== "OK" &&
			r.status !== "OK_FILTER" &&
			!(r.status === "PENDING" && r.posibleData)
	);

	const emptyFieldsResults = [
		...pendingWithPossibleData,
		...otherResults,
	].filter(
		(r) =>
			!r.colony ||
			!r.city ||
			!r.state ||
			!r.code ||
			(typeof r.code === "string" && r.code.trim().length === 0)
	);

	const fourDigitCPResults = [
		...pendingWithPossibleData,
		...otherResults,
	].filter(
		(r) => r.code && typeof r.code === "string" && /^\d{4}$/.test(r.code.trim())
	);

	const restResults = [...pendingWithPossibleData, ...otherResults].filter(
		(r) => !emptyFieldsResults.includes(r) && !fourDigitCPResults.includes(r)
	);

	const reorderedResults = [
		...okResults,
		...emptyFieldsResults,
		...fourDigitCPResults,
		...restResults.sort((r, b) =>
			r.num?.startsWith("#D") || r.num?.startsWith("#d") ? -1 : 1
		),
	];

	for (let i = 0; i < reorderedResults.length; i++) {
		await db.excelResult.update({
			where: {
				id: reorderedResults[i].id,
			},
			data: {
				row: i,
			},
		});
	}

	await db.excel.update({
		where: {
			id: excel_id,
		},
		data: {
			last: okResults.length - 1,
		},
	});

	return allResults.length;
}

export async function verify_is_correct(excel_id: number, row: ExcelResult) {
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
		row.phone || row.name || row.num
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
							{
								num: row.num ? `${row.num}` : undefined,
							},
						],
					},
			  })
			: null;

	if (correct) {
		await db.excelResult.update({
			where: {
				id: row.id,
			},
			data: {
				status: "OK_FILTER",
				equal_to: repeated ? repeated.id : null,
			},
		});

		return true;
	}

	if (row.colony?.toLowerCase().includes("calvario")) {
		const verify_correct = await db.address.findMany({
			where: {
				d_asenta: {
					contains: "calvario",
					mode: "insensitive",
				},
				d_code: `${row.code}`,
			},
		});

		if (verify_correct.length === 1) {
			await db.excelResult.update({
				where: {
					id: row.id,
				},
				data: {
					status: "OK_FILTER",
					colony: verify_correct[0].d_asenta,
					equal_to: repeated ? repeated.id : null,
				},
			});

			return true;
		}
	}

	return false;
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

	if (row.status === "OK" || row.status === "OK_FILTER") {
		return {
			status: "OK",
			row,

			errors: [],
			equals: [],

			posible: [],
		};
	}

	if (row.posibleData) {
		const possibleAddresses = await db.address.findMany({
			where: {
				id: {
					in: row.posibleData as Array<number>,
				},
			},
		});

		return {
			status: "PENDING",
			row,

			errors: [],
			equals: [],

			posible: possibleAddresses.map((a) => ({
				muni: a.d_muni,
				city: a.d_ciud,
				code: a.d_code,
				colony: a.d_asenta,
				state: a.d_esta,
				id: a.id,
				d_tipo_asent: a.d_tipo_asenta,
			})),
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
			OR: [
				{
					id_state:
						posible_states.length > 0
							? {
									in: posible_states.map((p) => p.item.id),
							  }
							: undefined,
				},
				{
					d_code: `${row.code ?? ""}`,
				},
			],
		},
	});

	const fuseAddress = new Fuse(address, {
		keys: [
			{
				name: "d_code",
				weight: 20,
			},
			{
				name: "d_esta",
				weight: 5, // Alto peso para coincidencia de estado
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
	state: string,
	muni: string
) {
	if (!colony && !tipe_asenta && !code && !state && !muni) {
		return [];
	}

	let results;

	if (code) {
		results = await db.address.findMany({
			where: {
				d_code: {
					contains: `${code.trim()}`,
					mode: "insensitive",
				},
			},
		});
	}

	if (!results || results.length === 0) {
		results = await db.address.findMany({});
	}

	const keys = [];

	if (colony) {
		keys.push({
			name: "d_asenta",
		});
	}

	if (tipe_asenta) {
		keys.push({
			name: "d_tipo_asenta",
		});
	}

	if (state) {
		keys.push({
			name: "d_esta",
		});
	}

	if (muni) {
		keys.push({
			name: "d_muni",
		});
	}

	if (keys.length === 0) {
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

	const fuseAddress = new Fuse(results, {
		keys,
		includeScore: true,
		shouldSort: true,
		minMatchCharLength: 3, // Reducir para permitir coincidencias más flexibles
		threshold: 0.2,
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

	if (muni) {
		$or.push({
			d_muni: muni,
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
				case "OK_FILTER":
					color = "2fce2f";
					break;
				case "SKIP":
					color = "ef4444";
					// color = null;
					break;
				case "ERROR":
					color = "22d3ee";
					break;
				default:
					color = null;
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
