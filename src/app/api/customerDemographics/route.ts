import { NextResponse } from "next/server";
import { query } from "@/lib/mysql";

// Country mapping for cities
const cityToCountry: Record<string, string> = {
  // UK Cities
  "London": "United Kingdom",
  "Harrow": "United Kingdom",
  "Middlesex": "United Kingdom",
  "Middx": "United Kingdom",
  "Poyle": "United Kingdom",
  "Southall": "United Kingdom",
  "Heston": "United Kingdom",
  "Watford": "United Kingdom",
  "Wembley": "United Kingdom",
  "Gloucestershire": "United Kingdom",
  "Essex": "United Kingdom",
  "Hounslow": "United Kingdom",
  "ISLEWORTH": "United Kingdom",
  "Birmingham": "United Kingdom",
  "Borehamwood": "United Kingdom",
  "Reading": "United Kingdom",
  "Stafford": "United Kingdom",
  "Bedford": "United Kingdom",
  "St Neots": "United Kingdom",
  "Hemel Hempstead": "United Kingdom",
  "Stanmore": "United Kingdom",
  "Burton on Trent": "United Kingdom",
  "Leicester": "United Kingdom",
  "SLOUGH": "United Kingdom",
  "Worcestershire": "United Kingdom",
  "Sounthall": "United Kingdom",
  "Hertfordshire": "United Kingdom",
  "Lechlade": "United Kingdom",
  "Berkshire": "United Kingdom",
  "Monmouthshire": "United Kingdom",
  "Manor Park": "United Kingdom",
  "Acton": "United Kingdom",
  "Devon": "United Kingdom",
  "Surrey": "United Kingdom",
  "Cambs": "United Kingdom",
  "Edinburgh": "United Kingdom",
  "Aldershot": "United Kingdom",
  "Kings Langley": "United Kingdom",
  "Bracknell": "United Kingdom",
  "Hayes": "United Kingdom",
  "Norwich": "United Kingdom",
  "Dorset": "United Kingdom",
  "Farnborough": "United Kingdom",
  "Uxbridge": "United Kingdom",
  "UXBRIDGE": "United Kingdom",
  "Lancaster": "United Kingdom",
  "Nottingham": "United Kingdom",
  "Milton Keynes": "United Kingdom",
  "Grays": "United Kingdom",
  "West Sussex": "United Kingdom",
  "Staines": "United Kingdom",
  "Feltham": "United Kingdom",
  "Worcester Park": "United Kingdom",
  "Dunstable": "United Kingdom",
  "Manchester": "United Kingdom",
  "Edgware": "United Kingdom",
  "Pinner": "United Kingdom",
  "Bulkington": "United Kingdom",
  "Sunbury": "United Kingdom",
  "Loughton": "United Kingdom",
  "Keynes": "United Kingdom",
  "Northamptonshire": "United Kingdom",
  "Rickmansworth": "United Kingdom",
  "ashford": "United Kingdom",
  "Liverpool": "United Kingdom",
  "WINNERSH": "United Kingdom",
  "Goodwick": "United Kingdom",
  "Oldham": "United Kingdom",
  "Carrickfergus": "United Kingdom",
  "Frimley": "United Kingdom",
  "Basildon": "United Kingdom",
  "Eastleigh": "United Kingdom",
  "Aylesbury": "United Kingdom",
  "Southhall": "United Kingdom",
  "St. Albans": "United Kingdom",
  "Southhampton": "United Kingdom",
  "Frimley Camberly": "United Kingdom",
  "Kent": "United Kingdom",
  "Slough": "United Kingdom",
  "South Harrow": "United Kingdom",
  "Cambridgeshire": "United Kingdom",

  // India Cities
  "Ahmedabad": "India",
  "Thane": "India",
  "Bhubaneswar": "India",
  "Delhi": "India",
  "Dehradun": "India",
  "Vadodara": "India",
  "Mumbai": "India",
  "Navi Mumbai": "India",
  "Rajkot": "India",
  "Pune": "India",
  "Gurgaon": "India",
  "Mohali": "India",
  "Kolkata": "India",
  "Gaziabad": "India",

  // Other Countries
  "Germany": "Germany",
  "Singapore": "Singapore",
  "Florida": "United States",
  "USA": "United States",
  "CT": "United States",
  "Willimington": "United States",
  "Estonia": "Estonia",
  "Harju maakond": "Estonia",
  "Chatham": "United Kingdom"
};

export async function GET() {
  try {
    const customers: any = await query(
      `SELECT city, COUNT(*) as count 
       FROM customer 
       WHERE city IS NOT NULL AND city != '' AND isdeleted = 0
       GROUP BY city 
       ORDER BY count DESC`
    );

    // Group by country
    const countryStats: Record<string, any> = {};
    let totalCustomers = 0;

    customers.forEach((row: any) => {
      const city = row.city.trim();
      const count = parseInt(row.count);
      totalCustomers += count;

      // Map city to country
      let country = "Other";

      // Check for exact match or partial match
      for (const [cityKey, countryValue] of Object.entries(cityToCountry)) {
        if (city.toLowerCase().includes(cityKey.toLowerCase()) ||
          cityKey.toLowerCase().includes(city.toLowerCase())) {
          country = countryValue;
          break;
        }
      }

      if (!countryStats[country]) {
        countryStats[country] = {
          country: country,
          customers: 0,
          cities: []
        };
      }

      countryStats[country].customers += count;
      countryStats[country].cities.push({
        name: city,
        count: count
      });
    });

    // Calculate percentages and sort
    const demographics = Object.values(countryStats)
      .map((stat: any) => ({
        ...stat,
        percentage: ((stat.customers / totalCustomers) * 100).toFixed(2)
      }))
      .sort((a: any, b: any) => b.customers - a.customers);

    return NextResponse.json({
      demographics,
      totalCustomers,
      totalCountries: demographics.length
    });
  } catch (error) {
    console.error("Error fetching customer demographics:", error);
    return NextResponse.json(
      { error: "Failed to fetch customer demographics" },
      { status: 500 }
    );
  }
}
