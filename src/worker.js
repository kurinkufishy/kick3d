import { DurableObject } from "cloudflare:workers";

// /ws/1234?role=h|g&id=xxxx → 部屋ごとのDurable Objectへ
export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const m = url.pathname.match(/^\/ws\/(\d{4})$/);
    if (m) {
      if (req.headers.get("Upgrade") !== "websocket") return new Response("websocket only", { status: 426 });
      return env.ROOMS.get(env.ROOMS.idFromName(m[1])).fetch(req);
    }
    return env.ASSETS.fetch(req);
  },
};

// ホスト1人＋ゲスト1人の部屋。届いたメッセージを相手にそのまま流すだけ
export class Room extends DurableObject {
  async fetch(req) {
    const url = new URL(req.url);
    const role = url.searchParams.get("role");
    const id = (url.searchParams.get("id") || "").slice(0, 16);
    const [client, server] = Object.values(new WebSocketPair());
    let err = null;
    if (role !== "h" && role !== "g") err = "bad";
    else if (role === "h" && this.ctx.getWebSockets("h").length) err = "taken";
    else if (role === "g") {
      if (!this.ctx.getWebSockets("h").length) err = "notfound";
      else if (this.ctx.getWebSockets("g").some(w => (w.deserializeAttachment() || {}).id !== id)) err = "full";
    }
    if (err) {
      server.accept();
      server.send(JSON.stringify({ err }));
      server.close(1000, err);
      return new Response(null, { status: 101, webSocket: client });
    }
    this.ctx.acceptWebSocket(server, [role]);
    server.serializeAttachment({ role, id });
    server.send(JSON.stringify({ ok: 1 }));
    return new Response(null, { status: 101, webSocket: client });
  }
  others(ws) {
    const { role } = ws.deserializeAttachment() || {};
    return this.ctx.getWebSockets(role === "h" ? "g" : "h");
  }
  webSocketMessage(ws, msg) {
    if (typeof msg !== "string" || msg.length > 8000) return;
    for (const w of this.others(ws)) { try { w.send(msg); } catch (e) {} }
  }
  webSocketClose(ws, code) {
    for (const w of this.others(ws)) { try { w.send('{"bye":1}'); } catch (e) {} }
    try { ws.close(code === 1005 ? 1000 : code, "bye"); } catch (e) {}
  }
  webSocketError(ws) { this.webSocketClose(ws, 1011); }
}
