const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Telegram-Init-Data",
};

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      const url = new URL(request.url);

      // Проверяем Telegram Web App
      const telegramId = await getTelegramUserId(request, env);

      if (!telegramId) {
        return json(
          { error: "Telegram user not authorized" },
          401
        );
      }

      // -------------------------
      // ПОЛЬЗОВАТЕЛЬ
      // -------------------------

      if (url.pathname === "/api/me" && request.method === "GET") {
        const user = await env.DB.prepare(`
          SELECT telegram_id
          FROM habits
          WHERE telegram_id = ?
          LIMIT 1
        `)
          .bind(telegramId)
          .first();

        return json({
          telegram_id: telegramId,
          exists: !!user
        });
      }

      // -------------------------
      // ПОЛУЧИТЬ ПРИВЫЧКИ
      // -------------------------

      if (url.pathname === "/api/habits" && request.method === "GET") {
        const result = await env.DB.prepare(`
          SELECT
            id,
            telegram_id,
            name,
            emoji,
            color,
            created_at,
            archived
          FROM habits
          WHERE telegram_id = ?
            AND archived = 0
          ORDER BY id DESC
        `)
          .bind(telegramId)
          .all();

        return json(result.results);
      }

      // -------------------------
      // ДОБАВИТЬ ПРИВЫЧКУ
      // -------------------------

      if (url.pathname === "/api/habits" && request.method === "POST") {
        const body = await request.json();

        const name = String(body.name || "").trim();
        const emoji = String(body.emoji || "✓");
        const color = String(body.color || "#ffffff");

        if (!name) {
          return json(
            { error: "Habit name is required" },
            400
          );
        }

        const result = await env.DB.prepare(`
          INSERT INTO habits
          (telegram_id, name, emoji, color, archived)
          VALUES (?, ?, ?, ?, 0)
        `)
          .bind(
            telegramId,
            name,
            emoji,
            color
          )
          .run();

        return json({
          success: true,
          id: result.meta.last_row_id
        });
      }

      // -------------------------
      // УДАЛИТЬ ПРИВЫЧКУ
      // -------------------------

      if (
        url.pathname.startsWith("/api/habits/") &&
        request.method === "DELETE"
      ) {
        const id = url.pathname.split("/").pop();

        await env.DB.prepare(`
          UPDATE habits
          SET archived = 1
          WHERE id = ?
            AND telegram_id = ?
        `)
          .bind(id, telegramId)
          .run();

        return json({
          success: true
        });
      }

      // -------------------------
      // ПОЛУЧИТЬ ВЫПОЛНЕНИЯ
      // -------------------------

      if (
        url.pathname === "/api/completions" &&
        request.method === "GET"
      ) {
        const result = await env.DB.prepare(`
          SELECT
            id,
            habit_id,
            date,
            completed
          FROM habit_completions
          WHERE telegram_id = ?
          ORDER BY date DESC
        `)
          .bind(telegramId)
          .all();

        return json(result.results);
      }

      // -------------------------
      // ОТМЕТИТЬ ПРИВЫЧКУ
      // -------------------------

      if (
        url.pathname === "/api/completions" &&
        request.method === "POST"
      ) {
        const body = await request.json();

        const habitId = Number(body.habit_id);
        const date = String(body.date || "");
        const completed = body.completed ? 1 : 0;

        if (!habitId || !date) {
          return json(
            { error: "habit_id and date are required" },
            400
          );
        }

        // Проверяем, что привычка принадлежит пользователю
        const habit = await env.DB.prepare(`
          SELECT id
          FROM habits
          WHERE id = ?
            AND telegram_id = ?
            AND archived = 0
        `)
          .bind(habitId, telegramId)
          .first();

        if (!habit) {
          return json(
            { error: "Habit not found" },
            404
          );
        }

        await env.DB.prepare(`
          INSERT INTO habit_completions
          (habit_id, telegram_id, date, completed)
          VALUES (?, ?, ?, ?)
          ON CONFLICT(habit_id, date)
          DO UPDATE SET
            completed = excluded.completed
        `)
          .bind(
            habitId,
            telegramId,
            date,
            completed
          )
          .run();

        return json({
          success: true
        });
      }

      return json(
        { error: "Not found" },
        404
      );

    } catch (error) {
      return json(
        {
          error: error.message
        },
        500
      );
    }
  }
};


// =====================================
// TELEGRAM AUTH
// =====================================

async function getTelegramUserId(request, env) {
  const initData =
    request.headers.get("X-Telegram-Init-Data");

  if (!initData) {
    return null;
  }

  const params = new URLSearchParams(initData);

  const hash = params.get("hash");

  if (!hash) {
    return null;
  }

  params.delete("hash");

  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  const secretKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode("WebAppData"),
    {
      name: "HMAC",
      hash: "SHA-256"
    },
    false,
    ["sign"]
  );

  const botKey = await crypto.subtle.sign(
    "HMAC",
    secretKey,
    new TextEncoder().encode(env.TELEGRAM_BOT_TOKEN)
  );

  const dataKey = await crypto.subtle.importKey(
    "raw",
    botKey,
    {
      name: "HMAC",
      hash: "SHA-256"
    },
    false,
    ["sign"]
  );

  const calculatedHashBuffer =
    await crypto.subtle.sign(
      "HMAC",
      dataKey,
      new TextEncoder().encode(dataCheckString)
    );

  const calculatedHash = [...new Uint8Array(calculatedHashBuffer)]
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");

  if (calculatedHash !== hash) {
    return null;
  }

  const userString = params.get("user");

  if (!userString) {
    return null;
  }

  const user = JSON.parse(userString);

  return String(user.id);
}


// =====================================
// JSON RESPONSE
// =====================================

function json(data, status = 200) {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        ...corsHeaders
      }
    }
  );
}