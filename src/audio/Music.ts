import tracks from "../content/music.json";
export const musicTracks = tracks;
export function pickBackgroundTrack(
  previousPath: string,
  random = Math.random,
) {
  const choices = musicTracks.filter((track) => track.path !== previousPath);
  return choices[Math.floor(random() * choices.length)];
}
