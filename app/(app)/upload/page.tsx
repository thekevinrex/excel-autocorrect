import React from "react";
import Container from "@/components/container";
import Upload from "./upload";
import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin";
import { extractRouterConfig } from "uploadthing/server";
import { ourFileRouter } from "@/app/api/uploadthing/core";
import { getAllExcels, getLastDBUpdate } from "@/actions";
import PrevExcels from "./prev-excels";

const UploadPage = async () => {
	const prev_excels = await getAllExcels();
	const last_db_update = await getLastDBUpdate();

	return (
		<Container>
			<Upload last_update={last_db_update} />

			<PrevExcels excels={prev_excels} />

			<NextSSRPlugin routerConfig={extractRouterConfig(ourFileRouter)} />
		</Container>
	);
};

export default UploadPage;
