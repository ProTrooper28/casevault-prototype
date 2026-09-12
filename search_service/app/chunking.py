import re
from typing import List


def split_into_chunks(
    text: str, chunk_size_words: int = 120, overlap_words: int = 30
) -> List[str]:
    
    words = re.split(r"\s+", text.strip())
    words = [w for w in words if w]
    if not words:
        return []

    chunks = []
    start = 0
    step = max(chunk_size_words - overlap_words, 1)
    while start < len(words):
        chunk_words = words[start : start + chunk_size_words]
        chunks.append(" ".join(chunk_words))
        if start + chunk_size_words >= len(words):
            break
        start += step
    return chunks