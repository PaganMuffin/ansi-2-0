import type { APIRoute } from 'astro';
export const prerender = false;

interface DBEntry {
  id: string;
  title_romaji: string;
  title_english: string | null;
  title_other: string | null;
  date: string;
  author_id: string;
  author_nick: string;
}

export const GET: APIRoute = async ({ request, locals }) => {
    try{
        const db = locals.runtime.env.DB_ANSI_OLD;

        const url = new URL(request.url);
        const q = url.searchParams.get('q');
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = parseInt(url.searchParams.get('limit') || '20');
        let sort = url.searchParams.get('sort') || 'desc';
        if (!['asc', 'desc'].includes(sort.toLowerCase())) {
            sort = 'desc';
        }

        const offset = (page - 1) * limit;

        let countQuery;
        let totalResult: {total: number} | null = null;

        if (q) {
            countQuery = `SELECT COUNT(*) as total FROM ansi_old_fts(?)`;
            totalResult = await db.prepare(countQuery).bind(q).first<{total: number}>();
        } else {
            countQuery = `SELECT COUNT(*) as total FROM ansi_old`;
            totalResult = await db.prepare(countQuery).first<{total: number}>();
        }
        const total = totalResult?.total || 0;
        const hasMore = offset + limit < total;

        let finalQuery;
        let entries = []
        if (q) {
            finalQuery = `SELECT a.id, a.title_romaji, a.title_english, a.title_other, a.date, a.author_id, a.author_nick FROM ansi_old_fts(?) LEFT JOIN ansi_old AS a ON ansi_old_fts.rowid = a.id ORDER BY a.date ${sort.toUpperCase()}, a.title_romaji ASC LIMIT ? OFFSET ?`;
            entries = (await db.prepare(finalQuery).bind(q, limit, offset).all<DBEntry>()).results;
        } else {
            finalQuery = `SELECT a.id, a.title_romaji, a.title_english, a.title_other, a.date, a.author_id, a.author_nick FROM ansi_old AS a ORDER BY a.date ${sort.toUpperCase()}, a.title_romaji ASC LIMIT ? OFFSET ?`;
            entries = (await db.prepare(finalQuery).bind(limit, offset).all<DBEntry>()).results;
        }



        const formattedEntries = entries.map(entry => ({
            id: parseInt(entry.id),
            title: {
                romaji: entry.title_romaji,
                english: entry.title_english || entry.title_romaji,
                other: entry.title_other || ''
            },
            date: parseInt(entry.date),
            author: {
                id: parseInt(entry.author_id),
                nick: entry.author_nick
            }
        }));

        const response = {
            entries: formattedEntries,
            total,
            hasMore
        };

        return new Response(JSON.stringify(response));
    } catch (error) {
        console.error(error);
        return new Response('Internal Server Error', { status: 500 });
    }
}; 

