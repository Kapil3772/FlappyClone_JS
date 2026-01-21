class Rect {
  constructor(x,y,w,h){
    this.xPos = x;
    this.yPos = y;
    this.w = w;
    this.h = h;
  }
  top(){
    return this.yPos;
  }
  bottom(){
    return this.yPos + this.h;
  }
  right(){
    return this.xPos + this.w;
  }
  left(){
    return this.xPos;
  }
  centerX(){
    return this.xPos + (this.w / 2.0);
  }
  centerY(){
    return this.yPos + (this.h / 2.0);
  }
}

class PhysicsRect extends Rect {
  constructor(x,y,w,h){
    super(x,y,w,h);
    this.prevX = x;
    this.prevY = y;
  }
  intersects(rect){
    return this.right() > rect.left() && this.bottom() > rect.top() &&
    this.left() < rect.right() && this.top() < rect.bottom();
  }
}

class GameImage {
  loadImage(path){
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = path;
      img.onload = () => resolve(img);
      img.onerror = reject;
    });
  }
  async loadImagesFromFolder(path,count){
    const imgs = [];
    for(let i=0; i<count; i++){
      try{
      const img = await this.loadImage(path + i +".png");
        imgs.push(img);
      }catch {
        console.log("Cannot load the Image :" + path + i +".png");
      }
    }
    return imgs;
  }
}

class RenderOffset {
  constructor(x,y,w,h) {
    this.xPos = x;
    this.yPos = y;
    this.w = w;
    this.h = h;
  }
  setOffsets(x,y,w,h){
    this.xPos = x;
    this.yPos = y;
    this.w = w;
    this.h = h;
  }
  reset(){
    this.xPos = 0;
    this.yPos = 0;
    this.w = 0;
    this.h = 0;
  }
}

class Layer{
  img;
  depth;
  renderOffset = new RenderOffset(0,0,0,0);
  constructor(img,x,y,layer, game){
    this.img = img;
    this.xPos = x;
    this.yPos = y;
    this.w = this.img.width;
    this.h = this.img.height +40;
    this.copyxPos = x + this.w;
    this.copyyPos = this.y;
    this.depth = layer+1;
    this.depthFactorY = 0.3*(1.0/this.depth);
    this.game = game
    this.wrapX = 0;
    this.wrapY = 0;
    this.screenX = 0;
    this.screenY = 0;
    this.wrapW = this.game.vCanvas.width;
  }
  render(ctx){
    //Calculating wrap x,y so the image loops
    //for real
    this.screenX = this.xPos + (this.game.camera.cameraOffsetX * (1/this.depth *0.5));
    this.wrapX = ((this.screenX %  this.wrapW) + this.wrapW) % this.wrapW;
    
    ctx.drawImage(
      this.img,
      this.wrapX - this.w + this.renderOffset.xPos,
    0 + (this.game.camera.cameraOffsetY * this.depthFactorY) + this.renderOffset.yPos,
    this.w + this.renderOffset.w,
    this.h + this.renderOffset.h);
    
    this.copyxPos = this.xPos + this.w;
    // for copy
    this.screenX = this.copyxPos + (this.game.camera.cameraOffsetX * (1 / this.depth *0.5));
    this.wrapX = this.copyxPos + ((this.screenX % this.wrapW) + this.wrapW) % this.wrapW;

    ctx.drawImage(
      this.img,
      this.wrapX - this.w -1 + this.renderOffset.xPos,
      0 + (this.game.camera.cameraOffsetY * this.depthFactorY) + this.renderOffset.yPos,
      this.w + this.renderOffset.w,
      this.h + this.renderOffset.h);
  }
}


class Background {
  constructor(game){
    this.game = game;
    
  }
  render(ctx){
    for(const layer of this.layers){
        layer.render(ctx);
    }
  }
}

class Animation{
  constructor(frames,animFrequency,looping){
    this.framesCount = frames.length;
    this.framesDuration = 1.0/animFrequency;
    this.frames = frames;
    this.looping = looping;
    this.renderOffset = new RenderOffset(0,0,0,0);
  }
}

class AnimationPlayer {
  constructor(animation){
    this.animation = animation;
    this.isDone = false;
    this.animationTime = 0.0;
    this.currentFrame = 0;
    this.totalFramesElapsed = 1;
  }
  
