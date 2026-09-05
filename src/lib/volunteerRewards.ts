export const rewardMilestones = [
    { times: 3, title: "民眾黨小物", description: "完成 3 次活動報到後可兌換民眾黨小物。" },
    { times: 10, title: "民眾黨 T 恤", description: "完成 10 次活動報到後可兌換民眾黨 T 恤。" },
    { times: 20, title: "參觀台北市黨部", description: "完成 20 次活動報到後可獲得參觀台北市黨部機會。" },
    { times: 30, title: "與柯文哲合影機會", description: "完成 30 次活動報到後可獲得與柯文哲合影機會。" },
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
