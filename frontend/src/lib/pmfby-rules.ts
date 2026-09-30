export interface ClaimScenario {
  crop: string;
  sumInsured: number;
  claimReceived: number;
  damageType: "LOCALIZED" | "WIDESPREAD" | "POST_HARVEST" | "PREVENTED_SOWING";
  reportingDelayHours?: number;
  harvestedCutAndSpreadDays?: number;
}

export interface RuleDiagnosis {
  ruleCode: string;
  clauseTitle: string;
  spokenSummary: string;
  requiredDataPoints: string[];
}

export function matchPmfbyRule(scenario: ClaimScenario): RuleDiagnosis {
  const { sumInsured, claimReceived, damageType, reportingDelayHours, harvestedCutAndSpreadDays } = scenario;

  if (damageType === "LOCALIZED" && claimReceived === 0 && (reportingDelayHours ?? 0) > 72) {
    return {
      ruleCode: "PMFBY_SEC_21.5.4",
      clauseTitle: "Mandatory 72-Hour Loss Intimation Deadline",
      spokenSummary: "Under Section 21.5.4, individual field damage must be intimated within 72 hours. Delayed intimation leads to automatic claim repudiation.",
      requiredDataPoints: [
        "National Crop Insurance Portal intimation log",
        "Local Automatic Weather Station (AWS) weather record"
      ]
    };
  }

  if (damageType === "POST_HARVEST" && (harvestedCutAndSpreadDays ?? 0) > 14 && claimReceived === 0) {
    return {
      ruleCode: "PMFBY_SEC_21.6.1",
      clauseTitle: "Post-Harvest 14-Day Limit",
      spokenSummary: "Under Section 21.6, post-harvest coverage only applies up to 14 days after harvest while crops dry in the field.",
      requiredDataPoints: ["Village harvest register entry", "Local revenue rainfall logs"]
    };
  }

  if (damageType === "WIDESPREAD" && claimReceived > 0 && claimReceived < sumInsured) {
    return {
      ruleCode: "PMFBY_SEC_25",
      clauseTitle: "Area Correction Factor Discrepancy",
      spokenSummary: "Under Section 25, if the total insured area in your block exceeds official sown area, compensation is scaled down proportionately across all village farmers.",
      requiredDataPoints: [
        "Notified Sown Area at Tehsil/Mandal level",
        "Total Insured Area in your block",
        "Exact Area Correction Factor (ACF) multiplier applied"
      ]
    };
  }

  return {
    ruleCode: "PMFBY_SEC_21.2",
    clauseTitle: "Actual Yield vs Threshold Yield Assessment",
    spokenSummary: "Widespread losses are calculated based on average village harvest from Crop Cutting Experiments, not your single field. Lower shortfall yields lower payouts.",
    requiredDataPoints: [
      "Notified Threshold Yield (TY) for your Gram Panchayat",
      "CCE Form-2 field test records",
      "Lottery list of selected survey numbers"
    ]
  };
}
