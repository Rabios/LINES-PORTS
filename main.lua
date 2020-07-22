-- LINES!!! Linux port
-- Ported by Rabia Alhaffar in 21/July/2020

setmetatable(_G, { __index = rl })

ffi = require("ffi")
os = require("os")
math = require("math")
string = require("string")
LINES = 200

lines_from_x = {}
lines_from_y = {}
lines_to_x = {}
lines_to_y = {}
lines_size = {}
lines_colors = {}
lines_activated = {}

function load_resources()

-- Load Game assets
-- NOTES: raylib might crashes if assets loaded before window initialization
raytex = rl.LoadTexture("resources/raylib_logo.png")
gamelogo = rl.LoadTexture("resources/gamelogo.png")
rayfont = rl.LoadFont("resources/acme7wide.ttf")
gamefont = rl.LoadFont("resources/pixelated.ttf")
click = rl.LoadSound("resources/click.wav")
explosion = rl.LoadSound("resources/boom.mp3")
gameover = rl.LoadSound("resources/gameover.wav")
startgamebutton = rl.LoadTexture("resources/playbutton.png")
exitgamebutton = rl.LoadTexture("resources/exitbutton.png")

end

-- Main variables
scene = 1
seconds = 0
timer = 0
linestimer = 0
activationtimer = 0
fps = 60
gamespeed = 1.5
highscore = 0
explosionsize = 0.0
save_one_time = 0
alive = true
playerx = 0
playery = 0
explosionColor = rl.WHITE
HIGHSCORE = 0
madeWithTxt = "MADE WITH"
titleTxt = "LINES!!!"
copyrightTxt = "CREATED BY RABIA ALHAFFAR"
gameOverTxt = "GAME OVER"
scoreTxt = "SURVIVED: %i SECONDS"
highscoreTxt = "BEST TIME SURVIVED: %i SECONDS"
restartTxt = "[SPACE KEY]: Menu   [R]: Retry"
fade = rl.BLACK
time = 0
decrease = 1 -- 1 = Decrease, 2 = Increase, 3 = Keep there

-- Buttons
-- NOTES: In ports, Textures of the buttons used instead
startgamebuttonpressed = false
exitgamebuttonpressed = false

function Splashscreen()
    rl.BeginDrawing()
        rl.ClearBackground(rl.BLACK)
        rl.DrawTextEx(gamefont, madeWithTxt, { (rl.GetScreenWidth() - rl.MeasureText(madeWithTxt, 48)) / 2, rl.GetScreenHeight() / 3 - 45 }, 48, 2.0, rl.WHITE)
        rl.DrawTexture(raytex, (rl.GetScreenWidth() - raytex.width) / 2, rl.GetScreenHeight() / 3 + 45, rl.WHITE)
        time = time + 4
        fade.a = time
        if fade.a > fps * 4 then
            scene = 2
        end
        rl.DrawRectangleRec(Screen, fade)
        rl.DrawFPS(10, 10)
    rl.EndDrawing()
end

function Menu()
    rl.BeginDrawing()
        if decrease == 1 then
            fade.a = fade.a - 4
            if fade.a < 1 then
                decrease = 3
            end
        elseif decrease == 2 then
            fade.a = fade.a + 4
            if fade.a > fps * 4 then
                RestartGame()
                RemakeLines()
            end
        else
            fade.a = 0
        end
        rl.ClearBackground(rl.BLACK)
        rl.DrawTexture(gamelogo, (rl.GetScreenWidth() - (gamelogo.width)) / 2, rl.GetScreenHeight() / 7, rl.GRAY)
        rl.DrawTextEx(gamefont, copyrightTxt, { 10, rl.GetScreenHeight() - 32 }, 22, 2.0, rl.BLUE)
        rl.DrawTexture(startgamebutton, (rl.GetScreenWidth() - 250) / 2, rl.GetScreenHeight() / 3 + 125, rl.GRAY)
        rl.DrawTexture(exitgamebutton, (rl.GetScreenWidth() - 250) / 2, rl.GetScreenHeight() / 3 + 275, rl.GRAY)
        
        -- If mouse button down, Use AABB collision detection function
        -- To check which button is pressed
        if rl.IsMouseButtonPressed(0) then
            if AABB(rl.GetMouseX(), rl.GetMouseY(), 1, 1, (rl.GetScreenWidth() - 250) / 2, rl.GetScreenHeight() / 3 + 125, 250, 125) then
                startgamebuttonpressed = true
            elseif AABB(rl.GetMouseX(), rl.GetMouseY(), 1, 1, (rl.GetScreenWidth() - 250) / 2, rl.GetScreenHeight() / 3 + 275, 250, 125) then
                exitgamebuttonpressed = true
            end
        end
        if startgamebuttonpressed then
            rl.PlaySound(click)
            decrease = 2
            time = 0
            startgamebuttonpressed = false
        elseif exitgamebuttonpressed then
            exitgamebuttonpressed = false
            UnloadResources(2)
            rl.CloseAudioDevice()
            rl.CloseWindow()
            os.exit(0)
        end
        rl.DrawRectangleRec(Screen, fade)
        rl.DrawFPS(10, 10)
    rl.EndDrawing()
