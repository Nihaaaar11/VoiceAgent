import { NextRequest, NextResponse } from "next/server";
import { matchPmfbyRule, ClaimScenario } from "@/lib/pmfby-rules";

export async function POST(req: NextRequest) {
  try {
    const body: ClaimScenario = await req.json();

    if (!body.crop || body.sumInsured === undefined || body.claimReceived === undefined) {
      return NextResponse.json(
        { error: "Missing required parameters: crop, sumInsured, or claimReceived." },
        { status: 400 }
      );
    }

    const diagnosis = matchPmfbyRule(body);
    return NextResponse.json(diagnosis, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Rule engine failed to evaluate request." },
      { status: 500 }
    );
  }
}
