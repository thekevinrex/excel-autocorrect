import { getExcel } from "@/actions";
import Container from "@/components/container";
import React from "react";
import Check from "./check";
import { notFound } from "next/navigation";

type Props = {
	params: {
		excel: string;
	};
};

const CheckPage = async ({ params: { excel } }: Props) => {
	const e = await getExcel(excel);

	if (!e) {
		return notFound();
	}

	return (
		<Container>
			<Check excel={e} />
		</Container>
	);
};

export default CheckPage;
