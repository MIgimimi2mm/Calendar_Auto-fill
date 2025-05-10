export async function POST(req) {
    const body = await req.text();
    const { password } = JSON.parse(body);

    if (password === process.env.APP_PASSWORD) {
        return new Response(JSON.stringify({ success: true }), { status: 200 });
    }

    return new Response(JSON.stringify({ success: false }), { status: 401 });
}
