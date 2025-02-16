import { proccess_row, save_result, skip_result } from "@/actions";
import { AddressType, DataType } from "@/app/(app)/check/[excel]/check";
import { Excel, ExcelResult, ResultStatus } from "@prisma/client";
import React from "react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "../ui/table";
import { Card, CardHeader, CardTitle } from "../ui/card";
import { Checkbox } from "../ui/checkbox";
import { Button } from "../ui/button";
import { Filter, Loader2, MapPin } from "lucide-react";
import { ScrollArea } from "../ui/scroll-area";
import { Input } from "../ui/input";
import ExcelEquals from "./excel-equals";
import { formatExcel, toExcel } from "@/lib/utils";
import Link from "next/link";
import { Label } from "../ui/label";

type Props = {
	excel: Excel;
	data: DataType[];
	pos: number;
	setPos: (pos: number) => void;
};

export type ResultType = {
	errors: Array<string>;

	status: ResultStatus;

	posible: Array<
		{
			id: number;
			muni: string;
		} & AddressType
	>;

	equals: ExcelResult[];
};

const ExcelCheck = ({ data, pos, setPos, excel }: Props) => {
	const [result, setResult] = React.useState<ResultType | null>(null);
	const [selected, setSelected] = React.useState<number | null>(null);
	const [saving, setSaving] = React.useState(false);
	const [skip, setSkip] = React.useState(false);

	const [filters, setFilters] = React.useState<{
		search: string;
		colony: string;
		code: string;
		advanced: boolean;
	}>({
		code: "",
		colony: "",
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

			const result = await proccess_row(excel.id, row);

			setResult(result);
			setSelected(result.posible.length > 0 ? result.posible[0].id : null);
		} catch (e) {
			toast.error("Lo sentimos ha ocurrido un error al cargar los resultados");
		}
	}, [data, pos]);

	if (!result) {
		return "Cargando resultados...";
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

			toast.success("Fila guardada correctamente");

			setFilters({
				code: "",
				colony: "",
				search: "",
				advanced: false,
			});

			setPos(pos + 1);
		} catch {
			toast.error("Lo sentimos ha ocurrido un error al guardar el resultado");
		} finally {
			setSaving(false);
		}
	};

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
				advanced: false,
			});

			setPos(pos + 1);
		} catch {
			toast.error("Lo sentimos ha ocurrido un error al saltar la fila");
		} finally {
			setSkip(false);
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
							<div className="w-full flex flex-col md:flex-row items-center gap-5">
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
							</div>
						)}
					</CardHeader>
					<div className="max-h-[500px] overflow-y-auto">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead></TableHead>
									<TableHead>Colonia</TableHead>
									<TableHead>Municipio</TableHead>
									<TableHead>Estado</TableHead>
									<TableHead>Código</TableHead>
									<TableHead>Ciudad</TableHead>
									<TableHead></TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{result.posible
									.filter((r) => {
										if (filters.search === "" && !filters.advanced) {
											return true;
										}

										return (
											r.colony
												.toLowerCase()
												.includes(filters.search.toLowerCase()) ||
											r.city
												.toLowerCase()
												.includes(filters.search.toLowerCase()) ||
											r.state
												.toLowerCase()
												.includes(filters.search.toLowerCase()) ||
											r.muni
												.toLowerCase()
												.includes(filters.search.toLowerCase()) ||
											r.code
												.toString()
												.toLowerCase()
												.includes(filters.search.toLowerCase())
										);
									})
									.filter((r) => {
										if (!filters.advanced || filters.colony === "") {
											return true;
										}

										return r.colony
											.toLowerCase()
											.includes(filters.colony.toLowerCase());
									})
									.filter((r) => {
										if (!filters.advanced || filters.code === "") {
											return true;
										}

										return r.code === parseInt(filters.code);
									})
									.map((r, i) => (
										<TableRow key={i}>
											<TableCell>
												<Checkbox
													checked={selected === r.id}
													onCheckedChange={(checked) => {
														if (checked) {
															setSelected(r.id);
														} else {
															setSelected(null);
														}
													}}
												/>
											</TableCell>
											<TableCell>{r.colony}</TableCell>
											<TableCell>{r.muni}</TableCell>
											<TableCell>{r.state}</TableCell>
											<TableCell>{r.code}</TableCell>
											<TableCell>{r.city ? r.city : "-"}</TableCell>
											<TableCell>
												<Button variant={"outline"} size={"icon"} asChild>
													<Link
														href={`https://www.google.com/maps/search/?api=1&query=${r.colony},${r.muni},${r.state},${r.code}`}
														target="_blank"
														rel="noopener noreferrer"
													>
														<MapPin />
													</Link>
												</Button>
											</TableCell>
										</TableRow>
									))}
							</TableBody>
						</Table>
					</div>
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
