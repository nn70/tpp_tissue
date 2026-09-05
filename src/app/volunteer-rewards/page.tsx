import Link from "next/link";
import { Award, CheckCircle2, Gift, Shirt, Sparkles, Users } from "lucide-react";
import { rewardMilestones } from "@/lib/volunteerRewards";

const rewardIcons = [Gift, Shirt, Users, Sparkles];

export default function VolunteerRewardsPage() {
    return (
        <main className="min-h-screen tpp-page pt-20 px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-6xl space-y-6 pb-10">
                <section className="glass-panel rounded-2xl p-6 sm:p-8">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                        <div className="max-w-2xl">
                            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#61C5C7]/25 bg-[#61C5C7]/10 px-3 py-1 text-sm font-semibold text-[#D9FFFF]">
                                <Award className="h-4 w-4" />
                                志工獎勵說明
                            </div>
                            <h1 className="text-3xl font-black text-white sm:text-4xl">每一次到場，都會累積成你的志工里程碑</h1>
                            <p className="mt-4 leading-7 text-slate-300">
                                志工參加活動後，需完成現場 QR Code 報到，才會列入出席次數。達到指定次數後，可依後台紀錄兌換對應獎勵。
                            </p>
                        </div>
                        <Link
                            href="/forum"
                            className="inline-flex items-center justify-center rounded-xl tpp-primary-button px-5 py-3 text-sm font-semibold transition "
                        >
                            前往活動報名
                        </Link>
                    </div>
                </section>

                <section className="grid gap-4 md:grid-cols-2">
                    {rewardMilestones.map((reward, index) => {
                        const Icon = rewardIcons[index] ?? Gift;

                        return (
                            <article key={reward.times} className="glass-panel rounded-2xl p-6">
                                <div className="flex items-start gap-4">
                                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10">
                                        <Icon className="h-7 w-7 text-[#F4F7F7]" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-semibold text-slate-400">累積報到 {reward.times} 次</div>
                                        <h2 className="mt-1 text-2xl font-black text-white">{reward.title}</h2>
                                        <p className="mt-3 leading-7 text-slate-300">{reward.description}</p>
                                    </div>
                                </div>
                            </article>
                        );
                    })}
                </section>

                <section className="glass-panel rounded-2xl p-6">
                    <div className="flex items-start gap-3">
                        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#61C5C7]" />
                        <div>
                            <h2 className="font-bold text-white">計算方式</h2>
                            <p className="mt-2 leading-7 text-slate-300">
                                以活動後台的「已出席」紀錄為準；現場掃描活動 QR Code 成功後，系統會自動更新出席狀態並累計獎勵進度。
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}
