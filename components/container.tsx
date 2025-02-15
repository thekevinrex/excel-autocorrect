import React from "react";

type Props = {
	children: React.ReactNode;
};

const Container = ({ children }: Props) => {
	return (
		<div className="flex flex-col justify-start gap-5 w-full max-w-screen-xl mx-auto mt-20 mb-32">
			{children}
		</div>
	);
};

export default Container;
