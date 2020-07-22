// LINES!!! HTML5 port
// Ported by Rabia Alhaffar in 21/July/2020

LINES = (pancake.os.ANDROID || pancake.os.iOS) ? 300 : 200;

lines_from_x = [];
lines_from_y = [];
lines_to_x = [];
lines_to_y = [];
lines_size = [];
lines_colors = [];
lines_activated = [];

pancake.graphics.loadImage("resources/raylib_logo.png", 0);
pancake.graphics.loadImage("resources/gamelogo.png", 1);
pancake.graphics.loadImage("resources/playbutton.png", 2);
pancake.graphics.loadImage("resources/exitbutton.png", 3);
pancake.audio.load("resources/click.wav", 0);
pancake.audio.load("resources/boom.mp3", 1);
pancake.audio.load("resources/gameover.wav", 2);

// Main variables
scene = 1;
seconds = 0;
timer = 0;
linestimer = 0;
activationtimer = 0;
fps = 60;
gamespeed = 1.5;
highscore = Number(pancake.storage.load("highscore")) || 0;
explosionsize = 0;
save_one_time = 0;
alive = true;
playerx = 0;
playery = 0;
t = 0;
explosionAlpha = 0;
explosionColor = pancake.graphics.RGBA(255, 255, 255, explosionAlpha);
madeWithTxt = "MADE WITH";
titleTxt = "LINES!!!";
copyrightTxt = "CREATED BY RABIA ALHAFFAR";
gameOverTxt = "GAME OVER";
restartTxt = "[SPACE KEY]: Menu   [R]: Retry";
restartMobileTxt = "[TAP]: Menu";
fader = 1;
fade = pancake.graphics.RGBA(0, 0, 0, fader);
time = 0;
decrease = 1; // 1 = Decrease, 2 = Increase, 3 = Keep there

// Buttons
// NOTES: In ports, Textures of the buttons used instead
startgamebuttonpressed = false;
exitgamebuttonpressed = false;

function Splashscreen() {
    fade = pancake.graphics.RGBA(0, 0, 0, fader);
    pancake.graphics.setFont("pixelated", 48);
    pancake.graphics.color("blue", pancake.graphics.context.strokeStyle);
    pancake.graphics.text(madeWithTxt, (pancake.graphics.context.canvas.width - pancake.graphics.context.measureText(madeWithTxt).width) / 2, pancake.graphics.context.canvas.height / 3 - 45);
    pancake.graphics.imageFromIndex(0, (pancake.graphics.context.canvas.width - pancake.images[0].naturalWidth) / 2, pancake.graphics.context.canvas.height / 3 + 45, pancake.images[0].naturalWidth, pancake.images[0].naturalHeight);
    if (fader > fps * 4) scene = 2;
    pancake.graphics.color("transparent", pancake.graphics.context.strokeStyle);
    pancake.graphics.context.globalAlpha = fader;
    pancake.graphics.rect(0, 0, pancake.graphics.context.canvas.width, pancake.graphics.context.canvas.height);
    time += 4;
    fader = time;
}

function Menu() {
    fader = 255;
    if (decrease == 1) {
        fader -= 4;
        if (fader < 1) decrease = 3;
    } else if (decrease == 2) {
        fader += 4;
        if (fader > fps * 4) {
            RestartGame();
            RemakeLines();
        }
    } else {
        fader = 0;
    }
    pancake.graphics.imageFromIndex(1, (pancake.device.screen_width - ((pancake.os.ANDROID || pancake.os.iOS) ? pancake.images[1].naturalWidth / 2.2 : pancake.images[1].naturalWidth)), pancake.graphics.context.canvas.height / 7, pancake.images[1].naturalWidth / 2.5, pancake.images[1].naturalHeight / 2.5);
    pancake.graphics.color("blue", pancake.graphics.context.strokeStyle);
    pancake.graphics.setFont("pixelated", 22);
    pancake.graphics.text(copyrightTxt, 10, pancake.graphics.context.canvas.height - 32);
    pancake.graphics.imageFromIndex(2, (pancake.graphics.context.canvas.width - 250) / 2, pancake.graphics.context.canvas.height / 3 + 125, pancake.images[2].naturalWidth, pancake.images[2].naturalHeight);
    pancake.graphics.imageFromIndex(3, (pancake.graphics.context.canvas.width - 250) / 2, pancake.graphics.context.canvas.height / 3 + 275, pancake.images[3].naturalWidth, pancake.images[3].naturalHeight);
        
    // If mouse button down, Use AABB collision detection function
    // To check which button is pressed
    if (pancake.input.click || pancake.input.tap) {
        if (pancake.physics.checkCollisionRect(pancake.input.mouse_x || pancake.input.touch_x, pancake.input.mouse_y || pancake.input.touch_y, 1, 1, (pancake.graphics.context.canvas.width - 250) / 2, pancake.graphics.context.canvas.height / 3 + 125, 250, 125)) {
            startgamebuttonpressed = true;
        } else if (pancake.physics.checkCollisionRect(pancake.input.mouse_x || pancake.input.touch_x, pancake.input.mouse_y || pancake.input.touch_y, 1, 1, (pancake.graphics.context.canvas.width - 250) / 2, pancake.graphics.context.canvas.height / 3 + 275, 250, 125)) {
            exitgamebuttonpressed = true;
        }
    }
    // NOTES: Exit game button won't work on mobile.
    if (startgamebuttonpressed) {
        pancake.audio.playFromIndex(0);
        decrease = 2;
        time = 0;
        startgamebuttonpressed = false;
    } else if (exitgamebuttonpressed) {
        if (navigator.app) {
            navigator.app.exitApp();
        } else if (navigator.device) {
            navigator.device.exitApp();
        } else {
            window.close();
        }
        exitgamebuttonpressed = false;
    }
    pancake.graphics.color("transparent", pancake.graphics.context.strokeStyle);
    pancake.graphics.context.globalAlpha = fader;
    pancake.graphics.rect(0, 0, pancake.graphics.context.canvas.width, pancake.graphics.context.canvas.height);
}

