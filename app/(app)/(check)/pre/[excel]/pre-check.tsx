"use client";

import { pre_process_rows } from "@/actions";
import { Button } from "@/components/ui/button";
import { Excel } from "@prisma/client";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";

type Props = {
	excel: Excel;
};

const steps = {
	f01: "Pre Filtro 1 - Pre Verificación de nombres o abreviaturas",
	f1: "Filtro 1 - Todos los datos de las filas estan correctos",
	f2: "Filtro 2 - El código postal es correcto y la colonia es correcto",

	f3: "Filtro 3 - El código postal es correcto y la colonia es parcialmente correcto",

	f4: "Reorganización de filas - Se reorganizan las filas para que las correctas esten primero",
};

const PreCheck = ({ excel }: Props) => {
	const [loading, setLoading] = React.useState<keyof typeof steps | null>(null);

	const [currentStep, setCurrentStep] = React.useState<
		keyof typeof steps | "ended"
	>("f01");

	const [result, setResult] = React.useState<{
		[key in keyof typeof steps]: {
			status: "pending" | "success" | "error";
			result: number;
		};
	}>({
		f01: { status: "pending", result: 0 },
		f1: { status: "pending", result: 0 },
		f2: { status: "pending", result: 0 },
		f3: { status: "pending", result: 0 },
		f4: { status: "pending", result: 0 },
	});

	React.useEffect(() => {
		if (currentStep === "ended") {
			return;
		}

		const handleStep = async (step: keyof typeof steps) => {
			setLoading(step);

			const result = await pre_process_rows(excel.id, step);

			return result;
		};

		handleStep(currentStep).then((r) => {
			result[currentStep].status = r !== null ? "success" : "error";
			result[currentStep].result = r !== null ? r : 0;

			setResult({
				...result,
			});

			setLoading(null);

			if (currentStep === "f4") {
				setTimeout(() => setCurrentStep("ended"), 1000);
			} else {
				const nextStep = Object.keys(steps)[
					Object.keys(steps).indexOf(currentStep) + 1
				] as keyof typeof steps;

				setTimeout(() => setCurrentStep(nextStep), 1000);
			}
		});
	}, [currentStep]);

	const router = useRouter();

	const handleClick = () => {
		if (currentStep !== "ended") {
			return;
		}

		router.push(`/check/${excel.id}`);
	};

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

			<div className="flex flex-col gap-2">
				<h1 className="text-2xl font-bold">Pre Chequeo</h1>
				<p className="text-sm text-muted-foreground">
					Este es un pre chequeo de los datos, para automaticamente corregir las
					filas correctas
				</p>
			</div>

			<div className="flex flex-col gap-5">
				{Object.keys(steps).map((key, index) => (
					<div key={index} className="flex flex-row gap-5">
						<div className="size-16 flex flex-col items-center justify-center bg-background border rounded-full">
							{result[key as keyof typeof steps].status === "success" &&
								loading !== key && (
									<div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500">
										<span className="text-white">✓</span>
									</div>
								)}

							{result[key as keyof typeof steps].status === "error" &&
								loading !== key && (
									<div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500">
										<span className="text-white">✗</span>
									</div>
								)}

							{result[key as keyof typeof steps].status === "pending" &&
								loading !== key && (
									<div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-500">
										<span className="text-white">...</span>
									</div>
								)}

							{loading === key && <Loader2 className="animate-spin" />}
						</div>

						<div className="flex flex-col gap-1">
							<h1 className="text-xl font-bold">
								{steps[key as keyof typeof steps]}
							</h1>

							<p className="text-sm text-muted-foreground">
								Resultado:
								{result[key as keyof typeof steps].status === "pending"
									? " Esperando..."
									: result[key as keyof typeof steps].status === "success"
									? ` ${result[key as keyof typeof steps].result} filas `
									: " Error"}
							</p>
						</div>
					</div>
				))}
			</div>

			<div>
				<Button
					onClick={handleClick}
					disabled={currentStep !== "ended"}
					className="mt-5 w-fit"
				>
					<ArrowRight />
					Comenzar chequeo
				</Button>
			</div>
		</>
	);
};

export default PreCheck;
