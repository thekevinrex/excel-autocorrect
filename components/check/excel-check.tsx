import { AddressType } from "@/app/(app)/(check)/check/[excel]/check";
import { Excel, ExcelResult, ResultStatus } from "@prisma/client";
import React from "react";
import ExcelEquals from "./excel-equals";

import ExcelPosible from "./excel-posible";

type Props = {
	excel: Excel;
	result: ResultType;
	pos: number;
	setPos: (pos: number) => void;

	tipos: Array<string>;
};

export type ResultType = {
	row: ExcelResult;

	errors: Array<string>;

	status: ResultStatus;

	posible: Array<
		{
			id: number;
			muni: string;
			d_tipo_asent: string;
		} & AddressType
	>;

	equals: ExcelResult[];
};

const ExcelCheck = ({ result, pos, setPos, excel, tipos }: Props) => {
	const [verify, setVerify] = React.useState(
		result.equals && result.equals.length > 0 ? true : false
	);

	if (verify) {
		return (
			<ExcelEquals
				setPos={setPos}
				pos={pos}
				setVerify={setVerify}
				excel={excel}
				equals={result.equals}
				row={result.row}
			/>
		);
	}

	return (
		<>
			<ExcelPosible
				excel={excel}
				pos={pos}
				result={result}
				setPos={setPos}
				tipos={tipos}
			/>
		</>
	);
};

export default ExcelCheck;
