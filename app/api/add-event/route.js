import { google } from "googleapis";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);


// 環境変数からカレンダーIDを取得
const ITAMI_CALENDAR_ID = process.env.GOOGLE_CALENDAR_ITAMI;
const HAKODATE_CALENDAR_ID = process.env.GOOGLE_CALENDAR_HAKODATE;

// Google OAuth クライアントのセットアップ
const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
);
oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });

const calendar = google.calendar({ version: "v3", auth: oauth2Client });

// 1時間前の日時を生成する関数
const oneHourBefore = (dateStr) => {

    // return dayjs(dateStr).add(1, 'hour').format();
    return dayjs(dateStr).subtract(8, 'hour').format();
};

export async function POST(req) {
    const { eventName, lendDate, returnDate, location, model, number, surname, arrivalFlight, departureFlight, options, requiresTel, directVisit, isRepeater} = await req.json();

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    if (departureFlight) {
        console.log("出発便情報: ", departureFlight);
    }
    
    if (!eventName || !lendDate || !returnDate || !location || !model || !number || !surname) {
        return new Response(JSON.stringify({ error: "イベント情報が不足しています" }), { status: 400 });
    }

    // 受付店舗に応じてカレンダーIDを動的に決定
    const calendarId = location.includes("函館") ? HAKODATE_CALENDAR_ID : ITAMI_CALENDAR_ID;

    if (!calendarId) {
        return new Response(JSON.stringify({ error: "カレンダーIDが見つかりません" }), { status: 400 });
    }

    // 店舗に応じて色を変える
    let colorId;
    if (location.includes("函館")) {
        colorId = "1"; 
    } else if (location.includes("伊丹")) {
        colorId = "7"; 
    } else {
        colorId = "11"; 
    }

  


    // ★ locationから"空港店"などを削除する（短縮）
    const shortLocation = location.replace(/空港店|空港本店|店/g, '').trim();
    // ▼ 絵文字を組み立てる ▼
    let emojiPrefix = "";

    // ① 到着便が未設定 → 📞
    if (requiresTel) {
        emojiPrefix += "📞";
    }
    
    if (directVisit) {
        emojiPrefix += "👟";
    }

    // ② 到着便がローマ字入り（ANA123など）→ ✈
    else if (arrivalFlight && /[A-Za-z]/.test(arrivalFlight)) {
        emojiPrefix += "✈";
    }
    

    // ③ スタッドレスオプションあり → 🛞
    if (options && options["スタッドレス"] && options["スタッドレス"] > 0) {
        emojiPrefix += "🛞";
    }

    // ④ チャイルド・ベビー・ジュニアシートの合計 → 💺 × 数
    if (options) {
        const seatTypes = ["チャイルドシート", "ベビーシート", "ジュニアシート"];
        const totalSeats = seatTypes.reduce((sum, type) => sum + (options[type] || 0), 0);
        if (totalSeats > 0) {
            emojiPrefix += "💺".repeat(totalSeats);
        }
    }

    // ★ リピーターの場合、タイトルに追加
    let repeater = "";
    if(isRepeater){
        repeater += " ★リピーター様";
    }



    // ★ イベント名を加工
    const lendSummary = `${emojiPrefix}【貸出】${shortLocation}${model}(${number})${surname}様${repeater}`;
    const returnSummary = `${emojiPrefix}【返却】${shortLocation}${model}(${number})${surname}様${repeater}`;

    // ★ description を組み立てる
    let optionsText = "";
    if (options && Object.keys(options).length > 0) {
        const optionLines = Object.entries(options).map(([key, val]) => `${key} × ${val}`);
        optionsText = "\n" + optionLines.join("\n");
    }
    let lendDescription = "";

    if (directVisit) {
        lendDescription = "直接来店";
    } else if (arrivalFlight) {
        lendDescription = `✈ ${arrivalFlight}`;
    } else {
        lendDescription = "搭乗便確認（来店方法確認）";
    }

    if (optionsText) lendDescription += optionsText;




    try {
        // ★ 貸出イベントを作成
        const lendEvent = {
            summary: lendSummary,
            start: { dateTime: lendDate, timeZone: "Asia/Tokyo" },
            end: { dateTime: oneHourBefore(lendDate), timeZone: "Asia/Tokyo" },
            description: lendDescription,
            colorId: "0", 
        };

        const lendResponse = await calendar.events.insert({
            calendarId: calendarId,
            resource: lendEvent,
        });

        // ★ 返却イベントを作成
        const returnEvent = {
            summary: returnSummary,
            start: { dateTime: returnDate, timeZone: "Asia/Tokyo" },
            end: { dateTime: oneHourBefore(returnDate), timeZone: "Asia/Tokyo" },
            // description: lendDescription,
            colorId: colorId,
        };

        const returnResponse = await calendar.events.insert({
            calendarId: calendarId,
            resource: returnEvent,
        });

        return new Response(JSON.stringify({
            success: true,
            lendEventUrl: lendResponse.data.htmlLink,
            returnEventUrl: returnResponse.data.htmlLink
        }), { status: 200 });

    } catch (error) {
        console.error("Googleカレンダー登録エラー:", error);
        return new Response(JSON.stringify({ 
            success: false, 
            error: error.message || "カレンダー登録に失敗しました",
            details: error.response?.data || "詳細情報なし"
        }), { status: 500 });
    }
}
