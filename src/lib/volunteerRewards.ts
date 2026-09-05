export const rewardMilestones = [
    { times: 5, title: "5 次獎勵", description: "小禮物或志工徽章" },
    { times: 10, title: "10 次獎勵", description: "進階紀念品" },
    { times: 20, title: "20 次獎勵", description: "特別感謝狀" },
    { times: 50, title: "50 次獎勵", description: "年度志工榮譽獎" },
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
