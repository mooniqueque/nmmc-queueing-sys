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

export default function MonitorDisplayShell({
	brandTitle,
	brandSubtitle,
	queueEmptyLabel,
	upcomingEmptyLabel,
	windows,
	upcoming,
	currentTime,
	videoUrl,
	videoFallbackLabel,
}: MonitorDisplayShellProps) {
	const activeWindows = [...windows]
		.filter((window) => Boolean(window.displayTicket))
		.sort((left, right) => {
			const leftTime = left.calledAt ? new Date(left.calledAt).getTime() : 0;
			const rightTime = right.calledAt ? new Date(right.calledAt).getTime() : 0;
			return rightTime - leftTime;
		});

	const currentWindow = activeWindows[0] ?? null;
	const tableRows = activeWindows.slice(0, 8);

	return (
		<div className="flex h-screen flex-col overflow-hidden bg-[#edf2f7] text-slate-900">
			<main className="grid min-h-0 flex-1 grid-cols-1 xl:grid-cols-[minmax(0,4fr)_minmax(0,6fr)]">
				<section className="flex min-h-0 flex-col overflow-hidden border-r-2 border-slate-400 bg-white">
					<div className="grid min-h-0 flex-1 grid-rows-[minmax(300px,3.8fr)_minmax(130px,1fr)]">
						<div className="min-h-0 border-b-2 border-slate-400">
							<div className="grid grid-cols-[minmax(0,1fr)_220px] border-b-2 border-slate-400">
								<div className="border-r-2 border-slate-300 px-6 py-4">
									<p className="text-sm font-black uppercase tracking-[0.35em] text-slate-700">Now Serving</p>
									<p className="mt-3 truncate text-6xl font-black leading-none tracking-tight text-slate-900 tabular-nums">
										{currentWindow?.displayTicket ?? "--"}
									</p>
								</div>
								<div className="px-6 py-4 text-right">
									<p className="text-sm font-black uppercase tracking-[0.35em] text-slate-700">Window</p>
									<p className="mt-3 text-5xl font-black leading-none tracking-tight text-emerald-700 tabular-nums">
										{currentWindow?.stationNo ?? "--"}
									</p>
								</div>
							</div>

							<div className="max-h-full overflow-y-auto">
								{tableRows.length === 0 ? (
									<div className="px-6 py-8 text-sm font-semibold text-slate-400">{queueEmptyLabel}</div>
								) : (
									tableRows.map((window, index) => (
										<div
											key={`${window.stationNo}-${window.windowName}-${window.displayTicket}-${index}`}
											className="grid grid-cols-[minmax(0,1fr)_220px] border-b-2 border-slate-300"
										>
											<div className="border-r-2 border-slate-300 px-6 py-3">
												<p className="truncate text-3xl font-black leading-none tracking-tight text-slate-900 tabular-nums">
													{window.displayTicket ?? "--"}
												</p>
											</div>
											<div className="px-6 py-3 text-right">
												<p className="truncate text-xl font-black leading-none tracking-tight text-slate-700">
													{window.windowName || `Window ${window.stationNo}`}
												</p>
											</div>
										</div>
									))
								)}
							</div>
						</div>

						<div className="px-6 py-4">
							<p className="text-sm font-black uppercase tracking-[0.35em] text-slate-600">Next Number</p>
							<div className="mt-4 flex flex-wrap gap-3">
								{upcoming.length > 0 ? (
									upcoming.slice(0, 6).map((ticket) => (
										<div key={ticket} className="rounded-lg border-2 border-slate-300 bg-slate-50 px-4 py-2 text-2xl font-black tabular-nums text-slate-900">
											{ticket}
										</div>
									))
								) : (
									<p className="text-sm font-semibold text-slate-400">{upcomingEmptyLabel}</p>
								)}
							</div>
						</div>
					</div>
				</section>

				<section className="grid min-h-0 grid-rows-[minmax(110px,0.75fr)_minmax(0,5fr)] overflow-hidden bg-[#c84058]">
					<div className="border-b-2 border-slate-300 bg-[#b9364d] px-6 py-4 text-white">
						<div className="flex items-center justify-between gap-4">
							<div>
								<p className="text-xs font-black uppercase tracking-[0.35em] text-white/80">Header</p>
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

			<footer className="shrink-0 border-t-2 border-slate-400 bg-white px-6 py-2 text-center text-sm font-black uppercase tracking-[0.35em] text-slate-600">
				Footer
			</footer>
		</div>
	);
}
