"use client"
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import Link from "next/link";
export function SurveyForm() {
    return (
        <Card className="z-10 w-full max-w-2xl shadow-xl border-slate-300">
            <CardHeader className="border-b py-5 text-center space-y-2">
                <CardTitle className="text-2xl font-extrabold text-emerald-800">
                    Patient Feedback Survey
                </CardTitle>
                <p className="text-slate-500 text-sm">
                    Help us improve our services by providing your honest feedback.
                </p>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
                <form className="space-y-6">
                    {/* Question 1 */}
                    <div className="space-y-3">
                        <Label className="font-semibold text-slate-700">How would you rate your experience today?</Label>
                        <select className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-emerald-500">
                            <option value="">Select a rating</option>
                            <option value="excellent">Excellent</option>
                            <option value="good">Good</option>
                            <option value="average">Average</option>
                            <option value="poor">Poor</option>
                        </select>
                    </div>
                    {/* Question 2 */}
                    <div className="space-y-3">
                        <Label className="font-semibold text-slate-700">How can we improve our services? / Any Complaints?</Label>
                        <textarea
                            rows={4}
                            className="flex w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-emerald-500"
                            placeholder="Please detail your feedback here..."
                        />
                    </div>
                    <div className="pt-4 flex gap-3 border-t border-slate-200">
                        {/* Return Button */}
                        <Link href="/kiosk" className="w-1/3">
                            <Button type="button" variant="outline" className="w-full h-12">
                                Cancel
                            </Button>
                        </Link>
                        {/* Submit Button */}
                        <Button type="submit" className="w-2/3 h-12 bg-emerald-600 hover:bg-emerald-700">
                            Submit Survey
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}