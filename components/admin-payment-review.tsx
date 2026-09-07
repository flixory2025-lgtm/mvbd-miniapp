"use client"

import type { AdminPaymentReview, PaymentRequestStatus } from "@/lib/subscription-plans"

type AdminPaymentReviewProps = {
  requests: AdminPaymentReview[]
  onApprove?: (requestId: string) => Promise<void>
  onReject?: (requestId: string, adminNote?: string) => Promise<void>
}

export default function AdminPaymentReview({ requests, onApprove, onReject }: AdminPaymentReviewProps) {
  return (
    <section aria-labelledby="payment-review-heading" className="flex flex-col gap-4">
      <div>
        <h1 id="payment-review-heading" className="text-xl font-semibold text-white">Payment requests</h1>
        <p className="text-sm text-slate-400">Review requests through a trusted admin-authorized service.</p>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5">
        <table className="min-w-full text-left text-sm text-slate-200">
          <thead className="border-b border-white/10 text-xs uppercase text-slate-400">
            <tr>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3">Transaction</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((request) => (
              <PaymentRequestRow key={request.requestId} request={request} onApprove={onApprove} onReject={onReject} />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function PaymentRequestRow({
  request,
  onApprove,
  onReject,
}: {
  request: AdminPaymentReview
  onApprove?: (requestId: string) => Promise<void>
  onReject?: (requestId: string, adminNote?: string) => Promise<void>
}) {
  const isPending = request.status === "pending"
  const statusLabel: Record<PaymentRequestStatus, string> = {
    pending: "Pending",
    approved: "Approved",
    rejected: "Rejected",
  }

  return (
    <tr className="border-b border-white/5 last:border-0">
      <td className="px-4 py-3">
        <div className="font-medium">{request.userName || "Unknown user"}</div>
        <div className="text-xs text-slate-400">{request.mvbdId}</div>
      </td>
      <td className="px-4 py-3">{request.planName} · ৳{request.amount}</td>
      <td className="px-4 py-3 font-mono text-xs">{request.transactionId}</td>
      <td className="px-4 py-3">{statusLabel[request.status]}</td>
      <td className="px-4 py-3">
        {isPending ? (
          <div className="flex gap-2">
            <button type="button" disabled={!onApprove} onClick={() => onApprove?.(request.requestId)} className="rounded-lg bg-emerald-500/20 px-3 py-2 text-xs text-emerald-200 disabled:opacity-50">Approve</button>
            <button type="button" disabled={!onReject} onClick={() => onReject?.(request.requestId)} className="rounded-lg bg-red-500/20 px-3 py-2 text-xs text-red-200 disabled:opacity-50">Reject</button>
          </div>
        ) : (
          <span className="text-xs text-slate-500">Reviewed</span>
        )}
      </td>
    </tr>
  )
}
