import db from "@/lib/db";
import { ExcelType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { createUploadthing, type FileRouter } from "uploadthing/next";
// import { UploadThingError } from "uploadthing/server";

import z from "zod";

const f = createUploadthing();

export const ourFileRouter = {
	// Define as many FileRoutes as you like, each with a unique routeSlug
	uploadExcel: f({
		"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
			maxFileCount: 1,
			maxFileSize: "32MB",
		},
		"text/csv": {
			maxFileCount: 1,
			maxFileSize: "32MB",
		},
	})
		// Set permissions and file types for this FileRoute
		.input(
			z.object({
				type: z.string(),
				from: z.number(),
				to: z.number(),
			})
		)
		.middleware(async ({ input }) => {
			return { from: input.from, to: input.to, type: input.type };
		})
		.onUploadComplete(async ({ metadata, file }) => {
			const excel = await db.excel.create({
				data: {
					excel_url: file.ufsUrl,
					excel_name: file.name,
					excel_size: file.size,
					excel_id: file.key,

					from: metadata.from,
					to: metadata.to,
					last: -1,

					type: metadata.type as ExcelType,
				},
			});

			revalidatePath("/upload");

			return { id: excel.id };
		}),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
