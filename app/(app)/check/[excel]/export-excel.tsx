"use client";

import { export_excel } from "@/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Excel } from "@prisma/client";
import React from "react";

import * as ExcelJS from "exceljs";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type Props = {
	excel: Excel;
};

const ExportExcel = ({ excel }: Props) => {
	const router = useRouter();

	const handleExport = async () => {
		const data = await export_excel(excel.id);

		const workbook = new ExcelJS.Workbook();
		const worksheet = workbook.addWorksheet("Resultados");

		// Agregar los datos a la hoja
		data.forEach((item, rowIndex) => {
			const row = worksheet.addRow(Object.values(item.row)); // Agregar fila con los valores

			// Aplicar color a la segunda columna (índice 2)
			const cell = row.getCell(2); // La segunda columna es el índice 2
			cell.fill = {
				type: "pattern",
				pattern: "solid",
				fgColor: { argb: item.color.replace("#", "") }, // Convertir color a formato ARGB
			};

			row.eachCell((cell) => {
				cell.font = {
					name: "Arial",
					size: 10,
				};
			});
		});

		const buffer = await workbook.xlsx.writeBuffer();

		const blob = new Blob([buffer], {
			type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
		});

		const url = URL.createObjectURL(blob);

		const a = document.createElement("a");

		a.href = url;

		a.download = `${excel.excel_name}-verificado.xlsx`;

		a.click();

		URL.revokeObjectURL(url);

		// Cerrar la ventana
		toast.success("Exportación exitosa");

		router.push("/upload");
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>Exportar excel</CardTitle>
			</CardHeader>
			<CardContent>
				<Button onClick={handleExport}>Exportar</Button>
			</CardContent>
		</Card>
	);
};

export default ExportExcel;
