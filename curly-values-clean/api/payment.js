export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = process.env.MONOBANK_TOKEN;
  if (!token) {
    return res.status(500).json({ error: 'Payment not configured' });
  }

  const { email, role, pcts, dominant } = req.body;
  if (!email || !role || !pcts || !dominant) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const domain = req.headers.host || 'test-2-mu-olive.vercel.app';
  const orderId = 'curly_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);

  try {
    const response = await fetch('https://api.monobank.ua/api/merchant/invoice/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Token': token
      },
      body: JSON.stringify({
        amount: 22900,
        ccy: 980,
        merchantPaymInfo: {
          reference: orderId,
          destination: 'Розшифровка ціннісного профілю — Curly Management',
          basketOrder: [{
            name: 'Розшифровка ціннісного профілю',
            qty: 1,
            sum: 22900,
            unit: 'шт.'
          }]
        },
        redirectUrl: `https://${domain}/?paid=1&order=${orderId}`,
        webHookUrl: `https://${domain}/api/verify?order=${orderId}`,
        validity: 3600
      })
    });

    const data = await response.json();
    
    if (!data.invoiceId || !data.pageUrl) {
      return res.status(500).json({ error: 'Monobank error', details: data });
    }

    // Логуємо створення інвойсу
    const sheetsUrl = process.env.SHEETS_WEBHOOK_URL;
    if (sheetsUrl) {
      try {
        await fetch(sheetsUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: orderId,
            invoiceId: data.invoiceId,
            email: email,
            amount: 229,
            role: role,
            dominant: dominant,
            pcts: JSON.stringify(pcts),
            status: 'invoice_created'
          })
        });
      } catch (e) {
        console.error('Sheets log failed:', e.message);
      }
    }

    res.status(200).json({
      invoiceId: data.invoiceId,
      pageUrl: data.pageUrl,
      orderId: orderId
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
