import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { customers } = await request.json();
    
    if (!customers || !Array.isArray(customers)) {
      return NextResponse.json({ success: false, error: 'Invalid customers array' }, { status: 400 });
    }

    const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;

    if (!PHONE_NUMBER_ID || !ACCESS_TOKEN) {
      return NextResponse.json({ success: false, error: 'WhatsApp credentials not configured' }, { status: 500 });
    }

    const results = [];

    for (const customer of customers) {
      const recipient = customer.contactmain1 || customer.contactno1;
      const customerName = customer.custcompanyname || customer.custcompany || customer.custname || 'Customer';

      if (!recipient) {
        results.push({ custid: customer.custid, success: false, error: 'No contact number available' });
        continue;
      }
      
      const cleanNumber = String(recipient).replace(/\D/g, '');

      const payload = {
        messaging_product: "whatsapp",
        to: cleanNumber,
        type: "template",
        template: {
          name: "testing",
          language: {
            code: "en"
          },
          components: [
            {
              type: "body",
              parameters: [
                {
                  type: "text",
                  parameter_name: "user",
                  text: customerName
                },
                {
                  type: "text",
                  parameter_name: "company",
                  text: "Pinevox"
                }
              ]
            }
          ]
        }
      };

      const response = await fetch(`https://graph.facebook.com/v20.0/${PHONE_NUMBER_ID}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok) {
        results.push({ custid: customer.custid, success: true, messageId: data.messages?.[0]?.id });
      } else {
        results.push({ custid: customer.custid, success: false, error: data.error?.message || 'Unknown error' });
      }
    }

    return NextResponse.json({ success: true, results });

  } catch (error: any) {
    console.error("WhatsApp sending error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
