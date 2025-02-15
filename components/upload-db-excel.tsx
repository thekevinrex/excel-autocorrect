"use client";

import React from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

import * as XLSX from "xlsx";
import { Label } from "./ui/label";
import { Loader2 } from "lucide-react";
import { prepareStateData, updateStateData } from "@/actions";
import { toast } from "sonner";

const UploadDBExcel = ({ last_update }: { last_update?: Date }) => {
	const [status, setStatus] = React.useState<"pending" | "loading">("pending");
	const inputRef = React.useRef<HTMLInputElement>(null);

	const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		const reader = new FileReader();

		reader.onload = async (e) => {
			if (!e.target?.result) {
				return;
			}

			const data = new Uint8Array(e.target.result as ArrayBuffer);

			const workbook = XLSX.read(data, { type: "array" });

			const chunkSize = 500;

			await prepareStateData(workbook.SheetNames);

			Promise.all(
				workbook.SheetNames.map(async (state) => {
					const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[state], {
						blankrows: false,
					});

					for (let i = 0; i < jsonData.length; i += chunkSize) {
						await updateStateData(
							state,
							// eslint-disable-next-line @typescript-eslint/no-explicit-any
							jsonData.slice(i, i + chunkSize).map((j: any) => ({
								d_asenta: j?.d_asenta || "",
								d_tipo_asenta: j?.d_tipo_asenta || "",

								d_ciud: j?.d_ciudad || "",
								d_code: j.d_codigo || "",

								d_esta: j?.d_estado || state,
								d_muni: j?.D_mnpio || "",
							}))
						);
					}
				})
			)
				.then(() => {
					toast.success("BD actualizada correctamente");
				})
				.catch(() => {
					toast.error("Lo sentimos ha occurrido un error");
				})
				.finally(() => {
					setStatus("pending");

					if (inputRef.current) {
						inputRef.current.value = "";
					}
				});
		};

		reader.onloadstart = () => {
			setStatus("loading");
		};

		if (file) {
			reader.readAsArrayBuffer(file);
		}
	};

	return (
		<>
			<Input
				type="file"
				id="excel-loader"
				ref={inputRef}
				className="hidden"
				accept=".xlsx, .xls, .csv"
				onChange={handleFileUpload}
			/>

			<Button
				disabled={status === "loading"}
				onClick={() => inputRef.current?.click()}
			>
				{status === "loading" ? (
					<>
						<Loader2 className="animate-spin" /> Cargando...
					</>
				) : (
					"Actualizar DB"
				)}
			</Button>

			{last_update ? (
				<p className="text-xs text-muted-foreground">
					Última actualización: {last_update.toLocaleDateString()}
				</p>
			) : (
				<p className="text-xs text-muted-foreground">No hay actualizaciones</p>
			)}
		</>
	);
};

export default UploadDBExcel;
