@echo off
echo Copying game background images...
mkdir "public\assets\bg" 2>nul
copy /Y "C:\Users\shlom\.gemini\antigravity\brain\d8f45b7d-4ad7-46f0-b409-4a874d70e3d6\main_menu_bg_1773837981179.png" "public\assets\bg\main.png"
copy /Y "C:\Users\shlom\.gemini\antigravity\brain\d8f45b7d-4ad7-46f0-b409-4a874d70e3d6\battle_arena_bg_1773838087683.png" "public\assets\bg\battle.png"
copy /Y "C:\Users\shlom\.gemini\antigravity\brain\d8f45b7d-4ad7-46f0-b409-4a874d70e3d6\map_bg_1773838250453.png" "public\assets\bg\map.png"
copy /Y "C:\Users\shlom\.gemini\antigravity\brain\d8f45b7d-4ad7-46f0-b409-4a874d70e3d6\shop_bg_1773840446678.png" "public\assets\bg\shop.png"
copy /Y "C:\Users\shlom\.gemini\antigravity\brain\d8f45b7d-4ad7-46f0-b409-4a874d70e3d6\camp_bg_1773840502118.png" "public\assets\bg\camp.png"
echo Done! All backgrounds are now in public\assets\bg\
pause
