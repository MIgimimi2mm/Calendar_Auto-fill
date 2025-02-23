"use client"; // App Routerでは use client を指定

import { useState } from "react";

export default function Home() {
    const [inputText, setInputText] = useState("");
    const [responseData, setResponseData] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();

        // バックエンドAPIにテキストを送信
        const response = await fetch("/api/parse-text", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: inputText }),
        });

        const data = await response.json();
        setResponseData(data);
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
            <h1 className="text-2xl font-bold mb-4">テキストを入力して解析</h1>
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
                    <h2 className="text-lg font-bold">解析結果</h2>
                    <pre className="bg-gray-100 p-2 rounded">{JSON.stringify(responseData, null, 2)}</pre>
                </div>
            )}
        </div>
    );
}
