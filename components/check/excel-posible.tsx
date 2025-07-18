import React from "react";
import {
	ok_result,
	proccess_row,
	save_result,
	search_results,
	skip_result,
} from "@/actions";
import { AddressType } from "@/app/(app)/(check)/check/[excel]/check";
import { Excel, ResultStatus } from "@prisma/client";

import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";

import { Card, CardContent, CardHeader } from "../ui/card";
import { Button } from "../ui/button";
import { Filter, Loader2, Trash2 } from "lucide-react";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../ui/select";
import ResultTable from "../result-table";
import ExportButton from "../export-button";
import { ResultType } from "./excel-check";

type Props = {
	excel: Excel;
	result: ResultType;

	pos: number;
	setPos: (pos: number) => void;

	tipos: Array<string>;
};

const ExcelPosible = ({ result, excel, pos, setPos, tipos }: Props) => {
	const [saving, setSaving] = React.useState(false);
	const [skip, setSkip] = React.useState(false);

	const [selected, setSelected] = React.useState<number | null>(
		result.posible && result.posible.length > 0 ? result.posible[0].id : null
	);

	const [page, setPage] = React.useState(1);
	const [perPage, setPerPage] = React.useState(25);

	const [show, setShow] = React.useState<
		Array<
			{
				id: number;
				muni: string;
				d_tipo_asent: string;
			} & AddressType
		>
	>(result.posible || []);

	const [search, setSearch] = React.useState(false);
	const [filters, setFilters] = React.useState<{
		search: string;
		colony: string;
		asenta: string;
		code: string;
		advanced: boolean;
		muni: string;
		state: string;
	}>({
		code: "",
		colony: "",
		asenta: "",
		search: "",
		muni: "",
		state: "",
		advanced: false,
	});

	const handleSkip = async () => {
		try {
			setSkip(true);
			setPage(1);

			await skip_result(excel.id, pos);

			toast.success("Fila saltada correctamente");

			setFilters({
				code: "",
				colony: "",
				search: "",
				asenta: "",
				state: "",
				muni: "",
				advanced: false,
			});

			setPos(pos + 1);
		} catch {
			toast.error("Lo sentimos ha ocurrido un error al saltar la fila");
		} finally {
			setSkip(false);
		}
	};

	const handleSubmit = async (status: ResultStatus) => {
		try {
			setSaving(true);
			setPage(1);

			await save_result(excel.id, pos, status, selected || undefined);

			toast.success("Fila modificada correctamente");

			setFilters({
				code: "",
				colony: "",
				search: "",
				asenta: "",
				state: "",
				muni: "",
				advanced: false,
			});

			setPos(pos + 1);
			setSaving(false);
		} catch {
			setSaving(false);
			toast.error("Lo sentimos ha ocurrido un error al guardar el resultado");
		} finally {
		}
	};

	const handleAdvancedSearch = async () => {
		setPage(1);

		if (
			!filters.colony &&
			!filters.asenta &&
			!filters.code &&
			!filters.state &&
			!filters.muni
		) {
			setShow([...result.posible]);
			return;
		}

		if (search) {
			return;
		}

		try {
			setSearch(true);

			const result = await search_results(
				filters.colony,
				filters.asenta,
				filters.code,
				filters.state,
				filters.muni
			);

			setShow(result);
			setSelected(result.length > 0 ? result[0].id : selected);
			setSearch(false);
		} catch {
			setSearch(false);
			toast.error("Lo sentimos ha ocurrido un error al buscar");
		}
	};

	const handleOk = async () => {
		try {
			setSaving(true);

			await ok_result(excel.id, pos);

			toast.success("Fila actualizada correctamente");

			setSaving(false);
			setPos(pos + 1);
		} catch {
			setSaving(false);

			toast.error("Lo sentimos ha ocurrido un error al actualizar la fila");
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
								Buscar estado
								<Input
									value={filters.state}
									placeholder="Buscar estado..."
									onChange={(e) =>
										setFilters({
											...filters,
											state: e.target.value,
										})
									}
								/>
							</Label>

							<Label className="w-full">
								Buscar Municipio
								<Input
									value={filters.muni}
									placeholder="Buscar municipio..."
									onChange={(e) =>
										setFilters({
											...filters,
											muni: e.target.value,
										})
									}
								/>
							</Label>

							<Label className="w-full">
								Buscar código
								<Input
									value={filters.code}
									placeholder="Buscar código..."
									autoFocus
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
										search: "",
										state: "",
										code: "",
										colony: "",
										asenta: "",
										muni: "",
									});
									setShow(result.posible);
								}}
								className="shrink-0"
								variant={"outline"}
								type="button"
							>
								<Trash2 />
							</Button>

							<Button>
								{search ? (
									<>
										<Loader2 className="animate-spin" /> Buscando...
									</>
								) : (
									"Buscar"
								)}
							</Button>
						</form>
					)}
				</CardHeader>

				{result.status === "CANCELED" && (
					<CardContent className="bg-slate-500 text-white pt-5">
						<AlertTitle>Fila cancelada</AlertTitle>
						<AlertDescription>
							Esta fila ha sido cancelada y no se procesará.
						</AlertDescription>
						<Button
							onClick={handleOk}
							className="mt-5"
							variant={"secondary"}
							disabled={saving || skip}
						>
							Continuar
						</Button>
					</CardContent>
				)}

				{result.status !== "CANCELED" && (
					<ResultTable
						page={page}
						setPage={setPage}
						perPage={perPage}
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
				)}
			</Card>

			<Card>
				<CardContent className="flex flex-col md:flex-row items-center gap-5 justify-between p-4">
					<div>
						<ExportButton
							excel={excel}
							variant={{
								variant: "secondary",
							}}
						/>
					</div>

					<div className="flex flex-row gap-5 items-center justify-end">
						<Button
							type="button"
							onClick={handleSkip}
							variant={"destructive"}
							disabled={skip || saving}
						>
							{skip ? (
								<>
									<Loader2 /> Guardando...
								</>
							) : (
								"Incorrecto"
							)}
						</Button>

						<Button
							onClick={() => handleSubmit("ERROR")}
							disabled={saving || !selected}
							variant={"secondary"}
						>
							{saving ? (
								<>
									<Loader2 /> Guardando...
								</>
							) : (
								"Parcialmente"
							)}
						</Button>

						<Button
							onClick={() => handleSubmit("OK")}
							disabled={saving || !selected}
						>
							{saving ? (
								<>
									<Loader2 /> Guardando...
								</>
							) : (
								"Correcto"
							)}
						</Button>
					</div>
				</CardContent>
			</Card>
		</>
	);
};

export default ExcelPosible;