function Game() {
    pancake.graphics.color("red", pancake.graphics.context.strokeStyle);
    pancake.graphics.setFont("grixel", 64);
    pancake.graphics.text(seconds.toString() + "s", pancake.graphics.context.canvas.width / 2.3, 64);
    if (alive) {
        if (pancake.input.mousedown(0) || pancake.input.tap) {
            playerx = pancake.input.mouse_x || pancake.input.touch_x;
            playery = pancake.input.mouse_y || pancake.input.touch_y;
        }
        if (playery < 10) playery = 10;
        if (playerx < 5) playerx = 5;
        pancake.graphics.color("purple", pancake.graphics.context.strokeStyle);
        pancake.graphics.circle(playerx, playery, 5);
        timer++;
        linestimer++;
    }
    explosionAlpha = 255 - ((explosionsize / 80) * 255);
    pancake.graphics.globalAlpha = explosionAlpha;
    pancake.graphics.color(explosionColor, pancake.graphics.context.strokeStyle);
    pancake.graphics.circle(playerx, playery, explosionsize);
    if (linestimer >= fps) {
        DrawLines();
        if (linestimer >= fps * 3) {
            lines_activated[t] = true;
            if (lines_activated[t]) {
                lines_colors[t] = "red";
                lines_size[t] = 3;
            }
            t++;
        }
        if (linestimer >= fps * 3.5) CheckCollisions();
        if (linestimer >= fps * 6.2) {
            t = 0;
            RemakeLines();
        }
        if (!alive) {      
            explosionsize += 1;
            if (linestimer >= fps * 4) {
                for (i = 0;i < LINES;i++) {
                    lines_size[i] = (explosionAlpha / 255) * 3;
                }
            }
        }
    }
    if (timer >= fps) {
        timer = 0;
        seconds += 1;
    }
    if (explosionsize > 80) {
        pancake.audio.playFromIndex(1);
        scene = 4;
    }
}

