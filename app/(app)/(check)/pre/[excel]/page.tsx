import { getAllTipoAsent, getExcel } from "@/actions";
import Container from "@/components/container";
import React from "react";
import { notFound, redirect } from "next/navigation";
import PreCheck from "./pre-check";

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

	if (e.last !== -1) {
		return redirect(`/check/${e.id}`);
	}

	return (
		<Container>
			<PreCheck excel={e} />
		</Container>
	);
};

export default CheckPage;
