import React from 'react';
import { AbsoluteFill, Audio, Sequence, useCurrentFrame, useVideoConfig, interpolate, Img } from 'remotion';

interface VideoProps {
  title: string;
  subtitle: string;
  content: string[];
  audioPath: string;
  audioDuration: number;
  type: 'market_open' | 'midday' | 'market_close' | 'global' | 'preview';
}

export const NewsShort: React.FC<VideoProps> = ({
  title,
  subtitle,
  content,
  audioPath,
  audioDuration,
  type
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Color schemes based on video type
  const colorSchemes = {
    market_open: { primary: '#10B981', secondary: '#059669', bg: '#064E3B' },
    midday: { primary: '#3B82F6', secondary: '#2563EB', bg: '#1E3A8A' },
    market_close: { primary: '#EF4444', secondary: '#DC2626', bg: '#7F1D1D' },
    global: { primary: '#8B5CF6', secondary: '#7C3AED', bg: '#5B21B6' },
    preview: { primary: '#F59E0B', secondary: '#D97706', bg: '#78350F' }
  };

  const colors = colorSchemes[type];

  // Animation timings
  const titleDuration = 2 * fps; // 2 seconds
  const contentItemDuration = Math.floor((audioDuration * fps - titleDuration - 2 * fps) / content.length);
  const outroDuration = 2 * fps;

  // Title animation
  const titleOpacity = interpolate(
    frame,
    [0, 20, titleDuration - 20, titleDuration],
    [0, 1, 1, 0],
    { extrapolateRight: 'clamp' }
  );

  const titleScale = interpolate(
    frame,
    [0, 20],
    [0.8, 1],
    { extrapolateRight: 'clamp' }
  );

  return (
    <AbsoluteFill style={{ backgroundColor: '#000000' }}>
      {/* Audio */}
      <Audio src={audioPath} />

      {/* Animated Background Gradient */}
      <AbsoluteFill>
        <div style={{
          background: `linear-gradient(135deg, ${colors.bg} 0%, #000000 100%)`,
          opacity: 0.9
        }} />
      </AbsoluteFill>

      {/* Animated Grid Pattern */}
      <AbsoluteFill style={{ opacity: 0.1 }}>
        <svg width="100%" height="100%">
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
          </pattern>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </AbsoluteFill>

      {/* Title Sequence */}
      <Sequence from={0} durationInFrames={titleDuration}>
        <AbsoluteFill style={{
          justifyContent: 'center',
          alignItems: 'center',
          padding: '60px',
          opacity: titleOpacity,
          transform: `scale(${titleScale})`
        }}>
          {/* Logo/Brand */}
          <div style={{
            position: 'absolute',
            top: '80px',
            fontSize: '36px',
            fontWeight: '900',
            color: colors.primary,
            fontFamily: 'Arial, sans-serif',
            letterSpacing: '2px',
            textTransform: 'uppercase'
          }}>
            GameofCrores
          </div>

          {/* Main Title */}
          <div style={{
            fontSize: '72px',
            fontWeight: '900',
            color: '#FFFFFF',
            textAlign: 'center',
            lineHeight: '1.2',
            fontFamily: 'Arial, sans-serif',
            textShadow: `0 0 40px ${colors.primary}`,
            marginBottom: '30px',
            maxWidth: '90%'
          }}>
            {title}
          </div>

          {/* Subtitle */}
          <div style={{
            fontSize: '36px',
            fontWeight: '600',
            color: colors.primary,
            textAlign: 'center',
            fontFamily: 'Arial, sans-serif',
            maxWidth: '80%'
          }}>
            {subtitle}
          </div>

          {/* Animated Line */}
          <div style={{
            width: '200px',
            height: '4px',
            background: colors.primary,
            marginTop: '40px',
            borderRadius: '2px',
            boxShadow: `0 0 20px ${colors.primary}`
          }} />
        </AbsoluteFill>
      </Sequence>

      {/* Content Sequences */}
      {content.map((item, index) => {
        const startFrame = titleDuration + index * contentItemDuration;
        const itemOpacity = interpolate(
          frame,
          [startFrame, startFrame + 15, startFrame + contentItemDuration - 15, startFrame + contentItemDuration],
          [0, 1, 1, 0],
          { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' }
        );

        const itemTranslateY = interpolate(
          frame,
          [startFrame, startFrame + 20],
          [50, 0],
          { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' }
        );

        return (
          <Sequence key={index} from={startFrame} durationInFrames={contentItemDuration}>
            <AbsoluteFill style={{
              justifyContent: 'center',
              alignItems: 'center',
              padding: '80px',
              opacity: itemOpacity,
              transform: `translateY(${itemTranslateY}px)`
            }}>
              {/* Point Number */}
              <div style={{
                position: 'absolute',
                top: '100px',
                left: '60px',
                fontSize: '120px',
                fontWeight: '900',
                color: colors.primary,
                opacity: 0.3,
                fontFamily: 'Arial, sans-serif'
              }}>
                {index + 1}
              </div>

              {/* Content Card */}
              <div style={{
                background: `linear-gradient(135deg, ${colors.primary}22 0%, ${colors.secondary}11 100%)`,
                border: `3px solid ${colors.primary}`,
                borderRadius: '30px',
                padding: '60px',
                maxWidth: '90%',
                boxShadow: `0 20px 60px ${colors.primary}44`
              }}>
                <div style={{
                  fontSize: '48px',
                  fontWeight: '700',
                  color: '#FFFFFF',
                  textAlign: 'center',
                  lineHeight: '1.4',
                  fontFamily: 'Arial, sans-serif'
                }}>
                  {item}
                </div>
              </div>

              {/* Progress Indicator */}
              <div style={{
                position: 'absolute',
                bottom: '100px',
                display: 'flex',
                gap: '15px'
              }}>
                {content.map((_, i) => (
                  <div key={i} style={{
                    width: '60px',
                    height: '8px',
                    borderRadius: '4px',
                    background: i === index ? colors.primary : '#FFFFFF33',
                    boxShadow: i === index ? `0 0 15px ${colors.primary}` : 'none'
                  }} />
                ))}
              </div>
            </AbsoluteFill>
          </Sequence>
        );
      })}

      {/* Outro */}
      <Sequence from={titleDuration + content.length * contentItemDuration} durationInFrames={outroDuration}>
        <AbsoluteFill style={{
          justifyContent: 'center',
          alignItems: 'center',
          padding: '60px'
        }}>
          <div style={{
            fontSize: '64px',
            fontWeight: '900',
            color: colors.primary,
            fontFamily: 'Arial, sans-serif',
            letterSpacing: '3px',
            textTransform: 'uppercase',
            textShadow: `0 0 40px ${colors.primary}`
          }}>
            GameofCrores
          </div>
          <div style={{
            fontSize: '32px',
            fontWeight: '600',
            color: '#FFFFFF',
            marginTop: '30px',
            fontFamily: 'Arial, sans-serif'
          }}>
            Follow for Daily Updates
          </div>
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
};
