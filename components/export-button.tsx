import React from "react";

import { export_excel } from "@/actions";
import { Button, buttonVariants } from "@/components/ui/button";
import * as ExcelJS from "exceljs";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Excel } from "@prisma/client";
import { VariantProps } from "class-variance-authority";

type Props = { excel: Excel; variant: VariantProps<typeof buttonVariants> };

const ExportButton = ({ excel, variant: { variant } }: Props) => {
	const handleExport = async () => {
		const data = await export_excel(excel.id);

		const workbook = new ExcelJS.Workbook();
		const worksheet = workbook.addWorksheet("Resultados");

		// Agregar los datos a la hoja
		data.forEach((item, rowIndex) => {
			const row = worksheet.addRow(
				Object.keys(item.row).map((k) => item.row[k] || " - ")
			); // Agregar fila con los valores

			if (item.color) {
				// Aplicar color a la segunda columna (índice 2)
				const cell = row.getCell(2); // La segunda columna es el índice 2
				cell.fill = {
					type: "pattern",
					pattern: "solid",
					fgColor: { argb: item.color.replace("#", "") }, // Convertir color a formato ARGB
				};

				if (item.status === "SKIP" || item.status === "OK") {
					const cell = row.getCell(3); // La segunda columna es el índice 2
					cell.fill = {
						type: "pattern",
						pattern: "solid",
						fgColor: { argb: item.color.replace("#", "") }, // Convertir color a formato ARGB
					};
				}
			}

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

		// Cerrar la ventana
		toast.success("Exportación exitosa");
	};

	return (
		<Button type="button" variant={variant} onClick={handleExport}>
			Exportar
		</Button>
	);
};

export default ExportButton;
