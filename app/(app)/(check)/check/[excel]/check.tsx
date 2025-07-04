"use client";

import { Excel } from "@prisma/client";
import React from "react";
import ExcelTable from "@/components/check/excel-table";
import { toast } from "sonner";
import ExcelCheck, { ResultType } from "@/components/check/excel-check";
import ExportExcel from "./export-excel";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { proccess_row } from "@/actions";
import { useRouter } from "next/navigation";
import CancelNum from "./cancel-num";

type Props = {
	excel: Excel;

	tipos: Array<string>;
};

export type DataType = {
	num: string;
	name: string;
	phone: string;

	address: string;
	reference: string;

	local: string;

	row: any;
} & AddressType;

export type AddressType = {
	colony: string;
	city: string;
	state: string;
	code: string;
};

const Check = ({ excel, tipos }: Props) => {
	const [pos, setPos] = React.useState<number>(excel.last + 1);
	const [result, setResult] = React.useState<ResultType | null>(null);
	const [verify, setVerify] = React.useState(false);

	const router = useRouter();

	React.useEffect(() => {
		const fetch_result = async () => {
			try {
				setResult(null);

				if (pos >= excel.total) {
					return;
				}

				const result = await proccess_row(excel.id, pos);

				setResult(result);

				setVerify(result.equals && result.equals.length > 0 ? true : false);
			} catch (e) {
				toast.error(
					"Lo sentimos ha ocurrido un error al cargar los resultados"
				);

				router.push("/upload");
			}
		};

		fetch_result();
	}, [excel, pos]);

	if (pos >= excel.total) {
		return <ExportExcel excel={excel} />;
	}

	if (!result) {
		return "Cargando resultados...";
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

			<ExcelTable
				excel={excel}
				pos={pos}
				rowData={result.row}
				setPos={setPos}
			/>

			<ExcelCheck
				tipos={tipos}
				excel={excel}
				result={result}
				pos={pos}
				setPos={setPos}
			/>

			<CancelNum excelId={excel.id} />
		</>
	);
};

export default Check;
