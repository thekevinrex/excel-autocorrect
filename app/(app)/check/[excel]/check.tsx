"use client";

import * as XLSX from "xlsx";

import { Excel } from "@prisma/client";
import React from "react";
import ExcelTable from "@/components/check/excel-table";
import { formatExcel } from "@/lib/utils";
import { toast } from "sonner";
import ExcelCheck from "@/components/check/excel-check";
import ExportExcel from "./export-excel";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type Props = {
	excel: Excel;

	tipos: Array<string>;
};

export type DataType = {
	num: number;
	name: string;
	phone: string;
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

const Check = ({ excel, tipos }: Props) => {
	const [data, setData] = React.useState<DataType[] | null>(null);
	const [pos, setPos] = React.useState<number>(excel.last + 1);

	React.useEffect(() => {
		const get_excel_data = async () => {
			try {
				const response = await fetch(excel.excel_url);
				const arrayBuffer = await response.arrayBuffer();
				const workbook = XLSX.read(arrayBuffer, {
					type: "array",
				});

				const primeraHoja = workbook.Sheets[workbook.SheetNames[0]];

				const datosJson = XLSX.utils.sheet_to_json(primeraHoja, {
					header: "A",
					blankrows: true,
					defval: null, // This will ensure empty fields are included in the JSON
				});

				const range = datosJson.slice(excel.from, excel.to);

				setData(formatExcel(range, excel.type));
			} catch (error) {
				toast.error("Lo sentimos ha ocurrido un error al cargar el excel");
			}
		};

		get_excel_data();
	}, [excel]);

	if (!data) {
		return "Cargando...";
	}

	if (pos >= data.length) {
		return <ExportExcel excel={excel} />;
	}

	return (
		<>
			<div className="">
				<Button variant={"outline"} asChild>
					<Link href={"/upload"}>
						<ArrowLeft />
						Inicio
					</Link>
				</Button>
			</div>
			<ExcelTable data={data} pos={pos} setPos={setPos} />

			<ExcelCheck
				tipos={tipos}
				excel={excel}
				data={data}
				pos={pos}
				setPos={setPos}
			/>
		</>
	);
};

export default Check;
