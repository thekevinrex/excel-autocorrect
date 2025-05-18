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
	const [status, setStatus] = React.useState<"pending" | "loaded" | "analized">(
		"pending"
	);

	const [loading, setLoading] = React.useState<boolean>(false);

	const [rows, setRows] = React.useState<DataType[]>([]);

	const [text, setText] = React.useState<string>("");
	const [analisis, setAnalisis] = React.useState<{
		num: number;
		repeated: string[];
		reapeated_phones: Array<{
			num: string;
			with: string[];
		}>;
		not_found: string[];
	}>({
		num: 0,
		repeated: [],
		reapeated_phones: [],
		not_found: [],
	});

	const [file, setFile] = React.useState<{
		name: string;
		size: number;
	} | null>(null);

	const [files, setFiles] = React.useState<FileList | null>(null);
	const router = useRouter();
	const ref = React.useRef<HTMLInputElement>(null);

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

			let range;

			try {
				range = formatExcel(datosJson, type);

				setRows(range);
				setStatus("loaded");
				setLoading(false);

				// setText(range.map((r) => r.num).join("\n"));

				setFiles(null);
				setFile({
					name: file!.name,
					size: file!.size,
				});

				if (ref.current) {
					ref.current.value = "";
				}
			} catch (e: any) {
				if (e.message) {
					toast.error(e.message);
				}

				setLoading(false);

				setFiles(null);
				setFile(null);

				if (ref.current) {
					ref.current.value = "";
				}

				return;
			}
		};

		reader.onloadstart = () => {
			setText("");
			setRows([]);
			setAnalisis({
				num: 0,
				repeated: [],
				reapeated_phones: [],
				not_found: [],
			});
			setFile(null);
			setStatus("pending");
			setLoading(true);
		};

		if (file) {
			reader.readAsArrayBuffer(file);
		}
	};

	const handleFileLoadUpload = async () => {
		setLoading(true);

		if (!file) {
			toast.error("No se ha cargado ningun archivo");
			return;
		}

		const chunkSize = 250;

		try {
			const pedidos = text
				.split("\n")
				.map((r) => r.trim())
				.map((r) => {
					const match = r.match(/#\w\d+/); // Extract the first match of # followed by a letter and numbers
					return match ? match[0] : null;
				})
				.filter((r) => r !== null);

			const clean_pedidos = [
				...Array.from(
					new Set(
						pedidos.filter(
							(row) => pedidos.filter((ss) => ss === row).length === 1
						)
					)
				),
			].sort((a, b) => (!a.toLowerCase().startsWith("#d") ? -1 : 1));

			let selectedRows = clean_pedidos
				.map((p) => {
					return rows.find((row) => row.num === p);
				})
				.filter((p) => p !== undefined && p !== null);

			if (selectedRows.length === 0) {
				toast.error("No se encontraron filas para subir");
				return;
			}

			let id = undefined;

			for (let i = 0; i < selectedRows.length; i += chunkSize) {
				const excel = await uploadExcel_Pedido(
					{
						name: file!.name,
						size: file!.size,
					},
					{
						type,
						total: selectedRows.length,
						id,
					},

					selectedRows.slice(i, i + chunkSize)
				);

				if (excel) {
					id = excel;
				}
			}

			toast.success("Excel subido correctamente");

			if (id) {
				router.push(`/pre/${id}`);
			} else {
				router.refresh();
			}
		} catch (e) {
			toast.error("Lo sentimos ha occurrido un error");
		} finally {
			setLoading(false);

			setFiles(null);

			if (ref.current) {
				ref.current.value = "";
			}
		}
	};

	function handleAnalisis() {
		if (!file) {
			toast.error("No se ha cargado ningun archivo");
			return;
		}

		const pedidos = text
			.split("\n")
			.map((r) => r.trim())
			.map((r) => {
				const match = r.match(/#\w\d+/); // Extract the first match of # followed by a letter and numbers
				return match ? match[0] : null;
			})
			.filter((r) => r !== null);

		const repeated = [
			...Array.from(
				new Set(
					pedidos.filter((row) => pedidos.filter((ss) => ss === row).length > 1)
				)
			),
		];

		const clean_pedidos = [
			...Array.from(
				new Set(
					pedidos.filter(
						(row) => pedidos.filter((ss) => ss === row).length === 1
					)
				)
			),
		];

		const phone_repeated = [];
		for (const num of clean_pedidos) {
			const row = rows.find((r) => r.num === num)!;

			const rep = rows.filter((r) => r.phone === row.phone).map((r) => r.num);

			if (rep.length > 0) {
				phone_repeated.push({
					num: row.num,
					with: rep,
				});
			}
		}

		const not_found = clean_pedidos.filter(
			(p) => !rows.find((r) => r.num === p)
		);

		setAnalisis({
			num: pedidos.length,
			repeated: repeated,
			reapeated_phones: phone_repeated,
			not_found,
		});

		setStatus("analized");
	}

	return (
		<>
			{
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
							disabled={loading || !files || files?.length === 0}
							onClick={(e) => {
								e.preventDefault();
								handleFileLoad();
							}}
							variant={"default"}
						>
							{loading ? (
								<>
									<Loader2 className="animate-spin" /> Subiendo...
								</>
							) : (
								"Subir excel"
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
			}

			{
				<div className="w-full border border-dashed border-gray-300 p-4 rounded-lg mb-4 min-h-60 grid grid-cols-1 relative">
					{file && (
						<Card className="flex flex-col mb-4">
							<CardContent className="p-3">
								<p className="text-gray-500 text-sm">{file.name}</p>
							</CardContent>
						</Card>
					)}

					<Textarea
						placeholder="Pedidos a extraer"
						className="mb-5 min-h-64"
						value={text}
						onChange={(e) => {
							setText(e.target.value);
						}}
					/>

					<div className="flex-col flex gap-3">
						{status === "analized" && (
							<Card className="flex flex-col">
								<CardContent className="p-3">
									<p className="text-gray-500 text-sm">
										{analisis.num} filas seleccionadas
									</p>
								</CardContent>

								{analisis.not_found.length > 0 && (
									<CardContent className="p-3 mt-4">
										<p className="text-gray-500 text-sm">
											# de pedidos no encontrados:
										</p>

										<div className="flex flex-row flex-wrap gap-2 items-start mb-3">
											{analisis.not_found.map((s, i) => (
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

								{analisis.repeated.length > 0 && (
									<CardContent className="p-3 mt-4">
										<p className="text-gray-500 text-sm">
											# de pedidos repetidos:
										</p>

										<div className="flex flex-row flex-wrap gap-2 items-start mb-3">
											{analisis.repeated.map((s, i) => (
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

								{analisis.reapeated_phones.length > 0 && (
									<CardContent className="p-3 mb-4">
										<p className="text-gray-500 text-sm">
											# de pedidos (Teléfono) repetidos:
										</p>

										<div className="flex flex-row flex-wrap gap-2 items-start mb-3">
											{analisis.reapeated_phones.map((s, i) => {
												return s.with.map((ss, ii) => (
													<div
														className={cn(
															"px-2 py-1 rounded-md border border-border"
														)}
														key={i + "_" + ii}
													>
														{`${s.num} con ${ss}`}
													</div>
												));
											})}
										</div>
									</CardContent>
								)}
							</Card>
						)}

						<div className="flex flex-row gap-5">
							<Button
								disabled={loading || !file}
								className="w-full"
								onClick={(e) => {
									e.preventDefault();
									handleAnalisis();
								}}
								variant={"destructive"}
							>
								Analizar
							</Button>
							<Button
								disabled={loading || !file}
								className="w-full"
								onClick={(e) => {
									e.preventDefault();
									handleFileLoadUpload();
								}}
							>
								{loading ? (
									<>
										<Loader2 className="animate-spin" /> Subiendo...
									</>
								) : (
									"Comenzar"
								)}
							</Button>
						</div>
					</div>
				</div>
			}
		</>
	);
};

export default UploadExcel;
