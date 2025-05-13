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

	const [add, setAdd] = React.useState("");

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

			toast.success("Pedidos cargado correctamente");

			setLoad(true);
			setRows(range);
			setStatus("pending");

			setFiles(null);

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
									<Loader2 className="animate-spin" /> Cargando...
								</>
							) : (
								"Cargar pedidos"
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
				<div className="w-full border border-dashed border-gray-300 p-4 rounded-lg mb-4 min-h-60 grid grid-cols-2 relative">
					<div className="flex flex-row flex-wrap gap-2 items-start p-3">
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
					</div>

					<div className="flex-col flex gap-3">
						<Card>
							<CardContent className="p-3 flex flex-row gap-3 items-start flex-wrap">
								{selected.length === 0 && (
									<p className="text-gray-500 text-sm">
										Selecciona las filas que deseas cargar
									</p>
								)}

								{selected.map((row, i) => {
									return (
										<div
											key={i}
											className={`px-2 py-1 rounded-md border border-border cursor-pointer bg-blue-500 text-white`}
											onClick={() => {
												setSelected(selected.filter((r) => r !== row));
											}}
										>
											{row}
										</div>
									);
								})}
							</CardContent>

							<CardContent className="p-3">
								<form
									action={() => {
										if (add.length === 0) {
											return;
										}

										if (selected.includes(add)) {
											return;
										}

										setSelected([...selected, add]);
										setAdd("");
									}}
								>
									<Input
										placeholder="Añadir fila"
										value={add}
										onChange={(e) => {
											setAdd(e.target.value);
										}}
									/>
								</form>
							</CardContent>

							{selected.length > 0 && (
								<CardFooter>
									<p className="text-gray-500 text-sm">
										{selected.length} filas seleccionadas
									</p>
								</CardFooter>
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
								"Subir pedidos"
							)}
						</Button>
					</div>
				</div>
			)}
		</>
	);
};

export default UploadExcel;
