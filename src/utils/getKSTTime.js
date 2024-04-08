export function getNowTime(){
    const nowUTC = new Date();

    // 한국 시간(KST, UTC+9)으로 조정
    const nowKST = new Date(nowUTC.getTime() + (9 * 60 * 60 * 1000));

    const isoString = nowKST.toISOString();

    return new Date(isoString);
}