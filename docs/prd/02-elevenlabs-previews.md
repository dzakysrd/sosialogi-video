# PRD-02: ElevenLabs voice previews (about 12 s each)
## Goal
Three short previews of the v3 opening, one per candidate voice, so the user can choose the voice for video-01 v3 by ear.
## Text (exactly this, the first four sentences of voice/samples/v3/narration_v3.txt)
UMP Jakarta tertinggi. Tapi rata-ratanya di bawah UMP. Tahun dua ribu dua puluh enam, UMP Jakarta lima koma tujuh tiga juta. Rata-rata gaji bersihnya cuma lima koma dua tiga juta.
Save it as voice/samples/elevenlabs/preview/preview_text.txt (30 words).
## Voices (Voice Library, id-ID, free_users_allowed true, verified for eleven_multilingual_v2, per the read-only discovery of 2026-10-27)
- pratama: q8qwd1jY2jS3AWOBeq25 (Pratama - Clear, Confident and Warm; male, young, social_media)
- bian: 1k39YpzqXZn52BgyLyGO (Bian - Neutral, Calm and Clear; male, middle_aged, informative_educational)
- arunika: o5s6XRBkPSTD4syv6mZg (Arunika - National TV Voice Over; female, middle_aged, narrative_story)
## Settings
eleven_multilingual_v2, no voice settings passed (voice defaults), --max-pause 0.16 --lead-keep 0.05 --tail-pad 0.2 (the pause rhythm of the current v3 edge-tts take). One API call per voice; out-dir voice/samples/elevenlabs/preview/<name>/.
## Budget
About 180 characters per voice, so about 540 credits in total. Never more than one paid call per voice. If a call fails (for example a library voice refused for a free account), record the HTTP status and body verbatim and continue with the next voice. Do not add voices to the account, do not substitute another voice, do not retry with other settings.
## Report per voice
words (must be 30), sentences (must be 4), vo_seconds, hook span = end of the 8th word minus start of the 1st word (the v3 hook limit is 3.5 s), words per second over the whole take, integrated LUFS and true peak measured independently with ffmpeg ebur128=peak=true, credits_used and credits_source, and the alignment text check result.

## Outcome (2026-10-27): blocked
All three calls were refused with HTTP 402, code `paid_plan_required`: "Free users cannot use library voices via the API. Upgrade to Creator or add $5 of credits to use this voice". No audio was produced and no credits were charged (subscription character_count stayed at 54). The discovery field `free_users_allowed: true` does not mean a free account may use the voice through the API. Premade voices do work on the free plan (the PRD-01 smoke call used one). Next step depends on the user's choice: a paid plan or credits, or a free-plan alternative.
