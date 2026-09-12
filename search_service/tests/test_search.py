import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.chunking import split_into_chunks

def test_short_text_returns_single_chunk():
    text = "This is a short FIR summary."
    chunks = split_into_chunks(text, chunk_size_words=120, overlap_words=30)
    assert len(chunks) == 1
    assert chunks[0] == text

def test_long_text_splits_into_overlapping_chunks():
    words = [f"word{i}" for i in range(300)]
    text = " ".join(words)
    chunks = split_into_chunks(text, chunk_size_words=120, overlap_words=30)

    assert len(chunks) > 1
    first_chunk_words = chunks[0].split()
    second_chunk_words = chunks[1].split()
    assert set(first_chunk_words) & set(second_chunk_words)

def test_empty_text_returns_no_chunks():
    assert split_into_chunks("   ") == []

if __name__ == "__main__":
    import traceback

    tests = [obj for name, obj in list(globals().items()) if name.startswith("test_")]
    passed, failed = 0, 0
    for test in tests:
        try:
            test()
            print(f"PASS: {test.__name__}")
            passed += 1
        except Exception:
            print(f"FAIL: {test.__name__}")
            traceback.print_exc()
            failed += 1
    print(f"\n{passed} passed, {failed} failed")