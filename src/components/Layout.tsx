import type React from 'react';

interface LayoutProps {
	children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
	return (
		<div className="min-h-screen bg-[#f1f5f9] flex items-center justify-center p-0 sm:p-4">
			<div className="max-w-container w-full bg-white min-h-screen sm:min-h-[850px] relative shadow-2xl flex flex-col overflow-hidden">
				{children}
			</div>
		</div>
	);
};

export default Layout;
