export const rewardMilestones = [
    { times: 3, title: "甫投幫小物", description: "完成 3 次活動報到後，可登記領取主辦方核可之甫投幫紀念小物；實際品項、數量與發放方式以合規審查後公告為準。" },
    { times: 10, title: "紙本或電子感謝狀", description: "完成 10 次活動報到後，可由主辦方核發紙本或電子感謝狀，作為志工服務參與紀錄與感謝。" },
    { times: 20, title: "TPP 榮譽商品", description: "完成 20 次活動報到後，可登記 TPP 榮譽商品；是否提供、品項與價值限制須符合選罷法及主辦方合規審查。" },
    { times: 30, title: "與民眾黨特定人物合照機會", description: "完成 30 次活動報到後，可登記合照機會；實際人物、時間、地點與名額由主辦方安排，並以法規及活動安全規範為準。" },
    { times: 50, title: "與柯文哲榮譽主席合照機會", description: "完成 50 次活動報到後，可登記與柯文哲榮譽主席合照機會；實際安排需視行程、名額、法規與主辦方合規審查結果而定。" },
];

export function getRewardProgress(attendedCount: number) {
    const unlocked = rewardMilestones.filter((reward) => attendedCount >= reward.times);
    const next = rewardMilestones.find((reward) => attendedCount < reward.times) ?? null;

    return {
        attendedCount,
        unlocked,
        next,
        remainingToNext: next ? Math.max(next.times - attendedCount, 0) : 0,
    };
}