function GameOver() {
    pancake.graphics.color("red", pancake.graphics.context.strokeStyle);
    if (seconds > highscore) pancake.storage.save("highscore", Number(seconds));
    scoreTxt = "SURVIVED: " + seconds + " SECONDS";
    highscoreTxt = "HIGHSCORE: " + Number(pancake.storage.load("highscore") || 0) + " SECONDS";
    if (pancake.os.ANDROID || pancake.os.iOS) {
        pancake.graphics.setFont("grixel", 48);
        pancake.graphics.text(gameOverTxt, (pancake.graphics.context.canvas.width - (pancake.graphics.context.measureText(gameOverTxt).width)) / 2, pancake.graphics.context.canvas.height / 4);
        pancake.graphics.setFont("grixel", 20);
        pancake.graphics.text(highscoreTxt, (pancake.graphics.context.canvas.width - (pancake.graphics.context.measureText(highscoreTxt).width)) / 2, pancake.graphics.context.canvas.height / 2.8);
        pancake.graphics.text(scoreTxt, (pancake.graphics.context.canvas.width - pancake.graphics.context.measureText(scoreTxt).width) / 2, pancake.graphics.context.canvas.height / 2.4);
        pancake.graphics.color("green", pancake.graphics.context.strokeStyle);
        pancake.graphics.text(restartMobileTxt, (pancake.graphics.context.canvas.width - pancake.graphics.context.measureText(restartMobileTxt).width) / 2,pancake.graphics.context.canvas.height / 1.4);
        if (pancake.input.click || pancake.input.tap) {
                scene = 2;
                decrease = 1;
        }
    } else {
        pancake.graphics.setFont("grixel", 128);
        pancake.graphics.text(gameOverTxt, (pancake.graphics.context.canvas.width - (pancake.graphics.context.measureText(gameOverTxt).width)) / 2, pancake.graphics.context.canvas.height / 4);
        pancake.graphics.setFont("grixel", 32);
        pancake.graphics.text(highscoreTxt, (pancake.graphics.context.canvas.width - (pancake.graphics.context.measureText(highscoreTxt).width)) / 2, pancake.graphics.context.canvas.height / 2);
        pancake.graphics.setFont("grixel", 32);
        pancake.graphics.text(scoreTxt, (pancake.graphics.context.canvas.width - pancake.graphics.context.measureText(scoreTxt).width) / 2, pancake.graphics.context.canvas.height / 1.6);
        pancake.graphics.color("green", pancake.graphics.context.strokeStyle);
        pancake.graphics.text(restartTxt ,(pancake.graphics.context.canvas.width - pancake.graphics.context.measureText(restartTxt).width) / 2, pancake.graphics.context.canvas.height / 1.2);
        if (pancake.input.keydown(pancake.input.key.SPACE)) {
            scene = 2;
            decrease = 1;
        }
        if (pancake.input.keydown(pancake.input.key.R)) RestartGame();
    }
}

function RemakeLines() {
    for (i = 0; i < LINES;i++) {
        lines_from_x[i] = pancake.util.randomBetween(-pancake.graphics.context.canvas.width / 4, pancake.graphics.context.canvas.width * 1.5);
        lines_from_y[i] = pancake.util.randomBetween(-pancake.graphics.context.canvas.height / 4, pancake.graphics.context.canvas.height * 1.5);
        lines_to_x[i] = pancake.util.randomBetween(-pancake.graphics.context.canvas.width / 4, pancake.graphics.context.canvas.width * 1.5);
        lines_to_y[i] = pancake.util.randomBetween(-pancake.graphics.context.canvas.height / 4, pancake.graphics.context.canvas.height * 1.5);
        lines_size[i] = 1;
        lines_colors[i] = "white";
        activationtimer = 0;
        linestimer = 0;
        lines_activated[i] = false;
    }
}

function DrawLines() {
    for (i = 0;i < LINES;i++) {
        lines_from_x[i] += gamespeed;
        lines_from_y[i] -= gamespeed;
        lines_to_x[i] -= gamespeed;
        lines_to_y[i] += gamespeed;
        pancake.graphics.color(pancake.graphics.context.fillStyle, lines_colors[i]);
        pancake.graphics.line(lines_from_x[i], lines_from_y[i], lines_to_x[i], lines_to_y[i], lines_size[i]);
    }
}

function CheckCollisions() {
    for (i = 0;i < LINES;i++) {
        if (pancake.physics.checkCollisionCircleLine(playerx, playery, 5, lines_from_x[i], lines_from_y[i], lines_to_x[i], lines_to_y[i])) alive = false;
    }
}

function RestartGame() {
    RemakeLines();
    seconds = 0;
    save_one_time = 0;
    timer = 0;
    linestimer = 0;
    activationtimer = 0;
    scene = 3;
    explosionsize = 0;
    explosionAlpha = 255;
    alive = true;
    gamespeed = 1.5;
    t = 0;
    playerx = pancake.graphics.context.canvas.width / 2;
    playery = pancake.graphics.context.canvas.height / 2;
}
    
// Initialize game window in fullscreen and audio device if microphone or speaker found
pancake.canvas.create(pancake.canvas.compatible_width, pancake.canvas.compatible_height, 0);
pancake.context.create(0, 0);
pancake.graphics.useContext(0);

// Game loop
function loop() {
    pancake.graphics.setBackgroundColor("black");
    pancake.graphics.clear();
    explosionColor = pancake.graphics.RGBA(255, 255, 255, explosionAlpha);
    pancake.graphics.RGBA(0, 0, 0, fader)
    if (scene == 1) Splashscreen();
    if (scene == 2) Menu();
    if (scene == 3) Game();
    if (scene == 4) GameOver();
    pancake.input.preventLoop();
}
gameloop = pancake.timers.timer(loop, fps);