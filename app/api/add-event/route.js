import { google } from "googleapis";

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

export async function POST(req) {
    const { eventName, lendDate, returnDate, description, shopName } = await req.json();

    if (!eventName || !lendDate || !returnDate || !shopName) {
        return new Response(JSON.stringify({ error: "イベント情報が不足しています" }), { status: 400 });
    }

    // 受付店舗に応じてカレンダーIDを動的に決定
    const calendarId = shopName.includes("函館") ? HAKODATE_CALENDAR_ID : ITAMI_CALENDAR_ID;

    if (!calendarId) {
        return new Response(JSON.stringify({ error: "カレンダーIDが見つかりません" }), { status: 400 });
    }

    try {
        const event = {
            summary: eventName,
            start: { dateTime: lendDate, timeZone: "Asia/Tokyo" },
            end: { dateTime: returnDate, timeZone: "Asia/Tokyo" },
            description: description,
        };

        const response = await calendar.events.insert({
            calendarId: calendarId,
            resource: event,
        });

        return new Response(JSON.stringify({ success: true, eventUrl: response.data.htmlLink }), { status: 200 });
    } catch (error) {
        console.error("Googleカレンダー登録エラー:", error);
        return new Response(JSON.stringify({ error: "カレンダー登録に失敗しました" }), { status: 500 });
    }
}
