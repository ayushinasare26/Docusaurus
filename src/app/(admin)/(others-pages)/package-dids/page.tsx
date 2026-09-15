"use client"

import React, { useEffect, useState } from "react"
import { usePageHeading } from "@/context/PageHeadingContext"
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table"

type Did = {
  didno: string
  type: number
  custid: number
}

type CustomerPackage = {
  custid: number
  custname: string
  packageid: number
  packagename: string
  duration: number
  didno: string | null
  assignedDids: string[]
  allCustomerDids: string[]
}

export default function PackageDidsPage() {
  const { setHeading } = usePageHeading()
  const [customerPackages, setCustomerPackages] = useState<CustomerPackage[]>([])
  const [loading, setLoading] = useState(false)
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [selectedDids, setSelectedDids] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [customerId, setCustomerId] = useState<string>("")
  const [customerName, setCustomerName] = useState<string>("")

  useEffect(() => {
    setHeading("Package DID Assignment")
  }, [setHeading])

  const fetchCustomerPackages = async () => {
    if (!customerId) {
      alert("Please enter a customer ID")
      return
    }

    setLoading(true)
    setCustomerPackages([])
    try {
      const apiBase = ''
      
      // Fetch customer info, their packages, and their DIDs
      const [customerRes, packagesRes, didsRes] = await Promise.all([
        fetch(`${apiBase}/api/customers`),
        fetch(`${apiBase}/api/package-dids/assignments?custid=${customerId}`),
        fetch(`${apiBase}/api/package-dids/customer-dids?custid=${customerId}`)
      ])

      if (!customerRes.ok || !packagesRes.ok || !didsRes.ok) {
        alert("Failed to fetch customer data. Please check the customer ID.")
        return
      }

      const customers = await customerRes.json()
      const packagesData = await packagesRes.json()
      const didsData = await didsRes.json()

      // Find customer name
      const customer = customers.find((c: any) => c.custid === parseInt(customerId))
      setCustomerName(customer?.custname || 'Unknown Customer')

      // Get all customer DIDs
      const allCustomerDids = didsData.dids?.map((d: any) => d.didno) || []

      // Map assignments directly (they now include packagename and duration from backend)
      const combined: CustomerPackage[] = packagesData.assignments?.map((assignment: any) => ({
        custid: parseInt(customerId),
        custname: customer?.custname || 'Unknown',
        packageid: assignment.packageid,
        packagename: assignment.packagename,
        duration: assignment.duration,
        didno: Array.isArray(assignment.didno) ? assignment.didno.join(',') : assignment.didno,
        assignedDids: Array.isArray(assignment.didno) ? assignment.didno : (assignment.didno ? assignment.didno.split(',') : []),
        allCustomerDids
      })) || []

      setCustomerPackages(combined)
    } catch (error) {
      console.error('Error fetching data:', error)
      alert("Error fetching customer data")
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (pkg: CustomerPackage) => {
    const key = `${pkg.custid}-${pkg.packageid}`
    setEditingKey(key)
    setSelectedDids(pkg.assignedDids)
  }

  const handleCancel = () => {
    setEditingKey(null)
    setSelectedDids([])
  }

  const handleDidToggle = (didno: string) => {
    setSelectedDids(prev => {
      if (prev.includes(didno)) {
        return prev.filter(d => d !== didno)
      } else {
        return [...prev, didno]
      }
    })
  }

  const handleSave = async (custid: number, packageid: number, allCustomerDids: string[]) => {
    setSaving(true)
    try {
      const apiBase = ''
      
      // If all DIDs are selected, send empty array to set NULL (applies to all)
      const didsToSend = selectedDids.length === allCustomerDids.length ? [] : selectedDids
      
      const res = await fetch(`${apiBase}/api/package-dids/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          custid,
          packageid,
          dids: didsToSend
        })
      })

      if (res.ok) {
        alert('Package-DID assignments saved successfully!')
        setEditingKey(null)
        setSelectedDids([])
        fetchCustomerPackages()
      } else {
        const error = await res.json()
        alert(`Error: ${error.message || 'Failed to save assignments'}`)
      }
    } catch (error) {
      console.error('Error saving assignments:', error)
      alert('Failed to save assignments')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="container mx-auto p-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Customer Package DID's
          </h2>

        </div>

        <div className="mb-6 flex gap-4 items-end">
          <div className="flex-1 max-w-md">
            <input
              type="text"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && fetchCustomerPackages()}
              placeholder="Enter customer ID"
              className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={fetchCustomerPackages}
            disabled={loading || !customerId}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
          >
            {loading ? 'Loading...' : 'Search'}
          </button>
        </div>


        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : customerPackages.length === 0 && customerId ? (
          <div className="text-center py-12 text-gray-500">
            No packages found for this customer
          </div>
        ) : customerPackages.length > 0 ? (
          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell isHeader>Customer ID</TableCell>
                  <TableCell isHeader>Customer Name</TableCell>
                  <TableCell isHeader>Package</TableCell>
                  <TableCell isHeader>Duration (mins)</TableCell>
                  <TableCell isHeader>Assigned DIDs</TableCell>
                  <TableCell isHeader>Actions</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customerPackages.map((pkg) => {
                  const key = `${pkg.custid}-${pkg.packageid}`
                  const isEditing = editingKey === key

                  return (
                    <TableRow key={key}>
                      <TableCell>{pkg.custid}</TableCell>
                      <TableCell>{pkg.custname}</TableCell>
                      <TableCell>{pkg.packagename}</TableCell>
                      <TableCell>{pkg.duration}</TableCell>
                      <TableCell>
                        {isEditing ? (
                          <div className="space-y-2 max-w-md">
                            {pkg.allCustomerDids.length === 0 ? (
                              <span className="text-gray-500 text-sm">No DIDs available</span>
                            ) : (
                              <>
                                <div className="mb-2 pb-2 border-b">
                                  <label className="flex items-center space-x-2 text-sm font-medium">
                                    <input
                                      type="checkbox"
                                      checked={selectedDids.length === pkg.allCustomerDids.length && pkg.allCustomerDids.length > 0}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setSelectedDids(pkg.allCustomerDids)
                                        } else {
                                          setSelectedDids([])
                                        }
                                      }}
                                      className="w-4 h-4 rounded border-gray-300"
                                    />
                                    <span>Select All ({pkg.allCustomerDids.length})</span>
                                  </label>
                                </div>
                                <div className="max-h-48 overflow-y-auto space-y-1">
                                  {pkg.allCustomerDids.map((did) => (
                                    <label key={did} className="flex items-center space-x-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 p-1 rounded">
                                      <input
                                        type="checkbox"
                                        checked={selectedDids.includes(did)}
                                        onChange={() => handleDidToggle(did)}
                                        className="w-4 h-4 rounded border-gray-300"
                                      />
                                      <span className="font-mono">{did}</span>
                                    </label>
                                  ))}
                                </div>
                              </>
                            )}
                          </div>
                        ) : (
                          <div className="text-sm">
                            {pkg.assignedDids.length === 0 ? (
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded">
                                All DIDs ({pkg.allCustomerDids.length})
                              </span>
                            ) : (
                              <div className="space-y-1">
                                {pkg.assignedDids.map(did => (
                                  <div key={did} className="font-mono text-gray-700 dark:text-gray-300">{did}</div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleSave(pkg.custid, pkg.packageid, pkg.allCustomerDids)}
                              disabled={saving}
                              className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 text-sm font-medium"
                            >
                              {saving ? 'Saving...' : 'Save'}
                            </button>
                            <button
                              onClick={handleCancel}
                              disabled={saving}
                              className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:bg-gray-400 text-sm font-medium"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleEdit(pkg)}
                            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
                          >
                            Edit
                          </button>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        ) : null}
      </div>
    </div>
  )
}
