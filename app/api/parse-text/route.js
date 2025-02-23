export async function POST(req) {
    const { text } = await req.json();

    if (!text) {
        return new Response(JSON.stringify({ error: "テキストがありません" }), { status: 400 });
    }

    // 必要な情報を抽出（正規表現を使う）
    const extractData = (text) => {
        const eventName = text.includes("貸出") ? "レンタカー貸出" : "予約";

        // 日付と時間を抽出（令和を西暦に変換）
        const convertReiwaToYear = (reiwa, month, day, hour, minute) => {
            const year = 2018 + parseInt(reiwa, 10);
            return `${year}-${month}-${day}T${hour}:${minute}:00`;
        };

        const lendMatch = text.match(/貸出日時\s+令和\s+(\d+)\/(\d+)\/(\d+)\s+(\d+)\s*:\s*(\d+)/);
        const returnMatch = text.match(/返却日時\s+令和\s+(\d+)\/(\d+)\/(\d+)\s+(\d+)\s*:\s*(\d+)/);

        const lendDate = lendMatch ? convertReiwaToYear(lendMatch[1], lendMatch[2], lendMatch[3], lendMatch[4], lendMatch[5]) : null;
        const returnDate = returnMatch ? convertReiwaToYear(returnMatch[1], returnMatch[2], returnMatch[3], returnMatch[4], returnMatch[5]) : null;

        return { eventName, lendDate, returnDate };
    };

    const eventData = extractData(text);
    return new Response(JSON.stringify(eventData), { status: 200 });
}
