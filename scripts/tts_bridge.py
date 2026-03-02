import asyncio
import edge_tts
import sys

async def amain():
    if len(sys.argv) < 3:
        print("Usage: python tts_bridge.py <text> <output_path> [voice]")
        sys.exit(1)
    
    text = sys.argv[1]
    output_path = sys.argv[2]
    voice = sys.argv[3] if len(sys.argv) > 3 else "az-AZ-BabekNeural"

    communicate = edge_tts.Communicate(text, voice)
    await communicate.save(output_path)

if __name__ == "__main__":
    asyncio.run(amain())
