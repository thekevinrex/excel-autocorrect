import React from "react";
import Container from "@/components/container";
import Upload from "./upload";

import { getAllExcels, getAllTipoAsent, getLastDBUpdate } from "@/actions";
import PrevExcels from "./prev-excels";
import AdvancedSearch from "./advanced-search";

const UploadPage = async () => {
	const prev_excels = await getAllExcels();
	const last_db_update = await getLastDBUpdate();

	const tipo_asent = await getAllTipoAsent();

	return (
		<Container>
			<Upload last_update={last_db_update} />

			<PrevExcels excels={prev_excels} />

			<AdvancedSearch tipos={tipo_asent} />
		</Container>
	);
};

export default UploadPage;
