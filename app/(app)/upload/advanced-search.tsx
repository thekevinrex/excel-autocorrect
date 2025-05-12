"use client";

import React from "react";
import { AddressType } from "../(check)/check/[excel]/check";
import { search_results } from "@/actions";
import { toast } from "sonner";
import { Card, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Loader2, Trash2 } from "lucide-react";
import ResultTable from "@/components/result-table";

type Props = {
	tipos: Array<string>;
};

const AdvancedSearch = ({ tipos }: Props) => {
	const [page, setPage] = React.useState(1);
	const [perPage, setPerPage] = React.useState(25);

	const [show, setShow] = React.useState<
		Array<
			{
				id: number;
				muni: string;
				d_tipo_asent: string;
			} & AddressType
		>
	>([]);

	const [search, setSearch] = React.useState(false);
	const [filters, setFilters] = React.useState<{
		search: string;
		colony: string;
		asenta: string;
		code: string;
		advanced: boolean;
		muni: string;
		state: string;
	}>({
		code: "",
		colony: "",
		asenta: "",
		search: "",
		state: "",
		muni: "",
		advanced: true,
	});

	const handleAdvancedSearch = async () => {
		setPage(1);

		if (
			!filters.colony &&
			!filters.asenta &&
			!filters.code &&
			!filters.state &&
			!filters.muni
		) {
			return;
		}

		if (search) {
			return;
		}

		try {
			setSearch(true);

			const result = await search_results(
				filters.colony,
				filters.asenta,
				filters.code,
				filters.state,
				filters.muni
			);

			setShow(result);
			setSearch(false);
		} catch {
			setSearch(false);
			toast.error("Lo sentimos ha ocurrido un error al buscar");
		}
	};

	return (
		<Card className="flex flex-col w-full ">
			<CardHeader className="flex flex-col gap-5">
				<div className="flex items-center gap-5">
					<Input
						value={filters.search}
						placeholder="Buscar entre los resultados..."
						onChange={(e) =>
							setFilters({
								...filters,
								search: e.target.value,
							})
						}
					/>
				</div>

				{filters.advanced && (
					<form
						action={handleAdvancedSearch}
						className="w-full flex flex-col md:flex-row items-end gap-5"
					>
						<Label className="w-full">
							Buscar colonia
							<Input
								value={filters.colony}
								placeholder="Buscar colonia..."
								onChange={(e) =>
									setFilters({
										...filters,
										colony: e.target.value,
									})
								}
							/>
						</Label>
						<Label className="w-full">
							Tipo de asentamiento
							<Select
								value={filters.asenta}
								onValueChange={(v) => setFilters({ ...filters, asenta: v })}
							>
								<SelectTrigger>
									<SelectValue placeholder="Tipo de asentamiento" />
								</SelectTrigger>
								<SelectContent>
									{tipos.map((t, i) => (
										<SelectItem key={i} value={t}>
											{t}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</Label>

						<Label className="w-full">
							Buscar estado
							<Input
								value={filters.state}
								placeholder="Buscar estado..."
								onChange={(e) =>
									setFilters({
										...filters,
										state: e.target.value,
									})
								}
							/>
						</Label>

						<Label className="w-full">
							Buscar Municipio
							<Input
								value={filters.muni}
								placeholder="Buscar municipio..."
								onChange={(e) =>
									setFilters({
										...filters,
										muni: e.target.value,
									})
								}
							/>
						</Label>

						<Label className="w-full">
							Buscar código
							<Input
								value={filters.code}
								placeholder="Buscar código..."
								onChange={(e) =>
									setFilters({
										...filters,
										code: e.target.value,
									})
								}
							/>
						</Label>

						<Button
							size={"icon"}
							onClick={() => {
								setFilters({
									...filters,
									search: "",
									state: "",
									code: "",
									colony: "",
									asenta: "",
									muni: "",
								});
								setShow([]);
							}}
							className="shrink-0"
							variant={"outline"}
							type="button"
						>
							<Trash2 />
						</Button>

						<Button>
							{search ? (
								<>
									<Loader2 className="animate-spin" /> Buscando...
								</>
							) : (
								"Buscar"
							)}
						</Button>
					</form>
				)}
			</CardHeader>

			<ResultTable
				page={page}
				setPage={setPage}
				perPage={perPage}
				show={show.filter((r) => {
					if (filters.search === "") {
						return true;
					}

					return (
						r.colony.toLowerCase().includes(filters.search.toLowerCase()) ||
						r.city.toLowerCase().includes(filters.search.toLowerCase()) ||
						r.state.toLowerCase().includes(filters.search.toLowerCase()) ||
						r.muni.toLowerCase().includes(filters.search.toLowerCase()) ||
						r.code
							.toString()
							.toLowerCase()
							.includes(filters.search.toLowerCase())
					);
				})}
			/>
		</Card>
	);
};

export default AdvancedSearch;
