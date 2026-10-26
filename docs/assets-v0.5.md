# v0.5 视觉素材

使用内置 image_gen 生成，不通过第三方付费API；原始文件保留，运行时无需联网。

## 场景

输出：`assets/scene/home-landscape-v1.png`，750×560。

提示词：原创硬边16-bit像素RPG村庄，青蓝天空与奶油白云、远处青绿群山、左侧暖色木屋、两侧树木、前景草地；中间和右侧留空，不含人物、动物、车辆、文字、界面或既有游戏IP。用于750rpx宽的首页角色背景。

## 角色

母版：`assets/character/source/explorer-master.png`。运行图片：`assets/character/explorer-h0-o0.png` 等16个配色。

提示词：single friendly adult chibi explorer, front facing full body standing idle, dark tousled brown hair, warm skin, expressive eyes, sage green hoodie jacket with seams and pockets, dark blue jeans, off-white sneakers. Crisp 16-bit sprite pixels, dark stepped outlines, limited colors, subtle pixel shading. Transparent background, no ground, no objects, text, UI or logos. Hair brown and jacket sage green for separate palette customization. Single character, not a sprite sheet.

构建脚本 `scripts/build-character.js` 仅做像素缩放、透明边缘规整、调色板换色与PNG压缩，不在运行时绘制假人物。母版不进入小程序上传包；35张已有导航/分类图标继续复用。
