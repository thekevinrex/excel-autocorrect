"use client";

import { deleteExcel } from "@/actions";
import ExportButton from "@/components/export-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { formatSize } from "@/lib/utils";
import { Excel } from "@prisma/client";
import { Trash2 } from "lucide-react";
import Link from "next/link";
import React from "react";
import { toast } from "sonner";

type Props = {
	excels: Excel[];
};

const MAX_UPLOADS = process.env.NEXT_PUBLIC_MAX_UPLOADS_SIZE;

const PrevExcels = ({ excels }: Props) => {
	const handleDelete = async (id: number) => {
		try {
			await deleteExcel(id);

			toast.success("Excel eliminado correctamente");
		} catch (e) {
			toast.error("Error al eliminar el excel");
		}
	};

	return (
		<Card>
			<CardHeader>
				<div className="flex justify-between gap-5 items-center">
					<CardTitle>Excel procesando</CardTitle>

					<div className="text-sm text-muted-foreground">
						{`${formatSize(
							excels.reduce((acc, e) => acc + (e?.excel_size || 0), 0)
						)}`}
					</div>
				</div>
			</CardHeader>
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Excel</TableHead>
						<TableHead>Tamaño</TableHead>
						<TableHead>Tipo</TableHead>
						<TableHead>Desde</TableHead>
						<TableHead>Hasta</TableHead>
						<TableHead>Ultima</TableHead>
						<TableHead></TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{excels.length > 0 ? (
						excels.map((e) => (
							<TableRow key={e.id}>
								<TableCell>{e.excel_name ? e.excel_name : " - "}</TableCell>
								<TableCell>
									{e.excel_size ? formatSize(e.excel_size) : " - "}
								</TableCell>
								<TableCell>
									{e.type === "TIPE_1" ? "De tipo 1" : "De tipo 2"}
								</TableCell>
								<TableCell>{e.from}</TableCell>
								<TableCell>{e.to}</TableCell>
								<TableCell>{e.last + 1}</TableCell>
								<TableCell>
									<div className="flex items-center gap-3">
										<Button asChild>
											<Link href={`/check/${e.id}`}>Continuar</Link>
										</Button>
										<ExportButton
											excel={e}
											variant={{
												variant: "secondary",
											}}
										/>
										<Button
											onClick={() => handleDelete(e.id)}
											variant={"destructive"}
											size={"icon"}
										>
											<Trash2 />
										</Button>
									</div>
								</TableCell>
							</TableRow>
						))
					) : (
						<TableRow>
							<TableCell colSpan={7} className="text-center">
								No hay excels procesando
							</TableCell>
						</TableRow>
					)}
				</TableBody>
			</Table>
		</Card>
	);
};

export default PrevExcels;