end

function Game()
    rl.BeginDrawing()
        rl.ClearBackground(rl.BLACK)
        rl.DrawText(string.format("%is", seconds), rl.GetScreenWidth() / 2.1, 10, 64, rl.MAROON)
        if alive then
            if rl.IsMouseButtonDown(0) then
                playerx = rl.GetMouseX()
                playery = rl.GetMouseY()                    
            end
            if playery < 10 then playery = 10 end
            if playerx < 5 then playerx = 5 end
            rl.DrawCircle(playerx, playery, 5.0, rl.PURPLE)
            timer = timer + 1
            linestimer = linestimer + 1
        end
        explosionColor.a = 255.0 - ((explosionsize / 80.0) * 255.0)
        rl.DrawCircle(playerx, playery, explosionsize, explosionColor)      
        if linestimer >= fps * 2 then
            DrawLines()
            if linestimer >= fps * 4 then
                for i = 1, LINES, 1 do
                    if activationtimer > i / 4 then
                        lines_activated[i] = true
                    end
                    if lines_activated[i] then
                        lines_size[i] = 3.0
                        lines_colors[i] = rl.RED
                        CheckCollisions()
                    end
                end
                activationtimer = activationtimer + 1
            end
            if linestimer >= fps * 5 then
                CheckCollisions()
                RemakeLines()
                activationtimer = 0
                linestimer = 0
            end
            if not alive then      
                explosionsize = explosionsize + 1.0
                if linestimer >= fps * 4 then
                    for i = 1, LINES, 1 do
                        lines_size[i] = (explosionColor.a / 255.0) * 3.0
                        lines_colors[i].a = explosionColor.a            
                    end                    
                end
            end
        end
        rl.DrawFPS(10, 10)
        if timer >= fps then
            timer = 0
            seconds = seconds + 1
        end
        if explosionsize > 80.0 then
            rl.PlaySound(explosion)
            scene = 4
        end
    rl.EndDrawing()
end

function GameOver()
    rl.BeginDrawing()
        rl.ClearBackground(rl.BLACK)
        highscore = rl.LoadStorageValue(HIGHSCORE)
        if seconds > highscore and save_one_time == 0 then
            highscore = seconds
            rl.SaveStorageValue(HIGHSCORE, highscore)
            save_one_time = 1
        end
        rl.DrawText(gameOverTxt, (rl.GetScreenWidth() - rl.MeasureText(gameOverTxt, 128)) / 2, rl.GetScreenHeight() / 4, 128, rl.MAROON)
        rl.DrawText(string.format(highscoreTxt, rl.LoadStorageValue(HIGHSCORE)), (rl.GetScreenWidth() - rl.MeasureText(string.format(highscoreTxt, highscore), 64)) / 2, rl.GetScreenHeight() / 2, 64, rl.MAROON)
        rl.DrawText(string.format(scoreTxt, seconds), (rl.GetScreenWidth() - rl.MeasureText(string.format(scoreTxt, seconds), 32)) / 2, rl.GetScreenHeight() / 1.6, 32, rl.MAROON)     
        rl.DrawText(restartTxt,(rl.GetScreenWidth() - rl.MeasureText(restartTxt, 32)) / 2, rl.GetScreenHeight() / 1.2, 32, rl.GREEN)
        if rl.IsKeyPressed(rl.KEY_SPACE) then
            scene = 2
            decrease = 1
        elseif rl.IsKeyPressed(rl.KEY_R) then
            RestartGame()
        end
        rl.DrawFPS(10, 10)
    rl.EndDrawing()
end

