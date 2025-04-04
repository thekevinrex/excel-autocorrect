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
	const router = useRouter();

	const handleExport = async () => {
		const data = await export_excel(excel.id);

		const workbook = new ExcelJS.Workbook();
		const worksheet = workbook.addWorksheet("Resultados");

		// Ordenar todos los resultados segun el numero de pedido
		data.sort((a, b) => {
			const getOrder = (value: string) => {
				if (value.includes("m") || value.includes("M")) return 1; // 'm' comes second
				if (value.includes("d") || value.includes("D")) return 2; // 'd' comes last
				return 0; // no 'm' or 'd' comes first
			};

			const orderA = getOrder(a.row["A"] as string);
			const orderB = getOrder(b.row["A"] as string);

			if (orderA !== orderB) {
				return orderA - orderB; // Sort by order first
			}

			// If order is the same, sort numerically
			const numA =
				parseInt((a.row["A"] as string).replace(/[^\d]/g, ""), 10) || 0;
			const numB =
				parseInt((b.row["A"] as string).replace(/[^\d]/g, ""), 10) || 0;

			return numA - numB;
		});

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

		router.push("/upload");
	};

	return (
		<Button type="button" variant={variant} onClick={handleExport}>
			Exportar
		</Button>
	);
};

export default ExportButton;
