import React from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

import * as XLSX from "xlsx";
import { Loader2 } from "lucide-react";
import { uploadExcel } from "@/actions";
import { toast } from "sonner";
import { ExcelType } from "@prisma/client";
import { useRouter } from "next/navigation";

const UploadExcel = ({
	from,
	to,
	type,
}: {
	from: number;
	to: number;
	type: ExcelType;
}) => {
	const [status, setStatus] = React.useState<"pending" | "loading">("pending");

	const [files, setFiles] = React.useState<FileList | null>(null);
	const router = useRouter();
	const ref = React.useRef<HTMLInputElement>(null);

	const handleFileUpload = async () => {
		const file = files?.[0];
		const reader = new FileReader();

		reader.onload = async (e) => {
			if (!e.target?.result) {
				return;
			}

			const data = new Uint8Array(e.target.result as ArrayBuffer);

			const workbook = XLSX.read(data, { type: "array" });

			const primeraHoja = workbook.Sheets[workbook.SheetNames[0]];

			const datosJson = XLSX.utils.sheet_to_json(primeraHoja, {
				header: "A",
				blankrows: true,
				defval: null, // This will ensure empty fields are included in the JSON
			});

			const range = datosJson.slice(from, to);

			try {
				const excel = await uploadExcel(
					{
						name: file!.name,
						size: file!.size,
					},
					{
						from,
						to,
						type,
					},

					JSON.stringify(range)
				);

				toast.success("Excel subido correctamente");

				router.push(`/pre/${excel.id}`);
			} catch (e) {
				toast.error("Lo sentimos ha occurrido un error");
			} finally {
				setStatus("pending");

				setFiles(null);

				if (ref.current) {
					ref.current.value = "";
				}
			}
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
			<div className="w-full border border-dashed border-gray-300 p-4 rounded-lg mb-4 h-60 flex flex-col items-center justify-center relative">
				<Input
					type="file"
					id="excel-upload"
					ref={ref}
					onChange={(e) => {
						setFiles(e.target.files);
					}}
					className="absolute w-full h-full opacity-0 z-10"
					accept=".xlsx, .xls, .csv"
				/>

				<Button
					disabled={status === "loading" || !files || files?.length === 0}
					className="absolute z-20"
					onClick={(e) => {
						e.preventDefault();
						handleFileUpload();
					}}
				>
					{status === "loading" ? (
						<>
							<Loader2 className="animate-spin" /> Subiendo...
						</>
					) : (
						"Subir excel"
					)}
				</Button>

				{!files || files?.length === 0 ? (
					<p className="text-gray-500 text-sm absolute left-4 bottom-4 z-10">
						Arrastra tu archivo aquí
					</p>
				) : (
					<p className="text-gray-500 text-sm absolute left-4 bottom-4 z-10">
						{files?.[0].name}
					</p>
				)}
			</div>
		</>
	);
};

export default UploadExcel;
