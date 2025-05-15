import React from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

import * as XLSX from "xlsx";
import { Loader2 } from "lucide-react";
import { uploadExcel, uploadExcel_Pedido } from "@/actions";
import { toast } from "sonner";
import { ExcelType } from "@prisma/client";
import { useRouter } from "next/navigation";
import { cn, formatExcel } from "@/lib/utils";
import { DataType } from "@/app/(app)/(check)/check/[excel]/check";
import { Card, CardContent, CardFooter } from "./ui/card";
import { Textarea } from "./ui/textarea";

const UploadExcel = ({
	from,
	to,
	type,
}: {
	from?: number;
	to?: number;
	type: ExcelType;
}) => {
	const [status, setStatus] = React.useState<"pending" | "loading">("pending");
	const [load, setLoad] = React.useState(false);

	const [rows, setRows] = React.useState<DataType[]>([]);
	const [selected, setSelected] = React.useState<String[]>([]);
	const [file, setFile] = React.useState<{
		name: string;
		size: number;
	}>({
		name: "",
		size: 0,
	});

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

			let start = from || 0;
			let end = to || datosJson.length;

			if (end > datosJson.length) {
				end = datosJson.length;
			}

			if (start < 0) {
				start = 0;
			}

			const range = datosJson.slice(start, end);

			try {
				const excel = await uploadExcel(
					{
						name: file!.name,
						size: file!.size,
					},
					{
						from: start,
						to: end,
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

	const handleFileLoad = async () => {
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

			const range = formatExcel(datosJson, type);

			setLoad(true);
			setRows(range);
			// setSelected(range.map((r) => r.num));
			setStatus("pending");

			setFiles(null);
			setFile({
				name: file!.name,
				size: file!.size,
			});

			if (ref.current) {
				ref.current.value = "";
			}
		};

		reader.onloadstart = () => {
			setStatus("loading");
		};

		if (file) {
			reader.readAsArrayBuffer(file);
		}
	};

	const handleFileLoadUpload = async () => {
		setStatus("loading");
		try {
			const excel = await uploadExcel_Pedido(
				{
					name: file!.name,
					size: file!.size,
				},
				{
					type,
				},

				rows.filter((row) => selected.includes(row.num))
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

	return (
		<>
			{!load && (
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

					<div className="flex flex-row gap-2 z-20">
						<Button
							disabled={status === "loading" || !files || files?.length === 0}
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

						<Button
							disabled={status === "loading" || !files || files?.length === 0}
							onClick={(e) => {
								e.preventDefault();
								handleFileLoad();
							}}
							variant={"secondary"}
						>
							{status === "loading" ? (
								<>
									<Loader2 className="animate-spin" /> Extrayendo...
								</>
							) : (
								"Extraer"
							)}
						</Button>
					</div>

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
			)}

			{load && (
				<div className="w-full border border-dashed border-gray-300 p-4 rounded-lg mb-4 min-h-60 grid grid-cols-1 relative">
					{/* <div className="flex flex-row flex-wrap gap-2 items-start mb-3">
						{rows.map((row, i) => {
							return (
								<div
									className={cn("px-2 py-1 rounded-md border border-border", {
										"bg-blue-500 text-white": selected.includes(row.num),
										"bg-white text-black": !selected.includes(row.num),
									})}
									key={i}
									onClick={() => {
										if (selected.includes(row.num)) {
											setSelected(selected.filter((r) => r !== row.num));
										} else {
											setSelected([...selected, row.num]);
										}
									}}
								>
									{row.num}
								</div>
							);
						})}
					</div> */}

					<Textarea
						placeholder="Pedidos a extraer"
						className="mb-5 min-h-64"
						onBlur={(e) => {
							setSelected(
								e.target.value
									.split("\n")
									.map((r) => r.trim())
									.map((r) => {
										const match = r.match(/#\w\d+/); // Extract the first match of # followed by a letter and numbers
										return match ? match[0] : null;
									})
									.filter((r) => r !== null) // Filter out null values
							);
						}}
					/>

					<div className="flex-col flex gap-3">
						<Card className="flex flex-col">
							<CardContent className="p-3">
								<p className="text-gray-500 text-sm">
									{selected.length} filas seleccionadas
								</p>
							</CardContent>

							{selected.filter(
								(s) => selected.filter((ss) => ss === s).length > 1
							).length > 0 && (
								<CardContent className="p-3">
									<p className="text-gray-500 text-sm">Repetidos</p>

									<div className="flex flex-row flex-wrap gap-2 items-start mb-3">
										{[
											...Array.from(
												new Set(
													selected.filter(
														(s) => selected.filter((ss) => ss === s).length > 1
													)
												)
											),
										].map((s, i) => (
											<div
												className={cn(
													"px-2 py-1 rounded-md border border-border"
												)}
												key={i}
											>
												{s}
											</div>
										))}
									</div>
								</CardContent>
							)}
						</Card>

						<Button
							disabled={status === "loading" || selected.length === 0}
							className="w-full"
							onClick={(e) => {
								e.preventDefault();
								handleFileLoadUpload();
							}}
						>
							{status === "loading" ? (
								<>
									<Loader2 className="animate-spin" /> Subiendo...
								</>
							) : (
								"Comenzar"
							)}
						</Button>
					</div>
				</div>
			)}
		</>
	);
};

export default UploadExcel;
