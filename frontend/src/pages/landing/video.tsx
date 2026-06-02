import { forwardRef } from 'react';

const InicioVideo = forwardRef<HTMLVideoElement>((_props, ref) => {
  return (
    <>
      <video
        ref={ref}
        autoPlay
        muted
        loop
        playsInline
        className="background-video"
      >
        <source src="/mano_braille.mp4" type="video/mp4" />
      </video>
      <div className="video-overlay"></div>
    </>
  );
});

InicioVideo.displayName = 'InicioVideo';

export default InicioVideo;
