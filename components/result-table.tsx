import React from "react";

type Props = {
	show: Array<{
		id: number;
		colony: string;
		muni: string;
		state: string;
		code: string;
		city: string;
	}>;
	selected?: number | null;
	setSelected?: (selected: number | null) => void;

	page: number;
	setPage: (page: number) => void;
	perPage: number;
};

import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "./ui/button";
import Link from "next/link";
import { Copy, MapPin } from "lucide-react";
import {
	Pagination,
	PaginationContent,
	PaginationItem,
	PaginationNext,
	PaginationPrevious,
} from "./ui/pagination";
import { CardFooter } from "./ui/card";
import { copy } from "@/lib/utils";

const ResultTable = ({
	selected,
	setSelected,
	show,
	page,
	setPage,
	perPage,
}: Props) => {
	const pages = Math.ceil(show.length / perPage);

	const start = (page - 1) * perPage;
	const end = start + perPage;

	show = show.slice(start, end);

	return (
		<>
			<div className="">
				<Table>
					<TableHeader>
						<TableRow>
							{setSelected && <TableHead></TableHead>}
							<TableHead>Colonia</TableHead>
							<TableHead>Municipio</TableHead>
							<TableHead>Estado</TableHead>
							<TableHead>Código</TableHead>
							<TableHead>Ciudad</TableHead>
							<TableHead></TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{show.length > 0 ? (
							show.map((r, i) => (
								<TableRow
									key={i}
									onClick={() => {
										if (setSelected) {
											if (selected === r.id) {
												setSelected(null);
											} else {
												setSelected(r.id);
											}
										}
									}}
								>
									{setSelected && (
										<TableCell>
											<Checkbox checked={selected === r.id} />
										</TableCell>
									)}
									<TableCell>{r.colony}</TableCell>
									<TableCell>{r.muni}</TableCell>
									<TableCell>{r.state}</TableCell>
									<TableCell>{r.code}</TableCell>
									<TableCell>{r.city ? r.city : "-"}</TableCell>
									<TableCell>
										<Button variant={"outline"} size={"icon"} asChild>
											<Link
												href={`https://www.google.com/maps/search/?api=1&query=${r.colony} ${r.muni} ${r.state} ${r.code}`}
												target="_blank"
												rel="noopener noreferrer"
											>
												<MapPin />
											</Link>
										</Button>

										<Button
											onClick={(e) => {
												e.stopPropagation();
												copy(
													`${r.colony} ${r.muni} ${r.state} ${r.code} ${r.city}`,
													"Dirección copiada correctamente"
												);
											}}
											size={"icon"}
											variant={"outline"}
											className="mx-2"
										>
											<Copy />
										</Button>
									</TableCell>
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell colSpan={6} className="text-center">
									No se encontraron resultados
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>

			{pages > 1 && (
				<CardFooter className="p-5">
					<Pagination>
						<PaginationContent>
							{page > 1 && (
								<PaginationItem onClick={() => setPage(page - 1)}>
									<PaginationPrevious />
								</PaginationItem>
							)}

							<div className="flex-1 text-center text-sm">
								Página {page} de {pages}
							</div>

							{page < pages && (
								<PaginationItem onClick={() => setPage(page + 1)}>
									<PaginationNext />
								</PaginationItem>
							)}
						</PaginationContent>
					</Pagination>
				</CardFooter>
			)}
		</>
	);
};

export default ResultTable;
