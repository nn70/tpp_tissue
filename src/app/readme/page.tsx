import Image from "next/image";
import Link from "next/link";
import { Award, CalendarClock, CheckCircle2, ClipboardList, LockKeyhole, MapPinned, QrCode, ShieldCheck, Sparkles, Users } from "lucide-react";
import { rewardMilestones } from "@/lib/volunteerRewards";
import { VOLUNTEER_EVENT_CATEGORIES } from "@/lib/volunteerEventCategories";

const features = [
    { icon: Users, title: "Google 登入與活動報名", description: "志工登入 Google 帳號後即可報名活動，第一次報名需填寫姓名與電話，之後系統會自動帶出。" },
    { icon: ClipboardList, title: "活動建立與編輯", description: "管理員與小編可建立、編輯活動；管理員可刪除活動，並查看完整參與者資料。" },
    { icon: QrCode, title: "QR Code 現場報到", description: "每個活動都有專屬報到 QR Code，志工現場輸入報名電話，驗證成功才列入出席次數。" },
    { icon: MapPinned, title: "物資發放紀錄", description: "管理員與小編可在地圖上記錄發放地點、對象、物資品項與後續聯絡提醒，一般志工不會看到。" },
    { icon: CalendarClock, title: "Google Calendar 新增活動", description: "報名成功可開啟 Google Calendar 新增活動頁，由志工自行確認與儲存，不需要授權網站管理行事曆。" },
    { icon: Award, title: "志工里程碑", description: "完成現場報到後累積出席次數，網站會顯示不同階段的志工參與紀錄與感謝項目。" },
];

const roles = [
    { name: "一般志工", description: "活動瀏覽、Google 登入、活動報名、候補報名、查看自己的紀錄、修改自己的姓名與電話、查看志工里程碑。" },
    { name: "小編", description: "可建立與編輯活動、查看參與者完整資料、管理物資發放紀錄。" },
    { name: "管理員", description: "具備小編功能，並可刪除活動、管理帳號權限與維護系統資料。" },
];

