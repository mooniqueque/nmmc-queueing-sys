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
	previousNumbers: WindowStatus[];
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
	brandSubtitle: _brandSubtitle,
	queueEmptyLabel: _queueEmptyLabel,
	upcomingEmptyLabel,
	windows,
	previousNumbers = [],
	upcoming = [],
	currentTime,
	videoUrl,
	videoFallbackLabel,
}: MonitorDisplayShellProps) {
	void _queueEmptyLabel;
	void _brandSubtitle;
	void windows;

	const renderedRows = previousNumbers.slice(0, 5);
	const fixedRows = Array.from({ length: 5 }, (_, index) => renderedRows[index] ?? null);

	return (
		<div className="flex h-screen flex-col overflow-hidden bg-[#edf2f7] text-slate-900">
			<main className="grid min-h-0 flex-1 grid-cols-1 xl:grid-cols-[minmax(0,4fr)_minmax(0,6fr)]">
				<section className="flex min-h-0 flex-col overflow-hidden border-r-2 border-slate-400 bg-white">
					<div className="grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)_auto]">
						<div className="flex min-h-0 flex-col border-b-2 border-slate-400">
							<div className="grid grid-cols-[minmax(0,1fr)_220px] border-b-2 border-slate-400 bg-white">
								<div className="border-r-2 border-slate-300 px-8 py-3">
									<p className="text-lg font-black uppercase tracking-[0.3em] text-slate-600">Now Serving</p>
								</div>
								<div className="px-6 py-3 text-center">
									<p className="text-lg font-black uppercase tracking-[0.3em] text-slate-600">Window</p>
								</div>
							</div>

							<div className="grid min-h-0 flex-1 grid-rows-5 overflow-hidden">
								{fixedRows.map((window, index) => (
									<div
										key={window ? `${window.stationNo}-${window.displayTicket}-${window.calledAt ?? ""}-${index}` : `waiting-row-${index}`}
										className="grid min-h-0 grid-cols-[minmax(0,1fr)_220px] border-b-2 border-slate-300"
									>
										<div className="flex min-h-0 items-center border-r-2 border-slate-300 px-8 py-2">
											<p className={`truncate font-black leading-none tracking-tight tabular-nums ${window ? "text-5xl text-emerald-700 2xl:text-6xl" : "text-4xl text-slate-400 2xl:text-5xl"}`}>
												{window ? resolveDisplayTicket(window) : "WAITING"}
											</p>
										</div>
										<div className="flex min-h-0 items-center justify-center px-6 py-2 text-center">
											<p className={`truncate font-black leading-none tracking-tight tabular-nums ${window ? "text-5xl text-red-700 2xl:text-6xl" : "text-4xl text-slate-400 2xl:text-5xl"}`}>
												{window?.stationNo ?? "WAITING"}
											</p>
										</div>
									</div>
								))}
							</div>
						</div>

						<div className="px-8 py-3">
							<p className="text-lg font-black uppercase tracking-[0.35em] text-slate-600">Next Number</p>
							<div className="mt-2 flex flex-wrap gap-3">
								{upcoming.length > 0 ? (
									upcoming.slice(0, 6).map((ticket) => (
										<div key={ticket} className="rounded-lg border-2 border-slate-300 bg-slate-50 px-4 py-2 text-2xl font-black tabular-nums text-slate-900">
											{ticket}
										</div>
									))
								) : (
									<p className="text-base font-semibold text-slate-400">{upcomingEmptyLabel}</p>
								)}
							</div>
						</div>
					</div>
				</section>

				<section className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)] overflow-hidden bg-slate-800">
					<div className="border-b-2 border-slate-300 bg-emerald-700 px-6 py-5 text-white">
						<div className="flex items-center justify-between gap-6">
							<div className="flex min-w-0 items-center gap-4">
								<div className="flex shrink-0 items-center gap-2">
									<Image src="/doh-logo.svg" alt="DOH" width={35} height={35} className="object-contain" />
									<Image src="/nmmc-logo.png" alt="NMMC" width={40} height={40} className="object-contain" />
								</div>
								<p className="truncate text-2xl font-bold tracking-tight">{brandTitle}</p>
							</div>
							<div className="shrink-0 text-right leading-none">
								<p className="text-2xl font-bold uppercase tracking-tight text-white">
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
