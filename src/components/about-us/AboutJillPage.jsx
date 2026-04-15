import React from "react";
import jillPhoto from "assets/about/aboutJill.png";
import dogsPhoto from "assets/about/dogs.png";

export default function AboutJillPage() {
  return (
    <div
      style={{
        maxWidth: "900px",
        margin: "0 auto",
        padding: "3rem 1rem",
        textAlign: "center",
      }}
    >
      <h1 style={{ marginBottom: "2rem" }}>Jill</h1>

      {/* Images */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "2rem",
          marginBottom: "2.5rem",
          flexWrap: "wrap",
        }}
      >
        <img
          src={jillPhoto}
          alt="Jill"
          style={{
            width: "250px",
            borderRadius: "12px",
          }}
        />
        <img
          src={dogsPhoto}
          alt="Dogs"
          style={{
            width: "250px",
            borderRadius: "12px",
          }}
        />
      </div>

      {/* Paragraph */}
      <p
        style={{
          maxWidth: "750px",
          margin: "0 auto",
          fontSize: "1.6rem",
          lineHeight: "1.7",
        }}
      >
        Hey! this is Jill, I’m a computer science and robotics student at UB :).
        I’m passionate about autonomous robots and ML/perception, although I also
        love designing.
      </p>

      {/* Bullet points */}
      <div
        style={{
          maxWidth: "450px",
          margin: "2.5rem auto 0",
          fontSize: "1 rem",
          textAlign: "left",
        }}
      >
        <ul style={{ paddingLeft: "1.2 rem" }}>
          <li>Mom of two stinkies</li>
          <li>Can solve a Rubik’s cube in 30 seconds</li>
          <li>Born in Spain, raised in Colombia</li>
        </ul>
      </div>
    </div>
  );
};

