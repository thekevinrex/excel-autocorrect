import React from "react";

import { Card, CardHeader, CardTitle } from "../ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "../ui/table";
import { DataType } from "@/app/(app)/check/[excel]/check";

type Props = {
	pos: number;
	data: DataType[];
	setPos: (pos: number) => void;
};

const ExcelTable = ({ data, pos }: Props) => {
	const row = data[pos];

	return (
		<Card>
			<CardHeader>
				<div className="flex justify-between gap-5 items-center">
					<CardTitle>Fila actual </CardTitle>

					<div className="text-sm text-muted-foreground">{`${pos + 1} / ${
						data.length
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
					</TableRow>
				</TableBody>
			</Table>
		</Card>
	);
};

export default ExcelTable;
