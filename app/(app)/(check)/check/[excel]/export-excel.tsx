"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Excel } from "@prisma/client";
import React from "react";

import { Button } from "@/components/ui/button";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ExportButton from "@/components/export-button";

type Props = {
	excel: Excel;
};

const ExportExcel = ({ excel }: Props) => {
	return (
		<>
			<div className="">
				<Button variant={"outline"} asChild>
					<Link href={"/upload"}>
						<ArrowLeft />
						Inicio
					</Link>
				</Button>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Exportar excel</CardTitle>
				</CardHeader>
				<CardContent>
					<ExportButton
						excel={excel}
						variant={{
							variant: "default",
						}}
					/>
				</CardContent>
			</Card>
		</>
	);
};

export default ExportExcel;
