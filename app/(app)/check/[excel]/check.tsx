"use client";

import * as XLSX from "xlsx";

import { Excel } from "@prisma/client";
import React from "react";
import ExcelTable from "@/components/check/excel-table";
import { formatExcel } from "@/lib/utils";
import { toast } from "sonner";
import ExcelCheck from "@/components/check/excel-check";
import ExportExcel from "./export-excel";

type Props = {
	excel: Excel;
};

export type DataType = {
	num: number;
	name: string;
	address: string;
	local: number;

	row: any;
} & AddressType;

export type AddressType = {
	colony: string;
	city: string;
	state: string;
	code: number;
};

const Check = ({ excel }: Props) => {
	const [data, setData] = React.useState<DataType[] | null>(null);
	const [pos, setPos] = React.useState<number>(excel.last + 1);

	React.useMemo(async () => {
		try {
			const response = await fetch(excel.excel_url);
			const arrayBuffer = await response.arrayBuffer();

			const workbook = XLSX.read(arrayBuffer, { type: "array" });

			const primeraHoja = workbook.Sheets[workbook.SheetNames[0]];

			const datosJson = XLSX.utils.sheet_to_json(primeraHoja, {
				header: "A",
			});

			const range = datosJson.slice(excel.from, excel.to);

			setData(formatExcel(range, excel.type));
		} catch (error) {
			toast.error("Lo sentimos ha ocurrido un error al cargar el excel");
		}
	}, [excel]);

	if (!data) {
		return "Cargando...";
	}

	if (pos >= data.length) {
		return <ExportExcel excel={excel} />;
	}

	return (
		<>
			<ExcelTable data={data} pos={pos} setPos={setPos} />

			<ExcelCheck excel={excel} data={data} pos={pos} setPos={setPos} />
		</>
	);
};

export default Check;