function UnloadResources(r) 
    if r == 1 then
        rl.UnloadTexture(gamelogo)
        rl.UnloadTexture(raytex)
    elseif r == 2 then
        rl.UnloadFont(rayfont)
        rl.UnloadFont(gamefont)
        rl.UnloadSound(click)
        rl.UnloadSound(explosion)
        rl.UnloadSound(gameover)
    end
end

function RemakeLines()
    for i = 1, LINES, 1 do
        lines_from_x[i] = rl.GetRandomValue(-rl.GetScreenWidth() / 4, rl.GetScreenWidth() * 1.5)
        lines_from_y[i] = rl.GetRandomValue(-rl.GetScreenHeight() / 4, rl.GetScreenHeight() * 1.5)
        lines_to_x[i] = rl.GetRandomValue(-rl.GetScreenWidth() / 4, rl.GetScreenWidth() * 1.5)
        lines_to_y[i] = rl.GetRandomValue(-rl.GetScreenHeight() / 4, rl.GetScreenHeight() * 1.5)
        lines_size[i] = 1.0
        lines_colors[i] = rl.WHITE
        lines_activated[i] = false
    end
end

function DrawLines()
    for i = 1, LINES, 1 do
        lines_from_x[i] = lines_from_x[i] + gamespeed
        lines_from_y[i] = lines_from_y[i] - gamespeed
        lines_to_x[i] = lines_to_x[i] - gamespeed
        lines_to_y[i] = lines_to_y[i] + gamespeed
        rl.DrawLineEx({ lines_from_x[i], lines_from_y[i] }, { lines_to_x[i], lines_to_y[i] }, lines_size[i], lines_colors[i])
    end
end

function CheckCollisions()
    for i = 1, LINES, 1 do
        dist = nil
        v1x = lines_to_x[i] - lines_from_x[i]
        v1y = lines_to_y[i] - lines_from_y[i]
        v2x = playerx - lines_from_x[i]
        v2y = playery - lines_from_y[i]
        u = (v2x * v1x + v2y * v1y) / (v1y * v1y + v1x * v1x)
        if u >= 0 and u <= 1 then
            dist = math.pow((lines_from_x[i] + v1x * u - playerx), 2) + math.pow((lines_from_y[i] + v1y * u - playery), 2)
        else
            if u < 0 then
                dist = math.pow((lines_from_x[i] - playerx), 2) + math.pow((lines_from_y[i] - playery), 2)
            else
                dist = math.pow((lines_to_x[i] - playerx), 2) + math.pow((lines_to_y[i] - playery), 2)
            end
        end
        if dist < math.pow(5.0, 2) then
            alive = false
        end
    end
end

function RestartGame()
    RemakeLines()
    seconds = 0
    save_one_time = 0
    timer = 0
    linestimer = 0
    activationtimer = 0
    scene = 3
    explosionsize = 0.0
    alive = true
    gamespeed = 1.5
    playerx = rl.GetScreenWidth() / 2
    playery = rl.GetScreenHeight() / 2
end

function AABB(x1, y1, w1, h1, x2, y2, w2, h2)
    return x1 < x2 + w2 and x1 + w1 > x2 and y1 < y2 + h2 and y1 + h1 > y2
end

-- Main game code
-- Set flags and enable Antialiasing and VSync
rl.SetConfigFlags(rl.FLAG_VSYNC_HINT)
rl.SetConfigFlags(rl.FLAG_MSAA_4X_HINT)
    
-- Initialize game window in fullscreen and audio device if microphone or speaker found
rl.InitWindow(0, 0, "LINES!!!")
rl.ToggleFullscreen()
rl.InitAudioDevice()
    
rl.SetTargetFPS(fps)
-- Fix for HighDPI display problems
rl.SetTextureFilter(rl.GetFontDefault().texture, rl.FILTER_POINT)
    
-- Load game resources and unload it!!!
load_resources() 
    
-- Setting screen rectangle
Screen = ffi.new("Rectangle", 0, 0, rl.GetScreenWidth(), rl.GetScreenHeight())

-- Game loop
while not rl.WindowShouldClose() do
    if scene == 1 then Splashscreen() end
    if scene == 2 then Menu() end
    if scene == 3 then Game() end
    if scene == 4 then GameOver() end
end
    
-- Else if ESC pressed or closed by default
UnloadResources(1)
UnloadResources(2)
rl.CloseAudioDevice()
rl.CloseWindow()
os.exit(0)