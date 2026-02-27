export async function POST(req: Request) {
  const formData = await req.formData()
  const file = formData.get("file") as File

  if (!file) {
    return new Response(JSON.stringify({ error: "No file uploaded" }), {
      status: 400,
    })
  }

  // Simulated contract analysis
  const clauses = [
    {
      clause_preview: "The employer may terminate this agreement without notice.",
      risk_level: "High",
      bias_direction: "Employer Favoring",
      explanation: "Termination rights are unilateral and may expose the employee to instability."
    },
    {
      clause_preview: "Payment shall be made within 90 days of invoice.",
      risk_level: "Medium",
      bias_direction: "Employer Favoring",
      explanation: "Delayed payment terms may create financial strain."
    },
    {
      clause_preview: "Both parties must maintain confidentiality.",
      risk_level: "Low",
      bias_direction: "Neutral",
      explanation: "Confidentiality applies equally to both parties."
    }
  ]

  const high = clauses.filter(c => c.risk_level === "High").length
  const medium = clauses.filter(c => c.risk_level === "Medium").length
  const low = clauses.filter(c => c.risk_level === "Low").length

  const overall_risk_score_percent = Math.min(100, high * 30 + medium * 15 + low * 5)

  return new Response(JSON.stringify({
    total_clauses: clauses.length,
    high_risk_count: high,
    medium_risk_count: medium,
    low_risk_count: low,
    overall_risk_score_percent,
    analysis_results: clauses
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  })
}