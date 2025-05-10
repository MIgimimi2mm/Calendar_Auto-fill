export async function POST(req) {
    const { text: rawText } = await req.json();

    if (!rawText) {
        return new Response(JSON.stringify({ error: "テキストがありません" }), { status: 400 });
    }

    // ★ 1. まずテキストを整形
    const text = rawText.replace(/\s+/g, ' ').trim();
    // → 改行や複数スペースを単なる1個のスペースに変換

    const extractData = (text) => {
        const eventName = text.includes("貸出") ? "貸出" : "予約";

        const convertReiwaToYear = (reiwa, month, day, hour, minute) => {
            const year = 2018 + parseInt(reiwa, 10);
            return `${year}-${month}-${day}T${hour}:${minute}:00`;
        };

        // ★ 2. 整形済みテキストに正規表現を適用！
        const lendMatch = text.match(/貸出日時\s*令和\s*(\d+)\/(\d+)\/(\d+)\s*(\d+)\s*\d*\s*:\s*(\d+)/);
        const returnMatch = text.match(/返却日時\s*令和\s*(\d+)\/(\d+)\/(\d+)\s*(\d+)\s*\d*\s*:\s*(\d+)/);

        const locationMatch = text.match(/貸出店舗\s*J-Trip\s*([^\s\n]+)/);
        const modelMatch = text.match(/車輌\s+\S+\s+([^\s\n]+)/);
        
        const numberMatch = text.match(/わ\s*([0-9]+)/);
        const surnameMatch = text.match(/法人\s+([^\s\n]+)/);
        const flightMatch = text.match(/［搭乗便］\s*([A-Z]+\d+)?\s*([A-Z]+\d+)?/);
        const requiresTel = /［搭乗便］\s*要/.test(text);
        const directVisit = /［搭乗便］\s*直接/.test(text);



        const lendDate = lendMatch ? convertReiwaToYear(lendMatch[1], lendMatch[2], lendMatch[3], lendMatch[4], lendMatch[5]) : null;
        const returnDate = returnMatch ? convertReiwaToYear(returnMatch[1], returnMatch[2], returnMatch[3], returnMatch[4], returnMatch[5]) : null;
        const location = locationMatch ? locationMatch[1].trim() : null;
        const model = modelMatch ? modelMatch[1].trim() : null;
        
        const number = numberMatch ? numberMatch[1].trim() : null;
        const surname = surnameMatch ? surnameMatch[1].trim() : null;
        const arrivalFlight = flightMatch ? flightMatch[1] || null : null;
        const departureFlight = flightMatch ? flightMatch[2] || null : null;

        let options = {};
        const optionBlockMatch = text.match(/オプション([\s\S]*?)免責補償/);
        if (optionBlockMatch) {
            const optionBlock = optionBlockMatch[1];
            const optionItems = [
                "チャイルドシート",
                "ベビーシート",
                "ジュニアシート",
                "スタッドレス"
            ];
            optionItems.forEach(item => {
                const regex = new RegExp(item + "\\s*(\\d+)", "g");
                const match = optionBlock.match(regex);
                if (match) {
                    const quantityMatch = match[0].match(/\d+/); // 数字だけ取り出す
                    if (quantityMatch) {
                        options[item] = parseInt(quantityMatch[0], 10);
                    }
                }
            });
        }

        return { eventName, lendDate, returnDate, location, model, number, surname, arrivalFlight, departureFlight, options, requiresTel, directVisit };
    };

    const eventData = extractData(text);
    return new Response(JSON.stringify(eventData), { status: 200 });
}
