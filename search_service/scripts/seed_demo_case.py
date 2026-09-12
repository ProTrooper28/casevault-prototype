import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.supabase_client import supabase
from app import search_service

SAMPLE_DOCUMENTS = {
    "fir_0142": {
        "title": "FIR_0142_2026.pdf",
        "document_type": "fir_copy",
        "text": (
            "FIRST INFORMATION REPORT. FIR No. 0142/2026. Date of FIR: "
            "14/03/2026. District: Bengaluru Urban. P.S.: Whitefield Police "
            "Station. Date and Time of Occurrence: 12/03/2026 22:30 hrs. "
            "Place of Occurrence: Near ITPL Main Road, Sector 12, "
            "Whitefield, Bengaluru. Complainant Ramesh Kumar reported that "
            "his vehicle, a white Maruti Suzuki van bearing registration "
            "number KA-01-AB-1234, was stolen from outside his residence "
            "between 10 PM and 11 PM on the night of 12/03/2026."
        ),
    },
    "witness_statement_1": {
        "title": "Witness_Statement_Suresh.pdf",
        "document_type": "witness_statement",
        "text": (
            "Statement of witness Suresh Patil, recorded under Section 161 "
            "CrPC. The witness states that on the night of 12/03/2026, at "
            "approximately 10:45 PM, he observed a white colored van parked "
            "near the ITPL main road junction close to Sector 12. Two men "
            "were standing near the vehicle."
        ),
    },
    "forensic_report_1": {
        "title": "Forensic_Report_Fingerprints.pdf",
        "document_type": "forensic_report",
        "text": (
            "Forensic examination report. Fingerprint samples were lifted "
            "from the gate and compound wall of the complainant's "
            "residence. Two partial latent prints were recovered and sent "
            "for comparison against the state fingerprint database."
        ),
    },
    "unrelated_case_note": {
        "title": "Admin_Note_Case_Reassignment.pdf",
        "document_type": "other",
        "text": (
            "Administrative note: this case has been reassigned from "
            "Sub-Inspector Rao to Inspector Nair effective 16/03/2026 due "
            "to workload distribution within Whitefield Police Station."
        ),
    },
}


def main():
    if len(sys.argv) != 3:
        print("Usage: python scripts/seed_demo_case.py <profile_id> <case_id>")
        sys.exit(1)

    profile_id, case_id = sys.argv[1], sys.argv[2]

    print(f"Seeding {len(SAMPLE_DOCUMENTS)} sample documents into case {case_id} ...")

    for key, doc in SAMPLE_DOCUMENTS.items():
        inserted = (
            supabase.table("documents")
            .insert(
                {
                    "case_id": case_id,
                    "title": doc["title"],
                    "document_type": doc["document_type"],
                    "storage_path": f"demo-seed/{key}",
                    "file_hash_sha256": "0" * 64,
                    "ocr_extracted_text": doc["text"],
                    "extraction_status": "completed",
                    "uploaded_by": profile_id,
                }
            )
            .execute()
        )
        document_id = inserted.data[0]["id"]

        result = search_service.index_document(document_id=document_id)
        print(f"  Indexed {doc['title']}: {result['chunks_indexed']} chunk(s)")

    print("\nRunning demo query: 'documents mentioning a white van near Sector 12'")
    results = search_service.search(
        case_id=case_id,
        query="documents mentioning a white van near Sector 12",
        top_k=5,
        min_similarity=0.15,
    )

    for r in results:
        print(f"  [{r['similarity']:.3f}] {r['source_filename']}: {r['chunk_text'][:100]}...")

    if not results:
        print("  No results — check SUPABASE_URL/SUPABASE_SERVICE_KEY, and that "
              "supabase_search_function.sql has been run in the SQL Editor.")


if __name__ == "__main__":
    main()