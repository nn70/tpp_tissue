export const rewardMilestones = [
    { times: 3, title: "志工服務徽章", description: "完成 3 次活動報到後，系統顯示志工服務徽章，作為參與紀錄與感謝。" },
    { times: 10, title: "志工感謝狀", description: "完成 10 次活動報到後，可由主辦方核發不具財產價值之電子感謝狀。" },
    { times: 20, title: "志工培訓邀請", description: "完成 20 次活動報到後，可優先收到志工培訓、法規說明或服務交流場次資訊。" },
    { times: 30, title: "志工服務紀錄彙整", description: "完成 30 次活動報到後，可取得個人志工服務紀錄彙整，供本人留存參考。" },
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
