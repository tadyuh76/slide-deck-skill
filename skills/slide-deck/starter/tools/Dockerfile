# deck-pack: the image every packaging step runs in (PowerPoint, PDF, fonts, pictures)
FROM python:3.12-slim
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg && rm -rf /var/lib/apt/lists/* \
 && pip install --no-cache-dir python-pptx pillow lxml numpy scipy fonttools pymupdf
