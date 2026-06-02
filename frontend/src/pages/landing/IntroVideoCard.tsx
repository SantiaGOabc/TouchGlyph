const IntroVideoCard = () => {
  return (
    <div className="intro-video-card">
      <video
        autoPlay
        muted
        loop
        playsInline
        className="intro-video"
      >
        <source src="/proto.mp4" type="video/mp4" />
      </video>

      <div className="intro-video-overlay">
        <span>Aprendizaje en acción</span>
      </div>
    </div>
  );
};

export default IntroVideoCard;
