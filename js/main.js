import { initScene } from "./scene.js";

initScene({
  onComplete: (selections) => {
    console.log("Finished input flow:", selections);

    // Next: transition into scrolly
    // document.getElementById("scene").style.display = "none";
    // document.getElementById("scrollyRoot").style.display = "block";
  }
});
