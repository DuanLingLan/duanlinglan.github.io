@echo off
cd C:\Users\Horiz\Desktop\web pack\asheweb

node generatePosts.js

git add .  

git commit -m "Update posts and posts.json"  

git push origin main  

echo Update and push completed!
pause
