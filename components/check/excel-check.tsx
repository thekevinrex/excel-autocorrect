import { proccess_row, save_result } from "@/actions";
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
import { Loader2, MapPin } from "lucide-react";
import { ScrollArea } from "../ui/scroll-area";
import { Input } from "../ui/input";
import ExcelEquals from "./excel-equals";
import { formatExcel, toExcel } from "@/lib/utils";
import Link from "next/link";

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
	const [search, setSearch] = React.useState("");

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

			setPos(pos + 1);
		} catch {
			toast.error("Lo sentimos ha ocurrido un error al guardar el resultado");
		} finally {
			setSaving(false);
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
					<CardHeader>
						<div>
							<Input
								value={search}
								placeholder="Buscar entre los resultados..."
								onChange={(e) => setSearch(e.target.value)}
							/>
						</div>
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
										if (search === "") {
											return true;
										}
										return (
											r.colony.toLowerCase().includes(search.toLowerCase()) ||
											r.city.toLowerCase().includes(search.toLowerCase()) ||
											r.state.toLowerCase().includes(search.toLowerCase()) ||
											r.muni.toLowerCase().includes(search.toLowerCase()) ||
											r.code
												.toString()
												.toLowerCase()
												.includes(search.toLowerCase())
										);
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
			</form>
		</>
	);
};

export default ExcelCheck;
