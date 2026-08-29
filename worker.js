const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Telegram-Id",
  "Content-Type": "application/json; charset=utf-8",
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: CORS,
  });
}

function getUserId(request, url) {
  return (
    request.headers.get("X-Telegram-Id") ||
    url.searchParams.get("telegram_id") ||
    "demo"
  );
}

async function readBody(request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS });
    }

    const url = new URL(request.url);
    const path = url.pathname;
    const userId = getUserId(request, url);

    try {
      // Проверка Worker
      if (path === "/" || path === "/api") {
        return json({
          ok: true,
          service: "Habit-tracker API",
        });
      }

      // Получить привычки пользователя
      if (path === "/api/habits" && request.method === "GET") {
        const result = await env.DB.prepare(
          `SELECT id, name, emoji, color, created_at, archived
           FROM habits
           WHERE telegram_id = ?
           ORDER BY id DESC`
        )
          .bind(userId)
          .all();

        return json({
          ok: true,
          habits: result.results || [],
        });
      }

      // Добавить привычку
      if (path === "/api/habits" && request.method === "POST") {
        const data = await readBody(request);

        const name = String(data.name || "").trim();
        const emoji = String(data.emoji || "✓");
        const color = String(data.color || "#A855F7");

        if (!name) {
          return json(
            {
              ok: false,
              error: "Название привычки пустое",
            },
            400
          );
        }

        const result = await env.DB.prepare(
          `INSERT INTO habits
           (telegram_id, name, emoji, color, created_at, archived)
           VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, 0)
           RETURNING id, name, emoji, color, created_at, archived`
        )
          .bind(userId, name, emoji, color)
          .first();

        return json(
          {
            ok: true,
            habit: result,
          },
          201
        );
      }

      // Удалить привычку
      if (
        path.startsWith("/api/habits/") &&
        request.method === "DELETE"
      ) {
        const id = Number(path.split("/").pop());

        if (!id) {
          return json(
            {
              ok: false,
              error: "Неверный ID привычки",
            },
            400
          );
        }

        await env.DB.prepare(
          `DELETE FROM habit_completions
           WHERE habit_id = ?
           AND telegram_id = ?`
        )
          .bind(id, userId)
          .run();

        await env.DB.prepare(
          `DELETE FROM habits
           WHERE id = ?
           AND telegram_id = ?`
        )
          .bind(id, userId)
          .run();

        return json({
          ok: true,
        });
      }

      // Получить выполненные привычки
      if (
        path === "/api/completions" &&
        request.method === "GET"
      ) {
        const from =
          url.searchParams.get("from") || "2000-01-01";

        const to =
          url.searchParams.get("to") || "2100-01-01";

        const result = await env.DB.prepare(
          `SELECT habit_id, date, completed
           FROM habit_completions
           WHERE telegram_id = ?
           AND date BETWEEN ? AND ?
           ORDER BY date`
        )
          .bind(userId, from, to)
          .all();

        return json({
          ok: true,
          completions: result.results || [],
        });
      }

      // Отметить привычку выполненной / снять отметку
      if (
        path === "/api/completions" &&
        request.method === "POST"
      ) {
        const data = await readBody(request);

        const habitId = Number(data.habit_id);
        const date = String(data.date || "");
        const completed = data.completed ? 1 : 0;

        if (!habitId || !date) {
          return json(
            {
              ok: false,
              error: "habit_id и date обязательны",
            },
            400
          );
        }

        if (completed) {
          await env.DB.prepare(
            `INSERT INTO habit_completions
             (habit_id, telegram_id, date, completed)
             VALUES (?, ?, ?, 1)
             ON CONFLICT(habit_id, date)
             DO UPDATE SET completed = 1`
          )
            .bind(habitId, userId, date)
            .run();
        } else {
          await env.DB.prepare(
            `DELETE FROM habit_completions
             WHERE habit_id = ?
             AND telegram_id = ?
             AND date = ?`
          )
            .bind(habitId, userId, date)
            .run();
        }

        return json({
          ok: true,
        });
      }

      return json(
        {
          ok: false,
          error: "Not found",
        },
        404
      );
    } catch (error) {
      return json(
        {
          ok: false,
          error: error?.message || String(error),
        },
        500
      );
    }
  },
};