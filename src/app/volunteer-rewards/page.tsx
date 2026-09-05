import Link from "next/link";
import { AlertTriangle, Award, Camera, CheckCircle2, ClipboardCheck, Gift, Medal, Shirt } from "lucide-react";
import { rewardMilestones } from "@/lib/volunteerRewards";

const rewardIcons = [Gift, ClipboardCheck, Shirt, Camera, Medal];

export default function VolunteerRewardsPage() {
    return (
        <main className="min-h-screen tpp-page pt-20 px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-6xl space-y-6 pb-10">
                <section className="glass-panel rounded-2xl p-6 sm:p-8">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                        <div className="max-w-2xl">
                            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#61C5C7]/25 bg-[#61C5C7]/10 px-3 py-1 text-sm font-semibold text-[#D9FFFF]">
                                <Award className="h-4 w-4" />
                                志工里程碑說明
                            </div>
                            <h1 className="text-3xl font-black text-white sm:text-4xl">每一次到場，都會累積成你的志工里程碑</h1>
                            <p className="mt-4 leading-7 text-slate-300">
                                志工參加活動後，需完成現場 QR Code 報到，才會列入出席次數。里程碑僅作為服務參與紀錄、感謝與主辦方安排參考，所有內容皆須符合中華民國選罷法及主辦方合規審查。
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

                <section className="grid gap-5 md:grid-cols-2">
                    {rewardMilestones.map((reward, index) => {
                        const Icon = rewardIcons[index] ?? Medal;

                        return (
                            <article key={reward.times} className="glass-panel overflow-hidden rounded-2xl transition hover:-translate-y-0.5 hover:shadow-xl">
                                <div className="aspect-[16/10] overflow-hidden border-b border-[#61C5C7]/15 bg-[#fff8e8]">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={reward.imageUrl} alt={`${reward.title} 示意圖`} className="h-full w-full object-cover" />
                                </div>
                                <div className="p-6">
                                    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-[#61C5C7]/20 bg-[#61C5C7]/12">
                                        <Icon className="h-6 w-6 text-[#2aa8ac]" />
                                    </div>
                                    <div className="text-sm font-semibold text-slate-400">累積報到 {reward.times} 次</div>
                                    <h2 className="mt-1 text-2xl font-black text-white">{reward.title}</h2>
                                    <p className="mt-3 leading-7 text-slate-300">{reward.description}</p>
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
                                以活動後台的「已出席」紀錄為準；現場掃描活動 QR Code 並完成電話驗證後，系統會更新出席狀態並累計志工里程碑進度。
                            </p>
                        </div>
                    </div>
                </section>

                <section className="glass-panel rounded-2xl border-[#61C5C7]/20 bg-[#071820]/60 p-6">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[#61C5C7]" />
                        <div>
                            <h2 className="font-bold text-white">選罷法合規聲明</h2>
                            <p className="mt-2 leading-7 text-slate-300">
                                本頁所列里程碑為志工服務參與紀錄、感謝及活動安排參考，並非保證給付、抽獎、兌換承諾或可請求之權利；不得兌換現金、折價、報酬或其他經濟利益，也不得轉讓。任何小物、商品、感謝狀或合照安排，均不得作為投票、不投票、支持或不支持特定候選人、政黨、罷免案、連署或助選行為之對價、條件、承諾、誘因或暗示。主辦方得基於中華民國選罷法、選務期間規範、活動執行狀況、名額、行程或合規風險，隨時調整、替換、暫停或取消相關內容；實際內容以主辦方最新公告及法律專業審查意見為準。
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}
