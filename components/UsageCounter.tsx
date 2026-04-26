"use client";
import Link from "next/link";
import { Crown, AlertCircle, Lock, Infinity as InfinityIcon, TrendingDown } from "lucide-react";
import { PLAN_LIMITS, FEATURE_LABELS, type Plan, type FeatureKey } from "@/lib/planLimits";

interface Props {
  plan: Plan;
  feature: FeatureKey;
  used: number;
}

export default function UsageCounter({ plan, feature, used }: Props) {
  const limit = PLAN_LIMITS[plan][feature];
  const label = FEATURE_LABELS[feature];

  const monthName = new Date().toLocaleDateString("en-US", { month: "long" });
  const resetDate = new Date();
  resetDate.setMonth(resetDate.getMonth() + 1, 1);
  const resetLabel = resetDate.toLocaleDateString("en-US", { month: "long", day: "numeric" });

  /* ───── LOCKED ───── */
  if (limit === 0) {
    return (
      <div className="mb-6 bg-gradient-to-r from-red-900/20 to-[#162035] border-2 border-red-700/50 rounded-2xl p-5 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-red-900/40 rounded-xl flex items-center justify-center shrink-0">
            <Lock className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <p className="text-white font-semibold">{label} is locked on the {plan} plan</p>
            <p className="text-slate-400 text-sm">Upgrade to unlock this feature.</p>
          </div>
        </div>
        <Link
          href="/#pricing"
          className="bg-red-600 hover:bg-red-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors flex items-center gap-2"
        >
          <Crown className="w-4 h-4" /> Upgrade
        </Link>
      </div>
    );
  }

  /* ───── UNLIMITED ───── */
  if (limit === null) {
    return (
      <div className="mb-6 bg-gradient-to-r from-yellow-900/20 to-[#162035] border border-yellow-700/50 rounded-2xl p-4 flex items-center gap-3">
        <div className="w-10 h-10 bg-yellow-900/40 rounded-xl flex items-center justify-center shrink-0">
          <InfinityIcon className="w-5 h-5 text-yellow-400" />
        </div>
        <div>
          <p className="text-yellow-300 font-semibold text-sm">{label}: Unlimited usage</p>
          <p className="text-slate-400 text-xs">You&apos;re on the Business plan — no monthly cap.</p>
        </div>
      </div>
    );
  }

  /* ───── NUMERIC LIMIT ───── */
  const remaining = Math.max(0, limit - used);
  const pct = Math.min(100, Math.round((used / limit) * 100));

  const empty = remaining === 0;
  const warning = !empty && remaining <= 5;

  // Color classes
  const colorBg = empty
    ? "from-red-900/30 to-[#162035] border-red-600/60"
    : warning
      ? "from-yellow-900/25 to-[#162035] border-yellow-600/50"
      : "from-[#1e3050] to-[#162035] border-[#1e3050]";

  const colorIconBg = empty
    ? "bg-red-900/50"
    : warning
      ? "bg-yellow-900/40"
      : "bg-red-900/30";

  const colorIcon = empty
    ? "text-red-300"
    : warning
      ? "text-yellow-400"
      : "text-red-400";

  const colorNumber = empty
    ? "text-red-300"
    : warning
      ? "text-yellow-300"
      : "text-white";

  const colorBar = empty
    ? "bg-red-500"
    : warning
      ? "bg-yellow-500"
      : "bg-red-600";

  return (
    <div className={`mb-6 bg-gradient-to-r ${colorBg} border-2 rounded-2xl p-5`}>
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-12 h-12 ${colorIconBg} rounded-xl flex items-center justify-center shrink-0`}>
            {empty ? (
              <AlertCircle className={`w-5 h-5 ${colorIcon}`} />
            ) : warning ? (
              <TrendingDown className={`w-5 h-5 ${colorIcon}`} />
            ) : (
              <Crown className={`w-5 h-5 ${colorIcon}`} />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-white font-semibold text-sm sm:text-base">
              {label}:{" "}
              <span className={`font-bold ${colorNumber}`}>
                {remaining}/{limit}
              </span>{" "}
              <span className="text-slate-400 font-normal">remaining this month</span>
            </p>
            <p className="text-slate-500 text-xs mt-0.5">
              {empty
                ? `Limit reached. Resets on ${resetLabel}.`
                : warning
                  ? `Only ${remaining} left — upgrade for more.`
                  : `Used ${used} of ${limit} this ${monthName}. Resets on ${resetLabel}.`}
            </p>
          </div>
        </div>

        {empty && (
          <Link
            href="/#pricing"
            className="bg-red-600 hover:bg-red-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors flex items-center gap-2 shrink-0"
          >
            <Crown className="w-4 h-4" /> Upgrade
          </Link>
        )}

        {warning && (
          <Link
            href="/#pricing"
            className="bg-yellow-500 hover:bg-yellow-400 text-black font-semibold text-sm px-4 py-2 rounded-xl transition-colors flex items-center gap-2 shrink-0"
          >
            <Crown className="w-4 h-4" /> Upgrade
          </Link>
        )}
      </div>

      {/* Progress bar */}
      <div className="mt-3 h-1.5 bg-[#0f1a2e] rounded-full overflow-hidden">
        <div
          className={`h-full ${colorBar} rounded-full transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
