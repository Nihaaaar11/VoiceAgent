from fastapi import APIRouter, HTTPException, status
from app.pmfby_rules import ClaimScenario, RuleDiagnosis, match_pmfby_rule

router = APIRouter(prefix="/api", tags=["Voice Tool AssemblyAI Webhook"])

@router.post("/voice-tool", response_model=RuleDiagnosis)
async def voice_tool_webhook(scenario: ClaimScenario):
    """
    Webhook endpoint invoked by AssemblyAI voice agent tool-calling during a live call.
    Evaluates farmer numbers against statutory PMFBY clauses.
    """
    if not scenario.crop or scenario.sumInsured is None or scenario.claimReceived is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing required fields: crop, sumInsured, or claimReceived."
        )

    try:
        diagnosis = match_pmfby_rule(scenario)
        return diagnosis
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to evaluate PMFBY guidelines."
        )