  getCurrentFrame(dt) {
    this.animationTime += dt;

    if (this.animationTime >= this.animation.framesDuration) {
        this.currentFrame++;
        this.animationTime -= this.animation.framesDuration;

        if (this.currentFrame >= this.animation.framesCount) {
            if (this.animation.looping) {
                this.currentFrame = 0;
            } else {
                this.currentFrame = this.animation.framesCount - 1;
                this.isDone = true;
            }
        }
    }

    return this.animation.frames[this.currentFrame];
}
  
  reset(){
    this.animationTime = 0.0;
    this.currentFrame = 0;
    this.isDone = false;
    this.totalFramesElapsed = 1;
  }
}

class Camera extends Rect {
  constructor(x,y,w,h,entity,game){
    super(x,y,w,h);
    this.entity = entity;
    this.game = game;
    this.cameraOffsetX = 0;
    this.cameraOffsetY = 0;
    this.targetX = this.entity.xPos;
    this.targetY = this.entity.yPos;
    this.smoothness = 5;
  }
  update(dt){
    this.targetX = this.entity.xPos;
    this.targetY = this.entity.yPos;
    let dx = (this.targetX - this.xPos)* this.smoothness * dt;
    this.xPos += dx;
    let dy = (this.targetY - this.yPos)* this.smoothness * dt;
    this.yPos += dy;
    
    //this.xPos = this.entity.xPos;
    //this.yPos = this.entity.yPos;
    
    //calculating camera offset
    this.cameraOffsetX = (this.game.vCanvas.width / 8.0) - this.xPos;
    this.cameraOffsetY = (this.game.vCanvas.height / 2.0) - this.yPos;
  }
  render(ctx){
    //visually showing camera
    ctx.fillStyle = "yellow";
    ctx.fillRect(this.xPos + this.cameraOffsetX, this.yPos + this.cameraOffsetY, this.w,this.h);
    ctx.strokeStyle = "black";
    ctx.strokeRect(this.xPos + this.cameraOffsetX, this.yPos + this.cameraOffsetY, this.w,this.h);
  }
}

const EnemyAnimState = {
  IDLE: "IDLE",
  ATTACK: "ATTACK"
}