export default function ReadmePage() {
    return (
        <main className="min-h-screen tpp-page pt-20">
            <section className="px-4 py-8 sm:px-6 lg:px-8">
                <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
                    <div>
                        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#61C5C7]/30 bg-white/75 px-4 py-2 text-sm font-bold text-[#237478] shadow-sm">
                            <Sparkles className="h-4 w-4" />
                            TPP 松信區志工報名系統
                        </div>
                        <h1 className="max-w-3xl text-4xl font-black leading-tight text-[#173246] sm:text-5xl">
                            活動報名、現場報到、志工里程碑，一個網站完成
                        </h1>
                        <p className="mt-5 max-w-2xl text-lg leading-8 text-[#3b597d]">
                            這是一套為松山信義區志工活動設計的線上報名與管理系統。志工可以用 Google 帳號報名活動，主辦方則能在後台建立活動、統計出席、管理 QR Code 報到與物資發放紀錄。
                        </p>
                        <div className="mt-7 flex flex-wrap gap-3">
                            <Link href="/forum" className="inline-flex items-center justify-center rounded-xl tpp-primary-button px-5 py-3 text-sm font-bold">
                                前往志工報名
                            </Link>
                            <Link href="/volunteer-rewards" className="inline-flex items-center justify-center rounded-xl border border-[#61C5C7]/30 bg-white/80 px-5 py-3 text-sm font-bold text-[#173246] transition hover:bg-white">
                                查看志工里程碑
                            </Link>
                        </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        {VOLUNTEER_EVENT_CATEGORIES.slice(0, 4).map((category) => (
                            <div key={category.label} className="overflow-hidden rounded-2xl border border-[#61C5C7]/25 bg-white shadow-sm">
                                <div className="relative aspect-[4/3]">
                                    <Image src={category.imageUrl} alt={`${category.label}活動示意`} fill className="object-cover" sizes="(min-width: 1024px) 22vw, 45vw" />
                                </div>
                                <div className="px-4 py-3 text-sm font-bold text-[#173246]">{category.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="px-4 py-8 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-7xl">
                    <h2 className="text-2xl font-black text-[#173246]">網站主要功能</h2>
                    <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {features.map((feature) => {
                            const Icon = feature.icon;
                            return (
                                <article key={feature.title} className="rounded-2xl border border-[#61C5C7]/25 bg-white/88 p-5 shadow-sm">
                                    <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#61C5C7]/15 text-[#237478]">
                                        <Icon className="h-5 w-5" />
                                    </div>
                                    <h3 className="text-lg font-black text-[#173246]">{feature.title}</h3>
                                    <p className="mt-2 leading-7 text-[#3b597d]">{feature.description}</p>
                                </article>
                            );
                        })}
                    </div>
                </div>
            </section>

            <section className="px-4 py-8 sm:px-6 lg:px-8">
                <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
                    <div className="rounded-2xl border border-[#61C5C7]/25 bg-white/88 p-6 shadow-sm">
                        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#61C5C7]/15 text-[#237478]">
                            <ShieldCheck className="h-6 w-6" />
                        </div>
                        <h2 className="text-2xl font-black text-[#173246]">權限清楚分流</h2>
                        <p className="mt-3 leading-7 text-[#3b597d]">
                            一般志工只看到報名與自己的紀錄；管理員與小編才看得到完整名單、物資紀錄與後台功能，降低資料外流風險。
                        </p>
                    </div>
                    <div className="grid gap-4 md:grid-cols-3">
                        {roles.map((role) => (
                            <article key={role.name} className="rounded-2xl border border-[#61C5C7]/25 bg-white/88 p-5 shadow-sm">
                                <h3 className="font-black text-[#173246]">{role.name}</h3>
                                <p className="mt-2 text-sm leading-7 text-[#3b597d]">{role.description}</p>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            <section className="px-4 py-8 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-7xl">
                    <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <h2 className="text-2xl font-black text-[#173246]">志工里程碑</h2>
                            <p className="mt-2 text-[#3b597d]">完成現場 QR Code 報到後才會累積出席次數。</p>
                        </div>
                        <Link href="/volunteer-rewards" className="text-sm font-bold text-[#237478] hover:text-[#173246]">
                            查看完整說明
                        </Link>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                        {rewardMilestones.map((reward) => (
                            <article key={reward.times} className="overflow-hidden rounded-2xl border border-[#61C5C7]/25 bg-white shadow-sm">
                                <div className="relative aspect-[4/3] bg-[#fff8e8]">
                                    <Image src={reward.imageUrl} alt={`${reward.title}示意圖`} fill className="object-cover" sizes="(min-width: 1024px) 18vw, 45vw" />
                                </div>
                                <div className="p-4">
                                    <div className="text-xs font-bold text-[#237478]">累積 {reward.times} 次</div>
                                    <h3 className="mt-1 font-black leading-6 text-[#173246]">{reward.title}</h3>
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            <section className="px-4 py-8 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-7xl rounded-2xl border border-[#61C5C7]/25 bg-white/88 p-6 shadow-sm">
                    <div className="flex items-start gap-3">
                        <LockKeyhole className="mt-1 h-5 w-5 shrink-0 text-[#237478]" />
                        <div>
                            <h2 className="text-xl font-black text-[#173246]">里程碑免責與合規聲明</h2>
                            <p className="mt-3 leading-7 text-[#3b597d]">
                                所有志工里程碑、感謝項目、紀念品、合照機會與相關安排，均以感謝志工服務、活動參與紀錄與內部行政管理為目的，並非投票、支持特定候選人或政黨之對價或利益交換。
                            </p>
                            <p className="mt-3 leading-7 text-[#3b597d]">
                                實際項目、數量、資格、發放方式、時間、地點與內容，須依中華民國相關法令、選舉罷免法規、主管機關解釋、主辦方合規審查與現場實際狀況調整。主辦方保留修改、暫停、取消或替換相關規則與項目之權利，且不保證所有項目一定能實現或提供。
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="px-4 pb-12 pt-4 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-7xl rounded-2xl border border-[#61C5C7]/25 bg-[#173246] p-6 text-white shadow-sm">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <div className="inline-flex items-center gap-2 text-sm font-bold text-[#D9FFFF]">
                                <CheckCircle2 className="h-4 w-4" />
                                適合分享給志工與活動協作者
                            </div>
                            <h2 className="mt-2 text-2xl font-black">直接進網站看功能，不需要打開 GitHub</h2>
                        </div>
                        <Link href="/forum" className="inline-flex items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-bold text-[#173246] transition hover:bg-[#D9FFFF]">
                            開始使用
                        </Link>
                    </div>
                </div>
            </section>
        </main>
    );
}
