"use client"

import { useCallback, useEffect, useState } from "react"
import { CheckCircle2, CreditCard, Loader2, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { auth } from "@/lib/firebase"

type PaymentRequest = {
  requestId: string
  uid: string
  userName?: string
  mvbdId?: string
  planName?: string
  amount?: number
  transactionId?: string
  status: "pending" | "approved" | "rejected"
  createdAt?: { _seconds?: number } | null
}

export default function AdminPaymentsLive({ showNotice }: { showNotice: (message: string) => void }) {
  const [requests, setRequests] = useState<PaymentRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState("")

  const loadRequests = useCallback(async () => {
    if (!auth.currentUser) {
      setError("Sign in with an admin account to review payments.")
      setLoading(false)
      return
    }
    try {
      const token = await auth.currentUser.getIdToken()
      const response = await fetch("/api/admin/payment-requests", { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error || "Unable to load payment requests.")
      setRequests(body)
      setError("")
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to load payment requests.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadRequests()
  }, [loadRequests])

  const review = async (requestId: string, action: "approve" | "reject") => {
    if (!auth.currentUser) return
    setBusyId(requestId)
    try {
      const token = await auth.currentUser.getIdToken()
      const response = await fetch("/api/admin/payment-requests", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ requestId, action }) })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error || "Review failed.")
      setRequests((current) => current.map((item) => item.requestId === requestId ? { ...item, status: action === "approve" ? "approved" : "rejected" } : item))
      showNotice(action === "approve" ? "Payment approved and premium access activated" : "Payment rejected")
    } catch (requestError) {
      showNotice(requestError instanceof Error ? requestError.message : "Review failed")
    } finally {
      setBusyId(null)
    }
  }

  const pending = requests.filter((request) => request.status === "pending")

  return <div className="rounded-2xl border border-white/8 bg-card p-5">
    <div className="mb-6 flex items-center justify-between"><div><h2 className="font-semibold">Payment requests</h2><p className="mt-1 text-xs text-muted-foreground">Transaction IDs submitted from the subscriptions page</p></div><span className="rounded-full bg-amber-400/12 px-3 py-1 text-xs text-amber-300">{pending.length} pending</span></div>
    {error && <div className="mb-4 rounded-xl border border-rose-400/20 bg-rose-400/10 p-3 text-sm text-rose-200">{error}</div>}
    {loading ? <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" />Loading payment requests...</div> : <div className="flex flex-col gap-3">{requests.length === 0 ? <p className="text-sm text-muted-foreground">No payment requests yet.</p> : requests.map((payment) => <div key={payment.requestId} className="flex flex-col gap-4 rounded-xl border border-white/8 bg-secondary/20 p-4 md:flex-row md:items-center"><div className="flex size-10 items-center justify-center rounded-full bg-amber-400/10 text-amber-300"><CreditCard className="size-4" /></div><div className="min-w-0 flex-1"><div className="font-medium">{payment.userName || payment.uid}</div><div className="text-xs text-muted-foreground">{payment.mvbdId || payment.uid} · {payment.transactionId}</div></div><div className="text-sm">{payment.planName}</div><div className="font-semibold">৳{payment.amount}</div><div className="flex items-center gap-2">{payment.status === "pending" ? <><Button size="sm" disabled={busyId === payment.requestId} onClick={() => void review(payment.requestId, "approve")}><CheckCircle2 data-icon="inline-start" />Approve</Button><Button size="sm" variant="destructive" disabled={busyId === payment.requestId} onClick={() => void review(payment.requestId, "reject")}><XCircle data-icon="inline-start" />Reject</Button></> : <span className={payment.status === "approved" ? "text-xs text-emerald-300" : "text-xs text-rose-300"}>{payment.status}</span>}</div></div>)}</div>}
  </div>
}