class Enemy extends PhysicsRect{
  constructor(x,y,w,h, game){
    super(x,y,w,h);
    this.velocityX = 0.0;
    this.velocityY = 0.0;
    this.direction = 1;
    this.game = game;
    
    //Interpolated Position
    this.alphaX = this.xPos;
    this.alphaY = this.yPos;
    
    //flags
    this.onAir = true;
    this.facingRight = true;
    
    //Animation dependecies
    this.currAnimState = EnemyAnimState.IDLE;
    this.nextAnimState = this.currAnimState;
    this.animPlayerRegistry = {
      "IDLE": new AnimationPlayer(this.game.enemyIdle),
      "ATTACK": new AnimationPlayer(this.game.enemyAttack)
    };
    this.currAnimPlayer = this.animPlayerRegistry[this.currAnimState];
    
    //render dependencies
    this.imgScalingFactor = 2.2;
    this.finalRenderOffset = new RenderOffset(0, 0, 0, 0);
    this.animRenderOffset = new RenderOffset(0, 0, 0, 0);
  }
  update(dt) {
    this.prevX = this.xPos;
    this.prevY = this.yPos;
  }
  updateInterpolation(ipf) {
    this.alphaX = this.prevX + ((this.xPos - this.prevX) * ipf);
    this.alphaY = this.prevY + ((this.yPos - this.prevY) * ipf);
  }
  updateAnimation(deltaTime) {
    //updating anim render offset
    
  
  if (this.nextAnimState != this.currAnimState) {
    this.currAnimState = this.nextAnimState;
    this.currAnimPlayer = this.animPlayerRegistry[this.currAnimState];
    this.currAnimPlayer.reset();
  }
  
    this.animRenderOffset = this.currAnimPlayer.animation.renderOffset;
  
    this.img = this.currAnimPlayer.getCurrentFrame(deltaTime);
  }

updateRenderOffset() {
  
  this.finalRenderOffset.xPos = this.animRenderOffset.xPos + (this.w - (this.img.width * this.imgScalingFactor) / 2.0);
  this.finalRenderOffset.yPos = this.animRenderOffset.yPos + (this.h - this.img.height);
  this.finalRenderOffset.w = this.animRenderOffset.w;
  this.finalRenderOffset.h = this.animRenderOffset.h;
}

render(ctx) {
  if (this.img == null) {
    // fallback
    console.log("enemy sprite is null");
    ctx.fillStyle = "black";
    ctx.fillRect(
      this.alphaX + this.game.camera.cameraOffsetX,
      this.alphaY + this.game.camera.cameraOffsetY,
      this.w,
      this.h
    );
    return;
  }
  
  this.updateRenderOffset();
  
  const renderX = this.alphaX + this.game.camera.cameraOffsetX + this.finalRenderOffset.xPos;
  const renderY = this.alphaY + this.game.camera.cameraOffsetY + this.finalRenderOffset.yPos;
  const renderW = this.img.width * this.imgScalingFactor + this.finalRenderOffset.w;
  const renderH = this.img.height * this.imgScalingFactor + this.finalRenderOffset.h;
  
  if (this.facingRight) {
    // Normal draw
    ctx.drawImage(this.img, renderX, renderY, renderW, renderH);
  } else {
    // Flip horizontally
    ctx.save();
    ctx.translate(renderX + renderW / 2, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(
      this.img,
      -renderW / 2 + 18, // 18 chai flipped offset milauna ho yeslai paxi optimise garna parxa
      renderY,
      renderW,
      renderH
    );
    ctx.restore();
  }
  
  ctx.strokeStyle = "red";
  ctx.strokeRect(
    this.alphaX + this.game.camera.cameraOffsetX,
    this.alphaY + this.game.camera.cameraOffsetY,
    this.w,
    this.h
  );
}
}

const PlayerAnimState = {
  IDLE: "IDLE",
  GLIDE: "GLIDE",
  JUMP: "JUMP"
}
class Player extends PhysicsRect {
  constructor(x,y,w,h, game){
    super(x,y,w,h);
    this.velocityX = 0.0;//80px per sec
    this.velocityY = 0.0;
    this.direction = 1;
    this.game = game;
    
    //Interpolated Position
    this.alphaX = this.xPos;
    this.alphaY = this.yPos;
    
    //Flags
    this.onAir = true;
    this.isJumping = false;
    this.isFalling = true;
    this.facingRight = true;
    this.jumpHandeled = false;
    this.jumpDirection = 0;
    this.isGliding = false;
    
    //factors
    this.fallFactor = 2.0;
    this.gravityFactor = 1.0;
    this.glideGravityFactor = 0.30;
    this.maxGlideFallVelocity = 60;
    this.maxGlideVelocity = 190;
    
    //Animation dependecies
    this.currAnimState = PlayerAnimState.IDLE;
    this.nextAnimState;
    this.animPlayerRegistry = {
      "IDLE" : new AnimationPlayer(this.game.playerIdle),
      "JUMP" : new AnimationPlayer(this.game.playerJump),
      "GLIDE" : new AnimationPlayer(this.game.playerGlide)
    };
    this.currAnimPlayer = this.animPlayerRegistry[this.currAnimState];
    
    //render dependencies
    this.imgScalingFactor = 2;
    this.finalRenderOffset = new RenderOffset(0,0,0,0);
    this.animRenderOffset = new RenderOffset(0,0,0,0);
  }
  
  jump(){
    this.velocityY = -140;
    this.velocityX = 180 * this.jumpDirection;
    this.jumpHandeled = false;
    this.isJumping = true;
  }
  
