"use client";

import { useState } from "react";

export default function Home() {
    const [inputText, setInputText] = useState("");
    const [responseData, setResponseData] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [passwordInput, setPasswordInput] = useState("");

    // ログインチェック
    const handleLogin = async () => {
        const res = await fetch("/api/login", {
            method: "POST",
            body: JSON.stringify({ password: passwordInput }),
        });

        if (res.ok) {
            setIsAuthenticated(true);
        } else {
            alert("パスワードが間違っています");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const parseResponse = await fetch("/api/parse-text", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: inputText }),
        });

        const eventData = await parseResponse.json();
        setResponseData(eventData);

        const calendarResponse = await fetch("/api/add-event", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(eventData),
        });

        const calendarData = await calendarResponse.json();
        if (calendarData.success) {
            alert(`Googleカレンダーに予定を追加しました！\n${calendarData.lendEventUrl}`);
        } else {
            alert(`カレンダー登録に失敗しました\nエラー内容: ${calendarData.error || '不明なエラーが発生しました'}`);
        }
    };

    // 未認証ならログインフォームを表示
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4">
                <h1 className="text-2xl font-bold mb-4">パスワードを入力してください</h1>
                <input
                    type="password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="border p-2 rounded mb-2"
                    placeholder="パスワード"
                />
                <button
                    onClick={handleLogin}
                    className="p-2 bg-blue-600 text-white rounded"
                >
                    ログイン
                </button>
            </div>
        );
    }

    // 認証済みなら本来のフォームを表示
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
            <h1 className="text-2xl font-bold mb-4">カレンダーに自動入力</h1>
            <form onSubmit={handleSubmit} className="w-full max-w-lg">
                <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="ここにテキストを貼り付け"
                    rows={6}
                    className="w-full p-2 border rounded"
                />
                <button
                    type="submit"
                    className="mt-2 p-2 bg-blue-500 text-white rounded"
                >
                    送信
                </button>
            </form>

            {responseData && (
                <div className="mt-4 p-4 border rounded w-full max-w-lg">
                    <h2 className="text-lg font-bold">抽出ログ</h2>
                    <pre className="bg-gray-100 p-2 rounded">{JSON.stringify(responseData, null, 2)}</pre>
                </div>
            )}
        </div>
    );
}
