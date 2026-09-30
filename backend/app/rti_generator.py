from typing import Dict, Any
from app.models import RTIDraftRequest, RTIDraftResponse

def generate_rti_draft(req: RTIDraftRequest) -> RTIDraftResponse:
    lang = (req.language or "en").lower()
    
    farmer_name = req.farmer_name or "Farmer"
    mobile = req.mobile_number or "XXXXXXXXXX"
    mandal = req.mandal_tehsil or "[Mandal/Tehsil Name]"
    panchayat = req.gram_panchayat or "[Gram Panchayat Name]"
    district = req.district or "[District Name]"
    state = req.state_name or "[State Name]"
    crop = req.crop or "[Insured Crop]"
    season = req.season or "[Kharif/Rabi]"
    year = req.year or "2025-26"
    
    categories = [
        "Category 1: Form-2 Crop Cutting Experiment (CCE) field trial results and actual yield records for Gram Panchayat: " + panchayat,
        "Category 2: The exact Area Correction Factor (ACF) multiplier applied to the Insurance Unit for " + crop + " (" + season + " " + year + ")",
        "Category 3: The notified sown area versus total insured acreage for " + crop + " in block/mandal " + mandal
    ]
    
    if lang.startswith("te"): # Telugu
        draft_title = "సమాచార హక్కు చట్టం - 2005 కింద దరఖాస్తు (PMFBY / RWBCIS పంటల బీమా వివరాల కోసం)"
        addressee = f"పబ్లిక్ ఇన్ఫర్మేషన్ ఆఫీసర్ (PIO),\nవ్యవసాయ శాఖ కార్యాలయం,\nమండలం/తహసీల్: {mandal},\nజిల్లా: {district}, {state}."
        
        body_markdown = f"""### {draft_title}

**స్వీకరించేవారు:**
{addressee}

**దరఖాస్తుదారు:**
పేరు: {farmer_name}
మొబైల్ సంఖ్య: {mobile}
గ్రామ పంచాయతీ: {panchayat}
మండలం: {mandal}
జిల్లా: {district}

**విషయం:** సమాచార హక్కు చట్టం 2005 సెక్షన్ 6(1) కింద PMFBY పంటల బీమా గణాంకాలు మరియు రికార్డులు అందజేయవలసిందిగా కోరుతూ దరఖాస్తు.

**కోరబడిన సమాచారం:**
1. **కేటగిరీ 1 (CCE ఫలితాలు):** {panchayat} గ్రామ పంచాయతీ పరిధిలో {season} {year} సీజన్ కు సంబంధించి {crop} పంట యొక్క Form-2 పంట కోత ప్రయోగాలు (Crop Cutting Experiments - CCE) క్షేత్ర పరిశీలన ఫలితాలు మరియు దిగుబడి రికార్డులు.
2. **కేటగిరీ 2 (ACF మల్టిప్లైయర్):** మా ఇన్సూరెన్స్ యూనిట్‌కు వర్తింపజేసిన ఖచ్చితమైన ఏరియా కరెక్షన్ ఫ్యాక్టర్ (Area Correction Factor - ACF) మల్టిప్లైయర్ వివరాలు.
3. **కేటగిరీ 3 (విత్తిన విస్తీర్ణం vs బీమా చేసిన విస్తీర్ణం):** {mandal} మండలంలో నోటిఫై చేయబడిన నిజమైన విత్తిన విస్తీర్ణం మరియు మొత్తం బీమా చేయబడిన ఎకరాల వివరాలు.

సమాచార హక్కు చట్టం 2005 ప్రకారం నిబంధనల మేరకు నిర్ణీత 30 రోజుల వ్యవధిలో పైన పేర్కొన్న అధికారిక పత్రాల కాపీలను నాకు అందజేయవలసిందిగా ప్రార్థన.

తేదీ: ____________
స్థలం: {mandal}

దరఖాస్తుదారు సంతకం: ____________
"""
    elif lang.startswith("hi"): # Hindi
        draft_title = "सूचना का अधिकार अधिनियम - 2005 के तहत आवेदन (PMFBY / RWBCIS फसल बीमा)"
        addressee = f"लोक सूचना अधिकारी (PIO),\nकृषि विभाग कार्यालय,\nमंडल/तहसील: {mandal},\nजिला: {district}, {state}."
        
        body_markdown = f"""### {draft_title}

**सेवा में:**
{addressee}

**आवेदक का विवरण:**
नाम: {farmer_name}
मोबाइल नंबर: {mobile}
ग्राम पंचायत: {panchayat}
तहसील/मंडल: {mandal}
जिला: {district}

**विषय:** सूचना का अधिकार अधिनियम 2005 की धारा 6(1) के तहत PMFBY फसल बीमा अभिलेख प्रदान करने हेतु आवेदन।

**मांगी गई जानकारी:**
1. **श्रेणी 1 (CCE परिणाम):** ग्राम पंचायत {panchayat} हेतु {season} {year} सीजन में {crop} फसल के फॉर्म-2 फसल कटाई प्रयोग (Crop Cutting Experiments - CCE) के परिणाम और वास्तविक उपज आंकड़े।
2. **श्रेणी 2 (ACF गुणक):** हमारी बीमा इकाई पर लागू किए गए सटीक एरिया करेक्शन फैक्टर (Area Correction Factor - ACF) गुणक का विवरण।
3. **श्रेणी 3 (बुआई क्षेत्र बनाम बीमित क्षेत्र):** ब्लॉक/तहसील {mandal} में अधिसूचित वास्तविक बुआई क्षेत्र बनाम कुल बीमित रकबा का आधिकारिक विवरण।

कृपया सूचना का अधिकार अधिनियम 2005 के तहत निर्धारित 30 दिनों के भीतर वांछित प्रतियां उपलब्ध कराने की कृपा करें।

दिनांक: ____________
स्थान: {mandal}

आवेदक के हस्ताक्षर: ____________
"""
    else: # English
        draft_title = "APPLICATION UNDER RIGHT TO INFORMATION ACT, 2005 (PMFBY / RWBCIS CROP INSURANCE)"
        addressee = f"The Public Information Officer (PIO),\nOffice of the Agriculture Officer,\nMandal / Tehsil: {mandal},\nDistrict: {district}, {state}."
        
        body_markdown = f"""### {draft_title}

**To:**
{addressee}

**From Applicant:**
Name: {farmer_name}
Mobile: {mobile}
Gram Panchayat: {panchayat}
Tehsil/Mandal: {mandal}
District: {district}

**Subject:** Request for Official Information under Section 6(1) of RTI Act 2005 regarding PMFBY Claim Settlement.

**Information Demanded:**
1. **Category 1 (CCE Results):** Certified copy of Form-2 Crop Cutting Experiment (CCE) field trial results and actual average yield records for Gram Panchayat {panchayat} regarding {crop} crop for {season} {year}.
2. **Category 2 (ACF Multiplier):** The exact Area Correction Factor (ACF) multiplier applied to the Insurance Unit for {crop} crop.
3. **Category 3 (Sown vs Insured Acreage):** Officially notified actual sown area versus total insured acreage for {crop} crop in Tehsil/Mandal {mandal}.

Kindly supply certified copies of the requested government records within the statutory 30-day period.

Date: ____________
Place: {mandal}

Applicant Signature: ____________
"""

    printable_html = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>RTI Application Draft - crop.ins</title>
    <style>
        body {{ font-family: 'Georgia', 'Arial', sans-serif; line-height: 1.6; padding: 40px; color: #111; max-width: 800px; margin: 0 auto; }}
        .header {{ border-bottom: 2px solid #2e7d32; padding-bottom: 10px; margin-bottom: 20px; text-align: center; }}
        .header h2 {{ color: #2e7d32; margin: 0; }}
        .portal-tag {{ font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 1px; }}
        .section {{ margin-bottom: 20px; }}
        .title {{ font-weight: bold; font-size: 18px; text-align: center; margin: 20px 0; text-decoration: underline; }}
        .box {{ background: #f9f9f9; border: 1px solid #ddd; padding: 15px; border-radius: 6px; margin: 15px 0; }}
        .field-list {{ list-style-type: none; padding-left: 0; }}
        .field-list li {{ margin-bottom: 10px; padding-left: 20px; position: relative; }}
        .field-list li::before {{ content: "•"; color: #2e7d32; font-size: 20px; position: absolute; left: 0; top: -2px; }}
        .footer {{ margin-top: 50px; display: flex; justify-content: space-between; font-weight: bold; }}
        @media print {{
            body {{ padding: 0; }}
            .no-print {{ display: none; }}
        }}
    </style>
</head>
<body>
    <div class="header">
        <div class="portal-tag">crop.ins Portal — Pre-Filled Official RTI Application Draft</div>
        <h2>{draft_title}</h2>
    </div>
    
    <div class="section">
        <strong>To:</strong><br>
        {addressee.replace('\n', '<br>')}
    </div>
    
    <div class="section">
        <strong>Applicant Details:</strong><br>
        Name: {farmer_name}<br>
        Mobile: {mobile}<br>
        Gram Panchayat: {panchayat}<br>
        Mandal/Tehsil: {mandal}<br>
        District: {district}, State: {state}
    </div>
    
    <div class="section">
        <strong>Subject:</strong> Official Application under Section 6(1) of RTI Act 2005 for PMFBY records.
    </div>
    
    <div class="box">
        <strong>Information Demanded under Public Information Disclosure:</strong>
        <ul class="field-list">
            <li><strong>Category 1:</strong> Form-2 Crop Cutting Experiment (CCE) trial results and actual yield records for Gram Panchayat: <u>{panchayat}</u> ({crop}, {season} {year}).</li>
            <li><strong>Category 2:</strong> The exact Area Correction Factor (ACF) multiplier applied to the Insurance Unit.</li>
            <li><strong>Category 3:</strong> Notified actual sown area versus total insured acreage in Mandal/Tehsil: <u>{mandal}</u>.</li>
        </ul>
    </div>
    
    <div class="section">
        Please provide certified official copies of these records within 30 days as mandated by the RTI Act, 2005.
    </div>
    
    <div class="footer">
        <div>Date: _________________</div>
        <div>Signature / Thumb Impression: _________________</div>
    </div>
    
    <div class="no-print" style="margin-top: 40px; text-align: center;">
        <button onclick="window.print()" style="background: #2e7d32; color: white; border: none; padding: 12px 24px; font-size: 16px; border-radius: 4px; cursor: pointer;">🖨️ Print Pre-filled RTI Draft</button>
    </div>
</body>
</html>"""

    return RTIDraftResponse(
        session_id=req.session_id,
        draft_title=draft_title,
        addressee=addressee,
        body_markdown=body_markdown,
        body_text=body_markdown.replace("#", "").replace("**", ""),
        categories_demanded=categories,
        printable_html=printable_html
    )
