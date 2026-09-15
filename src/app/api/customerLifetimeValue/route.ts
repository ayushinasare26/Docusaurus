import { NextResponse } from "next/server";
import { query } from "@/lib/mysql";

export async function GET() {
  try {
    const sqlQuery = `
      SELECT 
        c.custid,
        c.custname,
        c.joindate,
        c.isdeleted,
        c.isSuspended,
        COALESCE(SUM(i.total - i.prevbal + i.paymentreceived), 0) as totalRevenue,
        COUNT(DISTINCT i.invoiceno) as totalInvoices,
        COALESCE(AVG(i.total - i.prevbal + i.paymentreceived), 0) as avgInvoiceAmount,
        COALESCE(SUM(i.monthly_rental), 0) as totalMonthlyRental,
        COALESCE(SUM(i.usagecharges), 0) as totalUsageCharges,
        DATEDIFF(CURDATE(), c.joindate) as daysActive,
        TIMESTAMPDIFF(MONTH, c.joindate, CURDATE()) as monthsActive
      FROM customer c
      LEFT JOIN invoices i ON c.custid = i.custid
      WHERE c.isdeleted = 0 AND COALESCE(c.isSuspended, 0) = 0
      AND c.custname != 'Pioneer Global Services Ltd'
      GROUP BY c.custid, c.custname, c.joindate, c.isdeleted, c.isSuspended
      HAVING totalRevenue > 0
      ORDER BY totalRevenue DESC
      LIMIT 100
    `;

    const rows: any = await query(sqlQuery);

    // Calculate additional metrics
    const customersWithCLV = rows.map((customer: any) => {
      // Handle the fact that MySQL returns numbers or strings depending on configuration/driver
      const totalRevenue = typeof customer.totalRevenue === 'string' ? parseFloat(customer.totalRevenue) : customer.totalRevenue;
      const avgInvoiceAmount = typeof customer.avgInvoiceAmount === 'string' ? parseFloat(customer.avgInvoiceAmount) : customer.avgInvoiceAmount;
      const monthsActive = customer.monthsActive || 1;
      const avgMonthlySpend = totalRevenue / monthsActive;

      return {
        custid: customer.custid,
        custname: customer.custname,
        joindate: customer.joindate,
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        totalInvoices: customer.totalInvoices,
        avgInvoiceAmount: parseFloat(avgInvoiceAmount.toFixed(2)),
        avgMonthlySpend: parseFloat(avgMonthlySpend.toFixed(2)),
        daysActive: customer.daysActive,
        monthsActive: customer.monthsActive,
        retentionPeriod: `${Math.floor(customer.monthsActive / 12)}y ${customer.monthsActive % 12}m`
      };
    });

    // Calculate summary statistics
    const totalCustomers = customersWithCLV.length;
    const totalRevenue = customersWithCLV.reduce((sum: number, c: any) => sum + c.totalRevenue, 0);
    const avgCLV = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;
    const avgMonthlySpendAll = totalCustomers > 0 ? customersWithCLV.reduce((sum: number, c: any) => sum + c.avgMonthlySpend, 0) / totalCustomers : 0;
    const avgRetentionMonths = totalCustomers > 0 ? customersWithCLV.reduce((sum: number, c: any) => sum + c.monthsActive, 0) / totalCustomers : 0;

    return NextResponse.json({
      summary: {
        totalCustomers,
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        avgCLV: parseFloat(avgCLV.toFixed(2)),
        avgMonthlySpend: parseFloat(avgMonthlySpendAll.toFixed(2)),
        avgRetentionMonths: parseFloat(avgRetentionMonths.toFixed(1))
      },
      customers: customersWithCLV
    });

  } catch (error: any) {
    console.error("Error fetching customer lifetime value:", error);
    return NextResponse.json(
      { error: "Failed to fetch customer lifetime value", details: error.message },
      { status: 500 }
    );
  }
}
