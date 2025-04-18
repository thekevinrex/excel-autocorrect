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
import { Checkbox } from "../ui/checkbox";
import { Excel, ExcelResult } from "@prisma/client";
import { formatExcel, toExcel } from "@/lib/utils";
import { duplicated_result } from "@/actions";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Loader2 } from "lucide-react";

type Props = {
	equals: ExcelResult[];
	excel: Excel;

	setVerify: (verify: boolean) => void;
	setPos: (pos: number) => void;
	pos: number;

	row: ExcelResult;
};

const ExcelEquals = ({ equals, excel, setPos, pos, setVerify, row }: Props) => {
	const [selected, setSelected] = React.useState<number | null>(
		equals && equals.length > 0 ? equals[0].id : null
	);

	const [saving, setSaving] = React.useState(false);

	const handleDuplicated = async () => {
		try {
			setSaving(true);

			await duplicated_result(excel.id, pos, selected || undefined);

			toast.success("Fila duplicada correctamente");

			setPos(pos + 1);
			setSaving(false);
		} catch {
			setSaving(false);
			toast.error("Lo sentimos ha ocurrido un error al guardar el resultado");
		} finally {
		}
	};

	return (
		<>
			<Card className="flex flex-col w-full ">
				<CardHeader>
					<CardTitle>Posibles similitudes</CardTitle>
				</CardHeader>

				<CardContent>
					<Card>
						<CardContent className="p-3">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
								<div className="flex flex-col">
									<span className="text-xs text-muted-foreground">
										Nombre del cliente
									</span>
									<p className="text-sm font-semibold">{row.name}</p>
								</div>
								<div className="flex flex-col">
									<span className="text-xs text-muted-foreground">
										Telefono
									</span>
									<p className="text-sm font-semibold">{row.phone}</p>
								</div>
							</div>
						</CardContent>
					</Card>
				</CardContent>

				<Table>
					<TableHeader>
						<TableRow>
							<TableHead></TableHead>
							<TableHead>Número de pedido</TableHead>
							<TableHead>Nombre del cliente</TableHead>
							<TableHead>Telefono</TableHead>
							<TableHead>Dirección</TableHead>
							<TableHead>Número de local</TableHead>
							<TableHead>Colonia</TableHead>
							<TableHead>Ciudad</TableHead>
							<TableHead>Estado</TableHead>
							<TableHead>Código postal</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{equals
							.map((e) => ({
								id: e.id,
								data: formatExcel([toExcel(e, excel.type)], excel.type),
							}))
							.map((row, i) => (
								<TableRow key={i}>
									<TableCell>
										<Checkbox
											checked={selected === row.id}
											onCheckedChange={(checked) => {
												if (checked) {
													setSelected(row.id);
												} else {
													setSelected(null);
												}
											}}
										/>
									</TableCell>
									<TableCell>{row.data[0].num}</TableCell>
									<TableCell>{row.data[0].name}</TableCell>
									<TableCell>{row.data[0].phone}</TableCell>
									<TableCell>{row.data[0].address}</TableCell>
									<TableCell>{row.data[0].local}</TableCell>
									<TableCell>{row.data[0].colony}</TableCell>
									<TableCell>{row.data[0].city}</TableCell>
									<TableCell>{row.data[0].state}</TableCell>
									<TableCell>{row.data[0].code}</TableCell>
								</TableRow>
							))}
					</TableBody>
				</Table>
			</Card>

			<div className="flex flex-col md:flex-row items-center gap-5 justify-between">
				<div></div>

				<div className="flex flex-row gap-5 items-center justify-end">
					<Button onClick={handleDuplicated} disabled={saving || !selected}>
						{saving ? (
							<>
								<Loader2 className="animate-spin" /> duplicando...
							</>
						) : (
							"Duplicado"
						)}
					</Button>
					<Button
						onClick={() => {
							setVerify(false);
						}}
						variant={"secondary"}
						disabled={saving}
					>
						No duplicado
					</Button>
				</div>
			</div>
		</>
	);
};

export default ExcelEquals;
