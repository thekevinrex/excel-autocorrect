import { Button } from "@/components/ui/button";
import { FileSpreadsheet } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function LandingPage() {
	return (
		<div className="flex min-h-screen flex-col">
			<header className="sticky top-0 z-40 border-b bg-background">
				<div className="container mx-auto flex h-16 items-center justify-between py-4">
					<div className="flex items-center gap-2">
						<FileSpreadsheet className="h-6 w-6 text-primary" />
						<span className="text-xl font-bold">Excel Autocorrector</span>
					</div>
					<div className="flex items-center">
						<Button size="sm" asChild>
							<Link href={"/upload"}>Empezar</Link>
						</Button>
					</div>
				</div>
			</header>
			<main className="flex-1">
				<section className="w-full py-12 md:py-16 lg:py-24 xl:py-32">
					<div className="container mx-auto px-4 md:px-6">
						<div className="flex flex-col gap-6 lg:gap-12">
							<div className="flex flex-col justify-center items-center gap-5">
								<div className="space-y-2">
									<h1 className="text-3xl text-center font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
										Excel Autocorrector
									</h1>
									<p className="max-w-[600px] text-center  text-muted-foreground md:text-xl">
										Analiza y corrige automáticamente errores en tus archivos
										excel de pedidos, fila por fila, con sugerencias para
										optimizar tu proceso.
									</p>
								</div>
								<div>
									<Button size="lg" className="gap-1" asChild>
										<Link href={"/upload"}>Corregir Excel</Link>
									</Button>
								</div>
							</div>
							<div className="flex items-center justify-center">
								<div className=" relative h-[450px] w-full md:h-[500px] lg:h-[600px]">
									<Image
										src="/preview.png?height=500&width=500"
										alt="Interfaz de Excel Autocorrector mostrando corrección de errores"
										fill
										className="object-contain"
										priority
									/>
								</div>
							</div>
						</div>
					</div>
				</section>
				<section
					id="how-it-works"
					className="w-full py-12 md:py-24 lg:py-32 bg-muted/40"
				>
					<div className="container mx-auto px-4 md:px-6">
						<div className="flex flex-col items-center justify-center space-y-4 text-center">
							<div className="space-y-2">
								<div className="inline-block rounded-lg bg-primary px-3 py-1 text-sm text-primary-foreground">
									Cómo Funciona
								</div>
								<h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">
									Proceso simple en tres pasos
								</h2>
								<p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed">
									Corrige tus archivos archivos de forma rápida y sencilla con
									sugerencias para optimizar tu proceso.
								</p>
							</div>
						</div>
						<div className="mx-auto grid max-w-5xl gap-6 py-12 md:grid-cols-3">
							<div className="flex flex-col items-center space-y-2 text-center">
								<div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
									1
								</div>
								<h3 className="text-xl font-bold">Sube el excel</h3>
								<p className="text-sm text-muted-foreground">
									Arrastra y suelta tu archivo Excel o CSV.
								</p>
							</div>
							<div className="flex flex-col items-center space-y-2 text-center">
								<div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
									2
								</div>
								<h3 className="text-xl font-bold">Análisis automático</h3>
								<p className="text-sm text-muted-foreground">
									Nuestro sistema analiza cada fila y detecta posibles errores o
									inconsistencias en tus datos.
								</p>
							</div>
							<div className="flex flex-col items-center space-y-2 text-center">
								<div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
									3
								</div>
								<h3 className="text-xl font-bold">Correcciones sugeridas</h3>
								<p className="text-sm text-muted-foreground">
									Recibe sugerencias para corregir los errores y optimizar tu
									proceso.
								</p>
							</div>
						</div>
					</div>
				</section>
			</main>
			<footer className="w-full border-t bg-background">
				<div className="container m-auto flex flex-col items-center justify-between gap-4 py-10 md:h-24 md:flex-row md:py-0">
					<div className="flex items-center gap-2">
						<FileSpreadsheet className="h-5 w-5 text-primary" />
						<span className="text-lg font-bold">Excel Autocorrector</span>
					</div>
					<p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
						© {new Date().getFullYear()} Excel Autocorrector. Todos los derechos
						reservados.
					</p>
				</div>
			</footer>
		</div>
	);
}
