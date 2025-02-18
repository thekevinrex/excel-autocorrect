import React from "react";
import Container from "@/components/container";
import Upload from "./upload";

import { getAllExcels, getLastDBUpdate } from "@/actions";
import PrevExcels from "./prev-excels";

const UploadPage = async () => {
	const prev_excels = await getAllExcels();
	const last_db_update = await getLastDBUpdate();

	return (
		<Container>
			<Upload last_update={last_db_update} />

			<PrevExcels excels={prev_excels} />
		</Container>
	);
};

export default UploadPage;
