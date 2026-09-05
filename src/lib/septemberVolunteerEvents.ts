export type SeptemberVolunteerEventSeed = {
    slug: string;
    title: string;
    category: string | null;
    description: string | null;
    location: string | null;
    startsAt: string;
    endsAt: string | null;
    capacity: number | null;
};

const officeAddress = "110臺北市信義區四育里虎林街71號";

function event(
    date: string,
    start: string,
    end: string | null,
    title: string,
    location: string | null,
    category: string | null,
    description: string | null,
    capacity: number | null,
    slugSuffix?: string,
): SeptemberVolunteerEventSeed {
    const slugBase = `${date}-${slugSuffix ?? title}`
        .toLowerCase()
        .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
        .replace(/^-+|-+$/g, "");

    return {
        slug: slugBase,
        title,
        category,
        description,
        location,
        startsAt: `${date}T${start}`,
        endsAt: end ? `${date}T${end}` : null,
        capacity,
    };
}

function endingEvent(
    date: string,
    end: string,
    title: string,
    location: string,
    slugSuffix: string,
): SeptemberVolunteerEventSeed {
    const [hour, minute] = end.split(":").map(Number);
    const startDate = new Date(`${date}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00+08:00`);
    startDate.setMinutes(startDate.getMinutes() - 30);
    const start = `${String(startDate.getHours()).padStart(2, "0")}:${String(startDate.getMinutes()).padStart(2, "0")}`;

    return event(date, start, end, title, location, "里民活動", `原始提供：${end} 結束`, 2, slugSuffix);
}

