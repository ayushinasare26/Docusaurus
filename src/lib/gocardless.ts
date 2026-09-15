import gocardless from 'gocardless-nodejs';
import * as constants from 'gocardless-nodejs/constants';

const isSandbox = process.env.GOCARDLESS_ENVIRONMENT === 'sandbox';

const gcClient = gocardless(
    process.env.GOCARDLESS_ACCESS_TOKEN || '',
    isSandbox ? constants.Environments.Sandbox : constants.Environments.Live
);

export default gcClient;

export async function getCustomerPayments(
    customerId: string,
    createdAtGt: string,
    createdAtLt: string
) {
    try {
        const response = await gcClient.payments.list({
            customer: customerId,
            created_at: {
                gt: createdAtGt,
                lt: createdAtLt,
            },
        });
        return response.payments;
    } catch (error) {
        console.error(`Error fetching GoCardless payments for customer ${customerId}:`, error);
        return [];
    }
}
