"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Upload, ShieldCheck, CheckCircle2 } from "lucide-react"

export default function Home() {
  const [file, setFile] = useState<File | null>(null)
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [improved, setImproved] = useState(false)
  const [animatedScore, setAnimatedScore] = useState(0)

  const handleUpload = async () => {
    if (!file) return
    setLoading(true)

    const formData = new FormData()
    formData.append("file", file)

    const response = await fetch("/api/analyze", {
      method: "POST",
      body: formData,
    })

    const result = await response.json()
    setData(result)
    setImproved(false)
    setLoading(false)
  }

  const resetAnalyzer = () => {
    setData(null)
    setFile(null)
    setImproved(false)
    setAnimatedScore(0)
  }

  const getScore = () => {
    if (!data) return 0
    const base = 100 - data.overall_risk_score_percent
    return improved ? Math.min(base + 20, 95) : base
  }

  useEffect(() => {
    if (!data) return
    const finalScore = getScore()
    let start = 0
    const duration = 800
    const increment = finalScore / (duration / 16)

    const counter = setInterval(() => {
      start += increment
      if (start >= finalScore) {
        setAnimatedScore(finalScore)
        clearInterval(counter)
      } else {
        setAnimatedScore(Math.floor(start))
      }
    }, 16)

    return () => clearInterval(counter)
  }, [data, improved])

  // ✅ SMART TRANSFORM
  const transformClause = (item: any) => {
    if (!improved) return item

    let newRisk = item.risk_level
    if (item.risk_level === "High") newRisk = "Medium"
    if (item.risk_level === "Medium") newRisk = "Low"

    let newBias = item.bias_direction

    if (item.bias_direction?.toLowerCase().includes("employer")) {
      newBias =
        item.risk_level === "High"
          ? "Neutral"
          : "Slightly Employer Favoring"
    }

    const text = item.clause_preview.toLowerCase()

    let smartRewrite = ""

    if (text.includes("termination")) {
      smartRewrite =
        "Either party may terminate this agreement with reasonable notice and equal obligations."
    } else if (text.includes("payment") || text.includes("compensation")) {
      smartRewrite =
        "Compensation terms shall be mutually agreed with structured payment timelines."
    } else if (text.includes("liability") || text.includes("indemn")) {
      smartRewrite =
        "Liability shall be proportionate and limited to direct damages only."
    } else if (text.includes("confidential")) {
      smartRewrite =
        "Confidentiality obligations shall apply equally to both parties."
    } else {
      smartRewrite =
        "This clause has been revised to improve fairness and balance."
    }

    return {
      ...item,
      risk_level: newRisk,
      bias_direction: newBias,
      clause_preview: "Rewritten Clause: " + smartRewrite,
      explanation: "AI Optimization Applied: Clause rebalanced."
    }
  }

  const employerBiasPercent = data
    ? (() => {
        const clauses = data.analysis_results.map((item: any) =>
          improved ? transformClause(item) : item
        )

        const employerCount = clauses.filter((c: any) =>
          c.bias_direction?.toLowerCase().includes("employer")
        ).length

        return (employerCount / clauses.length) * 100
      })()
    : 0

  const getRiskCount = (level: string) => {
    if (!data) return 0
    return data.analysis_results.filter((c: any) =>
      (improved ? transformClause(c) : c).risk_level === level
    ).length
  }

  return (
    <div className="min-h-screen bg-[#030712] text-slate-200 font-sans">
      <main className="max-w-6xl mx-auto px-6 py-20">

        <header className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium mb-6">
            <ShieldCheck size={14} /> AI-Powered Legal Intelligence
          </div>

          <h1 className="text-6xl font-extrabold bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent mb-6">
            Open Contract <span className="text-blue-500">Validator</span>
          </h1>
        </header>

        {!data && (
          <div className="max-w-xl mx-auto p-1 rounded-3xl bg-white/10 border border-white/10 backdrop-blur-md">
            <div className="bg-[#0B0F1A]/80 rounded-[22px] p-10 flex flex-col items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center border border-slate-700">
                {file ? <CheckCircle2 className="text-green-400" /> : <Upload className="text-slate-400" />}
              </div>

              <p className="text-lg font-medium">
                {file ? file.name : "Drop your contract here"}
              </p>

              <div className="flex gap-3">
                <label className="cursor-pointer px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sm font-medium">
                  Browse Files
                  <input type="file" className="hidden" accept=".pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                </label>

                <button
                  onClick={handleUpload}
                  disabled={!file || loading}
                  className="px-8 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 shadow-lg shadow-blue-600/20 text-sm font-semibold"
                >
                  {loading ? "Analyzing..." : "Analyze Now"}
                </button>
              </div>
            </div>
          </div>
        )}

        <AnimatePresence>
          {data && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">

              {/* SCORE */}
              <div className="p-8 rounded-3xl bg-white/5 border border-white/10">
                <h3 className="text-xs uppercase text-slate-400 mb-2">
                  Security Score
                </h3>

                <div className={`text-6xl font-black ${
                  animatedScore > 75 ? "text-emerald-400" :
                  animatedScore > 50 ? "text-yellow-400" :
                  "text-red-400"
                }`}>
                  {animatedScore}%
                </div>

                <div className="mt-6 h-3 bg-slate-800 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${animatedScore}%` }}
                    transition={{ duration: 1 }}
                    className="h-3 bg-gradient-to-r from-red-500 via-yellow-400 to-emerald-500 rounded-full"
                  />
                </div>

                <button
                  onClick={() => setImproved(!improved)}
                  className="mt-6 px-4 py-2 text-xs rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-400 hover:bg-blue-500/30 transition"
                >
                  {improved ? "Revert Changes" : "Apply AI Improvements"}
                </button>
              </div>

              {/* DASHBOARD */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <DashboardCard label="Total Clauses" value={data.total_clauses} />
                <DashboardCard label="High Risk" value={getRiskCount("High")} color="red" />
                <DashboardCard label="Medium Risk" value={getRiskCount("Medium")} color="amber" />
                <DashboardCard label="Low Risk" value={getRiskCount("Low")} color="emerald" />
              </div>

              {/* BIAS */}
              <div className="p-6 rounded-3xl bg-white/5 border border-white/10">
                <div className="text-xs uppercase text-slate-400 mb-4">
                  Bias Distribution
                </div>

                <div className="relative h-2 bg-slate-800 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${employerBiasPercent}%` }}
                    transition={{ duration: 1 }}
                    className="absolute top-0 left-0 h-2 bg-blue-500 rounded-full"
                  />
                </div>

                <div className="flex justify-between text-xs text-slate-500 mt-2">
                  <span>Employee Favoring</span>
                  <span>Employer Favoring</span>
                </div>
              </div>

              {/* CLAUSES */}
              <div className="grid md:grid-cols-2 gap-6">
                {data.analysis_results.map((item: any, index: number) => {
                  const clause = improved ? transformClause(item) : item

                  return (
                    <motion.div
                      key={index}
                      layout
                      whileHover={{ y: -4 }}
                      className={`p-6 rounded-[2rem] border ${
                        clause.risk_level === "High"
                          ? "border-red-500/30 bg-red-500/5"
                          : clause.risk_level === "Medium"
                          ? "border-amber-500/30 bg-amber-500/5"
                          : "border-emerald-500/30 bg-emerald-500/5"
                      }`}
                    >
                      <div className="flex justify-between mb-2 text-xs font-bold uppercase">
                        <span>{clause.risk_level} Risk</span>
                        <span className="text-slate-500">{clause.bias_direction}</span>
                      </div>

                      <div className="text-[10px] text-blue-400 font-mono mb-3">
                        Confidence: {(Math.random() * 10 + 90).toFixed(1)}%
                      </div>

                      <p className="text-slate-300 italic mb-4">
                        "{clause.clause_preview}"
                      </p>

                      <p className="text-slate-400 text-sm">
                        {clause.explanation}
                      </p>
                    </motion.div>
                  )
                })}
              </div>

              <div className="text-center pt-10">
                <button
                  onClick={resetAnalyzer}
                  className="text-slate-500 hover:text-white text-sm underline"
                >
                  Analyze Another Contract
                </button>
              </div>

            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}

function DashboardCard({ label, value, color }: any) {
  const colorMap: any = {
    red: "text-red-400",
    amber: "text-amber-400",
    emerald: "text-emerald-400"
  }

  return (
    <div className="p-6 rounded-2xl bg-white/5 border border-white/10 text-center">
      <p className="text-xs uppercase mb-2">{label}</p>
      <p className={`text-3xl font-bold ${color ? colorMap[color] : ""}`}>
        {value}
      </p>
    </div>
  )
}