  update(dt){
    this.prevX = this.xPos;
    this.prevY = this.yPos;
    this.jumpDirection = this.game.inputs.rightJumpPressed - this.game.inputs.leftJumpPressed;
    //flags Check
    if(this.velocityX > 0){
      this.facingRight = true;
    }
    if(this.velocityX < 0){
      this.facingRight = false;
    }
    //Applying AirFriction
    if(!this.isGliding){
      if(this.facingRight){
        this.velocityX = Math.max(0,this.velocityX - (this.game.AIR_FRICTION * dt));
      }else{
        this.velocityX = Math.min(0,this.velocityX + (this.game.AIR_FRICTION * dt));
      }
    }
    if(this.velocityY > 0){
      this.isFalling = true;
      this.isJumping = false;
    }
    if(this.velocityY < 0){
      this.isFalling = false;
    }
    
    this.fallFactor = Math.abs(this.velocityY)>70?2.0:1.0;
    
  //X direction handel
  
  if(this.isGliding){
    if(this.facingRight) {
      this.velocityX = this.maxGlideVelocity;
    }else{
      this.velocityX = - this.maxGlideVelocity;
    }
  }
  
  this.xPos += this.velocityX *this.direction * dt;
  
  //jump handel
  if((this.game.inputs.leftJumpPressed && !this.game.inputs.leftJumpHandeled) && this.jumpDirection !== 0 || (this.game.inputs.rightJumpPressed && !this.game.inputs.rightJumpHandeled)){
    if(!this.game.inputs.leftJumpHandeled){
      this.game.inputs.leftJumpHandeled = true;
    }
    if(!this.game.inputs.rightJumpHandeled){
      this.game.inputs.rightJumpHandeled = true;
    }
    this.jump();
  }
  
  //Y direction handel
  if(this.onAir && this.game.inputs.jumpPressed && this.velocityY > 0){
    this.isGliding = true;
  }else{
    this.isGliding = false;
  }
    if(this.isGliding){
      this.gravityFactor = this.glideGravityFactor;
      
    }else{
      this.gravityFactor = 1.0;
  }
  //half dt handel
  let dy = this.velocityY * this.gravityFactor * dt/2.0;
  this.yPos += dy;
  
  //other half dt handel
  this.velocityY = Math.min(this.velocityY + (this.game.ACCLN_DUE_GRAVITY * this.fallFactor *this.gravityFactor*dt), this.game.BASE_TERMINAL_VELOCITY);
  
  if(this.isGliding){
      this.velocityY = Math.min(this.velocityY, this.maxGlideFallVelocity);
  }
  
  dy = this.velocityY * dt/2.0;
  
  this.yPos += dy;
  
  }
  
  updateInterpolation(ipf){
    this.alphaX = this.prevX + ((this.xPos - this.prevX) * ipf);
    this.alphaY = this.prevY + ((this.yPos - this.prevY) * ipf);
  }
  
  updateAnimation(deltaTime){
    //updating anim render offset
    if(this.isJumping){
      this.nextAnimState = PlayerAnimState.JUMP;
    }else if(this.isGliding){
      this.nextAnimState = PlayerAnimState.GLIDE;
    }else{
      this.nextAnimState = PlayerAnimState.IDLE;
    }
    
    if(this.nextAnimState != this.currAnimState){
      this.currAnimState = this.nextAnimState;
      this.currAnimPlayer = this.animPlayerRegistry[this.currAnimState];
      this.currAnimPlayer.reset();
    }
    
    this.animRenderOffset = this.currAnimPlayer.animation.renderOffset;
    
    this.img = this.currAnimPlayer.getCurrentFrame(deltaTime);
  }
  
  updateRenderOffset(){
    
    this.finalRenderOffset.xPos = this.animRenderOffset.xPos + (this.w - (this.img.width * this.imgScalingFactor) / 2.0);
    this.finalRenderOffset.yPos = this.animRenderOffset.yPos + (this.h - this.img.height);
    this.finalRenderOffset.w = this.animRenderOffset.w;
    this.finalRenderOffset.h = this.animRenderOffset.h;
  }
  
  render(ctx) {
  if (this.img == null) {
    // fallback
    console.log("player sprite is null");
    ctx.fillStyle = "black";
    ctx.fillRect(
      this.alphaX + this.game.camera.cameraOffsetX,
      this.alphaY,
      this.w,
      this.h
    );
    return;
  }
  
  this.updateRenderOffset();
  
  const renderX = this.alphaX + this.game.camera.cameraOffsetX + this.finalRenderOffset.xPos;
  const renderY = this.alphaY + this.finalRenderOffset.yPos;
  const renderW = this.img.width * this.imgScalingFactor + this.finalRenderOffset.w;
  const renderH = this.img.height * this.imgScalingFactor + this.finalRenderOffset.h;
  
  if (this.facingRight) {
    // Normal draw
    ctx.drawImage(this.img, renderX, renderY, renderW, renderH);
  } else {
    // Flip horizontally
    ctx.save();
    ctx.translate(renderX + renderW/2, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(
      this.img,
      -renderW/2 + 18, // 18 chai flipped offset milauna ho yeslai paxi optimise garna parxa
      renderY,
      renderW,
      renderH
    );
    ctx.restore();
  }
  
  ctx.strokeStyle = "green";
  ctx.strokeRect(
    this.alphaX + this.game.camera.cameraOffsetX,
    this.alphaY,
    this.w,
    this.h
  );
}
}

class GameInputs{
  jumpPressed = false;
  jumpReleased = true;
  leftJumpPressed = 0;
  rightJumpPressed = 0;
  leftJumpHandeled = true;
  rightJumpHandeled = true;
}
class Game {
  //Game constants
  SCREEN_WIDTH = 100;
  MAX_SCREEN_HEIGHT = 692;
  canvas;
  LOOP_FPS = 60;
  UPDATE_FPS = 60;
  UPDATE_STEP_DURATION = 1.0/this.UPDATE_FPS;
  LOOP_STEP_DURATION = 1.0/this.LOOP_FPS;
  ACCLN_DUE_GRAVITY = 150; // px per sec²
  AIR_FRICTION = 50;
  
