"use client";

import { Icon } from "@/components/Icon";

export default function LumonaERP() {
  const stats = [
    { label: "Revenue", value: "$124,500", change: "+12.5%", color: "#10b981" },
    { label: "Orders", value: "1,284", change: "+8.2%", color: "#3b82f6" },
    { label: "Customers", value: "892", change: "+15.1%", color: "#8b5cf6" },
    { label: "Products", value: "342", change: "+3.4%", color: "#f59e0b" },
  ];

  const recentOrders = [
    { id: "#ORD-7842", customer: "Acme Corp", amount: "$2,400", status: "Completed" },
    { id: "#ORD-7841", customer: "Globex Inc", amount: "$1,150", status: "Processing" },
    { id: "#ORD-7840", customer: "Soylent Corp", amount: "$3,800", status: "Pending" },
    { id: "#ORD-7839", customer: "Initech", amount: "$950", status: "Completed" },
    { id: "#ORD-7838", customer: "Umbrella LLC", amount: "$4,200", status: "Processing" },
  ];

  return (
    <div
      className="h-full flex flex-col transition-colors duration-300"
      style={{ background: "var(--bg-app)", color: "var(--text-primary)" }}
    >
      {/* Header */}
      <div className="h-14 flex items-center px-6 border-b transition-colors duration-300" style={{ background: "var(--bg-sidebar)", borderColor: "var(--border-subtle)" }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#3b82f6" }}>
            <Icon name="Box" size={18} className="text-white" />
          </div>
          <div>
            <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Lumona ERP</h2>
            <p className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>Enterprise Resource Planning</p>
          </div>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-3">
          <button className="p-2 rounded-lg transition-colors" style={{ color: "var(--text-tertiary)" }}>
            <Icon name="Bell" size={16} />
          </button>
          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "rgba(59,130,246,0.15)" }}>
            <Icon name="User" size={14} style={{ color: "#3b82f6" }} />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="grid grid-cols-4 gap-4 mb-6">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-xl p-4 border transition-colors duration-300" style={{ background: "var(--bg-card)", borderColor: "var(--border-subtle)" }}>
              <div className="text-xs mb-1" style={{ color: "var(--text-tertiary)" }}>{stat.label}</div>
              <div className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>{stat.value}</div>
              <div className="text-xs mt-1" style={{ color: stat.color }}>{stat.change} from last month</div>
            </div>
          ))}
        </div>

        <div className="rounded-xl p-4 border mb-6 transition-colors duration-300" style={{ background: "var(--bg-card)", borderColor: "var(--border-subtle)" }}>
          <div className="text-sm font-medium mb-4" style={{ color: "var(--text-primary)" }}>Revenue Overview</div>
          <div className="h-32 flex items-end gap-2">
            {[40, 65, 45, 80, 55, 90, 70, 85, 60, 75, 95, 50].map((h, i) => (
              <div key={i} className="flex-1 rounded-t-sm transition-colors hover:opacity-80" style={{ height: `${h}%`, background: "rgba(59,130,246,0.4)" }} />
            ))}
          </div>
          <div className="flex justify-between mt-2 text-[10px]" style={{ color: "var(--text-tertiary)" }}>
            {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map((m) => (
              <span key={m}>{m}</span>
            ))}
          </div>
        </div>

        <div className="rounded-xl border overflow-hidden transition-colors duration-300" style={{ background: "var(--bg-card)", borderColor: "var(--border-subtle)" }}>
          <div className="px-4 py-3 border-b text-sm font-medium transition-colors duration-300" style={{ borderColor: "var(--border-subtle)", color: "var(--text-primary)" }}>Recent Orders</div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs border-b transition-colors duration-300" style={{ borderColor: "var(--border-subtle)", color: "var(--text-tertiary)" }}>
                <th className="text-left px-4 py-2 font-medium">Order ID</th>
                <th className="text-left px-4 py-2 font-medium">Customer</th>
                <th className="text-left px-4 py-2 font-medium">Amount</th>
                <th className="text-left px-4 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order.id} className="border-b transition-colors duration-300 hover:opacity-80" style={{ borderColor: "var(--border-subtle)" }}>
                  <td className="px-4 py-2.5" style={{ color: "var(--text-secondary)" }}>{order.id}</td>
                  <td className="px-4 py-2.5" style={{ color: "var(--text-primary)" }}>{order.customer}</td>
                  <td className="px-4 py-2.5" style={{ color: "var(--text-secondary)" }}>{order.amount}</td>
                  <td className="px-4 py-2.5">
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{
                      backgroundColor: order.status === "Completed" ? "rgba(16,185,129,0.12)" : order.status === "Processing" ? "rgba(59,130,246,0.12)" : "rgba(245,158,11,0.12)",
                      color: order.status === "Completed" ? "#10b981" : order.status === "Processing" ? "#3b82f6" : "#f59e0b",
                    }}>{order.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
