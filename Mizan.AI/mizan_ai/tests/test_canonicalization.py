import pytest
from mizan_ai.ingestion.legal_chunker import parse_canonical_reference

def test_canonical_equivalence():
    # 1. Section 497 Equivalences
    ref1 = parse_canonical_reference("Section 497 of CrPC", "CrPC")
    ref2 = parse_canonical_reference("S.497", "CrPC")
    ref3 = parse_canonical_reference("497 CrPC", "CrPC")
    assert ref1 == ref2 == ref3, f"Mismatch: {ref1}, {ref2}, {ref3}"
    assert ref1 == "pk:statute:CrPC:497"

    # 2. Section 489-F
    ref4 = parse_canonical_reference("Section 489-F", "PPC")
    ref5 = parse_canonical_reference("S. 489F", "PPC")
    ref6 = parse_canonical_reference("489-F PPC", "PPC")
    assert ref4 == ref5 == ref6, f"Mismatch: {ref4}, {ref5}, {ref6}"
    assert ref4 == "pk:statute:PPC:489-F"

    # 3. Article 199
    ref7 = parse_canonical_reference("Article 199 of the Constitution", "Constitution")
    ref8 = parse_canonical_reference("Art 199", "Constitution")
    assert ref7 == ref8, f"Mismatch: {ref7}, {ref8}"
    assert ref7 == "pk:statute:Constitution:199"
