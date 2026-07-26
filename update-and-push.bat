@echo off
cd C:\Users\Horiz\Desktop\web pack\asheweb

node scripts\generate-posts.js

node scripts\generate-notes.js

node scripts\generate-rss.js

node scripts\generate-gallery.js

node scripts\generate-changelog.js

git add .

git commit -m "Update posts and posts.json"  

git push origin main  

echo Update and push completed!
pause
