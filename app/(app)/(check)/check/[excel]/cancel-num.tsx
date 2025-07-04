"use client";

import { cancel_pedidos } from "@/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import React from "react";
import { toast } from "sonner";

type Props = {
	excelId: number;
};

const CancelNum = ({ excelId }: Props) => {
	const [cancel, setCancel] = React.useState<string>("");

	const [loading, setLoading] = React.useState<boolean>(false);

	const handleCancel = async () => {
		if (loading) {
			return;
		}

		setLoading(true);

		try {
			await cancel_pedidos(excelId, cancel);

			toast.success("Pedidos cancelados exitosamente");

			setCancel("");
		} catch {
			toast.error("Lo sentimos ha ocurrido un error al buscar");
		} finally {
			setLoading(false);
		}
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>Cancelar pedidos</CardTitle>
			</CardHeader>
			<CardContent>
				<form action={handleCancel} className="flex flex-col items-start gap-2">
					<Input
						placeholder="Pedidos a cancelar (Separados por comas)"
						className="mb-5 "
						value={cancel}
						onChange={(e) => {
							setCancel(e.target.value);
						}}
					/>

					<Button type="submit" disabled={loading || !cancel}>
						Cancelar pedidos
					</Button>
				</form>
			</CardContent>
		</Card>
	);
};

export default CancelNum;
