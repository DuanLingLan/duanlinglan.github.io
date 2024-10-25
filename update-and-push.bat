@echo off
REM 进入你的项目目录
cd C:\Users\Horiz\Desktop\web pack\asheweb

REM 运行脚本以生成 posts.json
node generatePosts.js

REM 提交更改
git add .
git commit -m "Update posts.json"
git push origin main  REM 或者你使用的分支名称

echo Update and push completed!
pause