  BASE_TERMINAL_VELOCITY = 300; // px per sec
  
  //Game booleans
  isPortrait = false;
  isRunning = true;
  gamePaused = false;
  
  //Time dependencies
  updateAccumulator = 0.0;
  nowMs = performance.now();
  prevMs = this.nowMs;
  computedFrameDuration;
  
  //entities
  inputs;
  player;
  background;
  constructor(){
   this.canvas = document.getElementById("game");
    this.resize();
    this.ctx = this.canvas.getContext("2d");
    this.ctx.imageSmoothingEnabled = false;
    
    this.vCanvas = document.createElement("canvas");
    this.vCanvas.width = 1024;
    this.vCanvas.height = 346;
    this.vCtx = this.vCanvas.getContext("2d");
    this.vCtx.imageSmoothingEnabled = false;
    window.addEventListener("resize", () => this.resize());

    //Asset loadings
    this.init();
  }
  resize() {
    this.canvas.width = window.innerWidth - 10;
    this.canvas.height = Math.min(window.innerHeight -10, this.MAX_SCREEN_HEIGHT);
  }
  checkPortrait(){
    return window.innerWidth < window.innerHeight;
  }
  pauseScreenIfPortrait(){
      this.isPortrait = this.checkPortrait();
      if(this.isPortrait){
        this.gamePaused = true;
      }
  }
  async init(){
    await this.loadAll();
    this.background = new Background(this);
    this.background.layers = [
      new Layer(this.layer4,0,0, 4, this),
      new Layer(this.layer3,0,0, 3, this),
      new Layer(this.layer2,0,0, 2, this),
      new Layer(this.layer1,0,0, 1, this),
      new Layer(this.layer0,0,0, 0, this)
    ];
    this.background.layers[0].renderOffset.setOffsets(0,-30,0,30);
    this.inputs = new GameInputs();

    //Entity Creation
    this.player = new Player(100, 100, 20, 28, this);
    //camera object
    this.camera = new Camera(this.player.xPos,this.player.yPos,10,10,this.player,this);
    
    this.enemy = new Enemy(120, 100, 22,24,this);
    
    this.run();
  }
  run(){
    if(!this.isRunning) return;
    
      this.gamePaused = false;
      //this.pauseScreenIfPortrait();
      
      this.nowMs = performance.now();
      this.deltaTime = (this.nowMs - this.prevMs) / 1000; // second
      this.prevMs = this.nowMs;
      
      
      if(this.gamePaused){
        //update and render paused
        //Blur effect applied
        //Rotate screen message displayed
      }else{
        this.updateAccumulator += this.deltaTime;
        while(this.updateAccumulator >= this.UPDATE_STEP_DURATION){
          this.update(this.UPDATE_STEP_DURATION);
          this.updateAccumulator -= this.UPDATE_STEP_DURATION;
        }
        
        //other updates
        const ipf = (this.UPDATE_STEP_DURATION - this.updateAccumulator)/this.UPDATE_STEP_DURATION;
        this.updateInterpolation(ipf);
        
        this.updateAnimation(this.deltaTime);
        //game render
        this.render(this.vCtx);
        
        this.computedFrameDuration = performance.now() -this.nowMs;
        if(this.computedFrameDuration < this.LOOP_STEP_DURATION){
          let sleepDuration = this.LOOP_STEP_DURATION - this.computedFrameDuration;
          //sleep fn
          //await sleep(sleepDuration);
        }
    }
    
    requestAnimationFrame(() => this.run());
  }
  
