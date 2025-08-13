'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function LoadingLink({ href, children }: { href: string; children: React.ReactNode }) {
	const [loading, setLoading] = useState(false);

	useEffect(() => {}, [loading]);

	return (
		<>
			<Link href={href} onClick={() => setLoading(true)} className="block">
				{children}
			</Link>
			{loading && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-white/70 backdrop-blur-sm">
					<div className="flex flex-col items-center">
						<div className="animate-spin-slow text-5xl">🦷</div>
						<p className="mt-3 text-slate-700">Please wait…</p>
					</div>
				</div>
			)}
			<style jsx global>{`
				.animate-spin-slow { animation: spin 1.4s linear infinite; }
				@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
			`}</style>
		</>
	);
}