export const septemberVolunteerEvents: SeptemberVolunteerEventSeed[] = [
    event("2026-09-06", "09:30", "10:30", "草埔市場掃街", "台北市新東街60-64號", "掃菜市場", "甫哥行程", 2, "caopu-market"),
    event("2026-09-06", "16:30", "17:30", "永春市場掃街", "台北市忠孝東路五段465號 全家", "掃菜市場", "甫哥行程", 2, "yongchun-market"),

    event("2026-09-07", "08:30", "09:30", "敦化南京路口", "台北市南京東路四段1號1樓 ECCO 南東門市", "站路口", "甫哥行程", 3, "dunhua-nanjing"),
    event("2026-09-07", "20:22", "20:30", "中正里垃圾車", "台北市松山區八德路2段449號(臺安醫院對面)", "追垃圾車", "甫哥行程", 2, "zhongzheng-garbage-1"),
    event("2026-09-07", "20:45", "21:05", "民福里垃圾車", "台北市松山區民權東路3段107號", "追垃圾車", "甫哥行程", 2, "minfu-garbage-1"),
    event("2026-09-07", "21:10", "21:30", "民福里垃圾車", "台北市松山區五常街370號", "追垃圾車", "甫哥行程", 2, "minfu-garbage-2"),
    event("2026-09-07", "20:45", "21:00", "長春里垃圾車", "台北市虎林街松德路口", "追垃圾車", "杰哥行程", 2, "changchun-garbage"),
    event("2026-09-07", "21:22", "21:35", "五全里垃圾車", "台北市信義區忠孝東路5段423巷66號（永吉公園）", "追垃圾車", "杰哥行程", 2, "wuquan-garbage"),
    event("2026-09-07", "18:45", "19:05", "復盛里垃圾車", "北市松山區光復南路31號", "追垃圾車", "致佑行程", 2, "fusheng-garbage"),
    event("2026-09-07", "19:20", "19:50", "三民里垃圾車", "台北市松山區民生東路5段163號(圓環)", "追垃圾車", "致佑行程", 2, "sanmin-garbage"),
    event("2026-09-07", "20:05", "20:20", "松基里垃圾車", "台北市松山區復興北路207號", "追垃圾車", "致佑行程", 2, "songji-garbage"),

    event("2026-09-08", "09:30", "10:30", "南京公寓市場", "台北市健康路入口", "掃菜市場", "甫哥行程", 3, "nanjing-apartment-market"),
    event("2026-09-08", "18:45", "19:05", "復盛里垃圾車", "台北市松山區光復南路31號", "追垃圾車", "甫哥行程", 2, "fusheng-garbage"),
    event("2026-09-08", "19:20", "19:50", "三民里垃圾車", "台北市松山區民生東路5段163號(圓環)", "追垃圾車", "甫哥行程", 2, "sanmin-garbage"),
    event("2026-09-08", "20:05", "20:20", "松基里垃圾車", "台北市松山區復興北路207號", "追垃圾車", "甫哥行程", 2, "songji-garbage"),
    event("2026-09-08", "20:30", "20:45", "五常里垃圾車", "台北市信義區永吉路225巷52弄23號前(五常公園)", "追垃圾車", "杰哥行程", 2, "wuchang-garbage"),
    event("2026-09-08", "21:00", "21:30", "松光里垃圾車", "台北市信義區大道路28巷口對面（春光公園）", "追垃圾車", "杰哥行程", 2, "songguang-garbage"),
    event("2026-09-08", "17:50", "18:30", "新東里垃圾車", "台北市松山區新東街35號", "追垃圾車", "致佑行程", 2, "xindong-garbage"),
    event("2026-09-08", "18:40", "19:05", "新益里垃圾車", "台北市松山區撫遠街259號(三民公園)", "追垃圾車", "致佑行程", 2, "xinyi-garbage-1"),
    event("2026-09-08", "21:10", "21:50", "新益里垃圾車", "台北市松山區撫遠街266號(新東公園)", "追垃圾車", "致佑行程", 2, "xinyi-garbage-2"),
    event("2026-09-08", "21:55", "22:15", "新益里垃圾車", "台北市松山區富錦街581巷口", "追垃圾車", "致佑行程", 2, "xinyi-garbage-3"),

    event("2026-09-09", "08:30", "09:30", "忠孝基隆路口", "台北市忠孝東路四段560號 台灣銀行", "站路口", "甫哥行程", 3, "zhongxiao-keelung"),

    event("2026-09-10", "08:30", "09:30", "松仁信義路口", "台北市松仁路130號 昇榮信義停車場", "站路口", "甫哥行程", 3, "songren-xinyi"),
    event("2026-09-10", "16:30", "17:30", "永春市場掃街", "台北市忠孝東路五段465號 全家", "掃菜市場", "甫哥行程", null, "yongchun-market"),
    event("2026-09-10", "18:30", "19:00", "松光里垃圾車", "臺北市信義區林口街68號對面(林口公園)", "追垃圾車", "甫哥行程", 2, "songguang-garbage"),
    event("2026-09-10", "18:30", "18:45", "三犁里垃圾車", "台北市信義區信義路5段150巷14弄16號對面(中強公園高峰會旁)", "追垃圾車", "致佑行程", 2, "sanli-garbage"),
    event("2026-09-10", "18:30", "19:00", "三張里垃圾車", "台北市信義區松仁路160號旁", "追垃圾車", "致佑行程", 2, "sanzhang-garbage-1"),
    event("2026-09-10", "19:05", "19:30", "三張里垃圾車", "台北市信義區莊敬路341巷口", "追垃圾車", "致佑行程", 2, "sanzhang-garbage-2"),

    event("2026-09-12", "11:30", "12:00", "信義區興隆里中秋登重陽活動", "台北市仁愛路4段507號", "里民活動", "甫哥行程", 2, "xinglong-mid-autumn"),
    event("2026-09-12", "18:00", "18:30", "松山區東榮里中秋節活動", "台北市松榮公園 (光復北路與富錦街口)", "里民活動", "甫哥行程", 2, "dongrong-mid-autumn"),
    event("2026-09-12", "09:00", "09:30", "松山區復建里中秋節活動", "台北市八德路三段158巷7弄20號", "里民活動", "致佑行程", 2, "fujian-mid-autumn"),
    event("2026-09-12", "20:22", "21:10", "中正里垃圾車", "臺北市松山區八德路2段449號(臺安醫院對面)", "追垃圾車", "致佑行程\n20:22-20:30 臺北市松山區八德路2段449號(臺安醫院對面)\n20:25-20:30 臺北市松山區復興北路15號(加油站前)\n20:32-20:40 臺北市松山區南京東路3段280號\n21:00-21:10 臺北市松山區敦化北路4巷1號", 2, "zhongzheng-garbage"),
    event("2026-09-12", "09:00", "09:30", "松山區復源里中秋節活動", "台北市復源公園 (光復南路32巷46號對面)", "里民活動", "志工行程", 2, "fuyuan-mid-autumn"),
    event("2026-09-12", "09:00", "09:30", "信義區國業里月餅登記", "台北市虎林街222巷15號", "里民活動", "志工行程", 2, "guoye-mooncake"),
    endingEvent("2026-09-12", "11:00", "私立協和祐德國中部", "台北市忠孝東路五段790巷27號", "xiehe-yude-school"),
    endingEvent("2026-09-12", "11:30", "松山國小/幼兒園學校日", "台北市八德路四段746號", "songshan-school-day"),
    endingEvent("2026-09-12", "11:30", "敦化國小幼兒園學校日", "台北市敦化北路2號", "dunhua-school-day"),
    endingEvent("2026-09-12", "11:30", "福德國小/幼兒園學校日", "台北市福德街253號", "fude-school-day"),
    endingEvent("2026-09-12", "11:30", "西松國小幼兒園學校日", "台北市三民路5號", "xisong-elementary-school-day"),
    endingEvent("2026-09-12", "12:00", "西松國中學校日", "台北市健康路325巷7號", "xisong-junior-school-day"),
    endingEvent("2026-09-12", "12:00", "三興國小學校日", "台北市基隆路二段99號", "sanxing-school-day"),
    endingEvent("2026-09-12", "12:00", "民權國小/幼兒園學校日", "台北市民權東路4段200號", "minquan-school-day"),
    endingEvent("2026-09-12", "12:00", "吳興國小學校日", "台北市松仁路226號", "wuxing-school-day"),
    endingEvent("2026-09-12", "12:00", "信義國小學校日", "台北市松勤街60號", "xinyi-school-day"),
    endingEvent("2026-09-12", "12:00", "光復國小學校日", "北市信義區光復南路271號", "guangfu-school-day"),

    event("2026-09-13", "10:00", "10:30", "松山區東光里中秋節活動", "台北市長壽公園 (健康路174號旁)", "里民活動", "致佑行程", 2, "dongguang-mid-autumn"),
    event("2026-09-13", "17:46", "18:30", "雅祥里垃圾車", "臺北市信義區松信路與松隆路交叉口", "追垃圾車", "致佑行程\n17:46-17:55 臺北市信義區松信路與松隆路交叉口\n17:58-18:04 臺北市信義區永吉路37號\n18:05-18:10 臺北市信義區基隆路1段37巷47號\n18:11-18:26 臺北市信義區基隆路1段35巷7弄4號\n18:27-18:30 臺北市信義區永吉路127巷與基隆路1段83巷交叉口(興雅國小邊)", 2, "yaxiang-garbage"),

    event("2026-09-07", "09:00", "13:00", "競選總部留守（上午）", officeAddress, "輔選", "競總留守", null, "office-duty-am"),
    event("2026-09-07", "13:00", "17:00", "競選總部留守（下午）", officeAddress, "輔選", "競總留守", null, "office-duty-pm"),
    event("2026-09-08", "09:00", "13:00", "競選總部留守（上午）", officeAddress, "輔選", "競總留守", null, "office-duty-am"),
    event("2026-09-08", "13:00", "17:00", "競選總部留守（下午）", officeAddress, "輔選", "競總留守", null, "office-duty-pm"),
    event("2026-09-09", "09:00", "13:00", "競選總部留守（上午）", officeAddress, "輔選", "競總留守", null, "office-duty-am"),
    event("2026-09-09", "13:00", "17:00", "競選總部留守（下午）", officeAddress, "輔選", "競總留守", null, "office-duty-pm"),
    event("2026-09-10", "09:00", "13:00", "競選總部留守（上午）", officeAddress, "輔選", "競總留守", null, "office-duty-am"),
    event("2026-09-10", "13:00", "17:00", "競選總部留守（下午）", officeAddress, "輔選", "競總留守", null, "office-duty-pm"),
    event("2026-09-11", "09:00", "13:00", "競選總部留守（上午）", officeAddress, "輔選", "競總留守", null, "office-duty-am"),
    event("2026-09-11", "13:00", "17:00", "競選總部留守（下午）", officeAddress, "輔選", "競總留守", null, "office-duty-pm"),
];
