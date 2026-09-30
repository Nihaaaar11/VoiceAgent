from typing import Optional, List
from pydantic import BaseModel

class ClaimScenario(BaseModel):
    crop: str
    sumInsured: float
    claimReceived: float
    damageType: str  # "LOCALIZED" | "WIDESPREAD" | "POST_HARVEST" | "PREVENTED_SOWING"
    reportingDelayHours: Optional[float] = 0
    harvestedCutAndSpreadDays: Optional[float] = 0

class RuleDiagnosis(BaseModel):
    ruleCode: str
    clauseTitle: str
    spokenSummary: str
    requiredDataPoints: List[str]

def match_pmfby_rule(scenario: ClaimScenario) -> RuleDiagnosis:
    sum_insured = scenario.sumInsured
    claim_received = scenario.claimReceived
    damage_type = scenario.damageType.upper()
    delay_hours = scenario.reportingDelayHours or 0
    cut_days = scenario.harvestedCutAndSpreadDays or 0

    # Case 1: Localized loss reported after 72 hours
    if damage_type == "LOCALIZED" and claim_received == 0 and delay_hours > 72:
        return RuleDiagnosis(
            ruleCode="PMFBY_SEC_21.5.4",
            clauseTitle="Mandatory 72-Hour Loss Intimation Deadline",
            spokenSummary="Under Section 21.5.4 of PMFBY guidelines, individual field loss from hailstorms or flooding must be reported within 72 hours. Because the intimation was delayed past 72 hours, insurance companies legally reject the claim.",
            requiredDataPoints=[
                "National Crop Insurance Portal intimation timestamp",
                "Local Automatic Weather Station (AWS) data for the incident date"
            ]
        )

    # Case 2: Post-harvest drying window exceeded 14 days
    if damage_type == "POST_HARVEST" and cut_days > 14 and claim_received == 0:
        return RuleDiagnosis(
            ruleCode="PMFBY_SEC_21.6.1",
            clauseTitle="Post-Harvest 14-Day Cut-and-Spread Condition Limit",
            spokenSummary="Under Section 21.6 of the guidelines, post-harvest insurance covers crops drying in the field in cut-and-spread condition for a maximum of 14 days after harvest. Claims past two weeks are outside coverage.",
            requiredDataPoints=[
                "Recorded date of harvest from Panchayat register",
                "Rainfall or cyclone data logs from local Revenue Officer"
            ]
        )

    # Case 3: Prevented Sowing mandatory 25% payout
    if damage_type == "PREVENTED_SOWING" and abs(claim_received - (sum_insured * 0.25)) < 100:
        return RuleDiagnosis(
            ruleCode="PMFBY_SEC_21.3.5",
            clauseTitle="Prevented Sowing Lump-Sum Settlement",
            spokenSummary="Under Section 21.3, when over 75% of the normal sown area in your village suffers prevented sowing due to adverse weather, the scheme pays a lump-sum of exactly 25% of the sum insured and terminates coverage for that season.",
            requiredDataPoints=[
                "State Government Prevented Sowing Notification",
                "Insurance Unit Sown Area survey report"
            ]
        )

    # Case 4: Widespread loss reduction (Area Correction Factor)
    if damage_type == "WIDESPREAD" and claim_received > 0 and claim_received < sum_insured:
        return RuleDiagnosis(
            ruleCode="PMFBY_SEC_25",
            clauseTitle="Acreage Discrepancy & Area Correction Factor (ACF)",
            spokenSummary="Under Section 25, if the total insured area in your block exceeds the government-notified sown area, compensation is scaled down proportionately across all farmers in that village. Your payout was likely reduced by an Area Correction Factor multiplier.",
            requiredDataPoints=[
                "Notified Sown Area at Tehsil/Mandal level",
                "Total Insured Area in your Insurance Unit",
                "Exact ACF multiplier applied to your claim formula"
            ]
        )

    # Default: Crop Cutting Experiment (CCE) Yield Shortfall
    return RuleDiagnosis(
        ruleCode="PMFBY_SEC_21.2",
        clauseTitle="Actual Yield vs Threshold Yield Assessment",
        spokenSummary="Widespread crop losses are calculated using average yield figures from village-level Crop Cutting Experiments, not your single field. If the average harvest in your Gram Panchayat was close to normal, the payout ratio is proportionately reduced.",
        requiredDataPoints=[
            "Notified Threshold Yield (TY) for your Gram Panchayat",
            "Crop Cutting Experiment (CCE) Form-2 Actual Yield logs",
            "List of CCE plot survey numbers selected by lottery"
        ]
    )
