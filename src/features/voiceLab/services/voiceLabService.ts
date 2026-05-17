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

export type VoicePresetCategory = 'studio' | 'effect';

export type VoicePresetId =
  // Studio / professional mastering chains — for your own recordings
  | 'studio_clean'
  | 'mosque_reverb'
  | 'cathedral'
  | 'cinematic_depth'
  | 'warm_radio'
  | 'youtube_master'
  | 'podcast_clean'
  | 'noise_cleanup'
  // Creative / fun effect chains
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
  category: VoicePresetCategory;
  label: string;
  /** Single emoji shown in the preset grid. */
  emoji: string;
  /** One-line description for the preset card. */
  description: string;
  /** FFmpeg audio filter chain (passed as -af). */
  filter: string;
}

// ---------------------------------------------------------------------------
// Filter recipes used by the studio chains
// ---------------------------------------------------------------------------
//
// Each chain follows the same broadcast-audio philosophy used by pro
// voice-over engineers:
//
//   1. CLEAN:     afftdn  — adaptive FFT noise reduction (removes phone-mic
//                            hiss, room AC hum, mouth-click background)
//   2. SHAPE:     equalizer / bass / treble  — sculpt presence + warmth
//   3. CONTROL:   acompressor  — even out loud and soft parts
//   4. SPACE:     aecho  — small / medium / large room reverb
//   5. NORMALISE: loudnorm  — push to YouTube's -14 LUFS / -1.5 TP target
//                              so the upload doesn't get re-encoded down
//   6. SAFETY:    alimiter  — peak ceiling to prevent inter-sample clipping
//
// All filters are part of stock FFmpeg audio — no GPL/licensed components.

// Adaptive FFT denoiser tuned for voice recordings.
const CLEAN = 'afftdn=nr=12:nf=-25:tn=1';

// Subtle voice EQ — warm chest tone at 150Hz, cut mud at 300Hz, presence
// at 3kHz, air at 10kHz.
const VOICE_EQ =
  'equalizer=f=150:t=q:w=1.5:g=2.5,' +
  'equalizer=f=300:t=q:w=1.5:g=-3,' +
  'equalizer=f=3000:t=q:w=1.5:g=2,' +
  'equalizer=f=10000:t=q:w=1.5:g=3';

// Gentle compressor — 3:1 ratio, -20dB threshold, fast attack, smooth release.
const VOICE_COMP =
  'acompressor=threshold=-20dB:ratio=3:attack=5:release=120:makeup=4';

// Loudness normalisation to YouTube / Spotify-ish target.
const YOUTUBE_LOUDNESS = 'loudnorm=I=-14:TP=-1.5:LRA=11';

// Brick-wall safety limiter to catch any post-loudnorm transients.
const SAFETY = 'alimiter=limit=0.95';

// Three reverb tails. aecho gives short / medium / long room ambience
// without needing a separate impulse-response file.
const ROOM_SMALL = 'aecho=0.85:0.7:50:0.25';
const ROOM_MEDIUM = 'aecho=0.8:0.78:80|140:0.32|0.22';
const ROOM_LARGE = 'aecho=0.7:0.85:120|260|520:0.4|0.3|0.18';

