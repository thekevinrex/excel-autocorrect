"use client";

import React from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UploadDBExcel from "@/components/upload-db-excel";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { ExcelType } from "@prisma/client";
import UploadExcel from "@/components/upload-excel";

const Upload = ({ last_update }: { last_update?: Date }) => {
	const [mounted, setMounted] = React.useState(false);
	const [type, setType] = React.useState<ExcelType>("TIPE_1");

	const [limits, setLimits] = React.useState<{
		from: number;
		to: number;
	}>({
		from: 0,
		to: 5,
	});

	React.useEffect(() => {
		setMounted(true);

		return () => {
			setMounted(false);
		};
	}, []);

	if (!mounted) {
		return "Cargando...";
	}

	return (
		<Tabs
			defaultValue="tipo_1"
			onValueChange={(value) =>
				setType(value === "tipo_1" ? "TIPE_1" : "TIPE_2")
			}
		>
			<Card>
				<CardHeader>
					<div className="flex flex-row justify-between items-center gap-5">
						<div className="flex flex-col gap-2 justify-start items-start">
							<CardTitle>Tipo de excel a procesar</CardTitle>
							<TabsList>
								<TabsTrigger value="tipo_1">Tipo 1</TabsTrigger>
								<TabsTrigger value="tipo_2">Tipo 2</TabsTrigger>
							</TabsList>
						</div>

						<div className="flex flex-col gap-1 justify-end items-end">
							<UploadDBExcel last_update={last_update} />
						</div>
					</div>
				</CardHeader>

				<CardContent>
					<CardTitle>Procesar rango de filas</CardTitle>
					<div className="flex flex-row flex-wrap items-center gap-3 mt-2">
						<div>
							<Label>
								Desde
								<Input
									placeholder="Desde"
									type="number"
									min={0}
									value={limits.from}
									onChange={(e) =>
										setLimits({
											...limits,
											from: parseInt(e.target.value),
										})
									}
								/>
							</Label>
						</div>
						<div>
							<Label>
								Hasta
								<Input
									placeholder="Hasta"
									type="number"
									min={0}
									value={limits.to}
									onChange={(e) =>
										setLimits({
											...limits,
											to: parseInt(e.target.value),
										})
									}
								/>
							</Label>
						</div>
					</div>
				</CardContent>

				<CardContent className="">
					<UploadExcel from={limits.from} type={type} to={limits.to} />
				</CardContent>
			</Card>
		</Tabs>
	);
};

export default Upload;
