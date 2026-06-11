# Sawiyya · سويّة
**Learn to sign — together, as equals.** A Duolingo-style app that teaches the *hearing* world Qatari Sign Language, with an on-device AI camera that grades your signing. Mada Innovation Award entry.

## Run the recognizer spike
```bash
python3 -m http.server 8000 --directory .
# open http://localhost:8000  (Chrome). Camera needs localhost or https.
```
`index.html` = Step 1: on-device MediaPipe hand tracking (21 landmarks, real-time). Next: Arabic-alphabet classifier on the landmark stream.

## Brand
Teal #0F6E6A · Coral #E8654C · Gold #E6B24C · Sand #F6EFE3 · Ink #16302E. Type: Readex Pro + Rubik.
