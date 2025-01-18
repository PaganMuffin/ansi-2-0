import type { APIRoute } from 'astro';
export const prerender = false;

export const GET: APIRoute = async ({ params, locals, request }) => {
  try {
    const { id } = params;
    if (!id) {
      return new Response('Missing file ID', { status: 400 });
    }

    const db = locals.runtime.env.DB_ANSI_OLD;
    const bucket = locals.runtime.env.R2_ANSI_OLD;

    // Pobierz IP użytkownika
    const ip = request.headers.get('cf-connecting-ip') || 
               request.headers.get('x-forwarded-for') || 
               'unknown';
    
    // Pobierz User-Agent
    const userAgent = request.headers.get('user-agent') || 'unknown';

    console.log(new Date().toISOString(), ip, userAgent);

    // Pobierz plik z R2
    const object = await bucket.get(`${id}.zip`);

    if (!object) {
      return new Response('File not found', { status: 404 });
    }

    const headers = new Headers();
    headers.set('Content-Type', 'application/zip');
    headers.set('Content-Disposition', `attachment; filename="${id}.zip"`);
    object.writeHttpMetadata(headers);

    return new Response(object.body, {
      headers
    });

  } catch (error) {
    console.error('Download error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}; 