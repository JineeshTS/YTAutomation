import { Composition } from 'remotion';
import { NewsShort } from './NewsShort';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="NewsShort"
        component={NewsShort}
        durationInFrames={1800} // 60 seconds at 30fps
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          title: 'Market Update',
          subtitle: 'Your daily market brief',
          content: ['Point 1', 'Point 2', 'Point 3'],
          audioPath: '',
          audioDuration: 60,
          type: 'market_open' as const
        }}
      />
    </>
  );
};
