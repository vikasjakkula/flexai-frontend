import { Link } from "react-router-dom";
import ScrollReveal from "../components/ScrollReveal";

const Home = () => {
  const heroSectionStyle = {
    width: "100vw",
    minHeight: "100vh",
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#fff",
    overflow: "hidden",
    boxSizing: "border-box",
    padding: 0,
    margin: 0,
  };

  const heroInnerStyle = {
    maxWidth: "1400px",
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "3.5rem",
    padding: "0 2rem",
    boxSizing: "border-box",
    flexWrap: "wrap",
  };

  const leftColStyle = {
    flex: "1 1 420px",
    minWidth: "340px",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    justifyContent: "center",
    maxWidth: "540px",
  };

  const heroTitleStyle = {
    fontSize: "2.5rem",
    fontWeight: "bold",
    marginBottom: "1.5rem",
    lineHeight: 1.18,
    color: "#161616",
    textAlign: "left",
  };

  const textGradient = {
    background: "linear-gradient(90deg,#ff445a 0%,#f6a700 85%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    fontWeight: "bold",
  };

  const heroDescStyle = {
    fontSize: "1.05rem",
    maxWidth: "385px",
    marginBottom: "2.2rem",
    color: "#494949",
    lineHeight: 1.6,
    textAlign: "left",
  };

  const heroBtnGroupStyle = {
    display: "flex",
    flexDirection: "row",
    gap: "18px",
    marginTop: "0.3rem",
  };

  const btnPrimary = {
    padding: "0.78em 2.1em",
    fontSize: "1.06rem",
    background: "#161616",
    color: "#fff",
    border: "none",
    borderRadius: "7px",
    fontWeight: 600,
    letterSpacing: ".03em",
    cursor: "pointer",
    textDecoration: "none",
    boxShadow: "0 2px 8px rgba(48, 24, 38, 0.04)",
    transition: "background 0.21s",
  };

  const btnOutline = {
    padding: "0.78em 2.1em",
    fontSize: "1.06rem",
    background: "transparent",
    color: "#161616",
    border: "1.7px solid #161616",
    borderRadius: "7px",
    fontWeight: 600,
    letterSpacing: ".03em",
    cursor: "pointer",
    textDecoration: "none",
    boxShadow: "none",
    transition: "background 0.21s, color 0.21s",
  };

  const rightColStyle = {
    flex: "1 1 340px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: "340px",
    minHeight: "390px",
    width: "min(490px, 85vw)",
    height: "min(440px, 70vw)",
  };

  const imageStyle = {
    width: "100%",
    height: "100%",
    objectFit: "contain",
    borderRadius: "25px",
    boxShadow: "0 6px 28px rgba(80,32,48,0.10)",
  };

  const topicStyle = {
    fontSize: "2.1rem",
    fontWeight: 600,
    margin: "2.2rem 0 1.2rem 0",
    textAlign: "center",
  };
  const textStyle = {
    fontSize: "1.18rem",
    marginBottom: "1.1rem",
    textAlign: "left",
  };

  return (
    <div className="home-page">
      <section className="hero-section" style={heroSectionStyle}>
        <div style={heroInnerStyle}>
          <div className="hero-content" style={leftColStyle}>
            <h1 className="hero-title" style={heroTitleStyle}>
            Remote Patient Monitoring,<br />
              <span className="text-gradient" style={textGradient}>
              Healthcare
              </span>
            </h1>
            <p className="hero-description" style={heroDescStyle}>
            An agent that monitors patient vitals (heart rate, blood pressure) via mock IoT data streams and automatically triggers emergency workflows when dangerous thresholds are crossed.
            </p>
            <div className="hero-buttons" style={heroBtnGroupStyle}>
              <Link to="/predict" style={btnPrimary}>
                Start Prediction
              </Link>
              <Link to="/dashboard" style={btnOutline}>
                View Dashboard
              </Link>
            </div>
          </div>
          <div className="hero-image" style={rightColStyle}>
            <img
              src="/image.png"
              alt="Heart Health"
              style={imageStyle}
              loading="eager"
              draggable={true}
            />
          </div>
        </div>
      </section>
      <section className="what-this-page-does">
        <ScrollReveal stagger>
          <ul>
            <li>
              <strong>Features</strong>
            </li>
            <li>
              <span>✅</span><span>Monitor patient vitals in real-time</span> <br />
            </li>
            <li>
              <span>✅</span><span>Detect critical health events instantly</span> <br />
            </li>
            <li>
              <span>✅</span><span>Trigger emergency responses automatically</span> <br />
            </li>
            <li>
              <span>✅</span><span>Reduce response time in emergencies</span> <br />
            </li>
          </ul>
        </ScrollReveal>
      </section>
      <section className="landing-brief">
        <div className="container">
          <ScrollReveal>
            <div style={topicStyle}>Why Use Our Remote Patient Monitoring System?</div>
          </ScrollReveal>
          <ScrollReveal stagger>
            <div style={textStyle}>
              <b>Real-time Monitoring:</b> Continuously collects and analyzes vitals from IoT devices, triggering alerts when thresholds are breached.
            </div>
            <div style={textStyle}>
              <b>Automated Emergency Response:</b> Instantly triggers workflows like CPR training or emergency room notifications when critical thresholds are exceeded.
            </div>
            <div style={textStyle}>
              <b>Adaptable Thresholds:</b> Easily configure safety thresholds for different patient profiles and care scenarios.
            </div>
            <div style={textStyle}>
              <b>Flexible Deployment:</b> Suitable for remote clinics, home health care, and patient monitoring in low-resource settings.
            </div>
            <div style={textStyle}>
              <b>API-First Design:</b> Ready for integration with existing healthcare systems or for extension with AI-driven analytics.
            </div>
            <div style={textStyle}>
              <b>Scalable & Hackathon-Ready:</b> Designed for rapid development and easy scaling to support multiple patients and devices.
            </div>
            <div style={textStyle}>
              <b>Integrates with Existing Systems:</b> Easily connect to existing EHRs or monitoring platforms for seamless data flow.
            </div>
          </ScrollReveal>

          <ScrollReveal>
            <div style={topicStyle}>How Our Remote Patient Monitoring System Works</div>
          </ScrollReveal>
          <ScrollReveal stagger>
            <div style={textStyle}>
              <b>Mock IoT Data Stream:</b> Simulates live patient vitals from IoT devices, providing a realistic monitoring experience.
            </div>
            <div style={textStyle}>
              <b>Real-time Threshold Evaluation:</b> Continuously checks vitals against configurable safety thresholds and triggers alerts when thresholds are breached.
            </div>
            <div style={textStyle}>
              <b>Emergency Workflow Automation:</b> Triggers pre-defined workflows like CPR training or emergency room notifications when critical thresholds are exceeded.
            </div>
            <div style={textStyle}>
              <b>API-First Design:</b> Ready for integration with existing healthcare systems or for extension with AI-driven analytics.
            </div>
            <div style={textStyle}>
              <b>Scalable & Hackathon-Ready:</b> Designed for rapid development and easy scaling to support multiple patients and devices.
            </div>
          </ScrollReveal>

          <ScrollReveal>
            <div style={topicStyle}>Our Remote Patient Monitoring System</div>
          </ScrollReveal>
          <ScrollReveal stagger>
            <div style={textStyle}>
              <b>Mock IoT Data Stream:</b> Simulates live patient vitals from IoT devices, providing a realistic monitoring experience.
            </div>
            <div style={textStyle}>
              <b>Real-time Threshold Evaluation:</b> Continuously checks vitals against configurable safety thresholds and triggers alerts when thresholds are breached.
            </div>
          </ScrollReveal>

          <ScrollReveal>
            <div
              className="remote-patient-monitoring-system"
              style={{
                marginTop: "2rem",
                background: "rgba(0,0,0,0.04)",
                borderRadius: 8,
                padding: "1.5rem",
              }}
            >
              <strong>Remote Patient Monitoring System:</strong>
              <p style={{ marginTop: "1rem", fontStyle: "italic" }}>
                "Our Remote Patient Monitoring System is a real-time agent that monitors patient vitals (heart rate, blood pressure) via mock IoT data streams and automatically triggers emergency workflows when dangerous thresholds are crossed."
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
};

export default Home;
