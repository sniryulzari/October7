const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const respond = (body: object, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  try {
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    if (!RESEND_API_KEY) {
      return respond({ error: 'Email service not configured' }, 500)
    }

    const { subject, body, reply_to } = await req.json()

    if (!subject || !body) {
      return respond({ error: 'Missing required fields' }, 400)
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'זיכרון 7.10 <onboarding@resend.dev>',
        to: 'sniryulzari@gmail.com',
        subject,
        text: body,
        ...(reply_to ? { reply_to } : {}),
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('Resend error:', err)
      return respond({ error: 'Failed to send email' }, 500)
    }

    return respond({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return respond({ error: message }, 500)
  }
})
