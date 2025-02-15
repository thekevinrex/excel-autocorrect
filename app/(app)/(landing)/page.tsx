import Container from "@/components/container";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
	return (
		<Container>
			<Button asChild>
				<Link href={"/upload"}>Corregir excel</Link>
			</Button>
		</Container>
	);
}
