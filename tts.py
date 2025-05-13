'''
Description: 
'''
import sys
import os
import asyncio
import edge_tts


async def main():


    if len(sys.argv) < 4:
        print("Usage: python tts.py <text> <voice> <output_file>")
        return

    text = sys.argv[1]
    voice = sys.argv[2]
    output_file = sys.argv[3]
    communicate = edge_tts.Communicate(text, voice)
    await communicate.save(output_file)

    print(f"Audio saved to {output_file}")

if __name__ == "__main__":
    asyncio.run(main())
