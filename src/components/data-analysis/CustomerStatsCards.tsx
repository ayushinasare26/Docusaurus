"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Users, UserCheck, UserX } from "lucide-react";

interface Customer {
  custid: number;
  isSuspended: number;
  isdeleted: number;
}

export default function CustomerStatsCards() {
  const router = useRouter();
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    suspended: 0
  });
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const res = await fetch('/api/customers');
        if (res.status === 401) {
          router.replace('/signin');
          return;
        }

        if (!res.ok) {
          let details = "";
          try {
            const payload = await res.json();
            details = payload?.error ? ` - ${payload.error}` : "";
          } catch {
            // ignore parse errors
          }
          setErrorMessage(`Failed to load customers (${res.status})${details}`);
          return;
        }

        const data = await res.json();
        
        if (Array.isArray(data)) {
          const total = data.length;
          const active = data.filter((c: Customer) => !c.isSuspended && !c.isdeleted).length;
          const suspended = data.filter((c: Customer) => c.isSuspended === 1).length;

          setStats({ total, active, suspended });
        }
      } catch (error) {
        console.error('Error fetching customer stats:', error);
        setErrorMessage('Failed to load customer stats.');
      } finally {
        setLoading(false);
      }
    };
    fetchCustomers();
  }, []);

  const statCards = [
    {
      title: "Total Customers",
      value: stats.total,
      icon: Users,
      color: "bg-blue-100",
      textColor: "text-black-500"
    },
    {
      title: "Active Customers",
      value: stats.active,
      icon: UserCheck,
      color: "bg-green-100",
      textColor: "text-black-500"
    },
    {
      title: "Suspended",
      value: stats.suspended,
      icon: UserX,
      color: "bg-yellow-100",
      textColor: "text-black-500"
    }
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-5 text-sm text-red-700">
        {errorMessage}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {statCards.map((stat, index) => (
        <div key={index} className="rounded-2xl border border-gray-200 bg-white px-6 py-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {stat.title}
              </p>
              <p className={`text-3xl font-bold mt-2 ${stat.textColor}`}>
                {stat.value.toLocaleString()}
              </p>
            </div>
            <div className={`${stat.color} p-3 rounded-full bg-opacity-10`}>
              <stat.icon className={`w-6 h-6 ${stat.textColor}`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
