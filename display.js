function displayEndGame() {
  var endgame = document.getElementById('EndGame');
  //var game = document.getElementById('WebGL-output');

  if (endgame.style.display === "none" || endgame.style.display === "") {
    endgame.style.display = "block";
    //game.style.display = "none";
  } else {
    endgame.style.display = "none";
    //game.style.display = "block";
  }

  console.log("Holi");

}
