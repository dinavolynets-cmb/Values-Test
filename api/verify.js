export default async function handler(req, res) {
  // GET — перевірка статусу інвойсу
  if (req.method === 'GET') {
    const { orderId } = req.query;
    if (!orderId) return res.status(400).json({ paid: false });

    const token = process.env.MONOBANK_TOKEN;

    try {
      const response = await fetch(`https://api.monobank.ua/api/merchant/invoice/status?invoiceId=${orderId}`, {
        headers: { 'X-Token': token }
      });
      const data = await response.json();
      const paid = data.status === 'success';
      
      // Логуємо успішну оплату
      if (paid && process.env.SHEETS_WEBHOOK_URL) {
        try {
          await fetch(process.env.SHEETS_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId: data.reference || orderId,
              invoiceId: orderId,
              email: '',
              amount: data.amount ? data.amount / 100 : 229,
              role: '',
              dominant: '',
              pcts: '',
              status: 'paid'
            })
          });
        } catch (e) {
          console.error('Sheets log failed:', e.message);
        }
      }
      
      return res.status(200).json({ 
        paid: paid,
        status: data.status,
        reference: data.reference
      });
    } catch (err) {
      return res.status(500).json({ paid: false, error: err.message });
    }
  }

  // POST — webhook від Monobank
  if (req.method === 'POST') {
    const body = req.body;
    console.log('Monobank webhook:', JSON.stringify(body));
    
    if (body.status === 'success' && process.env.SHEETS_WEBHOOK_URL) {
      try {
        await fetch(process.env.SHEETS_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: body.reference || '',
            invoiceId: body.invoiceId || '',
            email: '',
            amount: body.amount ? body.amount / 100 : 229,
            role: '',
            dominant: '',
            pcts: '',
            status: 'webhook_paid'
          })
        });
      } catch (e) {
        console.error('Sheets log failed:', e.message);
      }
    }
    
    return res.status(200).json({ received: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
