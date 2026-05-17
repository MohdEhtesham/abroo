import { FFmpegKit, ReturnCode } from 'ffmpeg-kit-react-native';
import RNFS from 'react-native-fs';

// =============================================================================
// Voice Lab — file-based voice changer (FREE, on-device, unlimited)
// =============================================================================
//
// Stack: ffmpeg-kit's `audio` package runs entirely on the phone. Once the
// APK ships, every conversion is instant, offline, and costs nothing.
//
// We expose a tiny set of presets. Each preset maps to an FFmpeg `-af`
// filter chain. All filters used here are part of the stock FFmpeg audio
// build — no licensed components like rubberband required.

export type VoicePresetId =
  | 'chipmunk'
  | 'deep'
  | 'baby'
  | 'monster'
  | 'robot'
  | 'echo'
  | 'cave'
  | 'telephone'
  | 'whisper'
  | 'slow'
  | 'fast'
  | 'helium'
  | 'demon';

export interface VoicePreset {
  id: VoicePresetId;
  label: string;
  /** Single emoji shown in the preset grid. */
  emoji: string;
  /** One-line description for the preset card. */
  description: string;
  /** FFmpeg audio filter chain (passed as -af). */
  filter: string;
}

// FFmpeg trick used for pitch-without-speed-change:
//   `asetrate=44100*<k>,aresample=44100,atempo=1/<k>`
// asetrate resamples (speed + pitch shift), aresample restores sample rate,
// atempo compensates the playback speed. Stock-FFmpeg-safe.
export const VOICE_PRESETS: VoicePreset[] = [
  {
    id: 'chipmunk',
    label: 'Chipmunk',
    emoji: '🐿️',
    description: 'High squeaky voice — both pitch + speed up',
    filter: 'asetrate=44100*1.5,aresample=44100',
  },
  {
    id: 'deep',
    label: 'Deep Voice',
    emoji: '🦁',
    description: 'Movie-trailer baritone — pitch + speed down',
    filter: 'asetrate=44100*0.75,aresample=44100',
  },
  {
    id: 'baby',
    label: 'Baby',
    emoji: '👶',
    description: 'High pitch, normal speed',
    filter: 'asetrate=44100*1.4,aresample=44100,atempo=1/1.4',
  },
  {
    id: 'monster',
    label: 'Monster',
    emoji: '👹',
    description: 'Low growl, normal speed',
    filter: 'asetrate=44100*0.65,aresample=44100,atempo=1/0.65',
  },
  {
    id: 'robot',
    label: 'Robot',
    emoji: '🤖',
    description: 'Mechanical sci-fi voice — phase-locked tone',
    filter:
      "afftfilt=real='hypot(re,im)*sin(0)':imag='hypot(re,im)*cos(0)':win_size=512:overlap=0.75",
  },
  {
    id: 'echo',
    label: 'Echo',
    emoji: '🌀',
    description: 'Two delayed copies — hall reverb',
    filter: 'aecho=0.8:0.9:1000|1800:0.3|0.25',
  },
  {
    id: 'cave',
    label: 'Cave',
    emoji: '🕳️',
    description: 'Deep cavernous echo',
    filter: 'aecho=0.8:0.88:60:0.4,aecho=0.8:0.88:120:0.3',
  },
  {
    id: 'telephone',
    label: 'Telephone',
    emoji: '📞',
    description: 'Tinny narrowband — phone-line filter',
    filter: 'highpass=f=300,lowpass=f=3400',
  },
  {
    id: 'whisper',
    label: 'Whisper',
    emoji: '🤫',
    description: 'Hushed, breathy delivery',
    filter: 'volume=0.5,highpass=f=300,lowpass=f=2000',
  },
  {
    id: 'slow',
    label: 'Slow-mo',
    emoji: '🐢',
    description: 'Half-speed without pitch shift',
    filter: 'atempo=0.7',
  },
  {
    id: 'fast',
    label: 'Fast Forward',
    emoji: '🐇',
    description: 'Double-speed without pitch shift',
    filter: 'atempo=1.6',
  },
  {
    id: 'helium',
    label: 'Helium',
    emoji: '🎈',
    description: 'Pitch up but same length',
    filter: 'asetrate=44100*1.25,aresample=44100,atempo=1/1.25',
  },
  {
    id: 'demon',
    label: 'Demon',
    emoji: '😈',
    description: 'Deep + slight tremolo wobble',
    filter: 'asetrate=44100*0.6,aresample=44100,tremolo=f=5:d=0.3',
  },
];

const sanitize = (s: string) => s.replace(/[^a-z0-9]+/gi, '_');

/**
 * Where the converted output lives. Inside the app's private documents
 * folder so it survives upgrades and never needs storage permission.
 */
const outputDir = () => `${RNFS.DocumentDirectoryPath}/voice-lab`;

const ensureOutputDir = async () => {
  const dir = outputDir();
  if (!(await RNFS.exists(dir))) {
    await RNFS.mkdir(dir);
  }
  return dir;
};

/** Copy a content://-URI picked file into the app's cache so FFmpeg can read it. */
export const cacheInputFile = async (
  pickedUri: string,
  hintedName?: string,
): Promise<string> => {
  await ensureOutputDir();
  const dest = `${outputDir()}/input_${Date.now()}_${sanitize(hintedName ?? 'audio')}`;
  await RNFS.copyFile(pickedUri, dest);
  return dest;
};

export interface VoiceConvertResult {
  outputPath: string;
  preset: VoicePreset;
  inputPath: string;
  durationMs: number;
}

/**
 * Apply a preset filter chain to `inputPath` and write a brand-new mp3 to
 * the voice-lab output directory. The original file is left untouched.
 *
 * Pure FFmpeg — fully on-device, no network. Output uses libmp3lame which
 * is included in the 'audio' build flavour we pinned in build.gradle.
 */
export const convertVoice = async (
  inputPath: string,
  preset: VoicePreset,
): Promise<VoiceConvertResult> => {
  await ensureOutputDir();
  const stamp = Date.now();
  const output = `${outputDir()}/${preset.id}_${stamp}.mp3`;

  const started = Date.now();
  // -y          overwrite if exists
  // -i input    source
  // -af filter  audio-filter chain
  // -c:a libmp3lame -q:a 4   reasonable VBR quality, ~120kbps
  // -threads 0  let ffmpeg pick a sane parallelism for the device
  const cmd = `-y -i "${inputPath}" -af "${preset.filter}" -c:a libmp3lame -q:a 4 -threads 0 "${output}"`;

  const session = await FFmpegKit.execute(cmd);
  const code = await session.getReturnCode();

  if (!ReturnCode.isSuccess(code)) {
    const logs = await session.getAllLogsAsString();
    throw new Error(
      logs?.slice(-500) ?? 'Voice conversion failed. Please try a different file.',
    );
  }

  return {
    outputPath: output,
    preset,
    inputPath,
    durationMs: Date.now() - started,
  };
};

/** List previously converted files (most recent first) — used for history. */
export const listConvertedFiles = async () => {
  await ensureOutputDir();
  const files = await RNFS.readDir(outputDir());
  return files
    .filter(f => f.isFile() && f.name.endsWith('.mp3') && !f.name.startsWith('input_'))
    .sort((a, b) => (b.mtime?.getTime() ?? 0) - (a.mtime?.getTime() ?? 0));
};

/** Clear the voice-lab output folder. */
export const clearVoiceLab = async () => {
  const dir = outputDir();
  if (await RNFS.exists(dir)) await RNFS.unlink(dir);
};
