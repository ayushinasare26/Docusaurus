import { NextResponse } from 'next/server';
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

export async function POST(request: Request) {
  try {
    const { customers } = await request.json();
    
    if (!customers || !Array.isArray(customers)) {
      return NextResponse.json({ success: false, error: 'Invalid customers array' }, { status: 400 });
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ success: false, error: 'ELEVENLABS_API_KEY not configured' }, { status: 500 });
    }

    const agentId = 'agent_4101kvqs4df0f9avr2zr9tq5g7v1';

    const client = new ElevenLabsClient({ apiKey });

    const recipients = [];

    for (const customer of customers) {
      const recipientNumber = customer.contactmain1 || customer.contactno1;
      const customerName = customer.custcompanyname || customer.custcompany || customer.custname || 'Customer';

      if (!recipientNumber) {
        continue;
      }
      
      const cleanNumber = String(recipientNumber).replace(/\D/g, '');
      // Ensure the number has a '+' prefix if it's missing (assuming international format)
      const formattedNumber = cleanNumber.startsWith('+') ? cleanNumber : `+${cleanNumber}`;

      let serviceTypeMapped = 'null';
      if (customer.stype === 'VP') serviceTypeMapped = 'VoIP';
      else if (customer.stype === 'IT') serviceTypeMapped = 'IT';
      else if (customer.stype) serviceTypeMapped = customer.stype;

      let statusMapped = 'null';
      if (customer.paidThisMonth !== undefined) {
        statusMapped = customer.paidThisMonth ? 'Paid' : 'Unpaid';
      }

      recipients.push({
        phoneNumber: formattedNumber,
        conversationInitiationClientData: {
          dynamicVariables: {
            customer_name: customerName || 'null',
            amount: customer.amount !== undefined ? String(customer.amount) : 'null',
            payment_type: customer.ptype || 'null',
            service_type: serviceTypeMapped,
            payment_date: customer.paymentdate ? new Date(customer.paymentdate).toLocaleDateString() : 'null',
            status: statusMapped
          }
        }
      });
    }

    if (recipients.length === 0) {
      return NextResponse.json({ success: false, error: 'No valid phone numbers found for selected customers' }, { status: 400 });
    }

    const response = await client.conversationalAi.batchCalls.create({
      callName: `Payment Reminder - ${new Date().toLocaleString()}`,
      agentId: agentId,
      agentPhoneNumberId: 'phnum_9701kvr7ca72evyv3pzr8n1qndp0',
      recipients: recipients
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Batch call initiated', 
      batchId: response.id,
      recipientCount: recipients.length
    });

  } catch (error: any) {
    console.error("ElevenLabs API error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