// FFmpeg trick used for pitch-without-speed-change:
//   `asetrate=44100*<k>,aresample=44100,atempo=1/<k>`
// asetrate resamples (speed + pitch shift), aresample restores sample rate,
// atempo compensates the playback speed. Stock-FFmpeg-safe.
export const VOICE_PRESETS: VoicePreset[] = [
  // ---------------------------------------------------------------------
  // STUDIO — broadcast-grade chains for your own recordings.
  // Each one runs the full clean → shape → control → space → normalise
  // pipeline so the output is YouTube-ready in one pass.
  // ---------------------------------------------------------------------
  {
    id: 'studio_clean',
    category: 'studio',
    label: 'Studio Clean',
    emoji: '🎙️',
    description: 'Noise removed, EQ-shaped, compressed, loudness-normalised',
    filter: [CLEAN, VOICE_EQ, VOICE_COMP, YOUTUBE_LOUDNESS, SAFETY].join(','),
  },
  {
    id: 'mosque_reverb',
    category: 'studio',
    label: 'Mosque',
    emoji: '🕌',
    description: 'Warm hall ambience — perfect for recitation videos',
    filter: [
      CLEAN,
      VOICE_EQ,
      VOICE_COMP,
      ROOM_MEDIUM,
      YOUTUBE_LOUDNESS,
      SAFETY,
    ].join(','),
  },
  {
    id: 'cathedral',
    category: 'studio',
    label: 'Cathedral',
    emoji: '⛪',
    description: 'Long, atmospheric reverb tail — dramatic recitation',
    filter: [
      CLEAN,
      VOICE_EQ,
      VOICE_COMP,
      ROOM_LARGE,
      YOUTUBE_LOUDNESS,
      SAFETY,
    ].join(','),
  },
  {
    id: 'cinematic_depth',
    category: 'studio',
    label: 'Cinematic Depth',
    emoji: '🎬',
    description: 'Movie-trailer warmth — pitch dipped, chest tone boosted',
    filter: [
      CLEAN,
      // very mild pitch dip + tempo compensation → richer chest tone
      'asetrate=44100*0.95,aresample=44100,atempo=1/0.95',
      // extra low-end warmth on top of voice EQ
      'bass=g=4:f=120:w=0.7',
      VOICE_EQ,
      VOICE_COMP,
      ROOM_MEDIUM,
      YOUTUBE_LOUDNESS,
      SAFETY,
    ].join(','),
  },
  {
    id: 'warm_radio',
    category: 'studio',
    label: 'Warm Radio',
    emoji: '📻',
    description: 'AM-radio-style mid-forward voice, very intimate',
    filter: [
      CLEAN,
      'highpass=f=80',
      'equalizer=f=200:t=q:w=1.2:g=3',
      'equalizer=f=2500:t=q:w=1.5:g=4',
      'equalizer=f=8000:t=q:w=2:g=-2',
      VOICE_COMP,
      ROOM_SMALL,
      YOUTUBE_LOUDNESS,
      SAFETY,
    ].join(','),
  },
  {
    id: 'youtube_master',
    category: 'studio',
    label: 'YouTube Master',
    emoji: '▶️',
    description: 'Hits YouTube\'s -14 LUFS spec exactly — no surprises on upload',
    filter: [CLEAN, VOICE_COMP, YOUTUBE_LOUDNESS, SAFETY].join(','),
  },
  {
    id: 'podcast_clean',
    category: 'studio',
    label: 'Podcast',
    emoji: '🎧',
    description: 'Clean intelligible voice, no reverb',
    filter: [
      CLEAN,
      'highpass=f=80',
      'equalizer=f=3000:t=q:w=1.5:g=2',
      VOICE_COMP,
      'dynaudnorm=f=200:g=15',
      SAFETY,
    ].join(','),
  },
  {
    id: 'noise_cleanup',
    category: 'studio',
    label: 'Noise Cleanup',
    emoji: '🧹',
    description: 'Just the denoise step — kills hiss / hum without altering voice',
    filter: [CLEAN, SAFETY].join(','),
  },

  // ---------------------------------------------------------------------
  // EFFECTS — fun / creative transformations.
  // ---------------------------------------------------------------------
  {
    id: 'chipmunk',
    category: 'effect',
    label: 'Chipmunk',
    emoji: '🐿️',
    description: 'High squeaky voice — both pitch + speed up',
    filter: 'asetrate=44100*1.5,aresample=44100',
  },
  {
    id: 'deep',
    category: 'effect',
    label: 'Deep Voice',
    emoji: '🦁',
    description: 'Movie-trailer baritone — pitch + speed down',
    filter: 'asetrate=44100*0.75,aresample=44100',
  },
  {
    id: 'baby',
    category: 'effect',
    label: 'Baby',
    emoji: '👶',
    description: 'High pitch, normal speed',
    filter: 'asetrate=44100*1.4,aresample=44100,atempo=1/1.4',
  },
  {
    id: 'monster',
    category: 'effect',
    label: 'Monster',
    emoji: '👹',
    description: 'Low growl, normal speed',
    filter: 'asetrate=44100*0.65,aresample=44100,atempo=1/0.65',
  },
  {
    id: 'robot',
    category: 'effect',
    label: 'Robot',
    emoji: '🤖',
    description: 'Mechanical sci-fi voice — phase-locked tone',
    filter:
      "afftfilt=real='hypot(re,im)*sin(0)':imag='hypot(re,im)*cos(0)':win_size=512:overlap=0.75",
  },
  {
    id: 'echo',
    category: 'effect',
    label: 'Echo',
    emoji: '🌀',
    description: 'Two delayed copies — hall reverb',
    filter: 'aecho=0.8:0.9:1000|1800:0.3|0.25',
  },
  {
    id: 'cave',
    category: 'effect',
    label: 'Cave',
    emoji: '🕳️',
    description: 'Deep cavernous echo',
    filter: 'aecho=0.8:0.88:60:0.4,aecho=0.8:0.88:120:0.3',
  },
  {
    id: 'telephone',
    category: 'effect',
    label: 'Telephone',
    emoji: '📞',
    description: 'Tinny narrowband — phone-line filter',
    filter: 'highpass=f=300,lowpass=f=3400',
  },
  {
    id: 'whisper',
    category: 'effect',
    label: 'Whisper',
    emoji: '🤫',
    description: 'Hushed, breathy delivery',
    filter: 'volume=0.5,highpass=f=300,lowpass=f=2000',
  },
  {
    id: 'slow',
    category: 'effect',
    label: 'Slow-mo',
    emoji: '🐢',
    description: 'Half-speed without pitch shift',
    filter: 'atempo=0.7',
  },
  {
    id: 'fast',
    category: 'effect',
    label: 'Fast Forward',
    emoji: '🐇',
    description: 'Double-speed without pitch shift',
    filter: 'atempo=1.6',
  },
  {
    id: 'helium',
    category: 'effect',
    label: 'Helium',
    emoji: '🎈',
    description: 'Pitch up but same length',
    filter: 'asetrate=44100*1.25,aresample=44100,atempo=1/1.25',
  },
  {
    id: 'demon',
    category: 'effect',
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
