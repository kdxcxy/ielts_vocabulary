import asyncio
import json
import subprocess
from pathlib import Path

import edge_tts


ROOT = Path(__file__).resolve().parents[1]
PUBLIC_AUDIO_ROOT = ROOT / "public" / "audio" / "manual"
DATA_FILES = [ROOT / "data" / "words.json", ROOT / "public" / "data" / "words.json"]
UK_VOICE = "en-GB-LibbyNeural"
US_VOICE = "en-US-EmmaNeural"


def load_manual_entries():
    command = [
        "node",
        "--input-type=module",
        "-e",
        (
            "import { MANUAL_PRONUNCIATIONS } from './lib/manual-pronunciations.js';"
            "console.log(JSON.stringify(Object.values(MANUAL_PRONUNCIATIONS)))"
        ),
    ]
    completed = subprocess.run(
        command,
        cwd=ROOT,
        check=True,
        capture_output=True,
        text=True,
        encoding="utf-8",
    )
    return json.loads(completed.stdout)


MANUAL_ENTRIES = load_manual_entries()


async def write_audio(text: str, voice: str, target: Path):
    target.parent.mkdir(parents=True, exist_ok=True)
    communicate = edge_tts.Communicate(text, voice=voice)
    await communicate.save(str(target))


async def generate_audio():
    tasks = []
    for entry in MANUAL_ENTRIES:
        tasks.append(
            write_audio(
                entry["ttsText"],
                UK_VOICE,
                PUBLIC_AUDIO_ROOT / "uk" / f'{entry["word"]}.mp3',
            )
        )
        tasks.append(
            write_audio(
                entry["ttsText"],
                US_VOICE,
                PUBLIC_AUDIO_ROOT / "us" / f'{entry["word"]}.mp3',
            )
        )
    await asyncio.gather(*tasks)


def sync_dataset():
    manual_map = {entry["word"]: entry for entry in MANUAL_ENTRIES}
    for path in DATA_FILES:
        rows = json.loads(path.read_text(encoding="utf-8"))
        updated = False
        for row in rows:
            entry = manual_map.get(str(row.get("word", "")).strip().lower())
            if not entry:
                continue
            row["phonetic_uk"] = entry["phoneticUk"]
            row["phonetic_us"] = entry["phoneticUs"]
            row["audio_uk"] = f'/audio/manual/uk/{entry["word"]}.mp3'
            row["audio_us"] = f'/audio/manual/us/{entry["word"]}.mp3'
            row["pronunciation_source"] = "manual"
            updated = True
        if updated:
            path.write_text(json.dumps(rows, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


async def main():
    await generate_audio()
    sync_dataset()
    print(f"generated {len(MANUAL_ENTRIES) * 2} manual audio files")


if __name__ == "__main__":
    asyncio.run(main())
