/**
 * Convert subtitle objects to SRT format string.
 */
export function generateSRT(subtitles: any[]): string {
  return subtitles
    .filter((s) => s.translatedText || s.text)
    .map((s, i) => {
      const start = formatSRTTime(s.start);
      const end = formatSRTTime(s.end);
      const text = s.translatedText || s.text;
      return `${i + 1}\n${start} --> ${end}\n${text}\n`;
    })
    .join("\n");
}

function formatSRTTime(seconds: number): string {
  const date = new Date(0);
  date.setSeconds(seconds);
  const hh = date.getUTCHours().toString().padStart(2, "0");
  const mm = date.getUTCMinutes().toString().padStart(2, "0");
  const ss = date.getUTCSeconds().toString().padStart(2, "0");
  const ms = Math.floor((seconds % 1) * 1000).toString().padStart(3, "0");
  return `${hh}:${mm}:${ss},${ms}`;
}
