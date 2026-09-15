import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/mysql";
import crypto from "crypto";
import gcClient from "@/lib/gocardless";

const webhookEndpointSecret = process.env.GOCARDLESS_WEBHOOK_SECRET || "";

export async function POST(req: NextRequest) {
    try {
        const signatureHeader = req.headers.get("webhook-signature");
        if (!signatureHeader || !webhookEndpointSecret) {
            console.error("Missing webhook signature or secret");
            return NextResponse.json({ error: "Missing signature or secret" }, { status: 400 });
        }

        const rawBody = await req.text();

        const hmac = crypto.createHmac("sha256", webhookEndpointSecret);
        hmac.update(rawBody);
        const signature = hmac.digest("hex");

        if (signature !== signatureHeader) {
            console.error("Invalid webhook signature");
            return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
        }

        const body = JSON.parse(rawBody);
        const events = body.events || [];

        for (const event of events) {
            if (event.resource_type === "payments" && (event.action === "confirmed" || event.action === "paid_out")) {
                const paymentId = event.links.payment;
                if (!paymentId) continue;

                const existing = await query(
                    `SELECT paymentid FROM paymentdetails WHERE gocardless_payment_id = ?`,
                    [paymentId]
                ) as any[];

                if (existing.length === 0) {
                    const payment = await gcClient.payments.find(paymentId);

                    const mandateId = payment.links?.mandate;
                    if (!mandateId) continue;

                    const mandate = await gcClient.mandates.find(mandateId);
                    const gcCustomerId = mandate.links?.customer;
                    if (!gcCustomerId) continue;

                    const mapping = await query(
                        `SELECT custid FROM customer_payment_ids WHERE gocardless_id = ?`,
                        [gcCustomerId]
                    ) as any[];

                    if (mapping.length > 0) {
                        const custid = mapping[0].custid;
                        const amountMajor = Number(payment.amount || 0) / 100;

                        await query(
                            `INSERT INTO paymentdetails (custid, invoiceno, paymentdate, amount, ptype, stype, comments, gocardless_payment_id) 
               VALUES (?, 0, ?, ?, 'DDT', 'VP', 'GoCardless Webhook Sync', ?)`,
                            [custid, (payment.created_at || '').split('T')[0], amountMajor, paymentId]
                        );
                    }
                }
            }
        }

        return NextResponse.json({ message: "Webhook processed" }, { status: 200 });
    } catch (error: any) {
        console.error("Error processing GoCardless webhook:", error);
        return NextResponse.json({ error: error.message || "Failed to process webhook" }, { status: 500 });
    }
}
