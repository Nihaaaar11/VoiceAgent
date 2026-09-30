import sys
import os

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from tests.test_backend import (
    test_root_and_health,
    test_voice_tool_webhook,
    test_assemblyai_status_endpoint,
    test_spoken_formatting_and_language_detection,
    test_start_session_greeting,
    test_scenario_a_workflow,
    test_scenario_b_workflow,
    test_safety_and_pii_guardrails,
    test_rti_draft_generation
)

if __name__ == "__main__":
    print("Running Kisan Sahayak Backend Test Suite...\n")
    
    tests = [
        ("Root & Health Checks", test_root_and_health),
        ("Voice Tool Webhook (AssemblyAI Rule Evaluator)", test_voice_tool_webhook),
        ("AssemblyAI Voice Engine Status", test_assemblyai_status_endpoint),
        ("Spoken Formatting & Language Detection", test_spoken_formatting_and_language_detection),
        ("Start Session Greeting", test_start_session_greeting),
        ("Scenario A (Post-Claim Rejection/RTI Workflow)", test_scenario_a_workflow),
        ("Scenario B (Pre-Application & Eligibility Workflow)", test_scenario_b_workflow),
        ("Safety, Privacy & Guardrails Deflection", test_safety_and_pii_guardrails),
        ("RTI Draft Generation & HTML Printing", test_rti_draft_generation),
    ]

    passed = 0
    failed = 0

    for name, test_func in tests:
        try:
            test_func()
            print(f"  [PASS] {name}")
            passed += 1
        except Exception as e:
            print(f"  [FAIL] {name} -> {e}")
            import traceback
            traceback.print_exc()
            failed += 1

    print(f"\nSummary: {passed} PASSED, {failed} FAILED.")
    if failed > 0:
        sys.exit(1)
