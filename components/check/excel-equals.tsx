import React from "react";

import { Card } from "../ui/card";
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
	equals: DataType[];
};

const ExcelEquals = ({ equals }: Props) => {
	return (
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
				{equals.map((row, i) => (
					<TableRow key={i}>
						<TableCell>{row.num}</TableCell>
						<TableCell>{row.name}</TableCell>
						<TableCell>{row.address}</TableCell>
						<TableCell>{row.local}</TableCell>
						<TableCell>{row.colony}</TableCell>
						<TableCell>{row.city}</TableCell>
						<TableCell>{row.state}</TableCell>
						<TableCell>{row.code}</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	);
};

export default ExcelEquals;
