"use client";

import { Card } from "@/components/ui/card";
import type { WindowStatus } from "@/features/monitoring/hooks/use-window-monitor";
import { API_URL } from "@/lib/api";
import { Play } from "@phosphor-icons/react";
import Image from "next/image";

interface MonitorDisplayShellProps {
	brandTitle: string;
	brandSubtitle: string;
	queueEmptyLabel: string;
	upcomingEmptyLabel: string;
	windows: WindowStatus[];
	upcoming: string[];
	currentTime: Date | null;
	videoUrl: string | null;
	videoFallbackLabel: string;
}

function formatTime(date: Date | null) {
	if (!date) return "";
	return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function formatDate(date: Date | null) {
	if (!date) return "";
	return date
		.toLocaleDateString([], {
			weekday: "long",
			year: "numeric",
			month: "short",
			day: "numeric",
		})
		.toUpperCase();
}

function getFullVideoUrl(url: string) {
	const backendUrl = API_URL.replace("/api", "");
	return `${backendUrl}${url}`;
}

function resolveDisplayTicket(window: WindowStatus | null | undefined) {
	if (!window) return "";
	return window.displayTicket ?? window.serviceTicket ?? window.triageTicket ?? "";
}

export default function MonitorDisplayShell({
	brandTitle,
	brandSubtitle,
	queueEmptyLabel: _queueEmptyLabel,
	upcomingEmptyLabel,
	windows,
	upcoming,
	currentTime,
	videoUrl,
	videoFallbackLabel,
}: MonitorDisplayShellProps) {
	void _queueEmptyLabel;

	const tableRows = [...windows]
		.filter((window) => Boolean(resolveDisplayTicket(window)))
		.sort((left, right) => {
			const leftTime = left.calledAt ? new Date(left.calledAt).getTime() : 0;
			const rightTime = right.calledAt ? new Date(right.calledAt).getTime() : 0;
			if (leftTime !== rightTime) return rightTime - leftTime;
			return left.stationNo - right.stationNo;
		})
		.slice(0, 8);

	const renderedRows = Array.from({ length: Math.max(8, tableRows.length) }, (_, index) => tableRows[index] ?? null);

	return (
		<div className="flex h-screen flex-col overflow-hidden bg-[#edf2f7] text-slate-900">
			<main className="grid min-h-0 flex-1 grid-cols-1 xl:grid-cols-[minmax(0,4fr)_minmax(0,6fr)]">
				<section className="flex min-h-0 flex-col overflow-hidden border-r-2 border-slate-400 bg-white">
					<div className="grid min-h-0 flex-1 grid-rows-[minmax(500px,5.2fr)_minmax(150px,1.1fr)]">
						<div className="min-h-0 border-b-2 border-slate-400">
							<div className="grid grid-cols-[minmax(0,1fr)_340px] border-b-2 border-slate-400">
								<div className="border-r-2 border-slate-300 px-8 py-5">
									<p className="text-xl font-black uppercase tracking-[0.35em] text-slate-700">Now Serving</p>
								</div>
								<div className="px-8 py-5 text-right">
									<p className="text-xl font-black uppercase tracking-[0.35em] text-slate-700">Window</p>
								</div>
							</div>

							<div className="max-h-full overflow-y-auto">
								{renderedRows.map((window, index) => (
									<div
										key={window ? `${window.stationNo}-${window.displayTicket}-${window.calledAt ?? ""}-${index}` : `empty-row-${index}`}
										className="grid grid-cols-[minmax(0,1fr)_340px] border-b-2 border-slate-300"
									>
										<div className="border-r-2 border-slate-300 px-8 py-6">
											<p className="truncate text-6xl font-black leading-none tracking-tight text-slate-900 tabular-nums">
												{resolveDisplayTicket(window)}
											</p>
										</div>
										<div className="px-8 py-6 text-right">
											<p className="truncate text-6xl font-black leading-none tracking-tight text-slate-700 tabular-nums">
												{window?.stationNo ?? ""}
											</p>
										</div>
									</div>
								))}
							</div>
						</div>

						<div className="px-8 py-5">
							<p className="text-lg font-black uppercase tracking-[0.35em] text-slate-600">Next Number</p>
							<div className="mt-4 flex flex-wrap gap-4">
								{upcoming.length > 0 ? (
									upcoming.slice(0, 6).map((ticket) => (
										<div key={ticket} className="rounded-lg border-2 border-slate-300 bg-slate-50 px-5 py-3 text-3xl font-black tabular-nums text-slate-900">
											{ticket}
										</div>
									))
								) : (
									<p className="text-lg font-semibold text-slate-400">{upcomingEmptyLabel}</p>
								)}
							</div>
						</div>
					</div>
				</section>

				<section className="grid min-h-0 grid-rows-[minmax(110px,0.75fr)_minmax(0,5fr)] overflow-hidden bg-slate-800">
					<div className="border-b-2 border-slate-300 bg-emerald-700 px-6 py-4 text-white">
						<div className="flex items-center justify-between gap-4">
							<div>
								<p className="mt-1 text-2xl font-black tracking-tight">{brandTitle}</p>
								<p className="text-sm font-semibold text-white/85">{brandSubtitle}</p>
							</div>
							<div className="text-right">
								<div className="flex justify-end gap-2">
									<Image src="/doh-logo.svg" alt="DOH" width={42} height={42} className="object-contain" />
									<Image src="/nmmc-logo.png" alt="NMMC" width={42} height={42} className="object-contain" />
								</div>
								<p className="mt-2 text-xs font-semibold uppercase tracking-[0.25em] text-white/80">
									{formatDate(currentTime)} {currentTime ? "|" : ""} {formatTime(currentTime)}
								</p>
							</div>
						</div>
					</div>

					<Card className="relative m-5 min-h-0 overflow-hidden border-0 bg-black shadow-2xl shadow-black/30">
						<div className="absolute inset-0 flex items-center justify-center bg-slate-900">
							{videoUrl ? (
								<video
									src={getFullVideoUrl(videoUrl)}
									className="h-full w-full object-cover"
									autoPlay
									muted
									loop
									playsInline
								/>
							) : (
								<div className="flex flex-col items-center gap-4 px-6 text-center">
									<div className="flex size-16 items-center justify-center rounded-full border border-slate-700 bg-slate-800">
										<Play size={24} className="ml-1 text-slate-500" weight="fill" />
									</div>
									<p className="text-xs font-semibold uppercase tracking-[0.45em] text-slate-500">{videoFallbackLabel}</p>
								</div>
							)}
						</div>
					</Card>
				</section>
			</main>

			<footer className="shrink-0 overflow-hidden border-t-2 border-slate-400 bg-white px-6 py-2 whitespace-nowrap">
				<div className="animate-marquee inline-block">
					<span className="mx-16 text-sm font-black uppercase tracking-[0.35em] text-slate-600">
						Welcome to Northern Mindanao Medical Center
					</span>
					<span className="mx-16 text-sm font-black uppercase tracking-[0.35em] text-emerald-700">
						Health is Wealth • Serbisyo Para sa Lahat
					</span>
					<span className="mx-16 text-sm font-black uppercase tracking-[0.35em] text-slate-600">
						Service Hours: 8:00 AM - 5:00 PM
					</span>
				</div>
			</footer>

			<style jsx>{`
				@keyframes marquee {
					0% {
						transform: translateX(100%);
					}
					100% {
						transform: translateX(-100%);
					}
				}

				.animate-marquee {
					animation: marquee 35s linear infinite;
				}
			`}</style>
		</div>
	);
}
