import {
	proccess_row,
	save_result,
	search_results,
	skip_result,
} from "@/actions";
import { AddressType, DataType } from "@/app/(app)/check/[excel]/check";
import { Excel, ExcelResult, ResultStatus } from "@prisma/client";
import React from "react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";

import { Card, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Filter, Loader2, MapPin, Trash2 } from "lucide-react";
import { Input } from "../ui/input";
import ExcelEquals from "./excel-equals";
import { formatExcel, toExcel } from "@/lib/utils";
import { Label } from "../ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../ui/select";
import ResultTable from "../result-table";

type Props = {
	excel: Excel;
	data: DataType[];
	pos: number;
	setPos: (pos: number) => void;

	tipos: Array<string>;
};

export type ResultType = {
	errors: Array<string>;

	status: ResultStatus;

	posible: Array<
		{
			id: number;
			muni: string;
			d_tipo_asent: string;
		} & AddressType
	>;

	equals: ExcelResult[];
};

const ExcelCheck = ({ data, pos, setPos, excel, tipos }: Props) => {
	const [result, setResult] = React.useState<ResultType | null | boolean>(null);
	const [selected, setSelected] = React.useState<number | null>(null);
	const [saving, setSaving] = React.useState(false);
	const [skip, setSkip] = React.useState(false);
	const [show, setShow] = React.useState<
		Array<
			{
				id: number;
				muni: string;
				d_tipo_asent: string;
			} & AddressType
		>
	>([]);

	const [search, setSearch] = React.useState(false);
	const [filters, setFilters] = React.useState<{
		search: string;
		colony: string;
		asenta: string;
		code: string;
		advanced: boolean;
	}>({
		code: "",
		colony: "",
		asenta: "",
		search: "",
		advanced: false,
	});

	React.useMemo(async () => {
		try {
			setResult(null);

			const row = data?.[pos];

			if (!row) {
				toast.error("La fila a procesar es invalida");
				return;
			}

			const result = await proccess_row(excel.id, {
				...row,
				row: "",
			});

			setResult(result);
			setShow(result.posible);
			setSelected(result.posible.length > 0 ? result.posible[0].id : null);
		} catch (e) {
			setResult(false);

			toast.error("Lo sentimos ha ocurrido un error al cargar los resultados");
		}
	}, [data, pos]);

	const handleSkip = async () => {
		const row = data?.[pos];

		if (!row) {
			return;
		}

		try {
			setSkip(true);

			await skip_result(excel.id, pos, row);

			toast.success("Fila saltada correctamente");

			setFilters({
				code: "",
				colony: "",
				search: "",
				asenta: "",
				advanced: false,
			});

			setPos(pos + 1);
		} catch {
			toast.error("Lo sentimos ha ocurrido un error al saltar la fila");
		} finally {
			setSkip(false);
		}
	};

	if (result === null) {
		return "Cargando resultados...";
	}

	if (typeof result === "boolean") {
		return (
			<>
				<Alert variant={"destructive"}>
					<AlertTitle className="font-semibold text-base">
						Problemas al cargar los resultados
					</AlertTitle>
					<AlertDescription>
						Se detectaron problemas y no se pudo procesar la fila
					</AlertDescription>
				</Alert>

				<form
					action={handleSkip}
					className="flex flex-row items-center gap-5 justify-end"
				>
					<Button variant={"destructive"} disabled={skip || saving}>
						{skip ? (
							<>
								<Loader2 /> Saltando...
							</>
						) : (
							"Saltar"
						)}
					</Button>
				</form>
			</>
		);
	}

	const handleSubmit = async () => {
		const row = data?.[pos];

		if (!row) {
			return;
		}

		try {
			setSaving(true);

			await save_result(
				excel.id,
				result.status,
				pos,
				row,
				selected || undefined
			);

			toast.success("Fila modificada correctamente");

			setFilters({
				code: "",
				colony: "",
				search: "",
				asenta: "",
				advanced: false,
			});

			setPos(pos + 1);
		} catch {
			toast.error("Lo sentimos ha ocurrido un error al guardar el resultado");
		} finally {
			setSaving(false);
		}
	};

	const handleAdvancedSearch = async () => {
		if (!filters.colony && !filters.asenta && !filters.code) {
			setShow(result.posible);
			return;
		}

		try {
			setSearch(true);

			const result = await search_results(
				filters.colony,
				filters.asenta,
				filters.code
			);

			setShow(result);
		} catch {
			toast.error("Lo sentimos ha ocurrido un error al buscar");
		} finally {
			setSearch(false);
		}
	};

	return (
		<>
			{(result.status === "ERROR" || result.errors.length > 0) && (
				<Alert variant={"destructive"}>
					<AlertTitle className="font-semibold text-base">
						Problemas detectados
					</AlertTitle>
					<AlertDescription>
						{result.errors.length > 0 ? (
							<ul className="flex flex-col gap-2">
								{result.errors.map((e, i) => (
									<li className="text-sm" key={i}>
										{e}
									</li>
								))}
							</ul>
						) : (
							"Hay problemas con las columnas de la fila"
						)}
					</AlertDescription>
				</Alert>
			)}

			{result.status === "OK" && (
				<Alert className="bg-green-500 text-white">
					<AlertTitle>Fila correcta</AlertTitle>
					<AlertDescription>
						No se detectaron ningun problema en la fila
					</AlertDescription>
				</Alert>
			)}

			{result.status === "EQUAL" && (
				<Alert className="bg-cyan-500 text-white">
					<AlertTitle>Fila repetida</AlertTitle>
					<AlertDescription>
						Se detectó un posible nombre o telefono repetido
					</AlertDescription>
				</Alert>
			)}

			{result.posible && result.posible.length > 0 && (
				<Card className="flex flex-col w-full ">
					<CardHeader className="flex flex-col gap-5">
						<div className="flex items-center gap-5">
							<Input
								value={filters.search}
								placeholder="Buscar entre los resultados..."
								onChange={(e) =>
									setFilters({
										...filters,
										search: e.target.value,
									})
								}
							/>

							<Button
								onClick={() => {
									setFilters({
										...filters,
										advanced: !filters.advanced,
									});
								}}
								size={"icon"}
								className="shrink-0"
								variant={"outline"}
							>
								<Filter />
							</Button>
						</div>

						{filters.advanced && (
							<form
								action={handleAdvancedSearch}
								className="w-full flex flex-col md:flex-row items-end gap-5"
							>
								<Label className="w-full">
									Buscar colonia
									<Input
										value={filters.colony}
										placeholder="Buscar colonia..."
										onChange={(e) =>
											setFilters({
												...filters,
												colony: e.target.value,
											})
										}
									/>
								</Label>
								<Label className="w-full">
									Tipo de asentamiento
									<Select
										value={filters.asenta}
										onValueChange={(v) => setFilters({ ...filters, asenta: v })}
									>
										<SelectTrigger>
											<SelectValue placeholder="Tipo de asentamiento" />
										</SelectTrigger>
										<SelectContent>
											{tipos.map((t, i) => (
												<SelectItem key={i} value={t}>
													{t}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</Label>

								<Label className="w-full">
									Buscar código
									<Input
										value={filters.code}
										placeholder="Buscar código..."
										onChange={(e) =>
											setFilters({
												...filters,
												code: e.target.value,
											})
										}
									/>
								</Label>

								<Button
									size={"icon"}
									onClick={() => {
										setFilters({
											...filters,
											code: "",
											colony: "",
											asenta: "",
										});
										setShow(result.posible);
									}}
									className="shrink-0"
									variant={"outline"}
									type="button"
								>
									<Trash2 />
								</Button>

								<Button disabled={search}>
									{search ? (
										<>
											<Loader2 /> Buscando...
										</>
									) : (
										"Buscar"
									)}
								</Button>
							</form>
						)}
					</CardHeader>
					<ResultTable
						show={show.filter((r) => {
							if (filters.search === "") {
								return true;
							}

							return (
								r.colony.toLowerCase().includes(filters.search.toLowerCase()) ||
								r.city.toLowerCase().includes(filters.search.toLowerCase()) ||
								r.state.toLowerCase().includes(filters.search.toLowerCase()) ||
								r.muni.toLowerCase().includes(filters.search.toLowerCase()) ||
								r.code
									.toString()
									.toLowerCase()
									.includes(filters.search.toLowerCase())
							);
						})}
						selected={selected}
						setSelected={setSelected}
					/>
				</Card>
			)}

			{result.equals && result.equals.length > 0 && (
				<Card className="flex flex-col w-full ">
					<CardHeader>
						<CardTitle>Posibles similitudes</CardTitle>
					</CardHeader>
					<ExcelEquals
						equals={formatExcel(
							result.equals.map((e) => toExcel(e, excel.type)),
							excel.type
						)}
					/>
				</Card>
			)}

			<form
				action={handleSubmit}
				className="flex flex-row items-center gap-5 justify-end"
			>
				<Button disabled={saving || !selected}>
					{saving ? (
						<>
							<Loader2 /> Modificando...
						</>
					) : (
						"Modificar"
					)}
				</Button>
				<Button
					type="button"
					onClick={handleSkip}
					variant={"destructive"}
					disabled={skip || saving}
				>
					{skip ? (
						<>
							<Loader2 /> Saltando...
						</>
					) : (
						"Saltar"
					)}
				</Button>
			</form>
		</>
	);
};

export default ExcelCheck;
