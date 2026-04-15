import React from "react";
import engineerImage from "assets/about/engineer.jpg";

const AboutJackPage = () => {
  return (
    <div>
      <img
          src={engineerImage}
          width="300px"
          height="300px"
          alt="JACK"
      />
      <br/>
      <p style={{paddingLeft: "300px", paddingRight: "300px"}}>
          My name is Jack Mazzella, I am a developer of RateRoom. 
          I've been studying Computer Science for almost 6 years, and I will be graduating from UB in a few months. 
          My favorite animals are penguins. My favorite TV show is The Wire. My favorite song is Light My Fire. 
          My most favorite game is Fallout 4 although it is objectively bad. I chose the engineer image because it's funny.
      </p>
    </div>
  );
}; export default AboutJackPage;