  async loadAll(){
    this.loader = new GameImage();
    this.layer4 = await this.loader.loadImage("./assets/background/4.png");
    this.layer3 = await this.loader.loadImage("./assets/background/3.png");
    this.layer2 = await this.loader.loadImage("./assets/background/2.png");
    this.layer1 = await this.loader.loadImage("./assets/background/1.png");
    this.layer0 = await this.loader.loadImage("./assets/background/0.png");
    
    //Player Animations frames
    const playerIdleFrames = await this.loader.loadImagesFromFolder("./assets/player/idleFx/", 5);
    const playerJumpFrames = await this.loader.loadImagesFromFolder("./assets/player/jump/",4);
    const playerGlideFrames = await this.loader.loadImagesFromFolder("./assets/player/glide/",4);
    const playerAttack1Frames = await this.loader.loadImagesFromFolder("./assets/player/attack1Fx/",6);
    //Enemy Animation frames
    const enemyIdleFrames = await this.loader.loadImagesFromFolder("./assets/enemy/idleRight/",4);
    const enemyAttackFrames = await this.loader.loadImagesFromFolder("./assets/enemy/attackRight/",6);
    //Animation Objects

    this.playerIdle = new Animation(playerIdleFrames,5,true);
    this.playerIdle.renderOffset.setOffsets(-4,-8,0,0);
    this.playerJump = new Animation(playerJumpFrames,10,false);
    this.playerJump.renderOffset.setOffsets(0,-1,0,0);
    this.playerGlide = new Animation(playerGlideFrames,4,true);
    this.playerGlide.renderOffset.setOffsets(0,-10,0,0);
    this.playerAttack1 = new Animation(playerAttack1Frames, 6, false);
    
    this.enemyIdle = new Animation(enemyIdleFrames,5,true);
    this.enemyIdle.renderOffset.setOffsets(-9,-20,0,0);
    this.enemyAttack = new Animation(enemyAttackFrames,6,true);
    this.enemyAttack.renderOffset.setOffsets(-9,-20,0,0);
  }
  
  update(dt){
    this.player.update(dt);
    this.camera.update(dt);
    this.enemy.update(dt);
  }
  
  updateInterpolation(ipf){
    this.player.updateInterpolation(ipf);
    this.enemy.updateInterpolation(ipf);
  }
  
  updateAnimation(deltaTime){
    this.player.updateAnimation(deltaTime);
    this.enemy.updateAnimation(deltaTime);
  }
  render(ctx){
    //Clearing screen
    ctx.clearRect(0,0,this.vCanvas.width,this.vCanvas.height);
    
    this.background.render(ctx);
    
    ctx.fillRect(
      this.vCanvas.width / 2 - 2,
      this.vCanvas.height / 2 - 2,
      4, 4
    );
    
    //enemy render
    this.enemy.render(ctx);
    
    //player render
    this.player.render(ctx);
    this.camera.render(ctx);
    
    //scaling the virtual ctx
    this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
    this.ctx.drawImage(
      this.vCanvas,
      0,0,this.vCanvas.width,this.vCanvas.height,
      0,0,this.vCanvas.width *2,this.vCanvas.height *2
    );
  }
}
const game = new Game();

document.body.addEventListener("touchstart", (e) => {
  const screenMid = window.innerWidth / 2;

  for (let i = 0; i < e.changedTouches.length; i++) {
    const touchX = e.changedTouches[i].clientX;

    game.inputs.jumpPressed = true;
    game.inputs.jumpReleased = false;

    if (touchX < screenMid) {
      game.inputs.leftJumpPressed = 1;
      game.inputs.leftJumpHandeled = false;
    }
    else if (touchX >= screenMid) {
      game.inputs.rightJumpPressed = 1;
      game.inputs.rightJumpHandeled = false;
    }
  }

  if (game.inputs.leftJumpPressed && game.inputs.rightJumpPressed) {
    game.inputs.leftJumpPressed = 0;
    game.inputs.rightJumpPressed = 0;
  }
});

document.body.addEventListener("touchend", (e) => {
  if (e.touches.length === 0) {
    game.inputs.jumpReleased = true;
    game.inputs.jumpPressed = false;

    game.inputs.leftJumpPressed = 0;
    game.inputs.rightJumpPressed = 0;

    game.inputs.leftJumpHandeled = true;
    game.inputs.rightJumpHandeled = true;
  }
});
document.addEventListener("touchstart", e => e.preventDefault(), { passive: false });
document.addEventListener("touchmove", e => e.preventDefault(), { passive: false });
document.addEventListener("touchend", e => e.preventDefault(), { passive: false });
