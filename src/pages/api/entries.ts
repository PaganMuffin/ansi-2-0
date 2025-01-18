import type { APIRoute } from 'astro';
export const prerender = false;
interface NewEntry {
  title: {
    romaji: string;
    english?: string;
    other?: string;
  };
  author: {
    id: string;
    nick: string;
  };
  id: number;
  date: string;
}

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const db = locals.runtime.env.DB_ANSI_OLD;
    const entry: NewEntry = await request.json();

    // Walidacja wymaganych pól
    if (!entry.title.romaji || !entry.author.id || !entry.author.nick) {
      return new Response(JSON.stringify({
        error: 'Missing required fields'
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log(entry); 

    const query = `
      INSERT INTO ansi_old (
        id,
        title_romaji,
        title_english,
        title_other,
        date,
        author_id,
        author_nick
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    await db.prepare(query).bind(
      entry.id,
      entry.title.romaji,
      entry.title.english || null,
      entry.title.other || null,
      new Date(entry.date).getTime(),
      entry.author.id,
      entry.author.nick
    ).run();

    return new Response(JSON.stringify({
        success: true
    }), { 
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error adding entry:', error);
    return new Response(JSON.stringify({
      error: 'Internal Server Error'
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}; 