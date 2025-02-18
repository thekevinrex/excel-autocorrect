import React from "react";

import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "../ui/table";
import { DataType } from "@/app/(app)/check/[excel]/check";
import { Button } from "../ui/button";
import Link from "next/link";
import { Edit, Loader2, MapPin } from "lucide-react";
import { Excel, ExcelResult } from "@prisma/client";
import { formatExcel, toExcel } from "@/lib/utils";
import { Input } from "../ui/input";
import { toast } from "sonner";
import { update_row } from "@/actions";

type Props = {
	pos: number;
	excel: Excel;
	rowData: ExcelResult;
};

const ExcelTable = ({ excel, rowData, pos }: Props) => {
	const row: DataType = formatExcel(
		[toExcel(rowData, excel.type)],
		excel.type
	)[0];

	const [edit, setEdit] = React.useState(false);
	const [saving, setSaving] = React.useState(false);
	const [data, setData] = React.useState<{
		address: string;
		reference: string;
	}>({
		address: row.address,
		reference: row.reference,
	});

	const handleUpdate = async () => {
		try {
			setSaving(true);

			await update_row(rowData.id, data.address, data.reference);

			toast.success("Fila actualizada correctamente");

			setSaving(false);
			setEdit(false);
		} catch {
			setSaving(false);

			toast.error("Lo sentimos ha ocurrido un error al actualizar la fila");
		}
	};

	return (
		<Card>
			<CardHeader>
				<div className="flex justify-between gap-5 items-center">
					<CardTitle>Fila actual </CardTitle>

					<div className="text-sm text-muted-foreground">{`${pos + 1} / ${
						excel.total
					}`}</div>
				</div>
			</CardHeader>
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Número de pedido</TableHead>
						<TableHead>Nombre del cliente</TableHead>
						<TableHead>Dirección</TableHead>
						<TableHead>Número de local</TableHead>
						<TableHead>Colonia</TableHead>
						<TableHead>Ciudad</TableHead>
						<TableHead>Estado</TableHead>
						<TableHead>Código postal</TableHead>
						<TableHead></TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					<TableRow>
						<TableCell>{row.num}</TableCell>
						<TableCell>{row.name}</TableCell>
						<TableCell>{row.address}</TableCell>
						<TableCell>{row.local}</TableCell>
						<TableCell>{row.colony}</TableCell>
						<TableCell>{row.city}</TableCell>
						<TableCell>{row.state}</TableCell>
						<TableCell>{row.code}</TableCell>
						<TableCell>
							<div className="flex items-center gap-3">
								<Button
									onClick={() => setEdit(true)}
									variant={"outline"}
									size={"icon"}
								>
									<Edit />
								</Button>
								<Button variant={"outline"} size={"icon"} asChild>
									<Link
										href={`https://www.google.com/maps/search/?api=1&query=${row.colony},${row.city},${row.state},${row.code}`}
										target="_blank"
										rel="noopener noreferrer"
									>
										<MapPin />
									</Link>
								</Button>
							</div>
						</TableCell>
					</TableRow>
				</TableBody>
			</Table>

			{edit && (
				<CardContent>
					<div className="flex flex-row gap-5 mb-5 w-full">
						<div>
							<label>Dirección</label>
							<Input
								value={data.address}
								onChange={(e) => setData({ ...data, address: e.target.value })}
								placeholder="Dirección"
								className="input"
							/>
						</div>
						<div>
							<label>Referencia</label>
							<Input
								value={data.reference}
								onChange={(e) =>
									setData({ ...data, reference: e.target.value })
								}
								placeholder="Referencia"
								className="input"
							/>
						</div>
					</div>

					<div>
						<Button
							variant={"default"}
							onClick={handleUpdate}
							disabled={saving}
						>
							{saving ? (
								<>
									<Loader2 className="animate-spin" />
									Guardando...
								</>
							) : (
								"Guardar"
							)}
						</Button>
					</div>
				</CardContent>
			)}
		</Card>
	);
};

export default ExcelTable;
